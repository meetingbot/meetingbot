# module "backend_policy" {
#   source = "terraform-aws-modules/iam/aws//modules/iam-policy"

#   name        = "backend-policy"
#   path        = "/"
#   description = "Policy for backend service"

#   policy = <<EOF
# {
#     "Version": "2012-10-17",
#     "Statement": [
#         {
#             "Effect": "Allow",
#             "Action": [
#                 "ecs:CreateService",
#                 "ecs:UpdateService",
#                 "ecs:DeleteService",
#                 "ecs:DescribeServices",
#                 "ecs:ListTasks",
#                 "ecs:DescribeTasks",
#                 "ecs:RunTask",
#                 "ecs:StopTask"
#             ],
#             "Resource": "*"
#         }
#     ]
# }
# EOF
# }
