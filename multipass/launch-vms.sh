# This script will create 3 VMs, and if any previous VMs created, 
# it will remove first before create a new one.
# Each instance will assign 2CPUs, 4GB of RAM and 20GB of Storage.
# NOTE: YOUR PREVIOUS VMs WILL BE GONE!!!

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Get host ssh public key
SSH_KEY="$(cat ~/.ssh/id_ed25519.pub)"

# Start create 3 VMs
for i in {1..3}; do
    # Set static IP (aligning with ansible/hosts.ini)
    # VM_IP="192.168.252.$((25 + i))"
    echo "----------------------------------------"
    # echo "Setting up vm-$i with IP $VM_IP..."

    # Clean up VM
    multipass stop vm-$i
    multipass delete --purge vm-$i
    
    # Create a temporary cloud-init file
    TEMP_CI=$(mktemp "$SCRIPT_DIR/cloud-init-vm-$i-XXXXXX.yaml")
    sed -e "s/\${SSH_KEY}/$SSH_KEY/g" \
        "$SCRIPT_DIR/cloud-init.yaml" > "$TEMP_CI"
    
    echo "Launching vm-$i..."
    multipass launch --name "vm-$i" \
        --cpus 2 --memory 4G --disk 20G \
        # --network name=en0,mode=manual \
        --cloud-init "$TEMP_CI"
    
    # Cleanup temp file
    rm "$TEMP_CI"
    # Change IP
    # multipass exec vm-$i -- sudo bash -s $VM_IP < change-ip.sh
done

echo "----------------------------------------"
echo "All VMs launched successfully."
multipass list