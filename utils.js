// ── Configuration ─────────────────────────────────────────────────────────────
//Andy, Texas
//export const OCTOBOX_BASE_URL = process.env.OCTOBOX_BASE_URL ?? "http://10.160.55.30:4000";
//SM3
export const OCTOBOX_BASE_URL = process.env.OCTOBOX_BASE_URL ?? "http://10.160.81.80:4000";

// ── API client ────────────────────────────────────────────────────────────────
export async function apiRequest(method, path, body) {
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

export function errText(err, context) {
    const message = err instanceof Error ? err.message : String(err);
    return `Error ${context}: ${message}\n\nEnsure OCTOBOX_BASE_URL is set correctly (current: ${OCTOBOX_BASE_URL}).`;
}

export function ok(data) {
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function fail(err, context) {
    return {
        content: [{ type: "text", text: errText(err, context) }],
        isError: true,
    };
}

// ── Formatting helpers ────────────────────────────────────────────────────────
export function formatMarkdown(data) {
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
