#!/bin/bash

VM_IP=$1
INTERFACE="enp0s2" # This is the secondary interface Multipass creates

echo "Configuring static IP: $VM_IP on secondary interface: $INTERFACE..."

# Write the custom static IP Netplan config for the SECONDARY interface ONLY
echo "Writing Netplan configuration to /etc/netplan/99-custom-network.yaml..."
cat <<EOF > /etc/netplan/99-custom-network.yaml
network:
  version: 2
  ethernets:
    $INTERFACE:
      dhcp4: no
      addresses: [$VM_IP/24]
      # We intentionally leave out the 'routes' gateway here.
      # Multipass uses the primary interface for internet access. 
      # Adding a second gateway will cause network routing conflicts!
EOF

chmod 600 /etc/netplan/99-custom-network.yaml

echo "Applying network changes..."
netplan apply

echo "Success! Your VM is now available at $VM_IP, and Multipass is still connected."