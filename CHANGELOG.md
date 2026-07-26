# Changelog

All notable changes to Garden Planner are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Every pull request must add at least one entry under `## [Unreleased]`.** Write entries from
the gardener's point of view — what changed for the person using the app — not from the code's
point of view.

> Good: `Fall planting windows now account for row cover, extending the season by about two weeks.`
> Bad: `Added isProtected boolean to the Bed entity.`

CI enforces this with the `changelog` status check. Genuinely trivial changes can skip it with
the `no-changelog` label on the PR.

## [Unreleased]

### Added

- Repository foundation: PolyForm Noncommercial license, contributor-facing conventions in
  `CLAUDE.md`, and source attribution in `NOTICE.md`.
- Project toolchain: TypeScript, ESLint, Prettier, Vitest and a dependency-cruiser architecture
  gate, wired into a single `npm run verify` command.
- Unit conversion the whole app depends on: garden measurements are stored metric and shown in
  feet and inches, so a 4×8 ft bed stays exactly 4×8 ft however often it is edited.
- Hardiness zone calculation from a location's mean annual extreme minimum temperature, and
  growing degree day accumulation — the groundwork for planting dates that follow the weather
  your garden actually had rather than a fixed calendar.
