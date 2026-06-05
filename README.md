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

Launch 5 VMs (3 masters, 2 agents) using Multipass:

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

## 4. Configure Firewalls (UFW)

Secure the cluster nodes by opening only the required ports:

```sh
ansible-playbook -i ansible/hosts.ini ansible/configure_firewall.yml
```

**What this does:**

- Allows SSH.
- Allows full communication between all cluster nodes.
- Opens port 6443 (API Server) on master nodes.
- Opens ports 80/443 for Ingress on all nodes.
- Denies all other incoming traffic.

## 5. Cluster Management

### Using kubectl on Master Nodes

You can run `kubectl` directly on any master node (`vm-1`, `vm-2`, or `vm-3`):

```sh
# Example on vm-1
ssh ubuntu@192.168.252.26
sudo kubectl get nodes
```

### Accessing the Cluster Locally

To manage the cluster from your host machine:

1. **Prepare the config on a master node** (e.g., `vm-1`):

    ```sh
    ssh ubuntu@192.168.252.26 "sudo cp /etc/rancher/k3s/k3s.yaml /tmp/k3s.yaml && sudo chmod 644 /tmp/k3s.yaml"
    ```

2. **Download the config to your local machine**:

    ```sh
    scp ubuntu@192.168.252.26:/tmp/k3s.yaml ./k3s.yaml
    ssh ubuntu@192.168.252.26 "rm /tmp/k3s.yaml"
    ```

3. **Update the Server Address**:
    Edit `k3s.yaml` and replace `server: https://127.0.0.1:6443` with `server: https://192.168.252.26:6443`.
    *(Or use sed on macOS: `sed -i '' 's/127.0.0.1/192.168.252.26/g' k3s.yaml`)*

4. **Set KUBECONFIG**:

    ```sh
    export KUBECONFIG=$(pwd)/k3s.yaml
    kubectl get nodes
    ```

## Project Structure

- `multipass/`: Scripts and cloud-init for VM provisioning.
- `ansible/`:
  - `hosts.ini`: Inventory grouped by master and node roles.
  - `install_k3s.yml`: Playbook for HA installation and agent joining.
