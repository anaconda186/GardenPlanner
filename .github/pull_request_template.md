<!--
The PR title becomes the commit message on main, because main is squash-merged.
Make it a Conventional Commit: feat(core): derive frost dates from reanalysis history
-->

## What changed, and why

<!-- The reason, not just the mechanism. What was wrong or missing before? -->

## Checklist

- [ ] `npm run verify` passes locally
- [ ] `CHANGELOG.md` has an entry under `## [Unreleased]`, written from the gardener's point of
      view rather than the code's
- [ ] Reviewed with `/code-review` in a **fresh session**, so the reviewer read the diff cold
- [ ] Nothing in `packages/core` imports React, Electron, `node:*` or `fetch` — a port was added
      instead if the platform was needed
- [ ] No dependency that requires a native compile step (no `node-gyp`, no Rust) — see
      [ADR 0001](../docs/adr/0001-electron-shell-and-wasm-sqlite.md)
- [ ] Domain logic takes `Clock` from `ports/` rather than reading the real clock
- [ ] Any new migration is additive; no already-pushed migration was edited
- [ ] An ADR was added under `docs/adr/` if this decision could be reversed by accident later

## Horticultural data

<!-- Delete this section if the PR touches no crop data. -->

- [ ] Every new or changed value has a `sources[]` entry with a URL and retrieval date
- [ ] No value was inferred or estimated — unsourced fields were omitted instead, since an absent
      value degrades gracefully and a wrong one produces confident advice that kills plants
- [ ] Companion relationships carry an honest evidence tier (`established` vs `traditional`)

## Golden test expectations

<!-- Delete unless a golden/expected value changed. -->

- [ ] An expected value in a golden test changed. **Which authority justifies the new number?**
      Editing an expectation to match the code's output is how the safety net gets destroyed.
