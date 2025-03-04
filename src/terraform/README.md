# MeetingBot Terraform Infrastructure

This directory contains the Terraform configuration to deploy MeetingBot infrastructure on AWS.

## Quick Start

```bash
# 1. Set up your AWS credentials
aws configure sso  # Use profile name: meetingbot

# 2. Initialize Terraform
cp backend.tfvars.example backend.tfvars
cp terraform.tfvars.example terraform.tfvars
terraform init -backend-config=backend.tfvars

# 3. Select workspace (dev or prod)
terraform workspace select dev  # or create with: terraform workspace new dev

# 4. Deploy infrastructure
terraform apply
```

## Environment Workspaces

We use Terraform workspaces to manage different environments:

- `prod`: Production environment (higher availability, deletion protection)
- Any other name (e.g., `dev`): Non-production environment (reduced resources, easier cleanup)

## Infrastructure Components

The configuration deploys the following resources:

- **VPC**: Private network with public, private, and database subnets
- **RDS**: PostgreSQL database for persistent storage
- **ALB**: Application Load Balancer for routing traffic
- **ECS**: Fargate services for running containerized applications
- **Security Groups**: Proper access controls for all components

## Common Commands

```bash
# Log in to AWS
aws sso login --profile meetingbot

# Switch environments
terraform workspace select prod  # or dev, etc.

# Plan changes without applying
terraform plan

# Apply changes
terraform apply

# Destroy resources (be careful!)
terraform destroy

# Show current workspace
terraform workspace show
```

## Configuration Files

- `main.tf` - Provider configuration
- `vpc.tf` - Network infrastructure
- `rds.tf` - Database configuration
- `alb.tf` - Load balancer setup
- `ecs.tf` - Container services
- `variables.tf` - Input variables
- `terraform.tfvars` - Variable values (copy example file to customize)
