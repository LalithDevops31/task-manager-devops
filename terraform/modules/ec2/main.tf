data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter { name = "name"; values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"] }
  filter { name = "virtualization-type"; values = ["hvm"] }
}

resource "aws_security_group" "jenkins" {
  name        = "${var.cluster_name}-jenkins-sg"
  description = "Jenkins security group"
  vpc_id      = var.vpc_id

  ingress { from_port = 22;   to_port = 22;   protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 8080; to_port = 8080; protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  egress  { from_port = 0;    to_port = 0;    protocol = "-1";  cidr_blocks = ["0.0.0.0/0"] }

  tags = { Name = "${var.cluster_name}-jenkins-sg", Environment = var.environment }
}

resource "aws_instance" "jenkins" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.public_subnet_id
  vpc_security_group_ids = [aws_security_group.jenkins.id]
  key_name               = var.key_name

  root_block_device { volume_size = var.volume_size; volume_type = "gp3" }

  user_data = <<-EOF
    #!/bin/bash
    apt update -y
    apt install -y openjdk-21-jdk docker.io
    systemctl start docker && systemctl enable docker
    mkdir -p /etc/apt/keyrings
    wget -q https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key -O /tmp/jenkins.key
    gpg --batch --yes --dearmor -o /etc/apt/keyrings/jenkins-keyring.gpg /tmp/jenkins.key
    echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.gpg] https://pkg.jenkins.io/debian-stable binary/" | tee /etc/apt/sources.list.d/jenkins.list > /dev/null
    apt update -y && apt install -y jenkins
    usermod -aG docker jenkins
    chmod 666 /var/run/docker.sock
    systemctl start jenkins && systemctl enable jenkins
  EOF

  tags = { Name = "jenkins-server", Environment = var.environment }
}
