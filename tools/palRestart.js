import { z } from "zod";
import { apiRequest, ok, fail } from "../utils.js";

export function registerPalRestartTools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/palRestart/all
    // Restart all PALs — response returns after they come back online
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal_restart_all", {
        title: "Restart All PALs",
        description: "Restart all PAL devices (Pal6s, Pal7s, STApals, STApal7s). " +
            "GET /api/v1/palRestart/all. " +
            "The response is not returned until all PALs have come back online. " +
            "No parameters.",
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async () => {
        try {
            const data = await apiRequest("GET", "/api/v1/palRestart/all");
            return ok(data);
        }
        catch (err) {
            return fail(err, "restarting all PALs");
        }
    });
}
