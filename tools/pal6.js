import { z } from "zod";
import { apiRequest, ok, fail, formatMarkdown } from "../utils.js";

export function registerPal6Tools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/pal6s
    // Push configuration values to a Pal6 device
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal6_command", {
        title: "Send Command to Pal6",
        description: "Push configuration values to a Pal6 device. " +
            "POST /api/v1/pal6s. " +
            "The 'request' field controls the action: " +
            "'Push' stops, updates, and starts radios all in one; " +
            "'WiFiEnable' enables/disables radios (use with enableRadios array); " +
            "'WiFiBandConfigUpdate' changes the band configuration; " +
            "'WiFiSTAStart'/'WiFiSTAStop'/'WiFiSTAUpdate' individually start/stop/update a STA; " +
            "'WiFiAPStart'/'WiFiAPStop'/'WiFiAPUpdate' individually start/stop/update an AP; " +
            "'WiFiReplayUpdate' pushes a replay config; " +
            "'StandByMode' puts the device in standby.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal6 device (e.g. '172.16.27.1')."),
            request: z.string().default("Push").describe("Request type: Push | WiFiEnable | WiFiBandConfigUpdate | " +
                "WiFiSTAStart | WiFiSTAStop | WiFiSTAUpdate | " +
                "WiFiAPStart | WiFiAPStop | WiFiAPUpdate | " +
                "WiFiReplayUpdate | StandByMode"),
            apStaMode: z.string().optional().describe("Mode: AP, STA, SNIFFER, REPLAY (or legacy MODE_AP, MODE_STA, etc.)"),
            palRadio: z.string().optional().describe("Radio: RADIO_24 | RADIO_5 | RADIO_5A | RADIO_5B | RADIO_6"),
            alias: z.string().optional().describe("Device alias (e.g. 'P6C_5')."),
            advRatesEnable: z.boolean().optional().describe("Enable advanced rates."),
            bandConfig: z.string().optional().describe("Band configuration. Required for replay configs. BAND_DUAL | BAND_TRI"),
            bandwidth: z.string().optional().describe("BANDWIDTH_20_FIXED | BANDWIDTH_40_ADAPT | BANDWIDTH_80_ADAPT | " +
                "BANDWIDTH_160_ADAPT | BANDWIDTH_8080_ADAPT | BANDWIDTH_ADAPT (STA only)"),
            baseMacAddress: z.string().optional().describe("Base MAC address."),
            beaconInterval: z.number().optional().describe("Beacon interval in ms (e.g. 100)."),
            beamformeeMUEnable: z.boolean().optional().describe("Enable MU beamformee."),
            beamformeeSUEnable: z.boolean().optional().describe("Enable SU beamformee."),
            beamformerMUEnable: z.boolean().optional().describe("Enable MU beamformer."),
            beamformerSUEnable: z.boolean().optional().describe("Enable SU beamformer."),
            bridgeEnable: z.boolean().optional().describe("Enable bridge mode."),
            bssid: z.string().optional().describe("BSSID to force or prefer."),
            bssidMode: z.string().optional().describe("BSSID_FORCED | BSSID_PREFERRED | BSSID_DISABLED"),
            captureEnable: z.boolean().optional().describe("Enable packet capture."),
            certFilename: z.string().optional().describe("Certificate filename for 802.1x (e.g. 'example.pfx')."),
            chainRXMask: z.number().int().optional().describe("RX chain mask."),
            chainTXMask: z.number().int().optional().describe("TX chain mask."),
            channelScanList: z.array(z.number().int()).optional().describe("List of channels to scan."),
            channelScanMode: z.boolean().optional().describe("Enable channel scan mode."),
            ctsRtsThreshold: z.number().min(0).max(2347).optional().describe("CTS/RTS threshold in bytes (0–2347)."),
            dfsEnable: z.boolean().optional().describe("Enable DFS."),
            enableRadios: z.array(z.boolean()).optional().describe("Used with WiFiEnable. Array of 5 booleans: " +
                "[allDisabled, Radio24, Radio5, Radio5A, Radio5B]."),
            filterManagementOnly: z.boolean().optional().describe("Filter management frames only."),
            filterHeadersOnly: z.boolean().optional().describe("Filter headers only."),
            fragmentationThreshold: z.number().min(256).max(2346).optional().describe("Fragmentation threshold in bytes (256–2346, even)."),
            guardInterval: z.string().optional().describe("GUARD_0_4US | GUARD_0_8US | GUARD_1_6US | GUARD_3_2US | GUARD_ADAPT"),
            inputFile: z.string().optional().describe("Input pcap file name for replay (e.g. 'replay.pcap')."),
            inputFilePath: z.string().optional().describe("Full path to pcap file (e.g. '/root/pcap/file.pcap')."),
            interface_: z.string().optional().describe("INTERFACE_B | INTERFACE_G | INTERFACE_A | INTERFACE_N | INTERFACE_AC | INTERFACE_AX"),
            ipAddress: z.string().optional().describe("IPv4 address."),
            ipGateway: z.string().optional().describe("IPv4 gateway."),
            ipMode: z.string().optional().describe("IP_DHCP | IP_STATIC"),
            ipNetmask: z.string().optional().describe("IPv4 netmask."),
            ipAddressBridge: z.string().optional().describe("Bridge IPv4 address."),
            ipGatewayBridge: z.string().optional().describe("Bridge IPv4 gateway."),
            ipModeBridge: z.string().optional().describe("IP_DHCP | IP_STATIC for bridge."),
            ipNetmaskBridge: z.string().optional().describe("Bridge IPv4 netmask."),
            ipv6Address: z.string().optional().describe("IPv6 address."),
            ipv6Gateway: z.string().optional().describe("IPv6 gateway."),
            ipv6Mode: z.string().optional().describe("IP_DHCP | IP_STATIC for IPv6."),
            ipv6AddressBridge: z.string().optional().describe("Bridge IPv6 address."),
            ipv6GatewayBridge: z.string().optional().describe("Bridge IPv6 gateway."),
            ipv6ModeBridge: z.string().optional().describe("IP_UNKNOWN | IP_DHCP | IP_STATIC for bridge IPv6."),
            ipv6PrefixLength: z.number().int().optional().describe("IPv6 prefix length (e.g. 64)."),
            ipv6PrefixLengthBridge: z.number().int().optional().describe("Bridge IPv6 prefix length."),
            kEnable: z.boolean().optional().describe("Enable 802.11k."),
            kvrLoggingEnable: z.boolean().optional().describe("Enable KVR logging."),
            maxAMPDUFrameSize: z.string().optional().describe("FRAME_8192 | FRAME_16383 | FRAME_32767 | FRAME_65535 | " +
                "FRAME_131071 | FRAME_262143 | FRAME_524287 | FRAME_1048575"),
            netcatPort: z.number().optional().describe("Netcat port number."),
            ofdmaDLEnable: z.boolean().optional().describe("Enable OFDMA downlink."),
            ofdmaULEnable: z.boolean().optional().describe("Enable OFDMA uplink."),
            packetGapMicroseconds: z.number().min(300).optional().describe("Packet gap in microseconds (300+) for replay."),
            password: z.string().optional().describe("WiFi password."),
            powerSaveEnable: z.boolean().optional().describe("Enable power save mode."),
            primaryChannel: z.number().optional().describe("Primary channel number."),
            priority: z.string().optional().describe("PRIORITY_BACKGROUND | PRIORITY_BESTEFFORT | PRIORITY_VIDEO | " +
                "PRIORITY_VOICE | PRIORITY_NOBACKOFF | PRIORITY_ADAPT"),
            probeID: z.string().optional().describe("Probe ID alias (e.g. 'P6C_5')."),
            radioEnabled: z.boolean().optional().describe("Enable or disable the radio."),
            radiusIdentity: z.string().optional().describe("RADIUS username for 802.1x."),
            radiusPassword: z.string().optional().describe("RADIUS password for 802.1x."),
            authServerIp: z.string().optional().describe("802.1x auth server IP."),
            authServerPort: z.number().int().optional().describe("802.1x auth server port."),
            authServerSecret: z.string().optional().describe("802.1x auth server secret."),
            rate: z.number().optional().describe("TX rate (fixed number or -1 for RATE_ADAPT)."),
            replayAdvanced: z.boolean().optional().describe("Show advanced replay options."),
            replayMode: z.string().optional().describe("Replay mode: REPLAY_MODE_AS_CAPTURED."),
            replaySource: z.string().optional().describe("Replay source: REPLAY_SOURCE_FILE_LOOP."),
            rFastTransitionEnable: z.boolean().optional().describe("Enable 802.11r fast transition."),
            roamTargetThreshold: z.number().optional().describe("Roam target RSSI threshold (e.g. -95)."),
            roamThreshold: z.number().optional().describe("Roam trigger RSSI threshold (e.g. -95)."),
            rOvertheDSEnable: z.boolean().optional().describe("Enable 802.11r over-the-DS."),
            secondaryChannel_8080: z.number().optional().describe("Secondary channel for 80+80 MHz."),
            security: z.string().optional().describe("SECURITY_NONE | SECURITY_WPA | SECURITY_WPA2 | SECURITY_WPA_WPA2_MIXED | " +
                "SECURITY_WPA3 | SECURITY_WPA3_WPA2_MIXED | SECURITY_OWE (RADIO_6 only)"),
            ssid: z.string().optional().describe("SSID to connect to or broadcast."),
            streams: z.number().min(1).max(8).optional().describe("Number of spatial streams (1–8)."),
            triggerOutMode: z.string().optional().describe("TMODE_DISABLE | TMODE_SCRIPT_ONLY | TMODE_SCRIPT_W_PACKETS"),
            triggerOutPacketFilterMask: z.number().optional().describe("Trigger output packet filter mask."),
            triggerOutScriptCmd: z.string().optional().describe("Trigger output script command."),
            txAtten: z.number().optional().describe("TX attenuation value."),
            uApsdEnable: z.boolean().optional().describe("Enable U-APSD."),
            vEnable: z.boolean().optional().describe("Enable vSTAs."),
            vLogging: z.boolean().optional().describe("Enable vSTA logging."),
            vstaCount: z.number().optional().describe("Number of vSTAs."),
            vstaConfig: z.array(z.object({
                interface_: z.string().optional(),
                bandwidth: z.string().optional(),
                certFilename: z.string().optional(),
                password: z.string().optional(),
                radiusIdentity: z.string().optional(),
                radiusPassword: z.string().optional(),
                security: z.string().optional(),
                ssid: z.string().optional(),
                streams: z.number().int().optional(),
                txAtten: z.number().int().optional(),
            })).optional().describe("Per-vSTA configuration overrides array."),
            wdsEnable: z.boolean().optional().describe("Enable WDS."),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", "/api/v1/pal6s", params);
            return ok(data);
        }
        catch (err) {
            return fail(err, `sending command to Pal6 ${params.managementAddr}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/pal6s/{managementAddr}/{request}
    // Send gRPC queries to a Pal6 device (no palRadio required)
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal6_query", {
        title: "Query Pal6 Device",
        description: "Send a gRPC read query to a Pal6 device. " +
            "GET /api/v1/pal6s/{managementAddr}/{request}.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal6 device (e.g. '172.16.27.1')."),
            request: z.enum([
                "ApiVersionRead",
                "SystemConfigRead",
                "SystemEtcHostsRead",
                "WiFiBandConfigRead",
                "SystemReset",
                "WiFiRadioStateRead",
            ]).describe("Query request type."),
            response_format: z.enum(["markdown", "json"]).default("json").describe("'json' returns raw payload; 'markdown' returns a formatted table."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET", `/api/v1/pal6s/${encodeURIComponent(params.managementAddr)}/${encodeURIComponent(params.request)}`);
            if (params.response_format === "json")
                return ok(data);
            return { content: [{ type: "text", text: formatMarkdown(data) }] };
        }
        catch (err) {
            return fail(err, `querying Pal6 ${params.managementAddr} with request '${params.request}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/pal6s/{managementAddr}/{request}/{palRadio}/{apStaMode}
    // Get Pal6 configurations based on radio & apStaMode
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal6_query_with_mode", {
        title: "Query Pal6 Device by Radio and Mode",
        description: "Get Pal6 configurations based on radio and apStaMode. " +
            "GET /api/v1/pal6s/{managementAddr}/{request}/{palRadio}/{apStaMode}. " +
            "Use request='ReadValues' to get all STA/AP/sniffer/replay configurations for the specified radio and mode. " +
            "Use request='WiFiSTAScan' to get available WiFi connections (device must be in STA mode).",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal6 device."),
            request: z.string().describe("ReadValues | WiFiSTAScan"),
            palRadio: z.string().describe("RADIO_24 | RADIO_5 | RADIO_5A | RADIO_5B | RADIO_6"),
            apStaMode: z.string().describe("AP | STA | SNIFFER | REPLAY (or legacy MODE_AP, MODE_STA, etc.)"),
            response_format: z.enum(["markdown", "json"]).default("json").describe("'json' returns raw payload; 'markdown' returns a formatted table."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET",
                `/api/v1/pal6s/${encodeURIComponent(params.managementAddr)}` +
                `/${encodeURIComponent(params.request)}` +
                `/${encodeURIComponent(params.palRadio)}` +
                `/${encodeURIComponent(params.apStaMode)}`
            );
            if (params.response_format === "json")
                return ok(data);
            return { content: [{ type: "text", text: formatMarkdown(data) }] };
        }
        catch (err) {
            return fail(err, `querying Pal6 ${params.managementAddr} radio=${params.palRadio} mode=${params.apStaMode}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // PUT /api/v1/pal6s/{managementAddr}/WiFiVSTAEnableUpdate/{palRadio}
    // Enable/Disable Pal6 VSTAs
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal6_vsta_update", {
        title: "Enable/Disable Pal6 VSTAs",
        description: "Enable or disable virtual STAs (vSTAs) on a Pal6 device. " +
            "PUT /api/v1/pal6s/{managementAddr}/WiFiVSTAEnableUpdate/{palRadio}. " +
            "Pass an array of 0s (disable) and 1s (enable) in vstaArray, one entry per vSTA.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal6 device."),
            palRadio: z.string().describe("RADIO_24 | RADIO_5 | RADIO_5A | RADIO_5B | RADIO_6"),
            vstaArray: z.array(z.number()).describe("Array of vSTA enable/disable values. 0 = disable, 1 = enable. One entry per vSTA."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("PUT",
                `/api/v1/pal6s/${encodeURIComponent(params.managementAddr)}/WiFiVSTAEnableUpdate/${encodeURIComponent(params.palRadio)}`,
                { vstaArray: params.vstaArray }
            );
            return ok(data);
        }
        catch (err) {
            return fail(err, `updating vSTAs on Pal6 ${params.managementAddr} radio=${params.palRadio}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/pal6s/{managementAddr}/WiFiVSTAEnableRead/{palRadio}
    // Get Pal6 VSTAs enabled/disabled status
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal6_vsta_read", {
        title: "Read Pal6 vSTA Enable Status",
        description: "Get the enabled/disabled status of vSTAs on a Pal6 device. " +
            "GET /api/v1/pal6s/{managementAddr}/WiFiVSTAEnableRead/{palRadio}.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal6 device."),
            palRadio: z.string().describe("RADIO_24 | RADIO_5 | RADIO_5A | RADIO_5B | RADIO_6"),
            response_format: z.enum(["markdown", "json"]).default("json").describe("'json' returns raw payload; 'markdown' returns a formatted table."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET",
                `/api/v1/pal6s/${encodeURIComponent(params.managementAddr)}/WiFiVSTAEnableRead/${encodeURIComponent(params.palRadio)}`
            );
            if (params.response_format === "json")
                return ok(data);
            return { content: [{ type: "text", text: formatMarkdown(data) }] };
        }
        catch (err) {
            return fail(err, `reading vSTA status on Pal6 ${params.managementAddr} radio=${params.palRadio}`);
        }
    });
}
