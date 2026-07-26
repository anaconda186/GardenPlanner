# CLAUDE.md

Conventions and standing policies for Garden Planner. Read this before making changes.

## What this project is

A local-first desktop garden planning app. Beds and layout, climate-derived planting dates, care
schedules, and a recommendation engine that turns "these crops, this much space, this many people"
into a plan and a dated task list. Personal use now; a mobile release is a later addition, not a
rewrite.

## Environment constraints (these are not negotiable)

Development happens on a **managed Windows workstation with no administrator rights and no C++
compiler** (`cl`, `link`, `clang`, `gcc` are all absent; there is no Visual Studio install), where
software cannot be installed.

- **Never introduce a dependency that requires a native compile step.** No `node-gyp`, no
  `better-sqlite3`, no Rust. If a package has no prebuilt pure-JS or WASM path, it cannot be used.
  See [ADR 0001](./docs/adr/0001-electron-shell-and-wasm-sqlite.md).
- Tauri was evaluated and rejected for this reason. The shell is **Electron**, installed via npm
  into user space.
- SQLite is the official WebAssembly build (`@sqlite.org/sqlite-wasm`, `opfs-sahpool` VFS, which
  needs no COOP/COEP headers). The Electron main process owns a real `.sqlite` file on disk.
- **The GitHub CLI (`gh`) is not available.** Git auth is SSH via the `github-personal` host alias
  ([ADR 0002](./docs/adr/0002-ssh-auth-for-personal-account.md)). Consequently, repository settings
  (visibility, rulesets, secret scanning) **and opening or merging pull requests** are browser
  actions for the user — do not attempt them from a tool call. Give the user a click-list instead.

## Architecture

```
packages/core        Pure TypeScript domain logic and engines
packages/crop-data   Versioned JSON crop dataset + Zod schema + validator
apps/desktop         React + Vite renderer + Electron main process
apps/mobile          (later) Expo, reusing packages/core verbatim
```

### The one rule that matters most

**`packages/core` must never import a platform API.** No React, no Electron, no `fs`, no `fetch`,
no `node:*`. It takes `Repository`, `WeatherProvider` and `Clock` as injected interfaces defined in
`packages/core/src/ports/`.

This is what makes the future mobile app cheap, and it is exactly the rule that gets broken because
calling a platform API directly is always the shortest path to working code. A lint rule fails CI
if it is violated. If you find yourself wanting to break it, add a port instead.

### Units

Store **SI everywhere**: millimetres, centimetres, °C, grams, m². Convert at the UI edge, which
defaults to imperial display. Never store the display format — that is how rounding drift starts.

### Dates and time

**Domain logic never reads the clock.** Take `Clock` from `ports/`. A garden app is date-dependent
in almost every engine, and a test that calls `new Date()` passes in July and fails in January.

## Horticultural data policy

This is the highest-risk area in the project. A fabricated days-to-maturity, frost tolerance or
crop coefficient reads perfectly plausibly and produces advice that kills plants, with no error
message anywhere.

- **Every field group in every crop record requires a `sources[]` entry** with a URL and a
  retrieval date. `npm run validate:crops` fails the build without one.
- **Never invent a number.** If a value cannot be sourced, omit the field and let the engine treat
  it as unknown. An absent value degrades gracefully; a wrong value does not.
- Preferred sources: US land-grant extension publications (UGA, NC State, UF/IFAS, UMN, Utah
  State), USDA, and UC IPM. `openfarmcc/OpenFarm` (CC0) is a hint source to be verified, never a
  citation on its own.
- Commercial seed catalogues are a cross-check only. Do not copy their content.
- Companion relationships carry an evidence tier: `established` (family-based disease and pest
  carryover, nitrogen fixation, trap and nurse cropping, height/root stacking, allelopathy) versus
  `traditional` (the classic companion chart, largely unproven). Surface the tier and the source in
  the UI. **Warn, never block.**

## Testing

- `packages/core` is the primary safety net, since it is platform-free and needs no mocking of
  native modules. Cover engines properly; UI coverage is secondary.
- **No network in tests.** Open-Meteo responses are committed as fixtures.
- Climate golden files use **public reference cities** (Minneapolis, Atlanta, Sacramento) — never
  the user's real coordinates, which are personal data and this repo is public.
- Schedule and succession engines are verified by golden-file comparison against published
  extension planting charts. The acceptance bar is "matches the extension chart within a week".
- **A failing golden test must never be "fixed" by editing the expected value.** The expectation is
  the specification. If a golden value genuinely needs to change, say so explicitly in the PR and
  name the authority that justifies the new number.

## Database

- **Migrations are forward-only.** Never edit a migration that has been pushed; add a new one. CI
  proves apply-from-empty and idempotency.
- Every table carries `id` (UUID v7), `created_at`, `updated_at`, `deleted_at` (soft delete). This
  is the entire cost of being able to add sync later without a schema rewrite.
- The `.sqlite` file is user data and is gitignored. Never commit one.

## Git workflow

- Feature branches: `feat/…`, `fix/…`, `chore/…`, `data/…`. Never commit directly to `main`.
- Squash-merge only. One PR becomes exactly one commit on `main`, so every commit in history is one
  that was reviewed and described in the changelog.
- The **PR title becomes the commit message**, so it must follow Conventional Commits
  (`feat(core): …`, `fix(water): …`). CI checks the title. Commit messages inside the branch can be
  messy — they get squashed away.
- Keep PRs under roughly 400 lines of hand-written diff. An unreviewable PR defeats the review
  requirement entirely; split the branch instead.
- AI-authored commits carry a `Co-Authored-By: Claude` trailer.
- Run `/code-review` over the branch diff **in a fresh session** before pushing, so the reviewer
  reads the code cold rather than defending decisions it just made.

## Changelog

Every PR adds at least one line under `## [Unreleased]` in `CHANGELOG.md`, written from the
gardener's point of view — what changed for the person using the app, not what changed in the code.
CI enforces this; `no-changelog` on the PR skips it for genuinely trivial changes.

Release bumps the version in **both** `package.json` and the Electron builder config, and CI
asserts the two agree — they drift silently otherwise.

## Dependencies

- **Verify a package exists before adding it.** Check its npm page: publish date, download count,
  linked repo. Hallucinated and typosquatted package names are a real supply-chain risk.
- Re-check the no-native-compile rule above for anything new.
- Committed lockfile; `npm ci` in CI.

## Decisions

Architectural decisions live in `docs/adr/` as one short file each. If you make a decision that a
future session could reasonably reverse by accident, write an ADR and link it from here.
