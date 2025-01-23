
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = local.name
  cidr = "10.0.0.0/16"

  azs              = local.azs
  private_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets   = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = terraform.workspace == "prod" ? false : true


  create_database_subnet_group           = true
  create_database_subnet_route_table     = true
  create_database_internet_gateway_route = true

  enable_dns_hostnames = true
  enable_dns_support   = true
}

# module "api_gateway" {
#   source = "terraform-aws-modules/apigateway-v2/aws"

#   # API
#   cors_configuration = {
#     allow_headers = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
#     allow_methods = ["*"]
#     allow_origins = ["*"]
#   }

#   description = "HTTP API Gateway with VPC links"
#   name        = local.name

#   # Custom Domain
#   create_domain_name = false

#   # Routes & Integration(s)
#   routes = {
#     "ANY /" = {
#       integration = {
#         connection_type = "VPC_LINK"
#         uri             = module.alb.listeners["default"].arn
#         type            = "HTTP_PROXY"
#         method          = "ANY"
#         vpc_link_key    = "my-vpc"
#       }
#     }
#   }

#   # VPC Link
#   vpc_links = {
#     my-vpc = {
#       name               = local.name
#       security_group_ids = [module.api_gateway_security_group.security_group_id]
#       subnet_ids         = module.vpc.private_subnets
#     }
#   }
# }

# module "api_gateway_security_group" {
#   source  = "terraform-aws-modules/security-group/aws"
#   version = "~> 5.0"

#   name        = local.name
#   description = "API Gateway group for example usage"
#   vpc_id      = module.vpc.vpc_id

#   ingress_cidr_blocks = ["0.0.0.0/0"]
#   ingress_rules       = ["http-80-tcp"]

#   egress_rules = ["all-all"]
# }

module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name = local.name

  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.public_subnets

  # Disable for example
  enable_deletion_protection = false

  security_group_ingress_rules = {
    all_http = {
      from_port   = 80
      to_port     = 80
      ip_protocol = "tcp"
      description = "HTTP web traffic"
      cidr_ipv4   = "0.0.0.0/0"
    }
    all_https = {
      from_port   = 443
      to_port     = 443
      ip_protocol = "tcp"
      description = "HTTPS web traffic"
      cidr_ipv4   = "0.0.0.0/0"
    }
  }
  security_group_egress_rules = {
    all = {
      ip_protocol = "-1"
      cidr_ipv4   = module.vpc.vpc_cidr_block
    }
  }

  listeners = {
    default = {
      port     = 80
      protocol = "HTTP"
      forward = {
        target_group_key = "backend"
      }
    }
  }

  target_groups = {
    backend = {
      backend_protocol                  = "HTTP"
      backend_port                      = local.backend_port
      target_type                       = "ip"
      deregistration_delay              = 5
      load_balancing_cross_zone_enabled = true

      health_check = {
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

      # There's nothing to attach here in this definition. Instead,
      # ECS will attach the IPs of the tasks to this target group
      create_attachment = false
    }
  }
}

resource "aws_service_discovery_http_namespace" "this" {
  name        = local.name
  description = "CloudMap namespace for ${local.name}"
}
