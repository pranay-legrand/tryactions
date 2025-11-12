#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

# This script automates the setup of the IDM test virtual Pdu's.
# It assumes that prerequisite packages like virtualization package,Networking utility & Python libraries for sensor randomization
# For a fresh machine, run this first:
# sudo apt install -y qemu-kvm
# sudo apt install -y uml-utilities
# sudo apt install python3-pexpect python3-requests
# sudo dnf install qemu-kvm
# sudo dnf install tunctl
# sudo dnf install python3-pexpect python3-requests
# sudo apt install inetutils-telnet

 

echo "--- 1. Downloading squashfs package ---"
PDU_NAME="pdu-x86qemulinux-squashfs-040311-52050.tgz"
mkdir -p ./virtual_pdu
wget -P ./virtual_pdu "https://releases.rz.raritan.com/raritan_power/dpx_II/firmware/latest_ga/${PDU_NAME}"

echo "--- 2. Unzipping the tgz file ---"
tar -xvf ./virtual_pdu/${PDU_NAME} -C ./virtual_pdu

echo "--- 3. Moving to folder and installing the PDU ---"
# Find the extracted directory dynamically
EXTRACTED_DIR=$(find ./virtual_pdu -maxdepth 1 -type d -name "pdu-x86qemulinux-squashfs-*")

cd "$EXTRACTED_DIR" || { echo "Error: Extracted folder not found"; exit 1; }

sudo chmod +x ./qemu_boot.sh
#sudo ./qemu_boot.sh


echo "--- 3. Starting Vpdu creation workflow ---"
Pdu_IP=$(sudo ./qemu_boot.sh)
echo "Pdu_SYSTEM=${Pdu_IP}"


if [ -z "$Pdu_IP" ]; then
    echo "❌ Error: Failed to get Pdu IP address."
    exit 1
fi

echo "--- 4. Writing IP to .env file ---"
echo "Pdu_SYSTEM=${Pdu_IP}" > ./.env

echo "✅ Pdu setup script finished."
echo "You can now connect to the Pdu with is Ip:- $Pdu_IP"