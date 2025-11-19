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
  runCommand(`tar -xvf "${path.join(virtualPduDir, PDU_NAME)}" -C "${virtualPduDir}"`);
  
  console.log("--- 3. Finding extracted PDU directory ---");
  const findOutput = runCommand(
    `find ${virtualPduDir} -maxdepth 1 -type d -name "pdu-x86qemulinux-squashfs-*"`
  );

  // The find command can return multiple lines if more than one dir matches.
  // We'll take the first one.
  const extractedDir = findOutput.split("\n")[0].trim();

  if (!extractedDir || !fs.existsSync(extractedDir)) {
    console.error("❌ Error: Extracted folder not found");
    process.exit(1);
  }
  console.log(`Found extracted folder: ${extractedDir}`);

  console.log("--- 4. Starting vPDU creation workflow ---");
  process.chdir(extractedDir);
  runCommand("sudo chmod +x ./qemu_boot.sh");

  const Pdu_IP = runCommand("sudo ./qemu_boot.sh");

  if (!Pdu_IP) {
    console.error("❌ Error: Failed to get Pdu IP address.");
    process.exit(1);
  }
  console.log(`vPDU IP Address: ${Pdu_IP}`);

  console.log("--- 5. Writing IP to .env file ---");
  fs.writeFileSync(".env", `Pdu_SYSTEM=${Pdu_IP}\n`);

  console.log("✅ Pdu setup script finished.");
  console.log(`You can now connect to the Pdu with its IP: ${Pdu_IP}`);
}

main();
