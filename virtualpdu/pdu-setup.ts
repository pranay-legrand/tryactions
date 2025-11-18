// setupPdu.ts
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function runCommand(command: string): string {
  try {
    console.log(`>>> Running: ${command}`);
    return execSync(command, { stdio: "pipe" }).toString().trim();
  } catch (error) {
    console.error(`❌ Error executing: ${command}`);
    process.exit(1);
  }
}

function main() {
  console.log("--- 1. Downloading squashfs package ---");
  const PDU_NAME = "pdu-x86qemulinux-squashfs-040311-52050.tgz";
  const virtualPduDir = path.resolve("./virtualpdu");

  if (!fs.existsSync(virtualPduDir)) {
    fs.mkdirSync(virtualPduDir, { recursive: true });
  }
  
  //runCommand(
  //  `wget -P ${virtualPduDir} "https://releases.rz.raritan.com/raritan_power/dpx_II/firmware/latest_ga/${PDU_NAME}"`
  //);

  console.log("--- 2. Unzipping the tgz file ---");
  runCommand(`tar -xvf "${virtualPduDir}/${PDU_NAME}" -C "${virtualPduDir}"`);
  console.log("--- 3. Moving to folder and installing the PDU ---");
  const extractedDir = runCommand(
    `find ${virtualPduDir} -maxdepth 1 -type d -name "pdu-x86qemulinux-squashfs-*"`
  );

  if (!extractedDir) {
    console.error("❌ Error: Extracted folder not found");
    process.exit(1);
  }else{
    runCommand(`cd ~`);
    runCommand(`pwd`);
    console.log(`Extracted folder: ${extractedDir}`);
    runCommand(`cd ${extractedDir}`)
  }

  process.chdir(extractedDir);
  runCommand("sudo chmod +x ./qemu_boot.sh");

  console.log("--- 3. Starting Vpdu creation workflow ---");
  const Pdu_IP = runCommand("sudo ./qemu_boot.sh");
  console.log(`Pdu_SYSTEM=${Pdu_IP}`);

  if (!Pdu_IP) {
    console.error("❌ Error: Failed to get Pdu IP address.");
    process.exit(1);
  }

  console.log("--- 4. Writing IP to .env file ---");
  fs.writeFileSync(".env", `Pdu_SYSTEM=${Pdu_IP}\n`);

  console.log("✅ Pdu setup script finished.");
  console.log(`You can now connect to the Pdu with its IP: ${Pdu_IP}`);
}

main();
