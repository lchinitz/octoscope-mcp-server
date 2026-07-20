import { z } from "zod";
import { apiRequest, ok, fail } from "../utils.js";

export function registerAutotestTools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/autotest/start/{testName}
    // Start an autotest by name
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_autotest_start", {
        title: "Start Autotest",
        description: "Start an autotest by name. " +
            "POST /api/v1/autotest/start/{testName}. " +
            "Optionally push pal/staPal configurations from the test config before starting.",
        inputSchema: z.object({
            testName: z
                .string()
                .describe("The name of the test config to start."),
            pushConfigs: z
                .boolean()
                .optional()
                .default(true)
                .describe("Whether to push the pal/staPal configurations in the test config before starting (default: true)."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const { testName, ...body } = params;
            const data = await apiRequest("POST", `/api/v1/autotest/start/${encodeURIComponent(testName)}`, body);
            return ok(data);
        }
        catch (err) {
            return fail(err, `starting autotest '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/autotest/stop/{testName}
    // Stop any active autotest by name
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_autotest_stop", {
        title: "Stop Autotest",
        description: "Stop any active autotest by name. " +
            "POST /api/v1/autotest/stop/{testName}.",
        inputSchema: z.object({
            testName: z
                .string()
                .describe("The name of the test config to stop."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", `/api/v1/autotest/stop/${encodeURIComponent(params.testName)}`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `stopping autotest '${params.testName}'`);
        }
    });
}
