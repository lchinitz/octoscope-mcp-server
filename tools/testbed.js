import { z } from "zod";
import { fail, OCTOBOX_BASE_URL } from "../utils.js";

export function registerTestbedTools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/testbedComponents
    // Retrieve all testbed components
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_get_testbed_components", {
        description: "Retrieve all testbed components from the octoScope system. GET /api/v1/testbedComponents",
        inputSchema: {
            response_format: z.enum(["markdown", "json"]).default("markdown").describe("'markdown' returns a human-readable table; 'json' returns raw payload.")
        }
    }, async ({ response_format = "markdown" }) => {
        try {
            const res = await fetch(`${OCTOBOX_BASE_URL}/api/v1/testbedComponents`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`octoScope API error ${res.status} ${res.statusText}: ${errorBody}`);
            }
            const data = await res.json();
            if (response_format === "json") {
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
                };
            }
            // Markdown formatting
            if (!data || (Array.isArray(data) && data.length === 0)) {
                return {
                    content: [{ type: "text", text: "No testbed components found." }]
                };
            }
            const components = Array.isArray(data) ? data : [data];
            const lines = components.map(c => {
                return [
                    `### Component: \`${c.name ?? c.id ?? "unknown"}\``,
                    ...Object.entries(c)
                        .filter(([k]) => k !== "name")
                        .map(([k, v]) => `- **${k}**: ${JSON.stringify(v)}`)
                ].join("\n");
            });
            return {
                content: [{ type: "text", text: lines.join("\n\n") }]
            };
        }
        catch (err) {
            return fail(err, "fetching testbed components");
        }
    });
}
