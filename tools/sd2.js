import { z } from "zod";
import { execFile } from "child_process";
import { resolve } from "path";
import { ok, fail } from "../utils.js";

// ── Python bridge (sd2Utils) ──────────────────────────────────────────────────
const BRIDGE_PATH = resolve(process.env.SD2_BRIDGE_PATH ?? "./bridge.py");

function callSd2Utils(funcName, args) {
    return new Promise((resolve, reject) => {
        const jsonArgs = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a)));
        execFile(
            "/home/lchinitz/Documents/venvMCP/bin/python3", // BECAUSE OF THE venv NEEDED TO INSTALL STARDUST SOCKET
            [BRIDGE_PATH, funcName, ...jsonArgs],
            { maxBuffer: 1024 * 1024 * 10 },
            (err, stdout, stderr) => {
                console.error("=== DEBUG ===");
                console.error("ARGS:", jsonArgs);
                console.error("ERR:", err);
                console.error("STDOUT:", stdout);
                console.error("STDERR:", stderr);
                console.error("=============");
                if (err) {
                    // bridge.py exits with code 1 and prints JSON with an "error" key
                    try {
                        const parsed = JSON.parse(stdout.trim());
                        reject(new Error(parsed.error ?? stderr ?? err.message));
                    }
                    catch {
                        reject(new Error(stderr || err.message));
                    }
                    return;
                }
                try {
                    resolve(JSON.parse(stdout.trim()));
                }
                catch {
                    resolve(stdout.trim()); // return raw string if not JSON
                }
            }
        );
    });
}

export function registerSd2Tools(server) {
    // ─────────────────────────────────────────────────────────────────────────────
    // sd2Utils.waitForAssociation
    // Polls a PAL radio until it associates (or times out).
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("sd2_wait_for_association", {
        title: "Wait For Association",
        description: "Poll a PAL radio until it associates with an AP, or until timeToWait seconds elapse. " +
            "Wraps sd2Utils.waitForAssociation(palName, targetRadio, timeToWait, quitOnFail, vstasRequired, meshinfoKey). " +
            "Returns {status: 'success', online: true} on success. " +
            "Returns a failure dict (or exits the process if quitOnFail is true and the call is made from a script context).",
        inputSchema: z.object({
            palName: z
                .string()
                .describe("Name of the PAL device as it appears in paramsDict (e.g. 'palA')."),
            targetRadio: z
                .string()
                .describe("Radio interface to watch (e.g. 'RADIO_2', 'RADIO_5', 'RADIO_5A', 'RADIO_5B', 'RADIO_6')."),
            timeToWait: z
                .number()
                .int()
                .default(30)
                .describe("Maximum seconds to wait for association (default: 30). 6 GHz typically needs ~40 s."),
            quitOnFail: z
                .boolean()
                .default(true)
                .describe("If true, the Python process calls sys.exit(1) on timeout or error. Set false to get a failure dict returned instead."),
            vstasRequired: z
                .number()
                .int()
                .optional()
                .describe("Number of vSTAs that must associate before success is declared. Omit (null) for a regular STA."),
            meshinfoKey: z
                .string()
                .optional()
                .describe("Key into meshinfo.json for channel-change tracking (e.g. 'extender1_5A'). Omit if not needed."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await callSd2Utils("waitForAssociation", [
                params.palName,
                params.targetRadio,
                params.timeToWait,
                params.quitOnFail,
                params.vstasRequired,
                params.meshinfoKey,
            ]);
            return ok(data);
        }
        catch (err) {
            return fail(err, `waitForAssociation(${params.palName}, ${params.targetRadio})`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // sd2Utils: setupSTA
    // Set up a STApal or Pal device as a STA
    // ─────────────────────────────────────────────────────────────────────────────
    server.registerTool("sd2_setup_sta", {
        title: "Setup STA",
        description: "Configure and set up a STApal or Pal device as a STA using sd2Utils.setupSTA. " +
            "Configures radio, SSID, IP, streams, OFDMA, beamforming, and pushes config to the device.",
        inputSchema: z.object({
            palToUse: z.string().describe("Alias of the PAL or STAPal device to configure (e.g. 'L2C')."),
            band: z.string().describe("Band to use: '24', '2.4', '5g', '5Ag', '5Bg', '6g'."),
            type: z.string().default("INTERFACE_AX").describe("Interface type (e.g. 'INTERFACE_AX', 'INTERFACE_AC', 'INTERFACE_BE'). Default: 'INTERFACE_AX'."),
            channel: z.number().int().default(0).describe("Primary channel number. 0 = auto. Default: 0."),
            bssid: z.string().default("").describe("BSSID to force connection to a specific AP radio. Leave empty to disable. Default: ''."),
            streams: z.number().int().default(2).describe("Number of spatial streams. STApals support max 2. Default: 2."),
            bandConfig: z.string().default("BAND_DUAL").describe("Band configuration for Pal6 devices. Default: 'BAND_DUAL'."),
            pushConfig: z.boolean().default(false).describe("Whether to push the config to the device immediately. Default: false."),
            timeToWait: z.number().int().default(60).describe("Timeout in seconds for association. Default: 60."),
            ipMode: z.string().default("IPv4").describe("IP mode: 'IPv4', 'IPv6', 'IPv6LL'. Default: 'IPv4'."),
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    }, async (params) => {
        try {
            const data = await callSd2Utils("setupSTA", [
                params.palToUse,
                params.band,
                [],                  // staDictList — starts empty, populated by setupSTA
                params.type,
                params.channel,
                params.bssid,
                params.streams,
                params.bandConfig,
                params.pushConfig,
                null,                // staDictOverride — not exposed, use default
                params.timeToWait,
                params.ipMode,
            ]);
            return ok(data);
        } catch (err) {
            return fail(err, "setupSTA");
        }
    });    
}
