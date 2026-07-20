import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// ── Configuration ─────────────────────────────────────────────────────────────
const OCTOBOX_BASE_URL = process.env.OCTOBOX_BASE_URL ?? "http://10.160.81.80:4000";
// ── API client ────────────────────────────────────────────────────────────────
async function apiRequest(method, path, body) {
    const url = `${OCTOBOX_BASE_URL}${path}`;
    const init = {
        method,
        headers: { "Content-Type": "application/json" },
    };
    if (body !== undefined) {
        init.body = JSON.stringify(body);
    }
    const response = await fetch(url, init);
    if (!response.ok) {
        const text = await response.text().catch(() => "(no body)");
        throw new Error(`octoScope API error ${response.status} ${response.statusText}: ${text}`);
    }
    const text = await response.text();
    if (!text)
        return {};
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
function errText(err, context) {
    const message = err instanceof Error ? err.message : String(err);
    return `Error ${context}: ${message}\n\nEnsure OCTOBOX_BASE_URL is set correctly (current: ${OCTOBOX_BASE_URL}).`;
}
function ok(data) {
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function fail(err, context) {
    return {
        content: [{ type: "text", text: errText(err, context) }],
        isError: true,
    };
}
// ── Formatting helpers ────────────────────────────────────────────────────────
function formatMarkdown(data) {
    const arr = Array.isArray(data) ? data : [data];
    if (arr.length === 0)
        return "No attenuators found.";
    const lines = [];
    for (const device of arr) {
        lines.push(`### Attenuator: \`${device["managementAddr"] ?? "unknown"}\``);
        const extra = Object.entries(device).filter(([k]) => k !== "managementAddr");
        if (extra.length > 0) {
            lines.push(extra.map(([k, v]) => `- **${k}**: ${JSON.stringify(v)}`).join("\n"));
        }
        lines.push("");
    }
    return lines.join("\n");
}
// ── MCP server ────────────────────────────────────────────────────────────────
const server = new McpServer({
    name: "octobox-mcp-server",
    version: "1.1.0",
});
//REGISTER TOOLS
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/attenuators
// Query attenuators by optional comma-separated IP list
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool("octobox_get_attenuators", {
    title: "Get Attenuator Values",
    description: "Retrieve current attenuation values from one or more octoScope attenuator devices. " +
        "GET /api/v1/attenuators?managementAddrList=... " +
        "Omit managementAddrList to return all attenuators known to the system.",
    inputSchema: z.object({
        managementAddrList: z
            .string()
            .optional()
            .describe("Comma-separated list of attenuator IP addresses " +
            "(e.g. '192.168.1.10,192.168.1.11'). Omit to retrieve all."),
        response_format: z
            .enum(["markdown", "json"])
            .default("markdown")
            .describe("'markdown' returns a human-readable table; 'json' returns raw payload."),
    }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
}, async (params) => {
    try {
        const url = new URL(`${OCTOBOX_BASE_URL}/api/v1/attenuators`);
        if (params.managementAddrList) {
            url.searchParams.set("managementAddrList", params.managementAddrList);
        }
        const response = await fetch(url.toString(), {
            headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "(no body)");
            throw new Error(`octoScope API error ${response.status} ${response.statusText}: ${text}`);
        }
        const data = await response.json();
        if (params.response_format === "json") {
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: { attenuators: data } };
        }
        return { content: [{ type: "text", text: formatMarkdown(data) }], structuredContent: { attenuators: data } };
    }
    catch (err) {
        return fail(err, "fetching attenuators");
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/attenuators/{managementAddr}
// Get a single attenuator by IP address
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool("octobox_get_attenuator_by_addr", {
    title: "Get Single Attenuator by IP",
    description: "Retrieve attenuation values for a single attenuator device by its IP address. " +
        "GET /api/v1/attenuators/{managementAddr}.",
    inputSchema: z.object({
        managementAddr: z.string().describe("IP address of the attenuator device."),
        response_format: z
            .enum(["markdown", "json"])
            .default("markdown")
            .describe("'markdown' returns a table; 'json' returns raw payload."),
    }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
}, async (params) => {
    try {
        const data = await apiRequest("GET", `/api/v1/attenuators/${encodeURIComponent(params.managementAddr)}`);
        if (params.response_format === "json")
            return ok(data);
        return { content: [{ type: "text", text: formatMarkdown(data) }] };
    }
    catch (err) {
        return fail(err, "fetching attenuator");
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/attenuators/{managementAddr}/{channel}/{attenuation}
// Set attenuation on a specific channel of a quadAtten device
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool("octobox_set_attenuator", {
    title: "Set Attenuator Channel Value",
    description: "Set attenuation on one or more channels of a quadAtten device by IP address. " +
        "POST /api/v1/attenuators/{managementAddr}/{channel}/{attenuation}. " +
        "channel: atten1 | atten2 | atten3 | atten4 | atten (sets all four). " +
        "attenuation: a single integer (e.g. '50') or a bracketed array '[10,20,30,40]' when channel='atten'.",
    inputSchema: z.object({
        managementAddr: z.string().describe("IP address of the quadAtten device."),
        channel: z
            .string()
            .describe("Channel to set: atten1, atten2, atten3, atten4, or atten (all)."),
        attenuation: z
            .string()
            .describe("Attenuation value as a string. Single integer for one channel (e.g. '50'). " +
            "Bracketed array for all channels (e.g. '[10,20,30,40]') when channel='atten'."),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false },
}, async (params) => {
    try {
        const data = await apiRequest("POST", `/api/v1/attenuators/${encodeURIComponent(params.managementAddr)}` +
            `/${encodeURIComponent(params.channel)}` +
            `/${encodeURIComponent(params.attenuation)}`);
        return ok(data);
    }
    catch (err) {
        return fail(err, "setting attenuator channel");
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/attenuators/list
// Set attenuation for multiple devices/channels in one call
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool("octobox_set_attenuators_list", {
    title: "Set Multiple Attenuators via List",
    description: "Set attenuation values for multiple devices and/or channels in a single call. " +
        "POST /api/v1/attenuators/list. " +
        "Each command specifies a managementAddr, channel, and attenuation value.",
    inputSchema: z.object({
        commands: z
            .array(z.object({
            managementAddr: z.string().describe("Device IP address."),
            channel: z
                .string()
                .describe("Channel: atten, atten1, atten2, atten3, or atten4."),
            attenuation: z
                .string()
                .describe("Attenuation value (e.g. '50' or '[10,20,30,40]')."),
        }))
            .min(1)
            .describe("Array of attenuation set commands."),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false },
}, async (params) => {
    try {
        const data = await apiRequest("POST", "/api/v1/attenuators/list", params.commands);
        return ok(data);
    }
    catch (err) {
        return fail(err, "setting attenuators via list");
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/attenuators/{name}/{attenuation}
// Set attenuation by device name (virtual or physical)
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool("octobox_set_attenuator_by_name", {
    title: "Set Attenuator by Device Name",
    description: "Set attenuation values using a device name instead of an IP address. " +
        "POST /api/v1/attenuators/{name}/{attenuation}. " +
        "For physical quadAttens, sets all four channels. " +
        "For virtual quadAttens, sets only the channels defined in the virtual device.",
    inputSchema: z.object({
        name: z
            .string()
            .describe("Device name as configured in the system (e.g. 'QA-C', 'QA-Left')."),
        attenuation: z
            .string()
            .describe("Attenuation value (e.g. '50')."),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false },
}, async (params) => {
    try {
        const data = await apiRequest("POST", `/api/v1/attenuators/${encodeURIComponent(params.name)}` +
            `/${encodeURIComponent(params.attenuation)}`);
        return ok(data);
    }
    catch (err) {
        return fail(err, "setting attenuator by name");
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/attenuators/name/list
// Set attenuation for multiple named devices in one call
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool("octobox_set_attenuators_name_list", {
    title: "Set Multiple Attenuators by Name via List",
    description: "Set attenuation values for multiple named attenuator devices in a single call. " +
        "POST /api/v1/attenuators/name/list.",
    inputSchema: z.object({
        commands: z
            .array(z.object({
            name: z
                .string()
                .describe("Device name (e.g. 'QA-C')."),
            attenuation: z
                .string()
                .describe("Attenuation value (e.g. '50')."),
        }))
            .min(1)
            .describe("Array of name/attenuation commands."),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false },
}, async (params) => {
    try {
        const data = await apiRequest("POST", "/api/v1/attenuators/name/list", params.commands);
        return ok(data);
    }
    catch (err) {
        return fail(err, "setting attenuators by name list");
    }
});
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
        return {
            content: [{
                    type: "text",
                    text: `Error fetching testbed components: ${err.message}\n\nEnsure OCTOBOX_BASE_URL is set correctly (current: ${process.env.OCTOBOX_BASE_URL}).`
                }],
            isError: true
        };
    }
});
//STAPAL7 TOOLS
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/staPal7s/{managementAddr}/{request}
// Send a gRPC read query to a staPal7 device (no apStaMode required)
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool("octobox_staPal7_query", {
    title: "Query staPal7 Device",
    description: "Send a gRPC read query to a staPal7 device. " +
        "GET /api/v1/staPal7s/{managementAddr}/{request}. " +
        "Use for request types that do not require an apStaMode: " +
        "'ApiVersionRead', 'SystemConfigRead', 'SystemEtcHostsRead', " +
        "'SystemReset', 'WiFiRadioStateRead'.",
    inputSchema: z.object({
        managementAddr: z
            .string()
            .describe("IP address of the staPal7 device (e.g. '172.16.28.4')."),
        request: z
            .enum([
            "ApiVersionRead",
            "SystemConfigRead",
            "SystemEtcHostsRead",
            "SystemReset",
            "WiFiRadioStateRead",
        ])
            .describe("gRPC read request type. One of: " +
            "'ApiVersionRead', 'SystemConfigRead', 'SystemEtcHostsRead', " +
            "'SystemReset', 'WiFiRadioStateRead'."),
        response_format: z
            .enum(["markdown", "json"])
            .default("json")
            .describe("'markdown' returns a human-readable summary; 'json' returns raw payload."),
    }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
}, async (params) => {
    try {
        const data = await apiRequest("GET", `/api/v1/staPal7s/${encodeURIComponent(params.managementAddr)}` +
            `/${encodeURIComponent(params.request)}`);
        if (params.response_format === "json")
            return ok(data);
        // Markdown: render key/value pairs
        const lines = Object.entries(data).map(([k, v]) => `- **${k}**: ${JSON.stringify(v)}`);
        return {
            content: [
                {
                    type: "text",
                    text: `### staPal7 \`${params.managementAddr}\` — ${params.request}\n\n` +
                        (lines.length ? lines.join("\n") : "_No data returned._"),
                },
            ],
        };
    }
    catch (err) {
        return fail(err, `querying staPal7 ${params.managementAddr} (${params.request})`);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/staPal7s/{managementAddr}/{request}/{apStaMode}
// Send a gRPC read query to a staPal7 device with an apStaMode parameter
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool("octobox_staPal7_query_with_mode", {
    title: "Query staPal7 Device with AP/STA Mode",
    description: "Send a gRPC read query to a staPal7 device that requires an apStaMode. " +
        "GET /api/v1/staPal7s/{managementAddr}/{request}/{apStaMode}. " +
        "Use 'ReadValues' to report all station/sniffer configurations for the given mode. " +
        "Use 'WiFiSTAScan' to report available WiFi connections (device must be in STA mode).",
    inputSchema: z.object({
        managementAddr: z
            .string()
            .describe("IP address of the staPal7 device (e.g. '172.16.28.4')."),
        request: z
            .enum(["ReadValues", "WiFiSTAScan"])
            .describe("'ReadValues' — reports all station/sniffer configurations for the given apStaMode. " +
            "'WiFiSTAScan' — reports available WiFi connections; device must be in STA mode."),
        apStaMode: z
            .enum([
            "AP",
            "STA",
            "SNIFFER",
            "REPLAY",
            "MODE_AP",
            "MODE_STA",
            "MODE_SNIFFER",
            "MODE_REPLAY",
        ])
            .describe("Device mode. Preferred values: AP, STA, SNIFFER, REPLAY. " +
            "Backwards-compatible values also accepted: MODE_AP, MODE_STA, MODE_SNIFFER, MODE_REPLAY."),
        response_format: z
            .enum(["markdown", "json"])
            .default("json")
            .describe("'markdown' returns a human-readable summary; 'json' returns raw payload."),
    }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
}, async (params) => {
    try {
        const data = await apiRequest("GET", `/api/v1/staPal7s/${encodeURIComponent(params.managementAddr)}` +
            `/${encodeURIComponent(params.request)}` +
            `/${encodeURIComponent(params.apStaMode)}`);
        if (params.response_format === "json")
            return ok(data);
        const lines = Object.entries(data).map(([k, v]) => `- **${k}**: ${JSON.stringify(v)}`);
        return {
            content: [
                {
                    type: "text",
                    text: `### staPal7 \`${params.managementAddr}\` — ${params.request} (${params.apStaMode})\n\n` +
                        (lines.length ? lines.join("\n") : "_No data returned._"),
                },
            ],
        };
    }
    catch (err) {
        return fail(err, `querying staPal7 ${params.managementAddr} (${params.request}/${params.apStaMode})`);
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/staPal7s
// Send a gRPC command (Push/stop) to a staPal7 device
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool("octobox_staPal7_command", {
    title: "Send Command to staPal7 Device",
    description: "Send a gRPC command to a staPal7 device to configure and start its radios. " +
        "POST /api/v1/staPal7s. " +
        "The default request type 'Push' stops, updates, and restarts radios in one call. " +
        "Use 'WiFiSTAStop' to send an explicit stop. " +
        "Only managementAddr, request, and apStaMode are required; all other fields are optional overrides.",
    inputSchema: z.object({
        // Required fields
        managementAddr: z
            .string()
            .describe("IP address of the staPal7 device (e.g. '172.16.28.4')."),
        request: z
            .string()
            .default("Push")
            .describe("gRPC command type. 'Push' (default) stops, updates, and starts radios. " +
            "'WiFiSTAStop' sends an explicit stop command."),
        apStaMode: z
            .enum([
            "AP",
            "STA",
            "SNIFFER",
            "REPLAY",
            "MODE_AP",
            "MODE_STA",
            "MODE_SNIFFER",
            "MODE_REPLAY",
        ])
            .describe("Device mode. Preferred values: AP, STA, SNIFFER, REPLAY. " +
            "Backwards-compatible values also accepted: MODE_AP, MODE_STA, MODE_SNIFFER, MODE_REPLAY."),
        // Optional radio/network configuration fields
        bandwidth: z
            .enum([
            "BANDWIDTH_20_FIXED",
            "BANDWIDTH_40_ADAPT",
            "BANDWIDTH_80_ADAPT",
            "BANDWIDTH_160_ADAPT",
            "BANDWIDTH_320_ADAPT",
            "BANDWIDTH_ADAPT",
        ])
            .optional()
            .describe("Channel bandwidth. BANDWIDTH_ADAPT is STA mode only."),
        beaconInterval: z.number().optional().describe("Beacon interval in ms (e.g. 100)."),
        bridgeEnable: z.boolean().optional().describe("Enable bridge mode."),
        bssid: z.string().optional().describe("BSSID to connect to."),
        bssidMode: z
            .enum(["BSSID_FORCED", "BSSID_PREFERRED", "BSSID_DISABLED"])
            .optional()
            .describe("BSSID selection mode."),
        captureEnable: z.boolean().optional().describe("Enable packet capture."),
        certFilename: z.string().optional().describe("Certificate filename for 802.1x auth (e.g. 'example.pfx')."),
        chainRXMask: z.number().int().optional().describe("RX chain mask (not currently supported on staPal7)."),
        chainTXMask: z.number().int().optional().describe("TX chain mask (not currently supported on staPal7)."),
        channelScanList: z
            .array(z.number().int())
            .optional()
            .describe("List of channels to scan."),
        channelScanMode: z.boolean().optional().describe("Enable channel scan mode."),
        ctsRtsThreshold: z
            .number()
            .min(0)
            .max(2347)
            .optional()
            .describe("CTS/RTS threshold in bytes (0–2347)."),
        dfsEnable: z.boolean().optional().describe("Enable DFS."),
        filterManagementOnly: z.boolean().optional().describe("Capture management frames only."),
        filterHeadersOnly: z.boolean().optional().describe("Capture headers only."),
        fragmentationThreshold: z
            .number()
            .min(256)
            .max(2346)
            .optional()
            .describe("Fragmentation threshold in bytes (256–2346, must be even)."),
        guardInterval: z
            .enum(["GUARD_0_4US", "GUARD_0_8US", "GUARD_1_6US", "GUARD_3_2US", "GUARD_ADAPT"])
            .optional()
            .describe("Guard interval."),
        interface_: z
            .enum(["INTERFACE_N", "INTERFACE_BE", "INTERFACE_AX", "INTERFACE_AC"])
            .optional()
            .describe("WiFi interface standard."),
        ipAddress: z.string().optional().describe("Static IP address (e.g. '192.168.15.95')."),
        ipGateway: z.string().optional().describe("IP gateway (e.g. '192.168.15.1')."),
        ipMode: z
            .enum(["IP_DHCP", "IP_STATIC"])
            .optional()
            .describe("IP addressing mode."),
        ipNetmask: z.string().optional().describe("IP netmask (e.g. '255.255.0.0')."),
        ipAddressBridge: z.string().optional().describe("Bridge IP address."),
        ipGatewayBridge: z.string().optional().describe("Bridge IP gateway."),
        ipModeBridge: z
            .enum(["IP_UNKNOWN", "IP_DHCP", "IP_STATIC"])
            .optional()
            .describe("Bridge IP mode."),
        ipNetmaskBridge: z.string().optional().describe("Bridge IP netmask."),
        ipv6Address: z.string().optional().describe("IPv6 address."),
        ipv6Gateway: z.string().optional().describe("IPv6 gateway."),
        ipv6Mode: z.enum(["IP_DHCP", "IP_STATIC"]).optional().describe("IPv6 addressing mode."),
        ipv6AddressBridge: z.string().optional().describe("Bridge IPv6 address."),
        ipv6GatewayBridge: z.string().optional().describe("Bridge IPv6 gateway."),
        ipv6ModeBridge: z
            .enum(["IP_UNKNOWN", "IP_DHCP", "IP_STATIC"])
            .optional()
            .describe("Bridge IPv6 mode."),
        ipv6PrefixLength: z.number().optional().describe("IPv6 prefix length (e.g. 64)."),
        ipv6PrefixLengthBridge: z.number().optional().describe("Bridge IPv6 prefix length."),
        maxAMPDUFrameSize: z
            .enum([
            "FRAME_8192",
            "FRAME_16383",
            "FRAME_32767",
            "FRAME_65535",
            "FRAME_131071",
            "FRAME_262143",
            "FRAME_524287",
            "FRAME_1048575",
        ])
            .optional()
            .describe("Maximum A-MPDU frame size."),
        mloFeatureDisable: z
            .boolean()
            .optional()
            .describe("true disables MLO; false enables MLO."),
        ofdmaDLEnable: z.boolean().optional().describe("Enable OFDMA downlink."),
        ofdmaULEnable: z.boolean().optional().describe("Enable OFDMA uplink."),
        palRadio: z
            .enum(["RADIO_2456"])
            .optional()
            .describe("PAL radio selector. Allowable value: RADIO_2456."),
        password: z.string().optional().describe("WiFi password."),
        primaryChannel: z
            .number()
            .optional()
            .describe("Primary channel number. Allowable values depend on bandwidth and device type."),
        priority: z
            .enum([
            "PRIORITY_BACKGROUND",
            "PRIORITY_BESTEFFORT",
            "PRIORITY_VIDEO",
            "PRIORITY_VOICE",
            "PRIORITY_NOBACKOFF",
            "PRIORITY_ADAPT",
        ])
            .optional()
            .describe("Traffic priority."),
        probeID: z.string().optional().describe("Probe identifier (e.g. 'L4C')."),
        netcatPort: z.number().optional().describe("Netcat port (e.g. 10011)."),
        radiusIdentity: z.string().optional().describe("Username for 802.1x RADIUS authentication."),
        radiusPassword: z.string().optional().describe("Password for 802.1x RADIUS authentication."),
        rate: z.number().optional().describe("Rate. Only RATE_ADAPT (0) is supported."),
        roamTargetThreshold: z.number().optional().describe("Roam target RSSI threshold (e.g. -95)."),
        roamThreshold: z.number().optional().describe("Roam trigger RSSI threshold (e.g. -95)."),
        security: z
            .enum([
            "SECURITY_NONE",
            "SECURITY_WPA",
            "SECURITY_WPA2",
            "SECURITY_WPA_WPA2_MIXED",
            "SECURITY_WPA3",
            "SECURITY_WPA3_WPA2_MIXED",
            "SECURITY_OWE",
        ])
            .optional()
            .describe("WiFi security mode. SECURITY_OWE is RADIO_6 only."),
        ssid: z.string().optional().describe("SSID to connect to or broadcast."),
        streams: z
            .number()
            .min(1)
            .max(8)
            .optional()
            .describe("Number of spatial streams (1–8)."),
        triggerOutMode: z
            .enum(["TMODE_DISABLE", "TMODE_SCRIPT_ONLY", "TMODE_SCRIPT_W_PACKETS"])
            .optional()
            .describe("Trigger output mode."),
        triggerOutPacketFilterMask: z
            .number()
            .optional()
            .describe("Bitmask of packet types to trigger on. Allowable flags: INCLUDE_MGMT_ASSOC_REQ, " +
            "INCLUDE_MGMT_ASSOC_RESP, INCLUDE_MGMT_REASSOC_REQ, INCLUDE_MGMT_REASSOC_RESP, " +
            "INCLUDE_MGMT_PROBE_REQ, INCLUDE_MGMT_PROBE_RESP, INCLUDE_MGMT_DATA, " +
            "INCLUDE_MGMT_DISASSOC, INCLUDE_MGMT_AUTH, INCLUDE_MGMT_DEAUTH, " +
            "INCLUDE_CTRL_RTS, INCLUDE_CTRL_CTS, INCLUDE_BEACON, INCLUDE_CTRL_ACK, " +
            "INCLUDE_CTRL_BLOCK_ACK, INCLUDE_TRIGGER_FRAME."),
        triggerOutScriptCmd: z
            .string()
            .optional()
            .describe("Script command to run on trigger (e.g. 'python3/octoscope/delay_gpio.py')."),
        txAtten: z.number().optional().describe("TX attenuation value."),
        uApsdEnable: z.boolean().optional().describe("Enable U-APSD (WMM power save)."),
        vEnable: z.boolean().optional().describe("Enable verbose mode."),
        vLogging: z.boolean().optional().describe("Enable verbose logging."),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false },
}, async (params) => {
    try {
        const data = await apiRequest("POST", "/api/v1/staPal7s", params);
        return ok(data);
    }
    catch (err) {
        return fail(err, `sending command to staPal7 ${params.managementAddr}`);
    }
});
//TRAFFIC PAIR API TOOLS
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
        // All update fields are optional — only send what needs changing
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
// ── Transport ─────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("octobox-mcp-server running (stdio) — all /api/v1/attenuators endpoints registered");
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
