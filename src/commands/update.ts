import { execSync } from "node:child_process";

declare const __VERSION__: string;

async function getLatestVersion(): Promise<string> {
  const res = await fetch("https://registry.npmjs.org/agsync-cli/latest");
  if (!res.ok) {
    throw new Error(`Failed to check latest version (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { version: string };
  return data.version;
}

export async function runUpdate(): Promise<void> {
  console.log(`Current version: ${__VERSION__}`);
  const latest = await getLatestVersion();

  if (latest === __VERSION__) {
    console.log("Already on the latest version.");
    return;
  }

  console.log(`Updating: ${__VERSION__} → ${latest}`);
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
