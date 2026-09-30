"""timeline_mcp.py — minimal MCP server exposing edl.json (our 'timeline') to Claude Code.
Register:  claude mcp add --transport stdio timeline -- python timeline_mcp.py /path/to/edl.json"""
import json, subprocess, sys
from pathlib import Path
from mcp.server.mcpserver import MCPServer   # mcp>=2 (was FastMCP in mcp 1.x)

EDL = Path(sys.argv[1] if len(sys.argv) > 1 else "edl.json")
mcp = MCPServer("timeline")

def load(): return json.loads(EDL.read_text(encoding="utf-8"))
def save(d): EDL.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")

@mcp.tool()
def describe_timeline() -> dict:
    """Segments (source in/out + record in/out), total duration, removed words, overlays."""
    d = load(); return {k: d.get(k) for k in ("segments", "duration_out", "overlays", "zooms")}

@mcp.tool()
def cut_range(rec_start: float, rec_end: float) -> str:
    """Remove [rec_start, rec_end) seconds of the OUTPUT timeline (splits segments as needed)."""
    d = load(); new, t = [], 0.0
    for s in d["segments"]:
        dur = s["out"] - s["in"]; a, b = t, t + dur
        if b <= rec_start or a >= rec_end: new.append(dict(s))
        else:
            if a < rec_start: new.append({**s, "out": round(s["in"] + rec_start - a, 3)})
            if b > rec_end:   new.append({**s, "in": round(s["in"] + rec_end - a, 3)})
        t = b
    t = 0.0
    for i, s in enumerate(new):
        s["id"], s["rec_in"] = i, round(t, 3); t += s["out"] - s["in"]; s["rec_out"] = round(t, 3)
    d["segments"], d["duration_out"] = new, round(t, 3); save(d)
    return f"ok: {len(new)} segments, {d['duration_out']}s"

@mcp.tool()
def add_zoom(rec_start: float, rec_end: float, x: float, y: float, scale: float = 1.6) -> str:
    """Punch-in zoom centred on (x,y) in source pixels, rendered later by render-export."""
    d = load()
    d.setdefault("zooms", []).append({"rec_start": rec_start, "rec_end": rec_end, "x": x, "y": y, "scale": scale})
    save(d); return "ok"

@mcp.tool()
def add_overlay(rec_start: float, duration: float, composition: str, variables: dict | None = None) -> str:
    """Place a HyperFrames/Remotion scene (e.g. compositions/stat.html) on the timeline."""
    d = load(); d.setdefault("overlays", []).append({"rec_start": rec_start, "duration": duration,
        "composition": composition, "variables": variables or {}}); save(d); return "ok"

@mcp.tool()
def render_preview(out: str = "work/preview.mp4") -> str:
    """Render the current EDL with autocut.py (draft) and return the output path."""
    subprocess.run([sys.executable, str(Path(__file__).with_name("autocut.py")), "render", str(EDL), "-o", out,
                    "--crf", "28"], check=True); return out

if __name__ == "__main__":
    mcp.run()   # stdio transport
