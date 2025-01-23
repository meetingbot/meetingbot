# Terraform Infrastructure Setup

We use workspaces for non-prod and prod environments.

The prod environment should always be the default workspace, to make deploying to self-hosted infrastructure easy.

## Prerequisites

- Install AWS CLI and configure credentials:
    <details>
    <summary>Install AWS CLI with brew</summary>

  ```bash
  brew install awscli
  ```

    </details>
    <details>
    <summary>Configure AWS credentials</summary>

  ```bash
  aws configure sso
  ```

  Put whatever you want for SSO session name. Find SSO start URL and region in AWS access portal > Access keys. Leave SSO registration scopes blank. Enter `meetingbot` as CLI profile name.

  Then:

  ```bash
  aws sso login --profile meetingbot
  ```

    </details>

- Install Terraform CLI:
    <details>
    <summary>Install with brew</summary>

  ```bash
  brew install terraform
  ```

    </details>

## Getting Started

Navigate to this folder (`/src/terraform/`)

1. Copy `backend.tfvars.example` to `backend.tfvars`

2. Initialize Terraform in your project:

```bash
terraform init -backend-config=backend.tfvars
```

3. Pick a workspace (list them using `terraform workspace list`)

```
terraform workspace select dev
```

4. Preview infrastructure changes:

```bash
terraform plan
```

5. Apply infrastructure changes:

```bash
terraform apply
```
