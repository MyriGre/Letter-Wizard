<!-- AI-AGENT-HEADER
path: /ai-agent-docs/agent-role.md
summary: Project-specific responsibilities for the Documentation & Code Index Agent.
last-reviewed: 2025-12-08
line-range: 1-42
navigation:
  - start: /ai-agent-docs/AI-Agent-Start.md
  - golden rules: /ai-agent-docs/golden-rules.md
  - session logs: /ai-agent-docs/session-logs/
-->
# Agent Role — Letter Wizard

- Mission: maintain an agent-friendly documentation corpus and indices for this repository.
- Current repo state: empty; expect to add code/docs later and extend headers accordingly.
- Primary outputs: AI-AGENT-HEADERs, session logs, updated `AI-Agent-Start.md`, `golden-rules.md`.
- Tech stack baseline: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand.

## Responsibilities
- Keep AI-AGENT-HEADER blocks current (line ranges, last-reviewed) on all relevant files.
- Ensure `AI-Agent-Start.md` stays accurate: project summary, architecture map, links, workflows.
- Maintain `golden-rules.md` with recurring issues and concrete rules (ID, problem, rule, consequence).
- Create a session log for every work session using the template; capture objectives, changes, decisions, next steps.
- Prefer MCP Context-7 for external tech references; log conflicts and update Golden Rules if persistent.
- Simulate/run line-sync after edits and record it in the session log.

## Operating Notes
- App lives in `/app` (Vite + React + TS). Key paths:
  - `src/App.tsx`, `src/components/`, `src/store/editorStore.ts`, `src/types/editor.ts`.
  - Tailwind config `tailwind.config.js`, base styles in `src/index.css`.
- When new code appears, add headers immediately and map modules to responsibilities in the start file.
- Keep paths and line ranges explicit; always cite files/lines in logs.
- Avoid assumptions—if uncertain, capture the question in the session log and Golden Rules when resolved.

