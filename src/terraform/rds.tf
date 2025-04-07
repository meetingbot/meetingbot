// Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = false
}

// Security group for database
resource "aws_security_group" "db" {
  name        = "${local.name}-db-sg"
  description = "Security group for database"
  vpc_id      = aws_vpc.this.id
}

// Security group rule for PostgreSQL access
resource "aws_security_group_rule" "postgresql_ingress" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"] # This allows public access to the database
  security_group_id = aws_security_group.db.id
}

resource "aws_security_group_rule" "postgresql_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.db.id
}

// RDS PostgreSQL instance
resource "aws_db_instance" "this" {
  identifier            = local.name
  engine                = "postgres"
  engine_version        = "17"
  instance_class        = "db.t4g.micro"
  allocated_storage     = 10
  max_allocated_storage = 100

  db_name  = "postgres"
  username = "postgres"
  password = random_password.db_password.result
  port     = 5432

  publicly_accessible     = true
  multi_az               = local.prod
  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.db.id]

  backup_retention_period = 1
  backup_window           = "03:00-06:00"
  maintenance_window      = "Mon:00:00-Mon:03:00"

  skip_final_snapshot = !local.prod
  deletion_protection = local.prod
}
