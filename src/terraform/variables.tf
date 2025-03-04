variable "aws_profile" {
  type        = string
  description = "The AWS profile to use"
}

variable "aws_region" {
  type        = string
  description = "The AWS region to deploy resources"
  nullable    = true
}

variable "domain_name" {
  type        = string
  description = "The domain name to use for the website"
}

variable "auth_github_id" {
  type        = string
  description = "The GitHub ID for authentication"
  sensitive   = true
}

variable "auth_github_secret" {
  type        = string
  description = "The GitHub secret for authentication"
  sensitive   = true
}
