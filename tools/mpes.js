import { z } from "zod";
import { apiRequest, ok, fail, OCTOBOX_BASE_URL } from "../utils.js";

export function registerMpeTools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/mpes
    // Get attenuation/bypass values via query string IP list
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_get_mpes", {
        title: "Get MPE Values",
        description: "Retrieve current attenuation and bypass values from one or more MPE devices. " +
            "GET /api/v1/mpes?managementAddrList=... " +
            "Omit managementAddrList to return all MPEs known to the system.",
        inputSchema: z.object({
            managementAddrList: z
                .string()
                .optional()
                .describe("Comma-separated list of MPE IP addresses (e.g. '172.16.23.1,172.16.23.2'). Omit to retrieve all."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const url = new URL(`${OCTOBOX_BASE_URL}/api/v1/mpes`);
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
            return ok(data);
        }
        catch (err) {
            return fail(err, "fetching MPE values");
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/mpes/{managementAddr}
    // Get MPE values for a single device by IP address
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_get_mpe_by_addr", {
        title: "Get MPE Values by IP",
        description: "Retrieve attenuation and bypass values for a single MPE device by IP address. " +
            "GET /api/v1/mpes/{managementAddr}. " +
            "Attenuation range: 0–63 dB. Bypass: 0 (NLOS) or 1 (LOS).",
        inputSchema: z.object({
            managementAddr: z.string().describe("IP address of the MPE device (e.g. '172.16.23.1')."),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET", `/api/v1/mpes/${encodeURIComponent(params.managementAddr)}`);
            return ok(data);
        }
        catch (err) {
            return fail(err, `fetching MPE values for ${params.managementAddr}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/mpes/{managementAddr}
    // Set attenuation and/or bypass fields on a single MPE device
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_set_mpe", {
        title: "Set MPE Values by IP",
        description: "Set attenuation and/or bypass values on a single MPE device by IP address. " +
            "POST /api/v1/mpes/{managementAddr}. " +
            "Attenuation range: 0–63 dB. Bypass: 0 (NLOS) or 1 (LOS). " +
            "All fields are optional — only send what needs changing.",
        inputSchema: z.object({
            managementAddr: z.string().describe("IP address of the MPE device (e.g. '172.16.23.1')."),
            atten1: z.number().min(0).max(63).optional().describe("Channel 1 attenuation (0–63 dB)."),
            atten2: z.number().min(0).max(63).optional().describe("Channel 2 attenuation (0–63 dB)."),
            atten3: z.number().min(0).max(63).optional().describe("Channel 3 attenuation (0–63 dB)."),
            atten4: z.number().min(0).max(63).optional().describe("Channel 4 attenuation (0–63 dB)."),
            bypass1: z.number().int().min(0).max(1).optional().describe("Channel 1 bypass: 0 = NLOS, 1 = LOS."),
            bypass2: z.number().int().min(0).max(1).optional().describe("Channel 2 bypass: 0 = NLOS, 1 = LOS."),
            bypass3: z.number().int().min(0).max(1).optional().describe("Channel 3 bypass: 0 = NLOS, 1 = LOS."),
            bypass4: z.number().int().min(0).max(1).optional().describe("Channel 4 bypass: 0 = NLOS, 1 = LOS."),
            ip_static_address: z.string().optional().describe("Static IP address of the device (e.g. '172.16.23.1')."),
            ip_static_gateway: z.string().optional().describe("Static IP gateway (e.g. '0.0.0.0')."),
            ip_static_subnet: z.string().optional().describe("Static IP subnet mask (e.g. '255.255.0.0')."),
            dev_name: z.string().optional().describe("Device name (e.g. 'MPE2')."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const { managementAddr, ...body } = params;
            const data = await apiRequest("POST", `/api/v1/mpes/${encodeURIComponent(managementAddr)}`, body);
            return ok(data);
        }
        catch (err) {
            return fail(err, `setting MPE values for ${params.managementAddr}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/mpes/list
    // Set attenuation/bypass values for multiple MPE devices in one call
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_set_mpes_list", {
        title: "Set Multiple MPEs via List",
        description: "Set attenuation and/or bypass values for multiple MPE devices in a single call. " +
            "POST /api/v1/mpes/list. " +
            "Each command targets one device by IP and may set any combination of atten1–4 and bypass1–4.",
        inputSchema: z.object({
            commands: z
                .array(z.object({
                    managementAddr: z.string().describe("IP address of the MPE device."),
                    atten1: z.number().min(0).max(63).optional().describe("Channel 1 attenuation (0–63 dB)."),
                    atten2: z.number().min(0).max(63).optional().describe("Channel 2 attenuation (0–63 dB)."),
                    atten3: z.number().min(0).max(63).optional().describe("Channel 3 attenuation (0–63 dB)."),
                    atten4: z.number().min(0).max(63).optional().describe("Channel 4 attenuation (0–63 dB)."),
                    bypass1: z.number().int().min(0).max(1).optional().describe("Channel 1 bypass: 0 = NLOS, 1 = LOS."),
                    bypass2: z.number().int().min(0).max(1).optional().describe("Channel 2 bypass: 0 = NLOS, 1 = LOS."),
                    bypass3: z.number().int().min(0).max(1).optional().describe("Channel 3 bypass: 0 = NLOS, 1 = LOS."),
                    bypass4: z.number().int().min(0).max(1).optional().describe("Channel 4 bypass: 0 = NLOS, 1 = LOS."),
                }))
                .min(1)
                .describe("Array of MPE set commands."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", "/api/v1/mpes/list", params.commands);
            return ok(data);
        }
        catch (err) {
            return fail(err, "setting MPE values via list");
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/mpes/{name}/{attenuation}/{bypass}
    // Set attenuation and bypass by device name
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_set_mpe_by_name", {
        title: "Set MPE Values by Device Name",
        description: "Set attenuation and bypass values on an MPE using its device name. " +
            "POST /api/v1/mpes/{name}/{attenuation}/{bypass}. " +
            "Sets all channels for physical MPEs; sets only defined channels for virtual MPEs. " +
            "Attenuation range: 0–63 dB. Bypass: 0 (NLOS) or 1 (LOS).",
        inputSchema: z.object({
            name: z.string().describe("Device name as configured in the system (e.g. 'MPE2-A')."),
            attenuation: z.string().describe("Attenuation value (e.g. '50')."),
            bypass: z.string().describe("Bypass value: '1' (LOS) or '0' (NLOS)."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST",
                `/api/v1/mpes/${encodeURIComponent(params.name)}` +
                `/${encodeURIComponent(params.attenuation)}` +
                `/${encodeURIComponent(params.bypass)}`
            );
            return ok(data);
        }
        catch (err) {
            return fail(err, `setting MPE '${params.name}' to atten=${params.attenuation} bypass=${params.bypass}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/mpes/name/list
    // Set attenuation/bypass for multiple named MPE devices in one call
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_set_mpes_name_list", {
        title: "Set Multiple MPEs by Name via List",
        description: "Set attenuation and bypass values for multiple named MPE devices in a single call. " +
            "POST /api/v1/mpes/name/list. " +
            "Sets all channels for physical MPEs; sets only defined channels for virtual MPEs.",
        inputSchema: z.object({
            commands: z
                .array(z.object({
                    name: z.string().describe("Device name (e.g. 'MPE2-A')."),
                    attenuation: z.string().describe("Attenuation value (e.g. '50')."),
                    bypass: z.string().describe("Bypass value: '1' (LOS) or '0' (NLOS)."),
                }))
                .min(1)
                .describe("Array of name/attenuation/bypass commands."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", "/api/v1/mpes/name/list", params.commands);
            return ok(data);
        }
        catch (err) {
            return fail(err, "setting MPE values by name list");
        }
    });
}
