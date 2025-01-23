module "ecs_cluster" {
  source = "terraform-aws-modules/ecs/aws//modules/cluster"

  cluster_name = local.name

  # Capacity provider
  fargate_capacity_providers = {
    FARGATE = {
      default_capacity_provider_strategy = {
        weight = 50
        base   = 20
      }
    }
    FARGATE_SPOT = {
      default_capacity_provider_strategy = {
        weight = 50
      }
    }
  }
}

# Backend Service
locals {
  backend_port = 3001
}
module "ecs_service" {
  source = "terraform-aws-modules/ecs/aws//modules/service"

  name        = local.name
  cluster_arn = module.ecs_cluster.arn

  cpu    = 1024
  memory = 4096

  # Enables ECS Exec
  enable_execute_command = true

  # Container definition(s)
  container_definitions = {
    "${local.name}-backend" = {
      essential = true
      image     = "ghcr.io/meetingbot/backend:pr-91"
      port_mappings = [
        {
          name          = "${local.name}-backend"
          containerPort = local.backend_port
          hostPort      = local.backend_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "PORT"
          value = local.backend_port
        },
        {
          name  = "DATABASE_URL"
          value = "postgres://${module.db.db_instance_username}:${random_password.db_password.result}@${module.db.db_instance_endpoint}/${module.db.db_instance_name}"
        }
      ]
    }
  }

  service_connect_configuration = {
    namespace = aws_service_discovery_http_namespace.this.arn
    service = {
      client_alias = {
        port     = local.backend_port
        dns_name = "${local.name}-backend"
      }
      port_name      = "${local.name}-backend"
      discovery_name = "${local.name}-backend"
    }
  }

  # TODO: FIX LB
  load_balancer = {
    service = {
      target_group_arn = module.alb.target_groups["backend"].arn
      container_name   = "${local.name}-backend"
      container_port   = local.backend_port
    }
  }

  subnet_ids = module.vpc.private_subnets
  security_group_rules = {
    alb_ingress_3001 = {
      type                     = "ingress"
      from_port                = local.backend_port
      to_port                  = local.backend_port
      protocol                 = "tcp"
      description              = "Service port"
      source_security_group_id = module.alb.security_group_id
    }
    egress_all = {
      type        = "egress"
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  service_tags = {
    "ServiceTag" = "Tag on service level"
  }
}

module "ecs_task_definition" {
  source = "terraform-aws-modules/ecs/aws//modules/service"

  # Service
  name           = "${local.name}-standalone"
  cluster_arn    = module.ecs_cluster.arn
  create_service = false

  # Task Definition
  volume = {
    ex-vol = {}
  }

  runtime_platform = {
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }

  # Container definition(s)
  container_definitions = {
    al2023 = {
      image = "public.ecr.aws/amazonlinux/amazonlinux:2023-minimal"

      mount_points = [
        {
          sourceVolume  = "ex-vol",
          containerPath = "/var/www/ex-vol"
        }
      ]

      command    = ["echo hello world"]
      entrypoint = ["/usr/bin/sh", "-c"]
    }
  }

  subnet_ids = module.vpc.private_subnets

  security_group_rules = {
    egress_all = {
      type        = "egress"
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
