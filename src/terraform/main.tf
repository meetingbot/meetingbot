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

