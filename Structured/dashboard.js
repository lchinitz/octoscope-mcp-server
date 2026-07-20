import { z } from "zod";
import { apiRequest, ok, fail } from "../utils.js";

export function registerDashboardTools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // PUT /api/v1/dashboardTraffic/set/started
    // Start the traffic on the dashboard
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_dashboard_traffic_start", {
        title: "Start Traffic on the Dashboard",
        description: "Start Traffic on the Octobox Dashboard. " +
            "PUT /api/v1/dashboardTraffic/set/started. " +
            "No parameters.",
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async () => {
        try {
            const data = await apiRequest("PUT", `/api/v1/dashboardTraffic/set/started`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `starting the traffic on the dashboard`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // PUT /api/v1/dashboardTraffic/set/stopped
    // Stop the traffic on the dashboard
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_dashboard_traffic_stop", {
        title: "Stop Traffic on the Dashboard",
        description: "Stop Traffic on the Octobox Dashboard. " +
            "PUT /api/v1/dashboardTraffic/set/stopped. " +
            "No parameters.",
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async () => {
        try {
            const data = await apiRequest("PUT", `/api/v1/dashboardTraffic/set/stopped`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `stopping the traffic on the dashboard`);
        }
    });
}
