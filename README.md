# 🚀 K3s HA Cluster Lab

[![K3s](https://img.shields.io/badge/K3s-v1.28%2B-orange?logo=k3s)](https://k3s.io/)
[![Ansible](https://img.shields.io/badge/Ansible-v2.15%2B-red?logo=ansible)](https://www.ansible.com/)
[![Multipass](https://img.shields.io/badge/Multipass-v1.12-blue?logo=ubuntu)](https://multipass.run/)

Automated deployment of a High Availability K3s cluster. This lab uses **Ansible** for the initial node provisioning and **Kubectl** for all component management.

---

## 🏗️ Architecture Overview

- **Provisioning:** Ansible (VMs & K3s Core)
- **Networking:** MetalLB (LoadBalancer)
- **Storage:** Longhorn (Distributed Block Storage)
- **Security:** cert-manager (Automated SSL)
- **GitOps:** ArgoCD
- **Observability:** Prometheus & Grafana stack

---

## 🛠️ Prerequisites

- **Multipass:** `brew install --cask multipass`
- **Ansible:** `brew install ansible`
- **Kubectl:** `brew install kubectl`
- **Node.js:** For running load tests

---

## 🚀 Phase 1: Infrastructure (Ansible)

Initialize the virtual machines and the core K3s cluster:

```bash
# 1. Launch VMs
sh multipass/launch-vms.sh

# 2. Setup HA Cluster & Firewalls
ansible-playbook -i ansible/hosts.ini ansible/install_k3s.yml
ansible-playbook -i ansible/hosts.ini ansible/configure_firewall.yml
```

---

## 🔐 Phase 2: Local Management (Kubectl)

Connect your local terminal to the new cluster:

1. **Fetch Config:**
   ```bash
   ssh ubuntu@192.168.252.107 "sudo cat /etc/rancher/k3s/k3s.yaml" > k3s.yaml
   ```
2. **Setup KUBECONFIG:**
   ```bash
   # Update server IP and set environment
   sed -i '' 's/127.0.0.1/192.168.252.107/g' k3s.yaml
   export KUBECONFIG=$(pwd)/k3s.yaml
   
   # Verify
   kubectl get nodes
   ```

---

## 📦 Phase 3: Components (Kubernetes Manifests)

All infrastructure components are managed via standard YAML manifests in the `kubernetes/` directory.

### 1. Load Balancing (MetalLB)
```bash
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.9/config/manifests/metallb-native.yaml
kubectl wait --namespace metallb-system --for=condition=ready pod --selector=app=metallb --timeout=120s
kubectl apply -f kubernetes/metallb/config.yaml
```

### 2. Distributed Storage (Longhorn)
```bash
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/v1.7.2/deploy/longhorn.yaml
kubectl apply -f kubernetes/longhorn/ui-service.yaml
```

### 3. Automated SSL (cert-manager)
```bash
helm repo add jetstack https://charts.jetstack.io && helm repo update
helm upgrade --install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set installCRDs=true
kubectl apply -f kubernetes/cert-manager/cluster-issuer.yaml
```

### 4. GitOps & Monitoring
```bash
# ArgoCD
kubectl create namespace argocd || true
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f kubernetes/argocd/config.yaml

# Monitoring (Prometheus/Grafana)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts && helm repo update
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace -f kubernetes/monitoring/values.yaml
```

### 5. Sample API
```bash
kubectl apply -f kubernetes/sample-app/api-deployment.yaml
```

---

## 🧪 Testing & Load Balancing

Run high-frequency concurrent load tests:

```bash
# Stress Test: Hits the /work endpoint (CPU intensive)
npx tsx scripts/load-test.ts http://192.168.252.103/work 2000 100
```

---

## 📂 Service Directory

| Service | URL | Credentials |
| :--- | :--- | :--- |
| **ArgoCD** | [https://192.168.252.102](https://192.168.252.102) | `admin` / (check secret) |
| **Longhorn** | [http://192.168.252.101](http://192.168.252.101) | *No Password* |
| **Grafana** | [http://192.168.252.104](http://192.168.252.104) | `admin` / `nBNKJI4c8umwUennBGfl6rPb9c7zVigkrHJYvc0Y` |
| **Sample API** | [http://192.168.252.103](http://192.168.252.103) | *No Password* |
