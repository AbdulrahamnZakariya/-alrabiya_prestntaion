#!/usr/bin/env bash
# PreToolUse gate for every Blotato MCP tool: always escalate to the human.
# بوابة النشر: أي أداة Blotato بتطلب موافقتك انت، حتى لو الجلسة بوضع auto.
cat >/dev/null
cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Publishing gate: only approve if you (the editor) typed «انشر» for exactly this publish/plan.json."}}
JSON
