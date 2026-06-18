# Task Manager — Full DevOps & SRE Practice Project

A complete DevOps and SRE learning project built on top of a simple Task Manager app (Node.js + React). Every tool in the modern DevOps stack is layered on top, phase by phase.

---

## What You Will Build

```
React Frontend → Node.js API → Docker → Jenkins CI → EKS (K8s) → ArgoCD → Prometheus → Grafana → OpenTelemetry → ELK → Terraform
```

---

## Prerequisites

Before starting, install these on your local machine:

| Tool | Install | Verify |
|---|---|---|
| Node.js 18+ | [nodejs.org](https://nodejs.org) | `node --version` |
| Docker Desktop | [docker.com](https://www.docker.com/products/docker-desktop) | `docker --version` |
| Git | [git-scm.com](https://git-scm.com) | `git --version` |
| AWS CLI | `brew install awscli` | `aws --version` |
| kubectl | `brew install kubectl` | `kubectl version --client` |
| eksctl | `brew tap weaveworks/tap && brew install weaveworks/tap/eksctl` | `eksctl version` |
| Helm | `brew install helm` | `helm version` |
| Terraform | `brew tap hashicorp/tap && brew install hashicorp/tap/terraform` | `terraform --version` |

---

## Project Structure

```
task-manager/
├── backend/                      # Node.js Express API
│   ├── src/
│   │   ├── index.js              # Express app with Prometheus metrics
│   │   ├── logger.js             # Winston structured logging
│   │   ├── tracing.js            # OpenTelemetry tracing
│   │   └── routes/
│   │       └── tasks.js          # CRUD task routes
│   ├── Dockerfile                # Multi-stage Docker build
│   └── package.json
├── frontend/                     # React + Vite app
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       └── TaskList.jsx
│   ├── nginx.conf                # nginx proxy config for K8s
│   ├── Dockerfile                # Multi-stage Docker build
│   └── package.json
├── k8s/                          # Kubernetes manifests
│   ├── namespace.yaml
│   ├── backend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── hpa.yaml
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   ├── monitoring/
│   │   ├── backend-servicemonitor.yaml
│   │   └── backend-prometheusrule.yaml
│   └── otel/
│       ├── otel-configmap.yaml
│       ├── otel-deployment.yaml
│       └── otel-service.yaml
├── terraform/                    # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   ├── backend.tf
│   ├── terraform.tfvars
│   └── modules/
│       ├── vpc/
│       ├── eks/
│       └── ec2/
├── Jenkinsfile                   # CI pipeline
├── docker-compose.yml            # Local development
└── README.md
```

---

## Phase 1 — Run the App Locally

### Backend
```bash
cd backend
npm install
npm start
# API running at http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# UI running at http://localhost:5173
```

### Test the API
```bash
curl http://localhost:3001/health
curl http://localhost:3001/tasks
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "My first task"}'
```

---

## Phase 2 — Git Setup

### Configure Git
```bash
git config --global user.name "Your Name"
git config --global user.email "you@email.com"
```

### Create GitHub Repository
1. Go to github.com → New repository → `task-manager-devops`
2. Set to Public, no README/gitignore

### Initialize and push
```bash
git init
git branch -M main
git add .
git commit -m "feat: initial task manager app"
git remote add origin https://github.com/YOURUSERNAME/task-manager-devops.git
git push -u origin main
git checkout -b develop
git push -u origin develop
```

### Branch strategy
```
main      ← production only, protected
develop   ← integration branch
feature/* ← one branch per phase
```

### Protect main branch
GitHub → Settings → Branches → Add rule → main → Require PR before merging

---

## Phase 3 — Docker

### Build and run locally
```bash
docker compose up --build
# App running at http://localhost:8080
```

### Build for AWS (linux/amd64) — required for EKS
```bash
docker buildx build --platform linux/amd64 \
  -t YOURDOCKERHUB/task-manager-backend:latest --push ./backend

docker buildx build --platform linux/amd64 \
  -t YOURDOCKERHUB/task-manager-frontend:latest --push ./frontend
```

> **Important:** Always build with `--platform linux/amd64` when pushing to Docker Hub for EKS. Mac M1/M2 builds arm64 by default which will not run on EKS nodes.

---

## Phase 4 — Jenkins CI on AWS EC2

### Launch EC2
- AMI: Ubuntu 24.04 LTS
- Instance type: t3.medium
- Key pair: create `jenkins-key`, download `.pem`
- Security group: open ports 22, 8080

### SSH into EC2
```bash
chmod 400 ~/.ssh/jenkins-key.pem
ssh -i ~/.ssh/jenkins-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Install Java 21
```bash
sudo apt update -y
sudo apt install -y openjdk-21-jdk
java -version
```

### Install Jenkins
```bash
sudo mkdir -p /etc/apt/keyrings
wget -q https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key -O /tmp/jenkins.key
sudo gpg --batch --yes --dearmor -o /etc/apt/keyrings/jenkins-keyring.gpg /tmp/jenkins.key
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.gpg] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update -y && sudo apt install -y jenkins
sudo systemctl start jenkins && sudo systemctl enable jenkins
```

### Install Docker on EC2
```bash
sudo apt install -y docker.io
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker jenkins
sudo usermod -aG docker ubuntu
sudo chmod 666 /var/run/docker.sock
sudo systemctl restart jenkins
```

### Unlock Jenkins
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```
Open `http://<EC2-IP>:8080` → paste password → Install suggested plugins

### Jenkins plugins to install
- Docker Pipeline
- Docker plugin
- GitHub Integration
- Pipeline Stage View

### Add Docker Hub credentials
Manage Jenkins → Credentials → Global → Add Credentials
- Kind: Username with password
- ID: `dockerhub-credentials`
- Use a Docker Hub Personal Access Token (not password)

### Create pipeline job
1. New Item → Pipeline → `task-manager-pipeline`
2. Pipeline script from SCM → Git
3. Repo URL: your GitHub URL
4. Branch: `*/main`
5. Script path: `Jenkinsfile`

### GitHub Webhook
GitHub → Settings → Webhooks → Add webhook
- URL: `http://<EC2-IP>:8080/github-webhook/`
- Content type: `application/json`
- Trigger: Push events

> **Important:** Open port 8080 to `0.0.0.0/0` in the EC2 security group for webhooks to work.

---

## Phase 5 — Kubernetes on EKS + ArgoCD

### Configure AWS CLI
```bash
aws configure
# Enter: Access Key, Secret Key, region (ap-southeast-2), json
```

### Create EKS cluster
```bash
eksctl create cluster \
  --name task-manager-cluster \
  --region ap-southeast-2 \
  --nodegroup-name worker-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --managed
```
> Takes 15-20 minutes

### Install EBS CSI Driver (required for persistent storage)
```bash
eksctl utils associate-iam-oidc-provider \
  --region ap-southeast-2 \
  --cluster task-manager-cluster \
  --approve

eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster task-manager-cluster \
  --region ap-southeast-2 \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --override-existing-serviceaccounts

kubectl rollout restart deployment ebs-csi-controller -n kube-system
```

### Deploy the app
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl get pods -n task-manager
```

> **Important:** The `nginx.conf` in the frontend uses `http://backend-service:3001` (not `backend` or `localhost`). This is the Kubernetes service name.

### Install ArgoCD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

kubectl patch svc argocd-server -n argocd \
  -p '{"spec": {"type": "LoadBalancer"}}'

kubectl get svc argocd-server -n argocd

kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

### Create ArgoCD Application
1. Login to ArgoCD UI (user: `admin`, password from above)
2. New App:
   - App name: `task-manager`
   - Repo URL: your GitHub URL
   - Path: `k8s`
   - Cluster: `https://kubernetes.default.svc`
   - Namespace: `task-manager`
   - Sync policy: Automatic
3. Create → Sync

---

## Phase 6 — Prometheus + Grafana

### Install kube-prometheus-stack
```bash
helm repo add prometheus-community \
  https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring

helm install prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin123 \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
```

### Apply monitoring manifests
```bash
kubectl apply -f k8s/monitoring/
```

### Access Grafana
```bash
kubectl port-forward svc/prometheus-stack-grafana 3000:80 -n monitoring
```
Open `http://localhost:3000` → admin / admin123

### Import dashboards
Grafana → + → Import → enter ID:
- `1860` — Node Exporter Full
- `15760` — Kubernetes Pods

### Access Prometheus
```bash
kubectl port-forward svc/prometheus-stack-kube-prom-prometheus 9090:9090 -n monitoring
```
Open `http://localhost:9090` → Status → Targets

### Backend metrics endpoint
The backend exposes `GET /metrics` with:
- `http_requests_total` — request count by method/route/status
- `http_request_duration_seconds` — request latency histogram
- Default Node.js process metrics (CPU, memory, event loop)

---

## Phase 7 — OpenTelemetry + ELK Stack

### Install ELK Stack
```bash
helm repo add elastic https://helm.elastic.co
helm repo update
kubectl create namespace logging

helm install elasticsearch elastic/elasticsearch \
  --version 7.17.3 \
  --namespace logging \
  --set replicas=1 \
  --set minimumMasterNodes=1 \
  --set resources.requests.memory=512Mi \
  --set resources.limits.memory=1Gi \
  --set volumeClaimTemplate.resources.requests.storage=5Gi \
  --set volumeClaimTemplate.storageClassName=gp2

kubectl get pods -n logging -w

helm install kibana elastic/kibana \
  --version 7.17.3 \
  --namespace logging \
  --no-hooks \
  --set elasticsearchHosts=http://elasticsearch-master:9200

helm install filebeat elastic/filebeat \
  --version 7.17.3 \
  --namespace logging \
  --set daemonset.hostNetworking=true \
  --set daemonset.secretMounts=null \
  --set filebeatConfig."filebeat\.yml"="filebeat.inputs:
- type: container
  paths:
    - /var/log/containers/*.log
output.elasticsearch:
  host: '0.0.0.0'
  hosts: ['http://elasticsearch-master:9200']
"
```

### Access Kibana
```bash
kubectl port-forward svc/kibana-kibana 5601:5601 -n logging
```
Open `http://localhost:5601`

### Set up Kibana index pattern
1. Stack Management → Index Patterns → Create index pattern
2. Pattern: `filebeat-*` → Next
3. Time field: `@timestamp` → Create
4. Discover → select `filebeat-*` → see all pod logs

### Deploy OTel Collector
```bash
kubectl apply -f k8s/otel/
kubectl get pods -n task-manager | grep otel
```

---

## Phase 8 — Terraform (Infrastructure as Code)

### Setup remote state
```bash
aws s3api create-bucket \
  --bucket task-manager-terraform-state \
  --region ap-southeast-2 \
  --create-bucket-configuration LocationConstraint=ap-southeast-2

aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2
```

### Initialize Terraform
```bash
cd terraform
terraform init
```

### Plan (see what will be created)
```bash
terraform plan
```

### Apply (create everything — takes 20 minutes)
```bash
terraform apply
```

### Update kubeconfig after apply
```bash
aws eks update-kubeconfig \
  --name task-manager-cluster \
  --region ap-southeast-2
kubectl get nodes
```

### Destroy everything (stop billing)
```bash
terraform destroy
```

---

## Tear Down (Stop AWS Billing)

Run these in order:

```bash
# Delete Helm releases
helm uninstall prometheus-stack -n monitoring
helm uninstall elasticsearch -n logging
helm uninstall kibana -n logging
helm uninstall filebeat -n logging

# Delete namespaces
kubectl delete namespace task-manager
kubectl delete namespace monitoring
kubectl delete namespace logging
kubectl delete namespace argocd

# Delete EKS cluster (takes 10-15 minutes)
eksctl delete cluster \
  --name task-manager-cluster \
  --region ap-southeast-2

# Terminate Jenkins EC2 from AWS Console
# EC2 → Instances → jenkins-server → Instance State → Terminate
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | /tasks | List all tasks |
| GET | /tasks/:id | Get single task |
| POST | /tasks | Create task (body: `{"title": "..."}`) |
| PUT | /tasks/:id | Update task (body: `{"status": "done"}`) |
| DELETE | /tasks/:id | Delete task |
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

---

## Common Issues and Fixes

### Docker images will not run on EKS
```bash
# Always build with --platform linux/amd64 on Mac
docker buildx build --platform linux/amd64 -t IMAGE:TAG --push ./dir
```

### nginx frontend cannot reach backend in K8s
The nginx.conf must use the Kubernetes service name:
```nginx
proxy_pass http://backend-service:3001;  # correct
proxy_pass http://backend:3001;          # wrong
proxy_pass http://localhost:3001;        # wrong
```

### EBS volumes stuck Pending
```bash
eksctl utils associate-iam-oidc-provider \
  --region ap-southeast-2 --cluster task-manager-cluster --approve

eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster task-manager-cluster \
  --region ap-southeast-2 \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve
kubectl rollout restart deployment ebs-csi-controller -n kube-system
```

### Jenkins Docker permission denied
```bash
sudo usermod -aG docker jenkins
sudo chmod 666 /var/run/docker.sock
sudo systemctl restart jenkins
```

### ArgoCD app path does not exist
Make sure K8s manifests are merged to main branch before creating the ArgoCD app.

### Helm release already exists
```bash
helm uninstall RELEASE_NAME -n NAMESPACE --no-hooks
kubectl delete secret -n NAMESPACE -l name=RELEASE_NAME
kubectl delete jobs -n NAMESPACE --all
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Containerisation | Docker + docker-compose |
| CI | Jenkins on EC2 with Docker agents |
| Container Registry | Docker Hub |
| Orchestration | Kubernetes on AWS EKS |
| GitOps | ArgoCD |
| Metrics | Prometheus + Grafana |
| Tracing | OpenTelemetry + OTel Collector |
| Logging | Winston + Filebeat + Elasticsearch + Kibana |
| IaC | Terraform |
| Cloud | AWS (EKS, EC2, VPC, IAM, EBS) |

---

## Branching Strategy

```
main        ← production, protected, PRs only
develop     ← integration branch
feature/*   ← one branch per phase/feature
```

Commit message convention:
- `feat:` new feature
- `fix:` bug fix
- `ci:` pipeline changes
- `chore:` maintenance
- `docs:` documentation

---

## Author

Built for DevOps and SRE practice. Fork it, break it, fix it, learn from it.
