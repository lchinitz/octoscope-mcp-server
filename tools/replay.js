import { z } from "zod";
import { apiRequest, ok, fail } from "../utils.js";

export function registerReplayTools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/pal6s/
    // Start/Stop pcap file replay on a Pal6 device
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal6_replay", {
        title: "Start/Stop Pal6 Replay",
        description: "Start or stop pcap file replay on a Pal6 device. " +
            "POST /api/v1/pal6s/. " +
            "Use request='WiFiReplayPlaybackStart' to start or 'WiFiReplayPlaybackStop' to stop.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal6 device (e.g. '172.16.27.1')."),
            request: z.string().describe("WiFiReplayPlaybackStart | WiFiReplayPlaybackStop"),
            palRadio: z.string().describe("Radio to use: RADIO_24 | RADIO_5 | RADIO_5A | RADIO_5B | RADIO_6"),
            epochMicroseconds: z.number().default(0).describe("Epoch microseconds offset. Use 0."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", "/api/v1/pal6s/", params);
            return ok(data);
        }
        catch (err) {
            return fail(err, `sending replay command to Pal6 ${params.managementAddr}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/v1/pal7s/
    // Start/Stop pcap file replay on a Pal7 device
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("octobox_pal7_replay", {
        title: "Start/Stop Pal7 Replay",
        description: "Start or stop pcap file replay on a Pal7 device. " +
            "POST /api/v1/pal7s/. " +
            "Use request='WiFiReplayPlaybackStart' to start or 'WiFiReplayPlaybackStop' to stop.",
        inputSchema: z.object({
            managementAddr: z.string().describe("Management address of the Pal7 device (e.g. '172.16.27.1')."),
            request: z.string().describe("WiFiReplayPlaybackStart | WiFiReplayPlaybackStop"),
            palRadio: z.string().describe("Radio to use: RADIO_24 | RADIO_5A | RADIO_5B | RADIO_6"),
            epochMicroseconds: z.number().default(0).describe("Epoch microseconds offset. Use 0."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await apiRequest("POST", "/api/v1/pal7s/", params);
            return ok(data);
        }
        catch (err) {
            return fail(err, `sending replay command to Pal7 ${params.managementAddr}`);
        }
    });
}
