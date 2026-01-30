# Codex Remote UX + Streaming Latency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

## Plan Metadata
- Version: 1.0
- Owner: Eng
- Last Updated: 2026-01-27
- Plan File: docs/plans/2026-01-27-codex-remote-ux-streaming.md

## Goal
Deliver a one-command entry into a remote-controllable Codex session, with daemon auto-start and realtime reasoning+tool streaming to mobile, while meeting latency targets.

## Architecture
Add a CLI entry that guarantees daemon availability, spawns a remote Codex session, and wires Codex MCP events into the session stream. Instrument the RPC + session update path end-to-end, then tighten streaming (reasoning/tool events) and mobile rendering to hit latency SLOs.

## Tech Stack
Node.js + TypeScript (CLI/daemon), Socket.IO + Fastify (server), Expo React Native (mobile), MCP stdio (Codex), Zod.

## Success Criteria (measurable)
- One CLI command reaches “remote controllable” ready state in <= 3s (CLI start → first `ready` event).
- Reasoning + tool events appear on mobile within <= 1000ms (Codex event → mobile render).
- End-to-end user message → first assistant token <= 2s.

## Acceptance Criteria
- `happy codex` (or equivalent single command) auto-starts daemon if not running and opens a remote session.
- Mobile can see live reasoning deltas and tool execution events (A+B) during Codex runs.
- Logs include timestamps for each hop to validate the 3 latency SLOs.

## Verification Commands
- `cd cli && yarn typecheck` (Expected: pass)
- `cd cli && yarn test` (Expected: pass)
- `cd expo-app && yarn typecheck` (Expected: pass)
- `cd expo-app && yarn test` (Expected: pass)
- `cd server && yarn build` (Expected: pass if touched)
- `cd server && yarn test` (Expected: pass if touched)

## Evidence
- CLI log file under `~/.happy-dev/logs/` (timestamped) with latency markers.
- Mobile app logs showing receive+render timestamps for reasoning/tool events.
- Server logs (if touched) for RPC forwarding timestamps.

## Estimation
- Effort: 3-5 days
- Story Points: 5
- Original Estimate: 5

## Risk Register
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Cross-platform daemon auto-start is OS-specific | High | Medium | Start with CLI auto-start + optional autostart toggle; document OS support |
| Reasoning/tool streams too chatty, UI jank | Medium | Medium | Throttle UI rendering to <=1000ms windows while keeping deltas intact |
| Instrumentation affects latency | Medium | Low | Use lightweight timestamps and sample logs |
| Codex MCP stdio is a bottleneck | Medium | Medium | Measure first; consider batching/tuning if needed |

---

## Repo / File List
- Create:
  - (Optional) `cli/src/utils/latencyMarks.ts` (shared timestamp helpers)
- Modify:
  - `cli/src/index.ts` (single-command UX + daemon auto-start path)
  - `cli/src/daemon/controlClient.ts` (ensure daemon running)
  - `cli/src/daemon/run.ts` (daemon ready markers + session spawn timing)
  - `cli/src/codex/runCodex.ts` (reasoning/tool stream + timing markers)
  - `cli/src/codex/codexMcpClient.ts` (connect timing markers)
  - `cli/src/codex/utils/reasoningProcessor.ts` (delta flush cadence)
  - `cli/src/utils/MessageQueue2.ts` (avoid extra waits for streaming events)
  - `server/sources/app/api/socket/rpcHandler.ts` (RPC forward timing markers)
  - `server/sources/app/api/socket/sessionUpdateHandler.ts` (session update timing markers, if needed)
  - `expo-app/sources/-session/SessionView.tsx` (render reasoning + tool events)
- Test:
  - `cli/src/daemon/daemon.integration.test.ts` (ensure daemon auto-start behavior)
  - `cli/src/utils/MessageQueue2.test.ts` (batching/latency behavior)
  - `expo-app/sources/-session/SessionView.spec.tsx` (rendering of reasoning/tool events)

## Approach (Pseudo-code)
1) Add lightweight latency markers at: CLI start, daemon ready, RPC send/recv, session create, first reasoning delta, tool begin/end, app render.
2) Introduce `ensureDaemonRunning()` in control client; wire into `happy codex` entry path so one command is enough.
3) Ensure Codex MCP events are forwarded immediately (reasoning/tool deltas) and not buffered > 1000ms.
4) Render reasoning/tool streams in mobile UI with minimal throttling.
5) Validate SLOs via log timestamps.

## Impact Analysis
- Changes touch CLI, server, and mobile; coordination needed to keep message types consistent.
- Streaming more events may increase bandwidth/CPU; must cap UI render rate.

## Action Items
- [ ] Task 1: Latency instrumentation across CLI/Server/App
- [ ] Task 2: One-command CLI UX + daemon auto-start
- [ ] Task 3: Real-time reasoning/tool streaming pipeline
- [ ] Task 4: Mobile rendering for reasoning + tool events
- [ ] Task 5: Queue/flush behavior tuning + tests

## Status Update (2026-01-30)
- Tests: `cli/src/utils/MessageQueue2.test.ts` passed.
- Tests: `expo-app/sources/sync/typesRaw.spec.ts` passed (Windows run via `node ..\\node_modules\\vitest\\vitest.mjs`).
- Note: `expo-app/sources/components/MessageView.spec.ts` is missing; test skipped per request.
- Repo hygiene: added `.sdd/`, `.serena/`, `context/`, `logs/` to `.gitignore` (docs and Agents.md remain tracked).

## Plan Update (2026-01-30)
**Scope addendum:** Make `expo-app` test workflow work on Windows (junction-safe vitest invocation) and resolve missing `MessageView` test coverage (create or align test target).

**Skills:** @systematic-debugging, @test-driven-development

### Task A: Fix Windows vitest invocation for expo-app
**Files:**
- Modify: `expo-app/package.json` (test script)

**Steps:**
1. Update `expo-app` `test` script to call `node ../node_modules/vitest/vitest.mjs` explicitly (junction-safe).
2. Run: `cd expo-app && yarn test` (Expected: tests run without `node_modules\\node_modules` error).
3. Commit: `git add expo-app/package.json && git commit -m "fix: expo-app test script uses explicit vitest path on Windows"`

### Task B: Restore/align MessageView test coverage
**Files:**
- Create: `expo-app/sources/components/messageViewVisibility.ts`
- Create: `expo-app/sources/components/messageViewVisibility.test.ts`
- Modify: `expo-app/sources/components/MessageView.tsx`

**Steps:**
1. Locate intended test target (MessageView vs SessionView) and align plan/test path.
2. Write failing test for codex `thinking` visibility behavior.
3. Run: `cd expo-app && yarn test` (Expected: FAIL on new test).
4. Implement minimal change if needed.
5. Re-run test (Expected: PASS).
6. Commit: `git add expo-app/sources/components/messageViewVisibility.ts expo-app/sources/components/messageViewVisibility.test.ts expo-app/sources/components/MessageView.tsx`

### Task 1: Latency instrumentation across CLI/Server/App

**Files:**
- Create (optional): `cli/src/utils/latencyMarks.ts`
- Modify: `cli/src/codex/runCodex.ts`, `cli/src/codex/codexMcpClient.ts`, `cli/src/daemon/run.ts`, `server/sources/app/api/socket/rpcHandler.ts`, `server/sources/app/api/socket/sessionUpdateHandler.ts`, `expo-app/sources/-session/SessionView.tsx`
- Test: `cli/src/utils/MessageQueue2.test.ts` (if new helper is added)

**Step 1: Write the failing test**
```ts
// If latencyMarks helper is added, assert it formats timestamps and preserves monotonic order
```

**Step 2: Run test to verify it fails**
Run: `cd cli && yarn test`
Expected: FAIL (new helper or markers missing)

**Step 3: Write minimal implementation**
- Add timestamp markers at key hops with a shared traceId (sessionId + messageId).
- Keep logs lightweight (`logger.debug`).

**Step 4: Run test to verify it passes**
Run: `cd cli && yarn test`
Expected: PASS

**Step 5: Commit**
```bash
git add cli/src/codex/runCodex.ts cli/src/codex/codexMcpClient.ts cli/src/daemon/run.ts server/sources/app/api/socket/rpcHandler.ts server/sources/app/api/socket/sessionUpdateHandler.ts expo-app/sources/-session/SessionView.tsx
git commit -m "feat: add latency markers for codex remote pipeline"
```

### Task 2: One-command CLI UX + daemon auto-start

**Files:**
- Modify: `cli/src/index.ts`, `cli/src/daemon/controlClient.ts`
- Test: `cli/src/daemon/daemon.integration.test.ts`

**Step 1: Write the failing test**
```ts
// Add an integration test that runs the new command and asserts daemon is running
```

**Step 2: Run test to verify it fails**
Run: `cd cli && yarn test`
Expected: FAIL (auto-start not implemented)

**Step 3: Write minimal implementation**
- Add `ensureDaemonRunning()` to start daemon if absent.
- Wire `happy codex` (or `happy codex --remote`) to call it and then spawn session.

**Step 4: Run test to verify it passes**
Run: `cd cli && yarn test`
Expected: PASS

**Step 5: Commit**
```bash
git add cli/src/index.ts cli/src/daemon/controlClient.ts cli/src/daemon/daemon.integration.test.ts
git commit -m "feat: one-command codex remote entry with daemon auto-start"
```

### Task 3: Real-time reasoning/tool streaming pipeline

**Files:**
- Modify: `cli/src/codex/runCodex.ts`, `cli/src/codex/utils/reasoningProcessor.ts`, `cli/src/utils/MessageQueue2.ts`
- Test: `cli/src/utils/MessageQueue2.test.ts`

**Step 1: Write the failing test**
```ts
// Add a test that ensures reasoning/tool events are flushed within <= 1000ms windows
```

**Step 2: Run test to verify it fails**
Run: `cd cli && yarn test`
Expected: FAIL

**Step 3: Write minimal implementation**
- Ensure reasoning deltas are forwarded without buffering beyond 1000ms.
- Avoid batching delays in MessageQueue2 for reasoning/tool events.

**Step 4: Run test to verify it passes**
Run: `cd cli && yarn test`
Expected: PASS

**Step 5: Commit**
```bash
git add cli/src/codex/runCodex.ts cli/src/codex/utils/reasoningProcessor.ts cli/src/utils/MessageQueue2.ts cli/src/utils/MessageQueue2.test.ts
git commit -m "feat: stream reasoning/tool events with low latency"
```

### Task 4: Mobile rendering for reasoning + tool events

**Files:**
- Modify: `expo-app/sources/-session/SessionView.tsx`
- Test: `expo-app/sources/-session/SessionView.spec.tsx`

**Step 1: Write the failing test**
```tsx
// Render a mock session event stream and assert reasoning/tool blocks appear
```

**Step 2: Run test to verify it fails**
Run: `cd expo-app && yarn test`
Expected: FAIL

**Step 3: Write minimal implementation**
- Render reasoning deltas and tool execution begin/end in the session UI.
- Throttle UI updates to keep <= 1000ms updates without jank.

**Step 4: Run test to verify it passes**
Run: `cd expo-app && yarn test`
Expected: PASS

**Step 5: Commit**
```bash
git add expo-app/sources/-session/SessionView.tsx expo-app/sources/-session/SessionView.spec.tsx
git commit -m "feat: show reasoning and tool events in mobile session view"
```

### Task 5: Queue/flush behavior tuning + tests

**Files:**
- Modify: `cli/src/utils/MessageQueue2.ts`
- Test: `cli/src/utils/MessageQueue2.test.ts`

**Step 1: Write the failing test**
```ts
// Add a regression test for batch collection latency under mixed message types
```

**Step 2: Run test to verify it fails**
Run: `cd cli && yarn test`
Expected: FAIL

**Step 3: Write minimal implementation**
- Adjust batch selection to prioritize streaming events.

**Step 4: Run test to verify it passes**
Run: `cd cli && yarn test`
Expected: PASS

**Step 5: Commit**
```bash
git add cli/src/utils/MessageQueue2.ts cli/src/utils/MessageQueue2.test.ts
git commit -m "test+fix: message queue latency tuning"
```
