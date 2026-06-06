# 🚀 K3s HA Cluster Lab

[![K3s](https://img.shields.io/badge/K3s-v1.28%2B-orange?logo=k3s)](https://k3s.io/)
[![Ansible](https://img.shields.io/badge/Ansible-v2.15%2B-red?logo=ansible)](https://www.ansible.com/)
[![Multipass](https://img.shields.io/badge/Multipass-v1.12-blue?logo=ubuntu)](https://multipass.run/)

Automated deployment of a High Availability K3s cluster using **Multipass** for virtualization and **Ansible** for orchestration. This lab environment provides a complete cloud-native stack including distributed storage, load balancing, GitOps, and full-stack monitoring.

---

## 🏗️ Architecture Overview

The lab provisions a 3-node cluster (scalable to 5+) where nodes take on mixed roles to ensure high availability with minimal resource footprint.

- **Orchestration:** Ansible
- **Virtualization:** Multipass (Ubuntu)
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
- **Node.js:** For running the load test script

---

## 🚀 Quick Start Guide

### 1. Provision Infrastructure
Launch the virtual machines:
```bash
sh multipass/launch-vms.sh
```

### 2. Deploy K3s Cluster
Install the HA cluster components:
```bash
ansible-playbook -i ansible/hosts.ini ansible/install_k3s.yml
```

### 3. Secure & Optimize
Configure firewalls and install core infrastructure:
```bash
# Security
ansible-playbook -i ansible/hosts.ini ansible/configure_firewall.yml

# Load Balancing & Storage
ansible-playbook -i ansible/hosts.ini ansible/install_metallb.yml
ansible-playbook -i ansible/hosts.ini ansible/install_longhorn.yml
ansible-playbook -i ansible/hosts.ini ansible/expose_longhorn_ui.yml

# GitOps & Monitoring
ansible-playbook -i ansible/hosts.ini ansible/install_cert_manager.yml
ansible-playbook -i ansible/hosts.ini ansible/install_argocd.yml
ansible-playbook -i ansible/hosts.ini ansible/install_monitoring.yml

# Sample Application
ansible-playbook -i ansible/hosts.ini ansible/deploy_sample_app.yml
```

---

## 🧪 Testing & Load Balancing

### Sample API
A lightweight Python API is deployed to the `sample-app` namespace. It includes two endpoints:
- `/` (Default): Returns basic pod and node info.
- `/work`: Simulates a CPU-intensive task (100ms busy wait).

### High-Frequency Load Test
Run a concurrent load test using the provided **TypeScript** script. To truly "stress" the cluster, use the `/work` endpoint:

```bash
# 1. Normal Load (Low CPU)
npx tsx scripts/load-test.ts http://192.168.252.104 500 20

# 2. Stress Test (High CPU)
# Hits the /work endpoint with 1000 requests and 50 concurrency
npx tsx scripts/load-test.ts http://192.168.252.104/work 1000 50
```

### 📈 Monitoring the Stress
While the stress test is running, observe the impact:
- **CLI:** `kubectl top nodes` or `kubectl top pods -n sample-app`
- **Grafana:** [http://192.168.252.103](http://192.168.252.103) (Search for "Kubernetes / Compute Resources / Pod")

---

## 🔐 Accessing the Cluster

### Local Kubectl Setup
To manage the cluster from your host machine:

1. **Fetch Config:**
   ```bash
   ssh ubuntu@192.168.252.107 "sudo cat /etc/rancher/k3s/k3s.yaml" > k3s.yaml
   ```
2. **Configure Port:**
   ```bash
   sed -i '' 's/127.0.0.1/192.168.252.107/g' k3s.yaml
   export KUBECONFIG=$(pwd)/k3s.yaml
   ```

### Service Directory

| Service | URL | Credentials |
| :--- | :--- | :--- |
| **ArgoCD** | [https://192.168.252.102](https://192.168.252.102) | `admin` / `HLHHhZIfWenv5j3s` |
| **Longhorn** | [http://192.168.252.101](http://192.168.252.101) | *No Password* |
| **Grafana** | [http://192.168.252.103](http://192.168.252.103) | `admin` / `nBNKJI4c8umwUennBGfl6rPb9c7zVigkrHJYvc0Y` |
| **Sample API** | [http://192.168.252.104](http://192.168.252.104) | *No Password* |

---

## 📂 Project Structure

```text
├── ansible/
│   ├── hosts.ini                # Inventory & variables
│   ├── install_k3s.yml          # Core cluster setup
│   ├── deploy_sample_app.yml    # API deployment
│   └── ...                      # Infrastructure playbooks
├── scripts/
│   └── load-test.ts             # TypeScript load testing script
└── multipass/
    ├── launch-vms.sh            # VM provisioning script
    └── cloud-init.yaml          # Node initialization config
```
