import { execSync } from "child_process";

console.log("🚀 STARTING AUTOMATION WORKFLOW...");

try {
  console.log("\n--- [PHASE 1] SCRAPING 5 OLDEST BLOGS ---");
  execSync("node src/services/beyondChatsScraper.js", { stdio: "inherit" });

  console.log("\n--- [PHASE 2] AI RESEARCH & GENERATION ---");
  execSync("node src/pipeline/runPipeline.js", { stdio: "inherit" });

  console.log("\n✅ ALL TASKS COMPLETE.");

} catch (error) {
  console.error("❌ Workflow failed:", error.message);
}