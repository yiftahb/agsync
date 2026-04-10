import { execSync } from "node:child_process";
import { CURRENT_VERSION, getLatestVersion } from "@/utils/version";

export async function runUpdate(): Promise<void> {
  console.log(`Current version: ${CURRENT_VERSION}`);
  const latest = await getLatestVersion();

  if (latest === CURRENT_VERSION) {
    console.log("Already on the latest version.");
    return;
  }

  console.log(`Updating: ${CURRENT_VERSION} → ${latest}`);
  try {
    execSync("npm install -g agsync-cli@latest", { stdio: "inherit" });
  } catch (_) {
    void _;
    throw new Error(
      "Update failed. You may need to run with sudo:\n  sudo npm install -g agsync-cli@latest"
    );
  }
  console.log(`Successfully updated to ${latest}`);
}
