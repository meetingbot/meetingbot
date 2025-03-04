// Frontend ALB Security Group
resource "aws_security_group" "frontend_alb" {
  name        = "${local.name}-frontend-alb-sg"
  description = "Security group for Frontend ALB"
  vpc_id      = aws_vpc.this.id

  tags = {
    Name = "${local.name}-frontend-alb-sg"
  }
}

// Ingress rule for Frontend ALB HTTP
resource "aws_security_group_rule" "frontend_alb_http_ingress" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "HTTP web traffic"
  security_group_id = aws_security_group.frontend_alb.id
}

// Ingress rule for Frontend ALB HTTPS
resource "aws_security_group_rule" "frontend_alb_https_ingress" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "HTTPS web traffic"
  security_group_id = aws_security_group.frontend_alb.id
}

// Egress rule for Frontend ALB
resource "aws_security_group_rule" "frontend_alb_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = [aws_vpc.this.cidr_block]
  security_group_id = aws_security_group.frontend_alb.id
}

// Application Load Balancer
resource "aws_lb" "this" {
  name               = "${local.name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.frontend_alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${local.name}-alb"
  }
}

// Frontend Target Group
resource "aws_lb_target_group" "frontend" {
  name        = "${local.name}-frontend"
  port        = local.frontend_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.this.id
  target_type = "ip"

  deregistration_delay = 5

  health_check {
    enabled             = true
    healthy_threshold   = 5
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  load_balancing_cross_zone_enabled = true

  tags = {
    Name = "${local.name}-frontend"
  }
}

// Backend Target Group for API Path
resource "aws_lb_target_group" "backend" {
  name        = "${local.name}-backend"
  port        = local.backend_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.this.id
  target_type = "ip"

  deregistration_delay = 5

  health_check {
    enabled             = true
    healthy_threshold   = 5
    interval            = 30
    matcher             = "200"
    path                = "/docs/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  load_balancing_cross_zone_enabled = true

  tags = {
    Name = "${local.name}-backend"
  }
}

// ACM Certificate for HTTPS
resource "aws_acm_certificate" "this" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${local.name}-certificate"
  }
}

// DNS validation record for the certificate
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = data.aws_route53_zone.this.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

// Certificate validation
resource "aws_acm_certificate_validation" "this" {
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

// Frontend HTTP Listener - Redirects ALL traffic to HTTPS
resource "aws_lb_listener" "frontend_http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

// Frontend HTTPS Listener
resource "aws_lb_listener" "frontend_https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate_validation.this.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

// API Path Based Routing Rule for HTTPS
resource "aws_lb_listener_rule" "api_https" {
  listener_arn = aws_lb_listener.frontend_https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api*", "/docs*"]
    }
  }
}
