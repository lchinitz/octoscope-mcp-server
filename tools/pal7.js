import { z } from "zod";
import { apiRequest, ok, fail, formatMarkdown } from "../utils.js";

export function registerPal7Tools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/pal7s
    // Push configuration values to a Pal7 device
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal7_command", {
        title: "Send Command to Pal7",
        description: "Push configuration values to a Pal7 device. " +
            "POST /api/v1/pal7s. " +
            "The 'request' field controls the action: " +
            "'Push' stops, updates, and starts radios all in one; " +
            "'WiFiEnable' enables/disables radios (use with enableRadios array); " +
            "'WiFiSTAStart'/'WiFiSTAStop'/'WiFiSTAUpdate' individually start/stop/update a STA; " +
            "'WiFiAPStart'/'WiFiAPStop'/'WiFiAPUpdate' individually start/stop/update an AP; " +
            "'WiFiReplayUpdate' pushes a replay config; " +
            "'WiFiReplayPlaybackStart'/'WiFiReplayPlaybackStop' start/stop replay playback; " +
            "'StandByMode' puts the device in standby.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal7 device (e.g. '172.16.27.1')."),
            request: z.string().default("Push").describe("Request type: Push | WiFiEnable | WiFiSTAStart | WiFiSTAStop | WiFiSTAUpdate | " +
                "WiFiAPStart | WiFiAPStop | WiFiAPUpdate | WiFiReplayUpdate | " +
                "WiFiReplayPlaybackStart | WiFiReplayPlaybackStop | StandByMode"),
            apStaMode: z.string().optional().describe("Mode: AP, STA, SNIFFER, REPLAY (or legacy MODE_AP, MODE_STA, etc.)"),
            palRadio: z.string().optional().describe("Radio: RADIO_24, RADIO_5A, RADIO_5B, RADIO_6"),
            bandwidth: z.string().optional().describe("BANDWIDTH_20_FIXED | BANDWIDTH_40_ADAPT | BANDWIDTH_80_ADAPT | BANDWIDTH_160_ADAPT | " +
                "BANDWIDTH_240_ADAPT | BANDWIDTH_320_ADAPT | BANDWIDTH_8080_ADAPT | BANDWIDTH_ADAPT (STA only)"),
            primaryChannel: z.number().optional().describe("Primary channel number."),
            ssid: z.string().optional().describe("SSID to connect to or broadcast."),
            password: z.string().optional().describe("WPA/WPA2/WPA3 password."),
            security: z.string().optional().describe("SECURITY_NONE | SECURITY_WPA | SECURITY_WPA2 | SECURITY_WPA_WPA2_MIXED | " +
                "SECURITY_WPA3 | SECURITY_WPA3_WPA2_MIXED | SECURITY_OWE (RADIO_6 only)"),
            interface_: z.string().optional().describe("INTERFACE_B | INTERFACE_G | INTERFACE_A | INTERFACE_N | INTERFACE_AC | INTERFACE_AX | INTERFACE_BE"),
            guardInterval: z.string().optional().describe("GUARD_0_4US | GUARD_0_8US | GUARD_1_6US | GUARD_3_2US | GUARD_ADAPT"),
            streams: z.number().optional().describe("Number of spatial streams (1-8)."),
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
            ipv6PrefixLength: z.number().optional().describe("IPv6 prefix length (e.g. 64)."),
            ipv6PrefixLengthBridge: z.number().optional().describe("Bridge IPv6 prefix length."),
            enableRadios: z.array(z.boolean()).optional().describe("Used with WiFiEnable request. Array of 5 booleans: [allDisabled, Radio24, Radio5A, Radio5B, Radio6]."),
            radioEnabled: z.boolean().optional().describe("Enable or disable the radio."),
            maxAMPDUFrameSize: z.string().optional().describe("FRAME_8192 | FRAME_16383 | FRAME_32767 | FRAME_65535 | FRAME_131071 | FRAME_262143 | FRAME_524287 | FRAME_1048575"),
            ofdmaDLEnable: z.boolean().optional().describe("Enable OFDMA downlink."),
            ofdmaULEnable: z.boolean().optional().describe("Enable OFDMA uplink."),
            beamformerSUEnable: z.boolean().optional().describe("Enable SU beamformer."),
            beamformerMUEnable: z.boolean().optional().describe("Enable MU beamformer."),
            beamformeeSUEnable: z.boolean().optional().describe("Enable SU beamformee."),
            beamformeeMUEnable: z.boolean().optional().describe("Enable MU beamformee."),
            mloMemberEnable: z.boolean().optional().describe("Enable MLO member."),
            mloMemberIndex: z.number().optional().describe("MLO member index."),
            priority: z.string().optional().describe("PRIORITY_BACKGROUND | PRIORITY_BESTEFFORT | PRIORITY_VIDEO | PRIORITY_VOICE | PRIORITY_NOBACKOFF | PRIORITY_ADAPT"),
            bssidMode: z.string().optional().describe("BSSID_FORCED | BSSID_PREFERRED | BSSID_DISABLED"),
            bssid: z.string().optional().describe("BSSID to force or prefer."),
            roamThreshold: z.number().optional().describe("Roam threshold in dBm."),
            roamTargetThreshold: z.number().optional().describe("Roam target threshold in dBm."),
            kEnable: z.boolean().optional().describe("Enable 802.11k."),
            rFastTransitionEnable: z.boolean().optional().describe("Enable 802.11r fast transition."),
            rOvertheDSEnable: z.boolean().optional().describe("Enable 802.11r over-the-DS."),
            powerSaveEnable: z.boolean().optional().describe("Enable power save mode."),
            uApsdEnable: z.boolean().optional().describe("Enable U-APSD."),
            dfsEnable: z.boolean().optional().describe("Enable DFS."),
            bridgeEnable: z.boolean().optional().describe("Enable bridge mode."),
            wdsEnable: z.boolean().optional().describe("Enable WDS."),
            captureEnable: z.boolean().optional().describe("Enable packet capture."),
            filterManagementOnly: z.boolean().optional().describe("Filter management frames only."),
            filterHeadersOnly: z.boolean().optional().describe("Filter headers only."),
            channelScanMode: z.boolean().optional().describe("Enable channel scan mode."),
            channelScanList: z.array(z.number()).optional().describe("List of channels to scan."),
            txAtten: z.number().optional().describe("TX attenuation value."),
            rate: z.number().optional().describe("TX rate (number for fixed, or RATE_ADAPT)."),
            ctsRtsThreshold: z.number().optional().describe("CTS/RTS threshold in bytes (0-2347)."),
            fragmentationThreshold: z.number().optional().describe("Fragmentation threshold in bytes (256-2346, even)."),
            beaconInterval: z.number().optional().describe("Beacon interval in ms."),
            netcatPort: z.number().optional().describe("Netcat port number."),
            vEnable: z.boolean().optional().describe("Enable vSTAs."),
            vLogging: z.boolean().optional().describe("Enable vSTA logging."),
            vstaCount: z.number().optional().describe("Number of vSTAs."),
            probeID: z.string().optional().describe("Probe ID alias (e.g. 'P7A_24')."),
            alias: z.string().optional().describe("Device alias."),
            certFilename: z.string().optional().describe("Certificate filename for 802.1x."),
            radiusIdentity: z.string().optional().describe("RADIUS username for 802.1x."),
            radiusPassword: z.string().optional().describe("RADIUS password for 802.1x."),
            authServerIp: z.string().optional().describe("802.1x auth server IP."),
            authServerPort: z.number().optional().describe("802.1x auth server port."),
            authServerSecret: z.string().optional().describe("802.1x auth server secret."),
            triggerOutMode: z.string().optional().describe("TMODE_DISABLE | TMODE_SCRIPT_ONLY | TMODE_SCRIPT_W_PACKETS"),
            triggerOutPacketFilterMask: z.number().optional().describe("Trigger output packet filter mask."),
            triggerOutScriptCmd: z.string().optional().describe("Trigger output script command."),
            secondaryChannel_8080: z.number().optional().describe("Secondary channel for 80+80 MHz."),
            inputFile: z.string().optional().describe("Input pcap file name for replay."),
            inputFilePath: z.string().optional().describe("Full path to pcap file for replay (e.g. '/root/pcap/file.pcap')."),
            replayMode: z.string().optional().describe("Replay mode: REPLAY_MODE_AS_CAPTURED."),
            replaySource: z.string().optional().describe("Replay source: REPLAY_SOURCE_FILE_LOOP."),
            replayAdvanced: z.boolean().optional().describe("Show advanced replay options."),
            packetGapMicroseconds: z.number().optional().describe("Packet gap in microseconds (300 - max)."),
            chainRXMask: z.number().optional().describe("RX chain mask."),
            chainTXMask: z.number().optional().describe("TX chain mask."),
            advRatesEnable: z.boolean().optional().describe("Enable advanced rates."),
            kvrLoggingEnable: z.boolean().optional().describe("Enable KVR logging."),
            baseMacAddress: z.string().optional().describe("Base MAC address."),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const { ...body } = params;
            const data = await apiRequest("POST", "/api/v1/pal7s", body);
            return ok(data);
        }
        catch (err) {
            return fail(err, `sending command to Pal7 ${params.managementAddr}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/pal7s/{managementAddr}/{request}
    // Send gRPC queries to a Pal7 device
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal7_query", {
        title: "Query Pal7 Device",
        description: "Send a gRPC read query to a Pal7 device. " +
            "GET /api/v1/pal7s/{managementAddr}/{request}.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal7 device."),
            request: z.enum([
                "ApiVersionRead",
                "SystemConfigRead",
                "SystemEtcHostsRead",
                "SystemReset",
                "WiFiRadioStateRead",
            ]).describe("Query request type."),
            response_format: z.enum(["markdown", "json"]).default("json").describe("'json' returns raw payload; 'markdown' returns a formatted table."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET", `/api/v1/pal7s/${encodeURIComponent(params.managementAddr)}/${encodeURIComponent(params.request)}`);
            if (params.response_format === "json")
                return ok(data);
            return { content: [{ type: "text", text: formatMarkdown(data) }] };
        }
        catch (err) {
            return fail(err, `querying Pal7 ${params.managementAddr} with request '${params.request}'`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/pal7s/{managementAddr}/{request}/{palRadio}/{apStaMode}
    // Get Pal7 configurations based on radio & apStaMode
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal7_query_with_mode", {
        title: "Query Pal7 Device by Radio and Mode",
        description: "Get Pal7 configurations based on radio and apStaMode. " +
            "GET /api/v1/pal7s/{managementAddr}/{request}/{palRadio}/{apStaMode}. " +
            "Use request='ReadValues' to get all STA/AP/sniffer/replay configurations for the specified radio and mode. " +
            "Use request='WiFiSTAScan' to get available WiFi connections (device must be in STA mode).",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal7 device."),
            request: z.string().describe("ReadValues | WiFiSTAScan"),
            palRadio: z.string().describe("RADIO_24 | RADIO_5A | RADIO_5B | RADIO_6"),
            apStaMode: z.string().describe("AP | STA | SNIFFER | REPLAY (or legacy MODE_AP, MODE_STA, etc.)"),
            response_format: z.enum(["markdown", "json"]).default("json").describe("'json' returns raw payload; 'markdown' returns a formatted table."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET", `/api/v1/pal7s/${encodeURIComponent(params.managementAddr)}` +
                `/${encodeURIComponent(params.request)}` +
                `/${encodeURIComponent(params.palRadio)}` +
                `/${encodeURIComponent(params.apStaMode)}`);
            if (params.response_format === "json")
                return ok(data);
            return { content: [{ type: "text", text: formatMarkdown(data) }] };
        }
        catch (err) {
            return fail(err, `querying Pal7 ${params.managementAddr} radio=${params.palRadio} mode=${params.apStaMode}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/pal7s/{bandwidth}/{primaryChannel}/{palRadio}/{apStaMode}/{interface_}
    // Get lists of legal puncture channels
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal7_get_puncture_channels", {
        title: "Get Legal Puncture Channels for Pal7",
        description: "Get lists of legal puncture channels for a given bandwidth, channel, radio, mode, and interface. " +
            "GET /api/v1/pal7s/{bandwidth}/{primaryChannel}/{palRadio}/{apStaMode}/{interface_}. " +
            "Supports only 80, 160, and 320 MHz bandwidths. 320 MHz is 6 GHz only. " +
            "Only INTERFACE_BE (802.11be) is supported. Only AP mode is supported.",
        inputSchema: z.object({
            bandwidth: z.string().describe("Bandwidth in MHz: 80 | 160 | 320"),
            primaryChannel: z.number().describe("Primary channel number."),
            palRadio: z.string().describe("5 GHz or 6 GHz radio only: RADIO_5A | RADIO_5B | RADIO_6"),
            apStaMode: z.string().describe("AP mode only."),
            interface_: z.string().describe("INTERFACE_BE only (802.11be)."),
            response_format: z.enum(["markdown", "json"]).default("json").describe("'json' returns raw payload; 'markdown' returns a formatted table."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET", `/api/v1/pal7s/${encodeURIComponent(params.bandwidth)}` +
                `/${encodeURIComponent(String(params.primaryChannel))}` +
                `/${encodeURIComponent(params.palRadio)}` +
                `/${encodeURIComponent(params.apStaMode)}` +
                `/${encodeURIComponent(params.interface_)}`);
            if (params.response_format === "json")
                return ok(data);
            return { content: [{ type: "text", text: formatMarkdown(data) }] };
        }
        catch (err) {
            return fail(err, `getting puncture channels for bw=${params.bandwidth} ch=${params.primaryChannel}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/pal7s/bss/
    // Send WiFiAPBeaconReport, WiFiAPLinkReport, or WiFiAPBssTransition to a Pal7
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal7_bss_command", {
        title: "Send BSS Command to Pal7 AP",
        description: "Send a BSS-related command to a Pal7 AP: beacon report, link report, or BSS transition. " +
            "POST /api/v1/pal7s/bss/. " +
            "request must be one of: WiFiAPBeaconReport | WiFiAPLinkReport | WiFiAPBssTransition.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal7 device."),
            request: z.enum(["WiFiAPBeaconReport", "WiFiAPLinkReport", "WiFiAPBssTransition"]).describe("BSS request type."),
            palRadio: z.string().describe("RADIO_24 | RADIO_5A | RADIO_5B | RADIO_6"),
            staMacAddress: z.string().optional().describe("STA MAC address to target (e.g. '14:f6:d8:43:69:67')."),
            regClass: z.number().optional().describe("Regulatory class."),
            channel: z.number().optional().describe("Channel number."),
            duration: z.number().optional().describe("Duration in ms."),
            mode: z.number().optional().describe("Mode value."),
            matchSsid: z.number().optional().describe("Match SSID flag (0 or 1)."),
            reportDetail: z.number().optional().describe("Report detail level."),
            requestIe: z.number().optional().describe("Request IE flag."),
            channelReport: z.number().optional().describe("Channel report flag."),
            candidateList: z.string().optional().describe("Candidate BSSID list (e.g. '11:22:33:64:35:2c')."),
            candidateListIncluded: z.number().optional().describe("Include candidate list flag (0 or 1)."),
            disassocImminent: z.number().optional().describe("Disassociation imminent value."),
            disassocTimer: z.number().optional().describe("Disassociation timer in ms."),
            validInterval: z.number().optional().describe("Valid interval."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", "/api/v1/pal7s/bss/", params);
            return ok(data);
        }
        catch (err) {
            return fail(err, `sending BSS command '${params.request}' to Pal7 ${params.managementAddr}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // PUT /api/v1/pal7s/{managementAddr}/WiFiVSTAEnableUpdate/{palRadio}
    // Enable/Disable Pal7 VSTAs
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal7_vsta_update", {
        title: "Enable/Disable Pal7 VSTAs",
        description: "Enable or disable virtual STAs (vSTAs) on a Pal7 device. " +
            "PUT /api/v1/pal7s/{managementAddr}/WiFiVSTAEnableUpdate/{palRadio}. " +
            "Pass an array of 0s (disable) and 1s (enable) in vstaArray, one entry per vSTA.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal7 device."),
            palRadio: z.string().describe("RADIO_24 | RADIO_5A | RADIO_5B | RADIO_6"),
            vstaArray: z.array(z.number()).describe("Array of vSTA enable/disable values. 0 = disable, 1 = enable. One entry per vSTA."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("PUT", `/api/v1/pal7s/${encodeURIComponent(params.managementAddr)}/WiFiVSTAEnableUpdate/${encodeURIComponent(params.palRadio)}`, { vstaArray: params.vstaArray });
            return ok(data);
        }
        catch (err) {
            return fail(err, `updating vSTAs on Pal7 ${params.managementAddr} radio=${params.palRadio}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/pal7s/{managementAddr}/WiFiVSTAEnableRead/{palRadio}
    // Get Pal7 vSTAs enabled/disabled status
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal7_vsta_read", {
        title: "Read Pal7 vSTA Enable Status",
        description: "Get the enabled/disabled status of vSTAs on a Pal7 device. " +
            "GET /api/v1/pal7s/{managementAddr}/WiFiVSTAEnableRead/{palRadio}.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal7 device."),
            palRadio: z.string().describe("RADIO_24 | RADIO_5A | RADIO_5B | RADIO_6"),
            response_format: z.enum(["markdown", "json"]).default("json").describe("'json' returns raw payload; 'markdown' returns a formatted table."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET", `/api/v1/pal7s/${encodeURIComponent(params.managementAddr)}/WiFiVSTAEnableRead/${encodeURIComponent(params.palRadio)}`);
            if (params.response_format === "json")
                return ok(data);
            return { content: [{ type: "text", text: formatMarkdown(data) }] };
        }
        catch (err) {
            return fail(err, `reading vSTA status on Pal7 ${params.managementAddr} radio=${params.palRadio}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/pal7s/SystemCommand
    // Send a system-level shell command to a Pal7 device
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal7_system_command", {
        title: "Send System Command to Pal7",
        description: "Send a system-level shell command to a Pal7 device. " +
            "POST /api/v1/pal7s/SystemCommand. " +
            "Allows running arbitrary shell commands on the device (e.g. 'iw dev ath1 info').",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal7 device (e.g. '172.16.27.22')."),
            command: z.string().describe("The command to run (e.g. 'iw')."),
            arguments: z.array(z.string()).optional().describe("Array of space-delimited arguments (e.g. ['dev', 'ath1', 'info'])."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const body = {
                request: "SystemCommand",
                managementAddr: params.managementAddr,
                command: params.command,
                arguments: params.arguments ?? [],
            };
            const data = await apiRequest("POST", "/api/v1/pal7s/SystemCommand", body);
            return ok(data);
        }
        catch (err) {
            return fail(err, `sending system command '${params.command}' to Pal7 ${params.managementAddr}`);
        }
    });
}
