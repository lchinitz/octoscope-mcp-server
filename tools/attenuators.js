import { z } from "zod";
import { apiRequest, ok, fail, formatMarkdown, OCTOBOX_BASE_URL } from "../utils.js";

export function registerAttenuatorTools(server) {
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
            
            // Handle simple array response (e.g. [0,0,0,0])
            if (Array.isArray(data)) {
		const lines = [`### Attenuator: \`${params.managementAddr}\``];
		data.forEach((val, i) => lines.push(`- **Channel ${i + 1}**: ${val} dB`));
		return { content: [{ type: "text", text: lines.join("\n") }] };
            }
            
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
}
