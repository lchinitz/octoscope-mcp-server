import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerAttenuatorTools } from "./tools/attenuators.js";
import { registerStaPal7Tools } from "./tools/staPal7.js";
import { registerPal7Tools } from "./tools/pal7.js";
import { registerTrafficPairTools } from "./tools/trafficPairs.js";
import { registerTestConfigTools } from "./tools/testConfigs.js";
import { registerDashboardTools } from "./tools/dashboard.js";
import { registerTestbedTools } from "./tools/testbed.js";
import { registerSd2Tools } from "./tools/sd2.js";

// ── MCP server ────────────────────────────────────────────────────────────────
const server = new McpServer({
    name: "octobox-mcp-server",
    version: "1.1.0",
});

// ── Register all tool groups ──────────────────────────────────────────────────
registerAttenuatorTools(server);
registerStaPal7Tools(server);
registerPal7Tools(server);
registerTrafficPairTools(server);
registerTestConfigTools(server);
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
