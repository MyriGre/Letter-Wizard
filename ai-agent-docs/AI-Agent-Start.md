<!-- AI-AGENT-HEADER
path: /ai-agent-docs/AI-Agent-Start.md
summary: Entry point for agents; describes current repo state, docs map, and workflows.
last-reviewed: 2025-12-08
line-range: 1-130
navigation:
  - agent role: /ai-agent-docs/agent-role.md
  - golden rules: /ai-agent-docs/golden-rules.md
  - session logs: /ai-agent-docs/session-logs/
-->
# AI Agent Start

- Repository status: no source files present yet; start by adding project code/docs as needed.
- Purpose: give agents a reproducible entry point, links, and workflows to maintain AI-facing docs.
- Mode awareness: run Preparation steps until corpus is complete; afterward follow Work session flow.

## Tech Stack (current plan)
- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui (Radix-based components)
- Zustand for state management

## Quick Links
- Agent role: `ai-agent-docs/agent-role.md`
- Golden rules: `ai-agent-docs/golden-rules.md`
- Session logs directory: `ai-agent-docs/session-logs/`
- Session template: `ai-agent-docs/templates/session-template.md`

## Repository Map (current)
- `ai-agent-docs/AI-Agent-Start.md`: entry point and workflow reference (includes tech stack).
- `ai-agent-docs/agent-role.md`: project-specific responsibilities for this agent.
- `ai-agent-docs/golden-rules.md`: recurring mistakes and best practices.
- `ai-agent-docs/templates/session-template.md`: checklist template for session logs.
- `ai-agent-docs/session-logs/`: timestamped session records (see latest for continuity).
- `app/`: Vite + React + TS app.
  - `src/App.tsx`: layout wiring sidebar, top bar, canvas.
  - `src/components/`: UI building blocks (`Sidebar`, `TopBar`, `Canvas`, shadcn-style `ui`).
  - `src/store/editorStore.ts`: Zustand store for letter state and selection.
  - `src/types/editor.ts`: data model for Letter/Screen/Element.
  - `tailwind.config.js`, `postcss.config.js`: Tailwind setup.

## Workflows
- Preparation (first run):
  - Ensure the doc scaffold above exists (done).
  - Add AI-AGENT-HEADER blocks to new files with accurate line ranges and last-reviewed date.
  - Capture architecture/feature notes here once code appears.
- Per-session (after preparation):
  - Read this file, then `agent-role.md`.
  - Create a new session log from the template; include objectives, changes (paths + line ranges), decisions, and next tasks.
  - Update headers and golden rules as patterns emerge; log line-sync actions after edits.

## Session Logs
- Location: `ai-agent-docs/session-logs/`
- Naming: `SESSION-YYYYMMDD-HHMM-.md`
- Always start from the template; keep checklist of planned vs. actual tasks and open items.

## Golden Rules
- Canonical list: `ai-agent-docs/golden-rules.md`
- Add a new rule when an issue recurs; include ID, problem, rule, and consequences.

## Line Sync
- After editing any file with an AI-AGENT-HEADER, update line-range and last-reviewed.
- If a line-sync script exists (e.g., `/ai-agent-tools/line-sync.py`), run or simulate it and note in the session log.

## External Docs (MCP Context-7)
- For external technologies, query MCP Context-7 first; prefer it over local docs on conflicts.
- Record any conflict in the session log; add to Golden Rules if recurring.

## Run the App (local)
- `cd app && npm install`
- `npm run dev` (Vite dev server)
- Tailwind already wired via `src/index.css`; components use shadcn-style utilities.

## Persistent Memory (if available)
- Store key paths: `ai-agent-docs/AI-Agent-Start.md`, `ai-agent-docs/agent-role.md`, `ai-agent-docs/golden-rules.md`, `ai-agent-docs/session-logs/`, template path.
- Store Golden Rule IDs and frequently touched code areas when the codebase grows.

