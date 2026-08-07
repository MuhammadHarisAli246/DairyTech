variable "aws_region" {
  default = "us-east-1"
}

variable "project_name" {
  default = "dairytech"
}

variable "environment" {
  default = "prod"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "db_username" {
  default = "dairyadmin"
}

variable "db_password" {
  description = "Set via TF_VAR_db_password (GitHub secret), never commit this"
  sensitive   = true
}

variable "container_image" {
  description = "Full ECR image URI:tag, passed in by the pipeline after each build"
  default     = ""
}

variable "container_port" {
  default = 8080
}

variable "github_org" {
  description = "Your GitHub org/username, e.g. acme-dairy"
}

variable "github_repo" {
  description = "Your GitHub repo name, e.g. dairy-platform"
}
