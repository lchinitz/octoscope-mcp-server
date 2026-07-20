import { z } from "zod";
import { apiRequest, ok, fail } from "../utils.js";

export function registerGlobalStateTools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/globalstate/maxAttenuators
    // Set all attenuators to 90 dB
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_globalstate_max_attenuators", {
        title: "Max All Attenuators",
        description: "Set all attenuators to 90 dB. " +
            "POST /api/v1/globalstate/maxAttenuators. " +
            "No parameters.",
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async () => {
        try {
            const data = await apiRequest("POST", "/api/v1/globalstate/maxAttenuators");
            return ok(data);
        }
        catch (err) {
            return fail(err, "setting all attenuators to max (90 dB)");
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/globalstate/minAttenuators
    // Set all attenuators to 0 dB
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_globalstate_min_attenuators", {
        title: "Min All Attenuators",
        description: "Set all attenuators to 0 dB. " +
            "POST /api/v1/globalstate/minAttenuators. " +
            "No parameters.",
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async () => {
        try {
            const data = await apiRequest("POST", "/api/v1/globalstate/minAttenuators");
            return ok(data);
        }
        catch (err) {
            return fail(err, "setting all attenuators to min (0 dB)");
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/globalstate/maxMpes
    // Set all MPEs to 63 dB and NLOS
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_globalstate_max_mpes", {
        title: "Max All MPEs",
        description: "Set all MPEs to 63 dB and NLOS (maximum attenuation). " +
            "POST /api/v1/globalstate/maxMpes. " +
            "No parameters.",
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async () => {
        try {
            const data = await apiRequest("POST", "/api/v1/globalstate/maxMpes");
            return ok(data);
        }
        catch (err) {
            return fail(err, "setting all MPEs to max (63 dB, NLOS)");
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/globalstate/minMpes
    // Set all MPEs to 0 dB and LOS
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_globalstate_min_mpes", {
        title: "Min All MPEs",
        description: "Set all MPEs to 0 dB and LOS (minimum attenuation). " +
            "POST /api/v1/globalstate/minMpes. " +
            "No parameters.",
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async () => {
        try {
            const data = await apiRequest("POST", "/api/v1/globalstate/minMpes");
            return ok(data);
        }
        catch (err) {
            return fail(err, "setting all MPEs to min (0 dB, LOS)");
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/globalstate/palStandBy
    // Put all STApals, STApal7s, Pal6s and Pal7s into standby mode
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_globalstate_pal_standby", {
        title: "Put All PALs into Standby",
        description: "Puts all STApals, STApal7s, Pal6s, and Pal7s into standby mode. " +
            "POST /api/v1/globalstate/palStandBy. " +
            "No parameters.",
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async () => {
        try {
            const data = await apiRequest("POST", "/api/v1/globalstate/palStandBy");
            return ok(data);
        }
        catch (err) {
            return fail(err, "putting all PALs into standby");
        }
    });
}
