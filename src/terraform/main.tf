provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
  default_tags {
    tags = {
      app-id      = "meetingbot"
      app-purpose = "meeting bot"
      environment = terraform.workspace
      pii         = "yes"
    }
  }
}

data "aws_availability_zones" "available" {}

locals {
  name = "meetingbot-${terraform.workspace}"

  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

terraform {
  backend "s3" {
    encrypt = true
  }
}

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

module "api_gateway" {
  source = "terraform-aws-modules/apigateway-v2/aws"

  # API
  cors_configuration = {
    allow_headers = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods = ["*"]
    allow_origins = ["*"]
  }

  description = "HTTP API Gateway with VPC links"
  name        = local.name

  # Custom Domain
  create_domain_name = false

  # Routes & Integration(s)
  routes = {
    "ANY /" = {
      integration = {
        connection_type = "VPC_LINK"
        uri             = module.alb.listeners["default"].arn
        type            = "HTTP_PROXY"
        method          = "ANY"
        vpc_link_key    = "my-vpc"
      }
    }
  }

  # VPC Link
  vpc_links = {
    my-vpc = {
      name               = local.name
      security_group_ids = [module.api_gateway_security_group.security_group_id]
      subnet_ids         = module.vpc.private_subnets
    }
  }
}

module "api_gateway_security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = local.name
  description = "API Gateway group for example usage"
  vpc_id      = module.vpc.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
  ingress_rules       = ["http-80-tcp"]

  egress_rules = ["all-all"]
}

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

  listeners = {
    default = {
      port     = 80
      protocol = "HTTP"
      fixed_response = {
        content_type = "text/plain"
        message_body = "Hello, World!"
        status_code  = "200"
      }
    }
  }
}

module "db" {
  source = "terraform-aws-modules/rds/aws"

  identifier = local.name

  # All available versions: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html#PostgreSQL.Concepts
  engine               = "postgres"
  engine_version       = "17"
  family               = "postgres17" # DB parameter group
  major_engine_version = "17"         # DB option group
  instance_class       = "db.t4g.micro"

  allocated_storage     = 10
  max_allocated_storage = 100

  # NOTE: Do NOT use 'user' as the value for 'username' as it throws:
  # "Error creating DB Instance: InvalidParameterValue: MasterUsername
  # user cannot be used as it is a reserved word used by the engine"
  db_name  = "postgres"
  username = "postgres"
  port     = 5432

  # Setting manage_master_user_password_rotation to false after it
  # has previously been set to true disables automatic rotation
  # however using an initial value of false (default) does not disable
  # automatic rotation and rotation will be handled by RDS.
  # manage_master_user_password_rotation allows users to configure
  # a non-default schedule and is not meant to disable rotation
  # when initially creating / enabling the password management feature
  manage_master_user_password_rotation              = true
  master_user_password_rotate_immediately           = false
  master_user_password_rotation_schedule_expression = "rate(15 days)"

  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [module.db_security_group.security_group_id]

  maintenance_window              = "Mon:00:00-Mon:03:00"
  backup_window                   = "03:00-06:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  create_cloudwatch_log_group     = true

  backup_retention_period = 1
  skip_final_snapshot     = true
  deletion_protection     = false

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  create_monitoring_role                = true
  monitoring_interval                   = 60
  monitoring_role_name                  = "db-monitoring-role"
  monitoring_role_use_name_prefix       = true
  monitoring_role_description           = "Database monitoring role"

  parameters = [
    {
      name  = "autovacuum"
      value = 1
    },
    {
      name  = "client_encoding"
      value = "utf8"
    }
  ]
  db_option_group_tags = {
    "Sensitive" = "low"
  }
  db_parameter_group_tags = {
    "Sensitive" = "low"
  }
  cloudwatch_log_group_tags = {
    "Sensitive" = "high"
  }
}

module "db_security_group" {
  source  = "terraform-aws-modules/security-group/aws//modules/postgresql"
  version = "~> 5.0"

  name        = "${local.name}-db"
  description = "Database group for example usage"
  vpc_id      = module.vpc.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
}
