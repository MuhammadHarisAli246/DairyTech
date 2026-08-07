# Dairy-tech platform on AWS — step-by-step deployment guide

This repo deploys a containerized backend to ECS Fargate, a client to S3/CloudFront,
and a PostgreSQL database on RDS — all defined in Terraform, all deployed automatically
by GitHub Actions on every push to `main`.

Two pipelines, on purpose:
- **`terraform.yml`** — builds/changes the infrastructure itself (VPC, RDS, ECS cluster, etc.). Runs rarely, uses a broader IAM role, ideally gated by a manual approval.
- **`deploy.yml`** — builds your app, pushes the image, rolls out ECS, syncs the client. Runs on every push, uses a narrowly-scoped IAM role.

---

## Step 1 — One-time local setup (before any pipeline can run)

You need an AWS account and, for this first step only, an admin IAM user or SSO session
on your own machine (not in CI).

1. Install [Terraform](https://developer.hashicorp.com/terraform/install) and the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) locally.
2. Run `aws configure` with your admin credentials.
3. Create the Terraform remote state bucket and lock table (Terraform can't create its own backend before it exists):
   ```bash
   aws s3api create-bucket --bucket dairytech-terraform-state --region us-east-1
   aws s3api put-bucket-versioning --bucket dairytech-terraform-state --versioning-configuration Status=Enabled
   aws dynamodb create-table \
     --table-name dairytech-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```
   (Bucket names are global — if `dairytech-terraform-state` is taken, pick another and update `terraform/provider.tf`.)

## Step 2 — Push this repo structure to GitHub

Your repo should look like:
```
terraform/              → infrastructure code
.github/workflows/       → the two pipelines
server/             → your API code + Dockerfile
client/                → your web app
```
Put your actual backend and client code into `server/` and `client/`. The
sample `Dockerfile` assumes Node — swap it for your language/framework, just keep
exposing a `/health` endpoint on the port defined in `terraform/variables.tf` (`container_port`, default 8080).

## Step 3 — Bootstrap the infrastructure once, from your machine

This is the chicken-and-egg step: the pipeline needs an IAM role to exist before it
can do anything, and that role is created by Terraform. So the very first apply runs
locally with your admin credentials.

```bash
cd terraform
terraform init
terraform apply \
  -var="github_org=YOUR_GITHUB_ORG" \
  -var="github_repo=YOUR_REPO_NAME" \
  -var="db_password=CHOOSE_A_STRONG_PASSWORD"
```
This creates the VPC, ECS cluster, RDS instance, S3/CloudFront, ECR repo, and — critically —
the two IAM roles GitHub Actions will use from now on. Save the two role ARNs from the output:
```bash
terraform output github_actions_deploy_role_arn
terraform output github_actions_infra_role_arn
```

## Step 4 — Add GitHub repo secrets

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Value |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | output from `github_actions_deploy_role_arn` |
| `AWS_INFRA_ROLE_ARN` | output from `github_actions_infra_role_arn` |
| `DB_PASSWORD` | same password you used in Step 3 |
| `FRONTEND_BUCKET` | output from `terraform output client_bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | output from `terraform output cloudfront_distribution_id` |

## Step 5 — (Recommended) Require approval for infra changes

**Settings → Environments → New environment → name it `infra`** → add yourself as a
required reviewer. This means every future `terraform apply` (VPC changes, DB resizes,
etc.) pauses for a human click before running — app deploys are unaffected and stay fully automatic.

## Step 6 — Push code and watch it deploy

From here on, it's automatic:
- Push to `server/` or `client/` → `deploy.yml` runs: tests → build image → push to ECR → rolling ECS deploy → client synced to S3 → CloudFront cache invalidated.
- Push to `terraform/` → `terraform.yml` runs: plan → (approval, if you set that up) → apply.

Check progress under the **Actions** tab in GitHub.

## Step 7 — Verify it's live

```bash
terraform output alb_dns_name          # backend API, direct
terraform output cloudfront_domain_name # client
```
Open the CloudFront URL in a browser; hit `http://<alb-dns>/health` to confirm the API is up.
Check **ECS console → Clusters → dairytech-cluster → Services** to see running tasks.

## Step 8 — Put a real domain on it

1. Buy/transfer your domain into **Route 53** (or add it as a hosted zone).
2. Request a certificate in **ACM** (must be in `us-east-1` for CloudFront) for your domain.
3. Add the ACM cert to `aws_cloudfront_distribution.client` (`viewer_certificate` block in `s3-cloudfront.tf`) and to an HTTPS listener on the ALB in `alb.tf`.
4. Add a Route 53 `A` record (alias) pointing at the CloudFront distribution, and one for the API subdomain pointing at the ALB.
5. Push to `main` — the infra pipeline picks it up.

## Step 9 — Add IoT ingestion later (optional)

When you have actual milk-collection sensors: add an `iot.tf` with an `aws_iot_topic_rule`
routing device messages into a Kinesis stream, then a stream → S3 data lake pipeline
(Firehose is simplest). Not included here since it depends on your device protocol.

## Step 10 — Day-2 basics

- **Rollback**: re-run `deploy.yml` against an older commit SHA, or `aws ecs update-service --force-new-deployment` with the previous task definition revision.
- **Logs**: CloudWatch → Log groups → `/ecs/dairytech-backend`.
- **Alarms**: add `aws_cloudwatch_metric_alarm` resources on ECS CPU/memory and RDS free storage, wired to an SNS topic that emails/Slacks you.
- **Cost control**: this default setup (single-AZ `db.t4g.micro`, 2 Fargate tasks, no NAT redundancy) runs roughly $60–100/month. Multi-AZ RDS and a second NAT gateway roughly double that — turn them on when uptime actually matters.
