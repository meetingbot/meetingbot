# MeetingBot Terraform Infrastructure

This directory contains the Terraform configuration to deploy MeetingBot infrastructure on AWS.

## Prerequisites
- A domain name in Route 53
- An S3 bucket to store Terraform state
- (Optional) A DynamoDB table to lock Terraform state
- A Github App to use for dashboard authentication
    - (Optional) Scope the app to your organization to restrict access

## Quick Start

```bash
# 1. Set up your AWS credentials
make sso
# This configures the AWS SSO profile named 'meetingbot'

# 2. Initialize Terraform
cp backend.tfvars.example backend.tfvars
cp terraform.tfvars.example terraform.tfvars
# Modify the .tfvars files with your specific configuration values
make init

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

- **VPC**: Private network with public, private, and database subnets across multiple availability zones
- **RDS**: PostgreSQL database for persistent storage
- **ALB**: Application Load Balancer for routing HTTP/HTTPS traffic
- **ECS**: Fargate services for running containerized applications
- **S3 Bucket**: Storage for application data
- **Route53**: DNS configuration for domain management
- **Security Groups**: Fine-grained access controls for all components
- **IAM Roles**: Permissions for service execution

## Common Commands

```bash
# Log in to AWS
make sso
# or directly:
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

# Update provider plugins
make upgrade

# Reconfigure backend
make reconfigure
```

## Configuration Files

- `main.tf` - Provider configuration and global settings
- `vpc.tf` - Network infrastructure
- `rds.tf` - Database configuration
- `alb.tf` - Load balancer setup
- `ecs.tf` - Container services
- `s3.tf` - Object storage bucket
- `dns.tf` - Route53 DNS configuration
- `variables.tf` - Input variables
- `terraform.tfvars` - Variable values (copy example file to customize)
- `backend.tfvars` - Backend configuration for state storage

## State Management

Terraform state is stored in an S3 bucket with DynamoDB locking as defined in `backend.tfvars`. This enables team collaboration and state versioning.
