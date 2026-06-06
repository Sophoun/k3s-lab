# K3s HA Cluster Lab

This project automates the creation of a 5-node K3s High Availability cluster using Multipass for VMs and Ansible for orchestration.

## Prerequisites

- [Multipass](https://multipass.run/)
- [Ansible](https://www.ansible.com/)

### Install Ansible (macOS)

```sh
brew install ansible
```

## 1. Create VMs

Launch 3 VMs (1 masters, 2 agents) using Multipass:

```sh
sh multipass/launch-vms.sh
```

## 2. Verify Connectivity

Check if Ansible can communicate with all VMs:

```sh
ansible all -i ansible/hosts.ini -m ping
```

## 3. Install K3s Cluster

Run the Ansible playbook to install K3s in HA mode:

```sh
ansible-playbook -i ansible/hosts.ini ansible/install_k3s.yml 
```

### Local kubectl Management

To manage the cluster from your host machine:

1. **Prepare the config on a master node** (e.g., `vm-1`):

    ```sh
    ssh ubuntu@192.168.252.26 "sudo cp /etc/rancher/k3s/k3s.yaml /tmp/k3s.yaml && sudo chmod 644 /tmp/k3s.yaml"
    ```

2. **Download the config to your local machine**:

    ```sh
    scp ubuntu@192.168.252.26:/tmp/k3s.yaml ./k3s.yaml
    ssh ubuntu@192.168.252.26 "sudo rm /tmp/k3s.yaml"
    ```

3. **Update the Server Address**:
    Edit `k3s.yaml` and replace `server: https://127.0.0.1:6443` with `server: https://192.168.252.26:6443`.
    *(Or use sed on macOS: `sed -i '' 's/127.0.0.1/192.168.252.26/g' k3s.yaml`)*

4. **Set KUBECONFIG**:

    ```sh
    export KUBECONFIG=$(pwd)/k3s.yaml
    kubectl get nodes
    ```

## 4. Configure Firewalls (UFW)

Secure the cluster nodes by opening only the required ports:

```sh
ansible-playbook -i ansible/hosts.ini ansible/configure_firewall.yml
```

## 5. Install Infrastructure Components

### LoadBalancer (MetalLB)

Provides external IP addresses for your services:

```sh
ansible-playbook -i ansible/hosts.ini ansible/install_metallb.yml
```

### Distributed Storage (Longhorn)

Provides replicated, high-availability storage across nodes:

```sh
ansible-playbook -i ansible/hosts.ini ansible/install_longhorn.yml
ansible-playbook -i ansible/hosts.ini ansible/expose_longhorn_ui.yml
```

### GitOps (ArgoCD)

Automated application deployment:

```sh
ansible-playbook -i ansible/hosts.ini ansible/install_argocd.yml
```

---

## 6. Accessing Services

### ArgoCD UI

- **URL**: [https://192.168.252.101](https://192.168.252.101)
- **Username**: `admin`
- **Password**: `HLHHhZIfWenv5j3s`
*(Note: Proceed past the SSL certificate warning in your browser)*

### Longhorn UI

- **URL**: [http://192.168.252.102](http://192.168.252.102)
- **Status**: No password required by default.

## Project Structure

- `multipass/`: Scripts and cloud-init for VM provisioning.
- `ansible/`:
  - `hosts.ini`: Inventory grouped by master and node roles.
  - `install_k3s.yml`: Playbook for HA installation.
  - `configure_firewall.yml`: UFW security configuration.
  - `install_metallb.yml`: LoadBalancer setup.
  - `install_longhorn.yml`: HA storage setup.
  - `expose_longhorn_ui.yml`: Expose Longhorn UI via LoadBalancer.
  - `install_argocd.yml`: GitOps setup.
