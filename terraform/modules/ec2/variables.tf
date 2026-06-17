variable "cluster_name" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_id" { type = string }
variable "instance_type" { type = string; default = "t3.medium" }
variable "key_name" { type = string }
variable "volume_size" { type = number; default = 20 }
