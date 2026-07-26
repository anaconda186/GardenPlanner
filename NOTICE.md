# Notices and attributions

Required Notice: Copyright 2026 Alex Will (https://github.com/anaconda186)

Garden Planner is licensed under the [PolyForm Noncommercial License 1.0.0](./LICENSE.md).

---

## Horticultural data sources

The crop dataset in `packages/crop-data` is compiled by hand from public agricultural extension
and government publications. **Every field group in every crop record carries a `sources[]` entry
with a URL and a retrieval date** — see the data policy in [CLAUDE.md](./CLAUDE.md). Values
without a citation are treated as untrusted and fail the `validate:crops` build check.

Primary sources consulted:

| Source                                                                   | Used for                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| University of Georgia Extension (e.g. C963, B577)                        | Planting dates, days to maturity, spacing, seed quantities                |
| NC State Extension — Vegetable Planting Guide                            | Planting windows by season                                                |
| University of Minnesota Extension                                        | Evapotranspiration-based irrigation scheduling / water balance method     |
| University of Florida IFAS Extension                                     | Warm-climate planting windows                                             |
| UC Statewide IPM Program (UC IPM)                                        | ET-based irrigation scheduling for home gardens                           |
| USDA                                                                     | Plant hardiness zone definition (mean annual extreme minimum temperature) |
| [OpenFarm](https://github.com/openfarmcc/OpenFarm) (CC0 / public domain) | Cross-checking crop attributes                                            |

Commercial seed catalogues (e.g. Johnny's Selected Seeds yield charts) are consulted only as a
**cross-check** on values sourced elsewhere. Their content is not copied into this repository.

Companion-planting relationships are labelled with an evidence tier. Wikipedia-derived
compilations such as [alecsharpie/companion_planting_dataset](https://github.com/alecsharpie/companion_planting_dataset)
are used only as a starting list of candidate pairs, each of which is then hand-tiered.

## Weather and climate data

Hardiness zone, frost dates, growing degree days, reference evapotranspiration and precipitation
are derived from the [Open-Meteo](https://open-meteo.com/) API (ERA5 reanalysis and forecast).

> Open-Meteo's free tier is for **non-commercial use**. Any future commercial release of this
> application requires a paid Open-Meteo plan or a self-hosted instance.

## Third-party software

Runtime and build dependencies are listed in `package.json` and `package-lock.json`, each under
its own license. Notably [SQLite](https://sqlite.org/) (public domain) is used via the official
`@sqlite.org/sqlite-wasm` build.

## Disclaimer

Garden Planner offers horticultural guidance derived from regional averages and modelled weather.
It is not a substitute for local observation or advice from your regional extension service.
Growing conditions vary enormously over short distances, and every crop record can be overridden
with values that match your own garden.
