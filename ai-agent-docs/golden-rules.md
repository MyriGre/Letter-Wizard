<!-- AI-AGENT-HEADER
path: /ai-agent-docs/golden-rules.md
summary: Canonical list of recurring mistakes and best practices with IDs and implications.
last-reviewed: 2025-12-08
line-range: 1-19
navigation:
  - start: /ai-agent-docs/AI-Agent-Start.md
  - agent role: /ai-agent-docs/agent-role.md
  - session logs: /ai-agent-docs/session-logs/
-->
# Golden Rules

| ID     | Problem                                      | Rule                                                               | Consequence/Implication                                      |
| ------ | -------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| GR-001 | Missing or stale AI-AGENT-HEADERs            | Add/update headers on all relevant files with accurate line ranges and dates. | Without headers, agents lose navigation and context.         |
| GR-002 | Line ranges drift after edits                | After edits, run/simulate line-sync and adjust line-range + last-reviewed. | Incorrect navigation wastes time; sync keeps headers reliable. |
| GR-003 | External tech references go stale or conflict | Query MCP Context-7 first; prefer it over local docs, log conflicts in session logs, and add a rule if recurring. | Prevents outdated guidance and highlights conflicts quickly. |

