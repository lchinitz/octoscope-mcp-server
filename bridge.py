"""
bridge.py — Dispatch bridge from the TypeScript MCP server to sd2Utils functions.

Usage:
    python3 bridge.py <functionName> [<jsonArg1> <jsonArg2> ...]

Each argument after the function name must be a JSON-encoded value.
The result is printed as a single JSON line to stdout.
Any error is printed as JSON to stdout with an "error" key, and the
process exits with code 1 so the TypeScript caller can distinguish
failure from a valid (even falsy) result.

Example:
    python3 bridge.py waitForAssociation '"palA"' '"RADIO_5"' '30' 'true'
"""

import sys
import json
import traceback

# ---------------------------------------------------------------------------
# Locate sd2Utils.py.  Put it on the path if it lives next to bridge.py.
# Adjust the path below if your layout is different.
# ---------------------------------------------------------------------------
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import sd2Utils


def _serialize(value):
    """Best-effort serialization — handles types json.dumps can't natively."""
    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        return json.dumps(str(value))


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No function name provided. Usage: bridge.py <funcName> [jsonArg ...]"}))
        sys.exit(1)

    func_name = sys.argv[1]

    # Look up the function in sd2Utils
    func = getattr(sd2Utils, func_name, None)
    if func is None or not callable(func):
        print(json.dumps({"error": f"Function '{func_name}' not found in sd2Utils"}))
        sys.exit(1)

    # Decode each remaining argument from JSON
    args = []
    for i, raw in enumerate(sys.argv[2:], start=2):
        try:
            args.append(json.loads(raw))
        except json.JSONDecodeError as e:
            args.append(raw)
            #print(json.dumps({"error": f"Argument {i} is not valid JSON: {raw!r} — {e}"}))
            #sys.exit(1)

    # Call the function and return the result
    try:
        result = func(*args)
        print(_serialize(result))
    except SystemExit as e:
        # sd2Utils uses sys.exit(1) for hard failures — surface this cleanly
        print(json.dumps({"error": f"sd2Utils called sys.exit({e.code}) — test failure or fatal condition"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc()
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
