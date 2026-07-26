# ADR 0001 — Electron shell and WebAssembly SQLite, not Tauri

- **Date:** 2026-07-25
- **Status:** Accepted
- **Supersedes:** the original plan's choice of Tauri 2

## Context

The plan specified Tauri 2 for the desktop shell: a ~10 MB installer, native OS integration, and
real SQLite through `tauri-plugin-sql`. On inspecting the development machine, that turned out to
be unbuildable here.

Verified state of the machine — a managed Windows workstation:

| Requirement                                 | Status                               |
| ------------------------------------------- | ------------------------------------ |
| Administrator rights                        | **No**                               |
| C++ compiler (`cl`, `link`, `clang`, `gcc`) | **None present**                     |
| Visual Studio / Build Tools                 | **Not installed** (`vswhere` absent) |
| Rust / `cargo`                              | Not installed                        |
| WebView2                                    | Present                              |
| Node 24 / npm 11, user-space installs       | Working                              |

Tauri requires Rust _and_ the MSVC linker. `rustup` alone would install into `%USERPROFILE%\.cargo`
without admin, but the MSVC build tools ship in an administrator-only installer, and software
installation is not permitted in this environment. The `x86_64-pc-windows-gnu` toolchain would need
MinGW-w64 and is poorly supported by Tauri. There is no viable path to a local Tauri build.

## Options considered

1. **Electron + WASM SQLite.** Both install via npm into user space; no compiler, no admin.
2. **Browser-only web app.** Least setup, but data lives in the browser profile, so clearing site
   data destroys the user's garden, and there is no real window or installer.
3. **Keep Tauri, build only in CI.** GitHub Actions runners have full toolchains. Rejected: the
   native layer could never be run or debugged locally, forcing two storage adapters that would
   silently diverge.
4. **Move development to a personal machine.** Best long-term answer, but not available now.

## Decision

Use **Electron** for the desktop shell and **`@sqlite.org/sqlite-wasm`** for storage.

- Electron and `electron-builder` are plain npm packages with prebuilt binaries — no compiler, no
  admin, and `electron-builder` produces an installer from user space.
- `@sqlite.org/sqlite-wasm` is the official SQLite WebAssembly build. Its `opfs-sahpool` VFS
  (SQLite 3.43+) works without COOP/COEP response headers, unlike the plain `opfs` VFS.
- The Electron **main process owns a real `.sqlite` file on disk** in the user's Documents folder.
  This is the key advantage over option 2: backups are ordinary file copies and the data cannot be
  destroyed by clearing browser storage.

**No dependency requiring a native compile step may be added to this project.** That rules out
`better-sqlite3`, anything using `node-gyp`, and any Rust component. This constraint is recorded in
`CLAUDE.md` because it is invisible from the code and a future session would otherwise reach for
`better-sqlite3` as the obvious choice.

## Consequences

**Unaffected** — and this is the point of the architecture: `packages/core` is pure TypeScript
behind injected ports, so the domain logic, crop dataset, climate derivation, scheduling, water
balance and recommendation engines are all untouched. Only the `Repository` adapter and the shell
change. `apps/desktop/electron/` replaces what would have been `src-tauri/`.

**Costs accepted:**

- Bundle size ~180 MB instead of ~10 MB, and higher memory use. Irrelevant for personal desktop use.
- WASM SQLite is slower than native SQLite. Also irrelevant at this data scale — a garden has tens
  of beds and thousands of log rows, not millions.
- Electron carries a larger security surface. Mitigated by the app being local-only with no remote
  content: `contextIsolation` on, `nodeIntegration` off, and a narrow preload IPC surface.

**Mobile is unaffected.** Expo EAS Build compiles in the cloud, so iOS and Android builds need no
local Xcode or Android Studio, and `eas submit` uploads to App Store Connect from Windows. The
locked-down laptop does not block the mobile path.

**Revisit if** the project moves to a machine with administrator rights and a C++ toolchain. Tauri
would still be the better shell, and because `packages/core` is platform-free, switching would mean
writing one new adapter — not a rewrite.
