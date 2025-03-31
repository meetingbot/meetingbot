resource "random_string" "this" {
  length  = 8

  numeric = true
  upper = false
  lower = false
  special = false
}

resource "aws_s3_bucket" "this" {
  bucket = "${local.name}-${random_string.this.result}-bot-data"
}
