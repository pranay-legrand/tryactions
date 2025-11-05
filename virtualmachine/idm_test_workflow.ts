import { exec, ExecOptions } from "child_process";
import * as fs from "fs";

interface VmConfig {
    name: string;
    diskSizeGb: number;
    ramMb: number;
    vcpus: number;
    isoPath: string;
    diskImagePath: string;
}

/**
 * Manages the lifecycle of a KVM virtual machine for testing.
 */
export class VirtualMachineManager {
    private config: VmConfig;
    public ipAddress: string | null = null;

    constructor(config: VmConfig) {
        this.config = config;
    }

    private log(message: string) {
        console.error(`[VM] ${message}`);
    }

    private async execute(command: string, options: ExecOptions = {}): Promise<string> {
        this.log(`Executing: ${command}`);
        return new Promise((resolve, reject) => {
            exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    const errorMessage = `Error executing command: '${command}'.\n\tSTDERR: ${stderr.toString().trim()}\n\tSTDOUT: ${stdout.toString().trim()}\n\tERROR: ${error.message}`;
                    this.log(errorMessage);
                    return reject(new Error(errorMessage));
                }
                resolve(stdout.toString().trim());
            });
        });
    }

    /**
     * Checks for an existing VM and cleans it up if present.
     */
    async cleanupVmIfPresent() {
        this.log(`--- Checking for existing VM '${this.config.name}' ---`);
        const listOutput = await this.execute(`sudo virsh list --all`).catch(() => "");
        const vmExists = listOutput.includes(this.config.name);

        if (!vmExists) {
            this.log(`✅ No existing VM found — skipping cleanup.`);
            return;
        }

        this.log(`⚙️ Cleaning up existing VM '${this.config.name}'...`);
        await this.execute(`sudo virsh destroy ${this.config.name}`).catch(() => this.log("VM not running — skipping destroy."));
        await this.execute(`sudo virsh undefine ${this.config.name} --remove-all-storage`).catch(() => this.log("Undefine skipped."));
        if (fs.existsSync(this.config.diskImagePath)) {
            fs.unlinkSync(this.config.diskImagePath);
            this.log(`Deleted disk image: ${this.config.diskImagePath}`);
        }
        this.log(`✅ Cleanup complete.`);
    }

    /**
     * Sets up the environment by creating the virtual disk.
     */
    async setupEnvironment() {
        this.log("--- Setting up environment ---");

        if (!fs.existsSync(this.config.isoPath)) {
            throw new Error(`ISO not found at ${this.config.isoPath}`);
        }

        const info = await this.execute(`file ${this.config.isoPath}`);
        if (!info.toLowerCase().includes("bootable")) {
            this.log(`⚠️ Warning: ISO might not be bootable — detected: ${info}`);
        }

        await this.execute(`sudo qemu-img create -f qcow2 ${this.config.diskImagePath} ${this.config.diskSizeGb}G`);
        this.log(`✅ Created virtual disk: ${this.config.diskImagePath}`);
    }

    /**
     * Defines and starts the VM installation process.
     */
    async defineAndStartVM() {
        this.log("--- Creating and starting VM ---");
        const networkType = "default"; // Force use of the default NAT network
        this.log(`Using network: ${networkType}`);

        const virtInstallCmd =
            `sudo virt-install --name ${this.config.name}` +
            ` --ram ${this.config.ramMb} --vcpus ${this.config.vcpus}` +
            ` --disk path=${this.config.diskImagePath},format=qcow2,bus=virtio` +
            ` --os-variant rocky9` +
            ` --boot cdrom,hd,menu=on` +
            ` --cdrom ${this.config.isoPath}` +
            ` --network ${networkType}` +
            ` --graphics vnc,listen=0.0.0.0` +
            ` --noautoconsole`;

        await this.execute(virtInstallCmd);
        this.log(`✅ VM installation launched.`);
        //await this.execute(`virt-manager`);
    }

    /**
     * Navigates the VM's boot menu via simulated key presses.
     */
    async navigateBootMenu() {
        this.log("--- Navigating VM boot menu ---");
        this.log("Waiting 5 seconds for the boot menu to appear...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        this.log("Sending 'Down Arrow' key...");
        await this.execute(`sudo virsh send-key ${this.config.name} KEY_DOWN`);
        await new Promise(resolve => setTimeout(resolve, 500));

        this.log("Sending 'Enter' key...");
        await this.execute(`sudo virsh send-key ${this.config.name} KEY_ENTER`);
        this.log("✅ Boot menu selection complete.");
    }

    /**
     * Triggers the final reboot after the installer has finished.
     */
    async triggerFinalReboot() {
        this.log("--- Attempting to trigger final reboot ---");
        this.log("Waiting 5 minutes for installer to complete...");
        await new Promise(resolve => setTimeout(resolve, 300000));

        this.log("Sending 'Tab' key to focus the reboot button...");
        await this.execute(`sudo virsh send-key ${this.config.name} KEY_TAB`);
        await new Promise(resolve => setTimeout(resolve, 500));

        this.log("Sending 'Enter' key to confirm reboot...");
        await this.execute(`sudo virsh send-key ${this.config.name} KEY_ENTER`);
        this.log("✅ Reboot command sent.");
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    /**
     * Starts the VM after the OS installation is complete.
     */
    // async startVmAfterInstall() {
    //     this.log("--- Starting VM to boot from new OS ---");
    //     await new Promise(resolve => setTimeout(resolve, 5000));
    //     await this.execute(`sudo virsh start ${this.config.name}`);
    //     this.log(`✅ VM '${this.config.name}' started.`);
    // }
    async startVmAfterInstall() {
    this.log("--- Starting VM to boot from new OS ---");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if VM is already running
    const stateOutput = await this.execute(`sudo virsh domstate ${this.config.name}`).catch(() => "");
    if (stateOutput.toLowerCase().includes("running")) {
        this.log(`⚠️ VM '${this.config.name}' is already running — skipping start.`);
        return;
    }

    await this.execute(`sudo virsh start ${this.config.name}`);
    this.log(`✅ VM '${this.config.name}' started.`);
}

    /**
     * Polls libvirt to get the VM's IP address.
     */
    async getVmIpAddress(timeoutSeconds = 300): Promise<string> {
        this.log("Waiting 30 seconds for installer to complete...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        this.log(`--- Waiting for VM '${this.config.name}' to obtain an IP ---`);
        const start = Date.now();

        while (Date.now() - start < timeoutSeconds * 1000) {
            const output = await this.execute(`sudo virsh domifaddr ${this.config.name} --source lease`).catch(() => "");
            const match = output.match(/ipv4\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
            if (match && match[1]) {
                this.ipAddress = match[1];
                this.log(`✅ VM IP: ${this.ipAddress}`);
                return this.ipAddress;
            }
            process.stderr.write(".");
            await new Promise((r) => setTimeout(r, 5000));
        }

        throw new Error("Timed out waiting for VM IP address.");
    }
}

// --- Main ---
async function main(): Promise<string> {
    const vmName = "idm-test-vm";
    const vmConfig: VmConfig = {
        name: vmName,
        diskSizeGb: 30,
        ramMb: 4096,
        vcpus: 2,
        isoPath: "/var/lib/libvirt/images/IDM_1.0.0.alpha.612.iso",
        diskImagePath: `/var/lib/libvirt/images/${vmName}.qcow2`,
    };

    const vmManager = new VirtualMachineManager(vmConfig);

    try {
        await vmManager.cleanupVmIfPresent();
        await vmManager.setupEnvironment();
        await vmManager.defineAndStartVM();
        await vmManager.navigateBootMenu();
        console.error("\n⏳ Installation is in progress. This will take several minutes...");
        await vmManager.triggerFinalReboot();
        await vmManager.startVmAfterInstall();
        const ip = await vmManager.getVmIpAddress(300);
        if (ip) {
            console.error(`\n✅ Success! VM is ready at IP: ${ip}`);
            console.error(`   You can SSH into your VM with: ssh arbitrary@${ip}`);
            return ip;
        }
        throw new Error("Failed to get VM IP address.");
    } catch (err) {
        if (err instanceof Error) {
            console.error(`\n❌ VM setup failed: ${err.stack}`);
        } else {
            console.error(`\n❌ VM setup failed: ${String(err)}`);
        }
        throw err;
    }
}

main().then(console.log).catch(() => process.exit(1));