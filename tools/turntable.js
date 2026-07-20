import { z } from "zod";
import { apiRequest, ok, fail } from "../utils.js";

// Writable commandName values (used for SET operations)
const WRITE_COMMAND_NAMES = [
    "action",
    "pos_sweep_from",
    "pos_sweep_to",
    "axis",
    "enable",
    "pos_limit",
    "pos_offset",
    "pos_target",
    "vel_target",
];

// Readable commandName values (used for GET operations — superset of write commands)
const READ_COMMAND_NAMES = [
    "action",
    "pos_sweep_from",
    "pos_sweep_to",
    "axis",
    "enable",
    "pos_limit",
    "pos_offset",
    "pos_target",
    "vel_target",
    "status",
    "vel",
    "pos",
];

export function registerTurntableTools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/v1/turntables/{managementAddr}/{commandName}
    // Get a turntable configuration or status value
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_turntable_get", {
        title: "Get Turntable Value",
        description: "Get a turntable configuration or status value. " +
            "GET /api/v1/turntables/{managementAddr}/{commandName}. " +
            "Read-only commandNames (status, vel, pos) return live state. " +
            "Configuration commandNames return their currently set values.",
        inputSchema: z.object({
            managementAddr: z.string().describe("IP address of the turntable device (e.g. '172.16.24.1')."),
            commandName: z
                .enum(READ_COMMAND_NAMES)
                .describe(
                    "Value to query. Configuration: action | pos_sweep_from | pos_sweep_to | axis | enable | " +
                    "pos_limit | pos_offset | pos_target | vel_target. " +
                    "Status (read-only): status | vel | pos."
                ),
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    }, async (params) => {
        try {
            const data = await apiRequest("GET",
                `/api/v1/turntables/${encodeURIComponent(params.managementAddr)}` +
                `/${encodeURIComponent(params.commandName)}`
            );
            return ok(data);
        }
        catch (err) {
            return fail(err, `getting turntable '${params.commandName}' on ${params.managementAddr}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/turntables/{managementAddr}/{commandName}/{value}
    // Set a single turntable action or configuration value
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_turntable_set", {
        title: "Set Turntable Value",
        description: "Set a single turntable action or configuration value. " +
            "POST /api/v1/turntables/{managementAddr}/{commandName}/{value}. " +
            "action values: home | pos | reset | stop | sweep. " +
            "enable/axis values: 0 (false) or 1 (true). " +
            "pos_* and vel_target values: numeric position or velocity.",
        inputSchema: z.object({
            managementAddr: z.string().describe("IP address of the turntable device (e.g. '172.16.24.1')."),
            commandName: z
                .enum(WRITE_COMMAND_NAMES)
                .describe(
                    "Command to set: action | pos_sweep_from | pos_sweep_to | axis | enable | " +
                    "pos_limit | pos_offset | pos_target | vel_target."
                ),
            value: z
                .string()
                .describe(
                    "Value to set. For action: home | pos | reset | stop | sweep. " +
                    "For enable/axis: 0 (false) or 1 (true). " +
                    "For pos_* and vel_target: numeric string (e.g. '90')."
                ),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST",
                `/api/v1/turntables/${encodeURIComponent(params.managementAddr)}` +
                `/${encodeURIComponent(params.commandName)}` +
                `/${encodeURIComponent(params.value)}`
            );
            return ok(data);
        }
        catch (err) {
            return fail(err, `setting turntable '${params.commandName}=${params.value}' on ${params.managementAddr}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/turntables/{managementAddr}/list
    // Set multiple turntable actions/configuration values in a single call
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_turntable_set_list", {
        title: "Set Turntable Values via List",
        description: "Set multiple turntable actions and/or configuration values in a single call. " +
            "POST /api/v1/turntables/{managementAddr}/list. " +
            "Useful for configuring a sweep (pos_sweep_from, pos_sweep_to, vel_target, action=sweep) in one request.",
        inputSchema: z.object({
            managementAddr: z.string().describe("IP address of the turntable device (e.g. '172.16.24.1')."),
            cmdList: z
                .array(z.object({
                    commandName: z
                        .enum(WRITE_COMMAND_NAMES)
                        .describe("Command name: action | pos_sweep_from | pos_sweep_to | axis | enable | " +
                        "pos_limit | pos_offset | pos_target | vel_target."),
                    value: z
                        .string()
                        .describe("Value to set (e.g. 'home', '90', '0', '1')."),
                }))
                .min(1)
                .describe("Array of command/value pairs to execute in order."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const { managementAddr, cmdList } = params;
            const data = await apiRequest("POST",
                `/api/v1/turntables/${encodeURIComponent(managementAddr)}/list`,
                { cmdList }
            );
            return ok(data);
        }
        catch (err) {
            return fail(err, `setting turntable values via list on ${params.managementAddr}`);
        }
    });
}
