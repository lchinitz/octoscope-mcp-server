import { z } from "zod";
import { apiRequest, ok, fail } from "../utils.js";

// ── Shared schemas ────────────────────────────────────────────────────────────
const TrafficEndpointSchema = z.object({
    alias: z.string().describe("Endpoint alias (e.g. 'P6C_5' or 'Server')."),
    managementAddress: z.string().optional().describe("Management IP address of the endpoint (e.g. '172.16.27.3')."),
    trafficAddress: z.string().optional().describe("Traffic IP address(es), slash-separated for dual-stack (e.g. '192.168.15.80/2001:470:1f07:d5b::80')."),
    devType: z.string().optional().describe("Device type (e.g. 'pal6', 'pal7', 'server')."),
    radio: z.string().optional().describe("Radio interface (e.g. 'RADIO_5'). Leave empty for wired endpoints."),
    linkMonitor: z.boolean().optional().describe("Enable link monitoring for this endpoint."),
});

const TrafficPairBodySchema = z.object({
    to: TrafficEndpointSchema.describe("Destination endpoint of the traffic pair."),
    from: TrafficEndpointSchema.describe("Source endpoint of the traffic pair."),
    alias: z.string().describe("Unique alias for this traffic pair (e.g. 'Traffic Pair 1')."),
    active: z.boolean().default(true).optional().describe("Whether this traffic pair is active (default: true)."),
    testDuration: z.number().int().default(30).optional().describe("Test duration in seconds (default: 30)."),
    settlingTime: z.number().int().default(2).optional().describe("Settling time in seconds before measurement begins (default: 2)."),
    bitrate: z.string().optional().describe("Target bitrate with unit (e.g. '100M', '1G'). Use '0' for unlimited. iperf2: KMGkmg; iperf3: KMG."),
    trafficType: z.enum(["iperf3", "iperf2", "ping"]).default("iperf3").optional().describe("Traffic generator type (default: 'iperf3')."),
    udp: z.string().optional().describe("Set to 'udp' for UDP traffic; omit for TCP."),
    ipVersion: z.enum(["ipv4", "ipv6"]).optional().describe("IP version to use ('ipv4' or 'ipv6')."),
    ipStreams: z.number().int().optional().describe("Number of parallel IP streams (e.g. 4)."),
    window: z.string().optional().describe("TCP/UDP window size (e.g. '2M')."),
    naglesAlgo: z.boolean().optional().describe("Enable Nagle's algorithm."),
    udpCounters64bit: z.boolean().optional().describe("Enable 64-bit UDP counters (iperf2 only)."),
    zerocopy: z.boolean().optional().describe("Enable zero-copy mode (iperf3 only)."),
    setMss: z.number().int().optional().describe("Set TCP maximum segment size in bytes."),
    length: z.string().optional().describe("Payload length in bytes. UDP: 16–65507; TCP: 0–1048576."),
    dscpType: z.string().optional().describe("Named DSCP preset: 'Best effort' (24), 'Background' (16), 'Video' (32), 'Voice' (56), or 'Custom' to use the dscp field."),
    dscp: z.number().int().min(0).max(63).optional().describe("DSCP / IP TOS value (0–63). Only used when dscpType is 'Custom'."),
    pingPayload: z.number().int().min(0).max(65507).optional().describe("Ping payload size in bytes (0–65507). Used when trafficType is 'ping'."),
    isochronous: z.boolean().optional().describe("Enable isochronous traffic mode (iperf2 only)."),
    fps: z.number().int().optional().describe("Frames per second for isochronous mode."),
    mean: z.string().optional().describe("Mean bitrate for isochronous mode (e.g. '20m')."),
    stdev: z.string().optional().describe("Standard deviation for isochronous mode (e.g. '1m')."),
    ipg: z.number().optional().describe("Interpacket gap in ms, 0–60 (iperf2, UDP, isochronous only)."),
    histogram: z.boolean().optional().describe("Enable latency histogram collection."),
    binCount: z.string().optional().describe("Number of histogram bins (e.g. '1000')."),
    binWidth: z.string().optional().describe("Width of each histogram bin in microseconds (e.g. '500')."),
    lowerCi: z.string().optional().describe("Lower confidence interval percentile (e.g. '5')."),
    upperCi: z.string().optional().describe("Upper confidence interval percentile (e.g. '95')."),
});

export function registerTrafficPairTools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/trafficPair/add
    // Add a new traffic pair to a given testConfig
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_add_traffic_pair", {
        title: "Add Traffic Pair",
        description: "Adds a new traffic pair to a given testConfig. " +
            "POST /api/v1/trafficPair/add. " +
            "A traffic pair defines a source ('from') and destination ('to') endpoint, " +
            "along with traffic generation parameters such as bitrate, protocol, and duration.",
        inputSchema: z.object({
            testName: z.string().describe("Name of the testConfig to add the traffic pair to (e.g. 'sample_test_name')."),
            trafficPair: TrafficPairBodySchema.describe("Traffic pair configuration to add."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", "/api/v1/trafficPair/add", params);
            return ok(data);
        }
        catch (err) {
            return fail(err, `adding traffic pair to testConfig '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/trafficPair/addVstas
    // Add vSTA traffic pairs to a given testConfig
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_add_vsta_traffic_pairs", {
        title: "Add vSTA Traffic Pairs",
        description: "Adds one or more vSTA traffic pairs to a given testConfig in a single call. " +
            "POST /api/v1/trafficPair/addVstas. " +
            "Use this instead of octobox_add_traffic_pair when configuring virtual STAs (vSTAs).",
        inputSchema: z.object({
            testName: z.string().describe("Name of the testConfig to add the vSTA traffic pairs to."),
            trafficPairs: z
                .array(TrafficPairBodySchema)
                .min(1)
                .describe("Array of vSTA traffic pair configurations to add."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", "/api/v1/trafficPair/addVstas", params);
            return ok(data);
        }
        catch (err) {
            return fail(err, `adding vSTA traffic pairs to testConfig '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/trafficPair/{testName}
    // Get all traffic pairs for a given testConfig
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_get_traffic_pairs", {
        title: "Get Traffic Pairs",
        description: "Get all trafficPairs associated with a given testConfig name. " +
            "GET /api/v1/trafficPair/{testName}.",
        inputSchema: z.object({
            testName: z.string().describe("The testConfig name from which to retrieve all traffic pairs."),
            response_format: z
                .enum(["markdown", "json"])
                .default("json")
                .describe("'markdown' returns a human-readable summary; 'json' returns raw payload."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET", `/api/v1/trafficPair/${encodeURIComponent(params.testName)}`);
            if (params.response_format === "json")
                return ok(data);
            const pairs = Array.isArray(data) ? data : [data];
            if (pairs.length === 0) {
                return { content: [{ type: "text", text: `No traffic pairs found for testConfig '${params.testName}'.` }] };
            }
            const lines = pairs.map((p) => `### Traffic Pair: \`${p["alias"] ?? "unknown"}\`\n` +
                Object.entries(p)
                    .filter(([k]) => k !== "alias")
                    .map(([k, v]) => `- **${k}**: ${JSON.stringify(v)}`)
                    .join("\n"));
            return { content: [{ type: "text", text: lines.join("\n\n") }] };
        }
        catch (err) {
            return fail(err, `fetching traffic pairs for testConfig '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/trafficPair/{testName}/{alias}
    // Get a specific traffic pair by testConfig name and alias
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_get_traffic_pair", {
        title: "Get Traffic Pair by Alias",
        description: "Get a specific trafficPair by testConfig name and alias. " +
            "GET /api/v1/trafficPair/{testName}/{alias}.",
        inputSchema: z.object({
            testName: z.string().describe("The testConfig name containing the traffic pair."),
            alias: z.string().describe("The alias of the traffic pair to retrieve."),
            response_format: z
                .enum(["markdown", "json"])
                .default("json")
                .describe("'markdown' returns a human-readable summary; 'json' returns raw payload."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET", `/api/v1/trafficPair/${encodeURIComponent(params.testName)}/${encodeURIComponent(params.alias)}`);
            if (params.response_format === "json")
                return ok(data);
            const p = data;
            const lines = Object.entries(p).map(([k, v]) => `- **${k}**: ${JSON.stringify(v)}`);
            return {
                content: [{
                    type: "text",
                    text: `### Traffic Pair: \`${params.alias}\` (testConfig: ${params.testName})\n\n` +
                        (lines.length ? lines.join("\n") : "_No data returned._"),
                }],
            };
        }
        catch (err) {
            return fail(err, `fetching traffic pair '${params.alias}' from testConfig '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // PUT /api/v1/trafficPair/update/{testName}/{alias}
    // Update a traffic pair within a given testConfig
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_update_traffic_pair", {
        title: "Update Traffic Pair",
        description: "Update a traffic pair within a given testConfig. " +
            "PUT /api/v1/trafficPair/update/{testName}/{alias}. " +
            "NOTES: Changing the 'alias' field is not permitted. " +
            "Take care when updating 'to'/'from' fields — changing them can invalidate existing data in the database. " +
            "If an autotest is active, changing the 'active' field will start/stop traffic immediately; " +
            "changing other fields alone will have no immediate effect (traffic is not restarted automatically).",
        inputSchema: z.object({
            testName: z.string().describe("The testConfig name containing the traffic pair to update."),
            alias: z.string().describe("The alias of the traffic pair to update. This value cannot be changed."),
            to: TrafficEndpointSchema.optional().describe("Updated destination endpoint."),
            from: TrafficEndpointSchema.optional().describe("Updated source endpoint."),
            active: z.boolean().optional().describe("Set to true to start traffic or false to stop it (when autotest is running)."),
            testDuration: z.number().int().optional().describe("Test duration in seconds."),
            settlingTime: z.number().int().optional().describe("Settling time in seconds."),
            bitrate: z.string().optional().describe("Target bitrate with unit (e.g. '100M'). Use '0' for unlimited."),
            trafficType: z.enum(["iperf3", "iperf2", "ping"]).optional().describe("Traffic generator type."),
            udp: z.string().optional().describe("Set to 'udp' for UDP; omit for TCP."),
            ipVersion: z.enum(["ipv4", "ipv6"]).optional().describe("IP version ('ipv4' or 'ipv6')."),
            ipStreams: z.number().int().optional().describe("Number of parallel IP streams."),
            window: z.string().optional().describe("TCP/UDP window size (e.g. '2M')."),
            naglesAlgo: z.boolean().optional().describe("Enable Nagle's algorithm."),
            udpCounters64bit: z.boolean().optional().describe("Enable 64-bit UDP counters (iperf2 only)."),
            zerocopy: z.boolean().optional().describe("Enable zero-copy mode (iperf3 only)."),
            setMss: z.number().int().optional().describe("TCP maximum segment size in bytes."),
            length: z.string().optional().describe("Payload length in bytes. UDP: 16–65507; TCP: 0–1048576."),
            dscpType: z.string().optional().describe("Named DSCP preset or 'Custom' to use the dscp field."),
            dscp: z.number().int().min(0).max(63).optional().describe("DSCP / IP TOS value (0–63)."),
            pingPayload: z.number().int().min(0).max(65507).optional().describe("Ping payload size in bytes."),
            isochronous: z.boolean().optional().describe("Enable isochronous traffic mode."),
            fps: z.number().int().optional().describe("Frames per second for isochronous mode."),
            mean: z.string().optional().describe("Mean bitrate for isochronous mode (e.g. '20m')."),
            stdev: z.string().optional().describe("Standard deviation for isochronous mode (e.g. '1m')."),
            ipg: z.number().optional().describe("Interpacket gap in ms, 0–60 (iperf2, UDP, isochronous only)."),
            histogram: z.boolean().optional().describe("Enable latency histogram collection."),
            binCount: z.string().optional().describe("Number of histogram bins."),
            binWidth: z.string().optional().describe("Width of each histogram bin in microseconds."),
            lowerCi: z.string().optional().describe("Lower confidence interval percentile."),
            upperCi: z.string().optional().describe("Upper confidence interval percentile."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const { testName, alias, ...body } = params;
            const data = await apiRequest("PUT", `/api/v1/trafficPair/update/${encodeURIComponent(testName)}/${encodeURIComponent(alias)}`, { alias, ...body });
            return ok(data);
        }
        catch (err) {
            return fail(err, `updating traffic pair '${params.alias}' in testConfig '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // DELETE /api/v1/trafficPair/{testName}/{alias}
    // Delete a traffic pair from a given testConfig
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_delete_traffic_pair", {
        title: "Delete Traffic Pair",
        description: "Delete a trafficPair from a given testConfig by alias. " +
            "DELETE /api/v1/trafficPair/{testName}/{alias}. " +
            "Use 'dashboard_test' as testName to delete from the dashboard test.",
        inputSchema: z.object({
            testName: z.string().describe("The testConfig name containing the traffic pair to delete. Use 'dashboard_test' for the dashboard test."),
            alias: z.string().describe("The alias of the traffic pair to delete."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("DELETE", `/api/v1/trafficPair/${encodeURIComponent(params.testName)}/${encodeURIComponent(params.alias)}`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `deleting traffic pair '${params.alias}' from testConfig '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/trafficPair/{action}/{testName}/{alias}
    // Start or stop traffic for a specific traffic pair by alias
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_control_traffic_pair", {
        title: "Start/Stop Traffic Pair by Alias",
        description: "Start or stop traffic for a specific trafficPair by alias. " +
            "POST /api/v1/trafficPair/{action}/{testName}/{alias}. " +
            "action must be either 'start' or 'stop'.",
        inputSchema: z.object({
            action: z.enum(["start", "stop"]).describe("Action to perform: 'start' or 'stop'."),
            testName: z.string().describe("The testConfig name containing the traffic pair."),
            alias: z.string().describe("The alias of the traffic pair to start or stop."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", `/api/v1/trafficPair/${encodeURIComponent(params.action)}` +
                `/${encodeURIComponent(params.testName)}` +
                `/${encodeURIComponent(params.alias)}`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `${params.action}ing traffic pair '${params.alias}' in testConfig '${params.testName}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/trafficPair/{action}/{testName}
    // Start or stop all traffic pairs in a given testConfig
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_control_all_traffic_pairs", {
        title: "Start/Stop All Traffic Pairs",
        description: "Start or stop all trafficPairs in a given testConfig at once. " +
            "POST /api/v1/trafficPair/{action}/{testName}. " +
            "action must be either 'start' or 'stop'.",
        inputSchema: z.object({
            action: z.enum(["start", "stop"]).describe("Action to perform: 'start' or 'stop'."),
            testName: z.string().describe("The testConfig name whose traffic pairs will all be started or stopped."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", `/api/v1/trafficPair/${encodeURIComponent(params.action)}` +
                `/${encodeURIComponent(params.testName)}`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `${params.action}ing all traffic pairs in testConfig '${params.testName}'`);
        }
    });
}
