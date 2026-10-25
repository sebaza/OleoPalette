# OleoPalette application

## Objective
Build a mobile-first, browser-local oil-paint mixing application for GitHub Pages from an empty repository.

## Problem and rationale
A painter needs to select an apparent color from a photo, inventory owned paints, and receive an honest, practical estimated recipe without unsupported claims of physical accuracy.

## Authorized scope
The attached master prompt authorizes local implementation, tests, documentation, and GitHub Pages CI configuration. No remote push or publication is authorized. UI language is Chilean Spanish; code and technical documentation use English.

## Architecture and constraints
React + TypeScript + Vite static application; modular domain/UI separation; CSS modules or scoped CSS over Tailwind to avoid unnecessary tooling; Dexie IndexedDB; color.js for perceptual comparison; Vitest, Testing Library, Playwright. No backend, tracking, synthetic spectral data, or automatic permanent photo storage. Strict TDD is enabled by project instructions; runner to be established with package setup (`npm test`). Feature branch: `codex/oleopalette-app`. Delivery strategy: `auto-chain`, with `feature-branch-chain` as the recommended review strategy if PRs are later requested; no PR or push now. The ~400 authored-line heuristic is advisory for tasks, not a code-golf target.

## Tasks
- [x] OP-01 Foundation: scaffold app, accessible navigation, typed domain/storage, theme, tests, lint/typecheck/build, and first functional mobile shell. Route: delegated (new project, multiple nontrivial files). Verify: `npm test -- --run` 1 passed; `npm run typecheck` passed; `npm run lint` passed; `npm run build` passed. RED observed: missing App import. Runtime harness: N/A, static shell has no external boundary. Rollback: foundation scaffold and first UI shell. Commit: recorded below.
- [ ] OP-02 Core mixing: photo sampling with zoom/pan and validation; inventory/catalog; bounded heuristic engine and spectral calibration gate; optimization and actionable recipe. Route: delegated (multiple nontrivial files). Verify: focused domain/UI tests and all checks. Commit: pending.
- [ ] OP-03 Practical workflow: quantity conversions, interactive recipe adjustment/comparison, saved recipes/history, backup import/export, settings. Route: delegated (multiple nontrivial files). Verify: domain, storage, component tests and all checks. Commit: pending.
- [ ] OP-04 Calibration and release quality: observations/empirical correction, meaningful E2E, accessibility/mobile QA, science/usage docs, GitHub Pages workflow. Route: delegated (multiple nontrivial files and execution). Verify: all checks, Playwright when available, production build; publication remains manual. Commit: pending.

## Acceptance criteria
The user can select a photo color, manage paints, compute recipes using available paints or a reference palette, adjust and save recipes, back up local data, and understand scientific limits. The site builds as static files under `/OleoPalette/` and includes CI deployment preparation. Features not reached or scientifically unsupported must be documented honestly.

## Progress and evidence
- 2026-10-25: Empty repository confirmed, with no commits on main and origin configured. Created feature branch and task document before source writes.
- Native RDD status and review boundaries: pending.
- Running authored-line count: 0.
- OP-01 uses CSS and browser-local fonts only; no third-party font request. IndexedDB schema v1 establishes paints and recipe snapshots. RDD globally off per parent check, so no native review was started.

## Next step
Implement OP-01 through OP-04 as independent, verified work-unit commits, prioritizing the complete photo → recipe path.
