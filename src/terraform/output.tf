output "database_url" {
  description = "The PostgreSQL connection string for the database"
  value       = "postgresql://${aws_db_instance.this.username}:${random_password.db_password.result}@${aws_db_instance.this.endpoint}/${aws_db_instance.this.db_name}"
  sensitive   = true
}
