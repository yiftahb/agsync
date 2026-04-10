import { CURRENT_VERSION, getLatestVersion } from "@/utils/version";

export async function runVersion(): Promise<void> {
  console.log(`agsync ${CURRENT_VERSION}`);
  try {
    const latest = await getLatestVersion();
    if (latest !== CURRENT_VERSION) {
      console.log(`Update available: ${latest} (run "agsync update")`);
    } else {
      console.log("You are on the latest version.");
    }
  } catch (_) {
    void _;
  }
}
