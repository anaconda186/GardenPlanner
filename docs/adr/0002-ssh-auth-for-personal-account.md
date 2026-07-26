# ADR 0002 — SSH with a dedicated key for GitHub auth, not the GitHub CLI

- **Date:** 2026-07-25
- **Status:** Accepted

## Context

This repository belongs to the `anaconda186` GitHub account, but the workstation it is developed on
has a **different** account configured as the global git identity, with Git Credential Manager set
as the credential helper in system-level git config.

Two failure modes had to be avoided:

1. A plain `git push` authenticates as the globally configured account and fails with 403 — GCM has
   no notion of which account a given repository belongs to unless told.
2. Commits carry the wrong author email into this repository's permanent, public history.

The original plan used the GitHub CLI to manage this. **`gh` is not available in this environment**
and cannot be installed, so it plays no part in the workflow.

## Decision

Use **SSH with a dedicated key and a host alias**.

`ssh` and `ssh-keygen` ship with Windows at `C:\WINDOWS\System32\OpenSSH\`, so this needs no
install and no administrator rights. Connectivity to both `github.com:22` and the
`ssh.github.com:443` fallback was verified.

```
# ~/.ssh/config
Host github-personal
    HostName ssh.github.com     # port 443 survives firewalls that block 22
    Port 443
    User git
    IdentityFile ~/.ssh/id_ed25519_anaconda186
    IdentitiesOnly yes          # only this key is ever offered
```

Remote: `git@github-personal:anaconda186/GardenPlanner.git`

Repo-local identity, leaving the machine's global git identity untouched:

```
git config --local user.name  "anaconda186"
git config --local user.email "82427768+anaconda186@users.noreply.github.com"
```

`IdentitiesOnly yes` is the load-bearing setting: without it, `ssh` offers every key in the agent,
so an unrelated key could authenticate this repository by accident.

The key is registered as a **deploy key with write access** on this repository rather than as an
account-level key, which scopes it to this repository alone. (Confirmed by the SSH greeting:
`Hi anaconda186/GardenPlanner!` rather than `Hi anaconda186!`.) Commit attribution is unaffected —
it derives from the commit author email, not from the key used to push.

## Alternatives rejected

- **Personal access token via Git Credential Manager.** Works without an install, but tokens expire
  and need rotating, and it depends on GCM's per-account keying behaving correctly.
- **Browser OAuth through the existing GCM.** Simplest, but the browser is signed into a different
  GitHub account, making it easy to authorize the wrong identity — the exact failure this ADR exists
  to prevent.
- **`gh auth setup-git`.** Unavailable, and would have been rejected anyway: it writes a *global*
  `credential.https://github.com.helper`, which would hijack authentication for every other
  repository on the machine.

## Consequences

- No token expiry and no credential prompts; nothing is stored in Windows Credential Manager.
- The globally configured git account is structurally incapable of reaching this repository.
- **Repository settings must be changed by hand in a browser** — visibility, rulesets, secret
  scanning, and CodeQL enablement. No CLI is available for them. Do not attempt these from a tool
  call; give the user a click-list instead.
- **Pull requests must be opened and merged in the browser** for the same reason. `git push` prints
  a one-click PR creation link, which keeps the friction low.
- The key is specific to this machine. A new machine needs a new key, which is the desired property —
  keys should not be copied around.
