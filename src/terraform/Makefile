init:
	terraform init -backend-config=backend.tfvars
upgrade:
	terraform init -upgrade -backend-config=backend.tfvars
reconfigure:
	terraform init -reconfigure -backend-config=backend.tfvars

sso-login:
	aws configure sso --profile meetingbot