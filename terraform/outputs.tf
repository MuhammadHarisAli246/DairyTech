output "ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.backend.name
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "rds_endpoint" {
  value     = aws_db_instance.main.address
  sensitive = true
}

output "github_actions_deploy_role_arn" {
  value = aws_iam_role.github_actions.arn
}

output "github_actions_infra_role_arn" {
  value = aws_iam_role.github_actions_infra.arn
}
