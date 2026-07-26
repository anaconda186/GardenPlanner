# Garden Planner

A desktop garden planning app that connects *what you want to eat* to *what to do this week*.

Most garden tools do one half of the job: either a pretty bed-layout editor with no sense of time,
or a planting calendar with no idea what your garden actually looks like. Garden Planner ties them
together — give it your beds, your climate, and the crops you refuse to live without, and it works
out the rest of the plan and the dated task list that follows from it.

> **Status: Phase 0 — foundations.** Not yet usable. See the roadmap below.

## What it will do

- **Bed and garden layout** — multiple beds on a canvas, each with a configurable cell grid
  (square-foot gardening, rows, in-ground plots and containers all from one model)
- **Location-aware timing** — hardiness zone and frost dates derived from 30 years of reanalysis
  weather for your exact coordinates, with probability bands rather than one fake-precise date
- **Planting calendar** — sow / transplant / harvest windows for *your* dates, split into cool
  season, warm season and transition crops, including "what can I still plant right now"
- **Companion planting and rotation** — with an honest evidence tier on every relationship, so you
  can tell established agronomy from traditional folklore. It warns; it never blocks.
- **Recommendations** — tell it your must-have crops, your bed sizes and how many people you're
  feeding, and it proposes what else to plant and how much, with a reason for each suggestion
- **Watering** — a real soil water balance driven by evapotranspiration and rainfall, not
  "an inch a week". It will tell you to skip watering when rain is coming.
- **Care schedules** — fertilizer by feeder class and soil test, mulching, thinning, pruning
- **Succession and season extension** — repeat sowings timed backwards from your first frost, and
  row cover / cold frame modelling that shifts your effective season
- **Records that pay you back** — harvest log, journal with photos, and pest/disease history that
  feeds rotation warnings and improves next year's recommendations

## Roadmap

| Phase | Deliverable |
|---|---|
| **0** | Repo, toolchain, CI/CD and process gates |
| **1** | Domain core, SQLite schema, crop dataset, climate engine |
| **2** | ⭐ Location + planting calendar + agenda — the first genuinely useful slice |
| **3** | Visual multi-bed layout editor |
| **4** | Companion planting, rotation, and the recommendation engine |
| **5** | Watering, fertilizer and mulching |
| **6** | Harvest log, journal, pests, seed inventory, yield analytics |
| **7** | Succession planting and season extension |
| **8** | Backup/export, accessibility, packaged installer |
| **9+** | OS notifications, calendar export, mobile app (Expo), optional sync |

## Architecture

```
packages/core        Pure TypeScript domain logic. No UI, no platform APIs.
packages/crop-data   Versioned JSON crop dataset + schema validator.
apps/desktop         React + Vite renderer in an Electron shell.
apps/mobile          (later) Expo app reusing packages/core verbatim.
```

The load-bearing rule: **`packages/core` never imports a platform API.** It receives storage,
weather and clock implementations through injected interfaces. That is what lets a future mobile
app reuse every engine — the crop dataset, frost-date derivation, scheduling, water balance and
recommendations — without a rewrite. A lint rule enforces it in CI.

All measurements are stored in SI units (mm, cm, °C, grams) and converted at the UI edge, which
defaults to imperial. Storing the display format is how rounding drift creeps in.

## Development

Requires Node 24+. Deliberately requires **no C++ compiler and no admin rights** — hence Electron
rather than Tauri, and WebAssembly SQLite rather than a native module.

```sh
npm install          # nothing to run yet — scaffold lands in Phase 0b
```

Conventions, invariants and standing policies live in [CLAUDE.md](./CLAUDE.md). Read that before
making changes. Data sources and attributions are in [NOTICE.md](./NOTICE.md).

## License

[PolyForm Noncommercial License 1.0.0](./LICENSE.md) — you're welcome to read it, run it, learn
from it and tinker with it for any noncommercial purpose. Commercial rights are reserved.
