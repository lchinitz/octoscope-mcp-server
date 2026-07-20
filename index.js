import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerAttenuatorTools } from "./tools/attenuators.js";
import { registerMpeTools } from "./tools/mpes.js";
import { registerGlobalStateTools } from "./tools/globalState.js";
import { registerPal6Tools } from "./tools/pal6.js";
import { registerPal7Tools } from "./tools/pal7.js";
import { registerStaPalTools } from "./tools/staPal.js";
import { registerStaPal7Tools } from "./tools/staPal7.js";
import { registerReplayTools } from "./tools/replay.js";
import { registerTrafficPairTools } from "./tools/trafficPairs.js";
import { registerTestConfigTools } from "./tools/testConfigs.js";
import { registerAutotestTools } from "./tools/autotest.js";
import { registerTurntableTools } from "./tools/turntable.js";
import { registerDashboardTools } from "./tools/dashboard.js";
import { registerTestbedTools } from "./tools/testbed.js";
import { registerPalRestartTools } from "./tools/palRestart.js";
import { registerSd2Tools } from "./tools/sd2.js";

// ── MCP server ────────────────────────────────────────────────────────────────
const server = new McpServer({
    name: "octobox-mcp-server",
    version: "1.2.0",
});

// ── Register all tool groups ──────────────────────────────────────────────────

// Hardware — RF path
registerAttenuatorTools(server);
registerMpeTools(server);
registerGlobalStateTools(server);

// Hardware — PAL devices
registerPal6Tools(server);
registerPal7Tools(server);
registerStaPalTools(server);
registerStaPal7Tools(server);
registerReplayTools(server);

// Hardware — accessories
registerTurntableTools(server);
registerPalRestartTools(server);

// Test configuration & traffic
registerTrafficPairTools(server);
registerTestConfigTools(server);
registerAutotestTools(server);

// System & utilities
registerDashboardTools(server);
registerTestbedTools(server);
registerSd2Tools(server);

// ── Transport ─────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("octobox-mcp-server running (stdio) — all tools registered");
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
