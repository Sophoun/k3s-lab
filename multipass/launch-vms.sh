# This script will create 5 VMs, and if any previous VMs created, 
# it will remove first before create a new one.
# Each instance will assign 2CPUs, 2GB of RAM and 20GB of Storage.
# NOTE: YOUR PREVIOUS VMs WILL BE GONE!!!

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# List vm
multipass list

# Start create 5 VMs
for i in {1..5}; do
    echo "Delete existing vm-$i"
    multipass delete --purge vm-$i 2>/dev/null || true
    echo "Launching vm-$i..."
    multipass launch --name "vm-$i" \
        --cpus 2 --memory 2G --disk 20G \
        --cloud-init "$SCRIPT_DIR/cloud-init.yaml"
done

# List vm after created
multipass list