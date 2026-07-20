import { z } from "zod";
import { apiRequest, ok, fail, OCTOBOX_BASE_URL } from "../utils.js";

// ── Shared TestConfig body schema (reused by create, archive, update) ─────────
const TestConfigBodySchema = z.object({
    name: z.string().describe("Unique name for the testConfig (e.g. 'rvr_test')."),
    model: z.string().optional().describe("User-provided model field (default: '-')."),
    revision: z.string().optional().describe("User-defined revision field (default: '-')."),
    description: z.string().optional().describe("User-defined description."),
    rvrMode: z.enum(["Static", "RvR", "RvRvO", "RvOvR", "RvRwR"]).optional()
        .describe("RvR mode (default: 'RvR')."),
    stepDuration: z.number().int().min(1).optional()
        .describe("Duration per attenuation step in seconds (min: 1, default: 60)."),
    trainingInterval: z.number().int().min(0).optional()
        .describe("Training duration before each step, 0 to stepDuration (default: 2)."),
    step: z.number().min(1).max(90).optional()
        .describe("Attenuation change per step, 1–90 in 0.5 dB increments."),
    synchroSnifferCapturing: z.boolean().optional()
        .describe("Enable synchroSniffer capturing (default: false)."),
    externalDataInterfaceEnable: z.string().optional()
        .describe("Enable external data interface (default: 'false')."),
    wiresharkHost: z.string().optional()
        .describe("IP address hosting Wireshark (e.g. '172.16.22.4')."),
    quadAttens: z.array(z.record(z.unknown())).optional()
        .describe("QuadAtten settings array."),
    virtualAttens: z.array(z.record(z.unknown())).optional()
        .describe("Virtual QuadAtten settings array."),
    mpes: z.array(z.record(z.unknown())).optional()
        .describe("MPE settings array."),
    virtualMpes: z.array(z.record(z.unknown())).optional()
        .describe("Virtual MPE settings array."),
    pal6s: z.array(z.record(z.unknown())).optional()
        .describe("Pal6 configuration settings array."),
    pal7s: z.array(z.record(z.unknown())).optional()
        .describe("Pal7 configuration settings array."),
    staPals: z.array(z.record(z.unknown())).optional()
        .describe("STAPal configuration settings array."),
    staPal7s: z.array(z.record(z.unknown())).optional()
        .describe("STAPal7 configuration settings array."),
    trafficPairs: z.array(z.record(z.unknown())).optional()
        .describe("TrafficPair settings array."),
    synchroSniffers: z.array(z.record(z.unknown())).optional()
        .describe("synchroSniffer settings array."),
    snifferDisplay: z.array(z.record(z.unknown())).optional()
        .describe("snifferDisplay settings array."),
    turntables: z.array(z.record(z.unknown())).optional()
        .describe("Turntable settings array."),
});

export function registerTestConfigTools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/testConfigs/initialize/{testName}
    // Configure all instruments for a given autotest
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_initialize_test_config", {
        title: "Initialize Test Config",
        description: "Configure all the instruments for a given autotest. " +
            "POST /api/v1/testConfigs/initialize/{testName}.",
        inputSchema: z.object({
            testName: z.string().describe("The name of the test config to initialize."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", `/api/v1/testConfigs/initialize/${encodeURIComponent(params.testName)}`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `initializing test config '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/testConfigs
    // Create a new TestConfig
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_create_test_config", {
        title: "Create Test Config",
        description: "Create a new TestConfig. " +
            "POST /api/v1/testConfigs. " +
            "Returns 201 on success, 206 if created with warnings, 400 if it already exists.",
        inputSchema: TestConfigBodySchema,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", "/api/v1/testConfigs", params);
            return ok(data);
        }
        catch (err) {
            return fail(err, `creating test config '${params.name}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // PUT /api/v1/testConfigs/data/{testName}
    // Archive autotest with a new test name
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_archive_test_config", {
        title: "Archive Test Config Data",
        description: "Archive an autotest under a new test name. " +
            "PUT /api/v1/testConfigs/data/{testName}. " +
            "Pass the existing testName in the path and a full or partial TestConfig body to update.",
        inputSchema: z.object({
            testName: z.string().describe("The name of the existing testConfig to archive (path param)."),
        }).merge(TestConfigBodySchema),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        const { testName, ...body } = params;
        try {
            const data = await apiRequest("PUT", `/api/v1/testConfigs/data/${encodeURIComponent(testName)}`, body);
            return ok(data);
        }
        catch (err) {
            return fail(err, `archiving test config data for '${testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/testConfigs
    // List all TestConfigs
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_list_test_configs", {
        title: "List Test Configs",
        description: "Get all testConfig records. " +
            "GET /api/v1/testConfigs. " +
            "Set namesOnly=true to return only name, model, revision, description, and _id.",
        inputSchema: z.object({
            namesOnly: z
                .boolean()
                .optional()
                .describe("When true, returns only name, model, revision, description, and _id fields."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const url = new URL(`${OCTOBOX_BASE_URL}/api/v1/testConfigs`);
            if (params.namesOnly)
                url.searchParams.set("namesOnly", "true");
            const response = await fetch(url.toString(), { headers: { "Content-Type": "application/json" } });
            if (!response.ok) {
                const text = await response.text().catch(() => "(no body)");
                throw new Error(`octoScope API error ${response.status} ${response.statusText}: ${text}`);
            }
            const data = await response.json();
            return ok(data);
        }
        catch (err) {
            return fail(err, "listing test configs");
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/testConfigs/{testName}
    // Get a specific TestConfig by name
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_get_test_config", {
        title: "Get Test Config by Name",
        description: "Get a specific testConfig record by name. " +
            "GET /api/v1/testConfigs/{testName}.",
        inputSchema: z.object({
            testName: z.string().describe("The name of the testConfig to retrieve."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET", `/api/v1/testConfigs/${encodeURIComponent(params.testName)}`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `fetching test config '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // PUT /api/v1/testConfigs/{testName}
    // Update a TestConfig in place
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_update_test_config", {
        title: "Update Test Config",
        description: "Update a specified testConfig in place by testName. " +
            "PUT /api/v1/testConfigs/{testName}. " +
            "Unlike octobox_archive_test_config (PUT /data/{testName}), this updates the existing record directly.",
        inputSchema: z.object({
            testName: z.string().describe("The name of the existing testConfig to update (path param)."),
        }).merge(TestConfigBodySchema),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        const { testName, ...body } = params;
        try {
            const data = await apiRequest("PUT", `/api/v1/testConfigs/${encodeURIComponent(testName)}`, body);
            return ok(data);
        }
        catch (err) {
            return fail(err, `updating test config '${testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // DELETE /api/v1/testConfigs/{testName}
    // Delete a specific TestConfig by name
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_delete_test_config", {
        title: "Delete Test Config",
        description: "Delete a specified testConfig by testName. " +
            "DELETE /api/v1/testConfigs/{testName}.",
        inputSchema: z.object({
            testName: z.string().describe("The name of the testConfig to delete."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("DELETE", `/api/v1/testConfigs/${encodeURIComponent(params.testName)}`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `deleting test config '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // DELETE /api/v1/testConfigs
    // Delete ALL TestConfigs and associated data
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_delete_all_test_configs", {
        title: "Delete All Test Configs",
        description: "Delete all testConfig records and their associated data. " +
            "DELETE /api/v1/testConfigs. WARNING: this is irreversible.",
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
    }, async () => {
        try {
            const data = await apiRequest("DELETE", "/api/v1/testConfigs");
            return ok(data);
        }
        catch (err) {
            return fail(err, "deleting all test configs");
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/testConfigs/eventLog/{testName}
    // Get event log for a TestConfig
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_get_test_config_event_log", {
        title: "Get Test Config Event Log",
        description: "Get event logs for a specified testConfig by testName. " +
            "GET /api/v1/testConfigs/eventLog/{testName}.",
        inputSchema: z.object({
            testName: z.string().describe("The name of the testConfig to retrieve event logs for."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET", `/api/v1/testConfigs/eventLog/${encodeURIComponent(params.testName)}`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `fetching event log for test config '${params.testName}'`);
        }
    });

}
