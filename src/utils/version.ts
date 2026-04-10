declare const __VERSION__: string;

export const CURRENT_VERSION = __VERSION__;

export async function getLatestVersion(): Promise<string> {
  const res = await fetch("https://registry.npmjs.org/agsync-cli/latest");
  if (!res.ok) {
    throw new Error(`Failed to check latest version (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { version: string };
  return data.version;
}
