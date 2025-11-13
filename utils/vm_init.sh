#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

# This script automates the setup of the IDM test virtual machine.
# It assumes that prerequisite packages like kvm, libvirt, nodejs, and npm are already installed.
# For a fresh machine, run this first:
# sudo dnf install -y qemu-kvm libvirt-daemon libvirt-client virt-install virt-manager bridge-utils nodejs npm cpio
# sudo systemctl status libvirtd

echo "--- 1. Installing project dependencies ---"
ISO_NAME="IDM_1.0.0.alpha.612.iso"
ISO_SOURCE_PATH="./utils/${ISO_NAME}"
# In future Change to path to a url using a wget/curl
ISO_DEST_PATH="/var/lib/libvirt/images/${ISO_NAME}"

echo "--- 2. Preparing ISO image ---"
if [ ! -f "$ISO_SOURCE_PATH" ]; then
    echo "❌ Error: ISO file not found at ${ISO_SOURCE_PATH}"
    exit 1
fi

echo "Copying ISO to libvirt images directory..."
sudo cp "$ISO_SOURCE_PATH" "$ISO_DEST_PATH"

echo "--- 3. Starting VM creation workflow ---"
sudo npx ts-node ./virtualmachine/idm_test_workflow.ts "$ISO_DEST_PATH"

echo "✅ VM setup script finished."
if [ -f "./.env" ]; then
    echo "IP address saved to ./.env"
fi
echo "You can now connect to the VM or use virt-manager to see its status."