# octobox-mcp-server

MCP server for the **octoScope** REST API.  
Exposes one tool: **`octobox_get_attenuators`** — retrieves current attenuation values from one or more attenuator devices via `GET /api/v1/attenuators`.

---

## Prerequisites

- Node.js 18+
- A running octoScope server

---

## Setup

```bash
# Install dependencies
npm install

# Build
npm run build
```

---

## Claude Desktop Configuration

Open your Claude Desktop config file:

| OS      | Path |
|---------|------|
| macOS   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Add the following entry inside the `"mcpServers"` object (replace the path and URL with your own values):

```json
{
  "mcpServers": {
    "octobox": {
      "command": "node",
      "args": ["/absolute/path/to/octobox-mcp-server/dist/index.js"],
      "env": {
        "OCTOBOX_BASE_URL": "http://<your-octobox-host>:8080"
      }
    }
  }
}
```

**Example (macOS):**

```json
{
  "mcpServers": {
    "octobox": {
      "command": "node",
      "args": ["/Users/yourname/octobox-mcp-server/dist/index.js"],
      "env": {
        "OCTOBOX_BASE_URL": "http://192.168.1.100:8080"
      }
    }
  }
}
```

Restart Claude Desktop after saving the file. You should see **octobox** listed under connected MCP servers.

---

## Environment Variables

| Variable          | Required | Default                  | Description                         |
|-------------------|----------|--------------------------|-------------------------------------|
| `OCTOBOX_BASE_URL`| Yes      | `http://localhost:8080`  | Base URL of your octoScope server   |

---

## Tool: `octobox_get_attenuators`

Retrieves per-channel attenuation values from octoScope attenuator devices.

### Parameters

| Parameter            | Type   | Required | Description |
|----------------------|--------|----------|-------------|
| `managementAddrList` | string | No       | Comma-separated IP addresses (e.g. `192.168.1.10,192.168.1.11`). Omit to get all attenuators. |
| `response_format`    | string | No       | `"markdown"` (default) or `"json"` |

### Example prompts in Claude

- *"Show me all attenuator values."*
- *"What's the attenuation on 192.168.1.10?"*
- *"Get attenuation for 192.168.1.10 and 192.168.1.11 in JSON format."*

---

## Development

```bash
# Watch mode
npm run dev

# Run directly (uses stdio transport)
node dist/index.js
```
