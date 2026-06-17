output "vpc_id" { value = module.vpc.vpc_id }
output "eks_cluster_name" { value = module.eks.cluster_name }
output "eks_cluster_endpoint" { value = module.eks.cluster_endpoint }
output "jenkins_public_ip" { value = module.ec2.jenkins_public_ip }
output "jenkins_url" { value = "http://${module.ec2.jenkins_public_ip}:8080" }
