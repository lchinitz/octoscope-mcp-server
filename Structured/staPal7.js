import { z } from "zod";
import { apiRequest, ok, fail } from "../utils.js";

export function registerStaPal7Tools(server) {
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
}
