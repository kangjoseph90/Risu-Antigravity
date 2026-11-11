# Risu-Antigravity Agent Guidelines

These instructions apply to agents working in this repository. Treat new model support as separate stages: **discovery → access checks → implementation → live validation → release**. Finding a model ID does not establish that generation, streaming, or quota reporting works.

## Before starting

- Check `git status`, the current version, and recent commits, tags, and releases. Preserve existing uncommitted changes and commit only your own changes.
- Local model discovery and monitoring tools may be untracked. Do not stage `scripts/`, authentication configuration, or local test tools indiscriminately.
- Authentication, webhooks, and snapshots under `.local/antigravity/` are local data. Never expose tokens, webhook URLs, OAuth callbacks, or credential backups in chat, logs, commits, or releases. Record status codes and metadata with secrets removed.

## Discovering a new model

1. Use the available account to check its project and subscription tier through `loadCodeAssist`, then query `fetchAvailableModels`. Both use the `.../v1internal:<method>` endpoint format.
2. If the local discovery tool exists, read `node --import tsx scripts/antigravity-models.mjs --help` first. Example: `node --import tsx scripts/antigravity-models.mjs list --ide-version <verified-version>`.
3. Record the raw catalog JSON, timestamp, account tier, client version, new IDs, and display names. Inspect the raw response for secrets before retaining it locally.
4. Absence from the catalog does not prove that a model is unreleased or retired. Pro/Ultra access, gradual rollout, IDE versus CLI clients, and request headers can affect visibility and availability.
5. If necessary, inspect official Antigravity CLI/app distribution files or bundles for model IDs, display names, and reasoning mappings. Record the source URL, version, file hash, and location of the evidence. Do not establish IDs from guessed names or community posts alone.
6. Hand any additional account login to the user. Do not claim to have tested a subscription tier you cannot access.

### Check client headers too

- Generation client selection lives in `src/antigravity/client.ts`. Do not change headers for every existing model to accommodate one new model.
- When comparing IDE versions, keep the client's `User-Agent`, `X-Client-Version`, and `loadCodeAssist.metadata.ide_version` consistent. Do not arbitrarily mix IDE and CLI header formats.
- Historically, Argon returned 404 through the old IDE client but responded through a CLI client. Verify new models with live requests instead of treating those historical version numbers as universal defaults.
- For 401, check token refresh; for 403, permissions and access conditions; for 404, the ID, client, and account visibility; for 429, quota. Distinguish a failing baseline request from a parameter compatibility failure.

## Implementation map and architecture

| Concern | File / rule |
| --- | --- |
| Model IDs, labels, reasoning, current/older classification | `src/model/list.ts` |
| Client headers for generation | `src/antigravity/client.ts` |
| Saved settings and legacy ID migration | `src/model/config.ts`, `src/model/index.ts` |
| Parameter merging and serialization | `src/chat/config.ts`, `src/chat/index.ts` |
| Model selection and parameter UI | `src/ui/modal/ModelSettings.svelte` |
| Account/quota requests and display | `src/antigravity/index.ts`, `src/ui/modal/QuotaView.svelte` |
| Fixed providers for each Risu request purpose | `src/chat/providers.ts` |

- Keep reasoning suffixes out of internal model IDs. Map actual request IDs explicitly in `reasoningIds`; never infer suffix conventions. Models without selectable reasoning use `requestId`.
- Preserve existing IDs, aliases, and saved reasoning levels through migration tests. Do not replace an unknown saved ID with another model.
- Use `isLatest` for the default list. Move older models or models scheduled for retirement to older models while preserving saved selections. Recheck classification during each update.
- API v3 registers fixed Chat, Memory, Emotion, Translate, and Other providers, each using its tab's settings. Add new models to the tabs' model list. Do not return to registering a separate Risu provider for every model.
- The v3 migration was tested against RisuAI `v2026.10.295`; use that as historical evidence, not a permanent latest-version assumption. Use asynchronous v3 APIs and `nativeFetch` from the plugin's iframe. Keep quick backups in plugin-scoped arguments: `pluginStorage` was shared across plugins in that release.
- Do not infer request purpose from v3 `args.mode`; Risu currently overwrites it with `v3`. Verify catalog update/removal APIs before attempting updates through re-registration, which can leave duplicate metadata.

## Parameter compatibility

- Establish a successful baseline first. Test each UI parameter individually, then valid combinations through normal and streaming requests. Include a regression check for an existing model.
- If even valid values fail because a model does not support a field, **hide it in that model's UI and exclude it from requests**. Use the same capability information for UI and serialization.
- Filter **after** merging saved settings with Risu parameters. Values from old backups and values supplied by the host must also be blocked. Preserve fields for models that support them.
- Flash 3.8 and Argon currently use `supportsPenalties: false` after confirmed HTTP 400 responses for Frequency/Presence Penalty. Verify support independently for each new model.
- Distinguish `0` from an unset value. Check numeric ranges, fractions, and integer limits. Separate invalid input from model incompatibility.
- HTTP 200 does not prove that a setting took effect. Acceptance of tool options does not prove that a tool ran. Text-only requests cannot establish the effect of media resolution.

## Generation, streaming, and quota validation

- Request a short, neutral marker and check the actual answer. Distinguish HTTP errors, empty responses, and thoughts without a final answer.
- Verify actual SSE requests, received chunks, plugin stream parsing, and output in Risu. Sending `use_stream: true` alone is not a successful streaming test.
- Direct Node requests, local test transports, Risu's default web proxy, and desktop transport cover different environments. State which path was tested; do not extend success claims to other paths.
- For live Risu tests, identify the latest release tag and verify installation, selection of fixed providers, settings UI and sidebar icon, generation, and persistence after reload.
- Preserve current settings before updating a dev instance. Check whether manual plugin updates reset arguments or reloads duplicate catalog entries. Never dump credential backups or complete host debug logs.
- Determine quota behavior from the actual `retrieveUserQuotaSummary` groups, buckets, descriptions, and account tier. Do not infer a shared Gemini quota from a model-name prefix.
- Compare remaining quota and reset times before and after requests when needed. Rounding or delayed updates can hide usage; no visible change does not prove zero consumption. Do not enable credit overage for testing without user authorization.
- If access restrictions prevent generation tests, record ID/catalog confirmation separately from live generation. When releasing, state the unverified scope briefly and accurately in the README and release notes.

## Checks and release

```sh
npm test
./node_modules/.bin/tsc --noEmit
npm run build
```

- Add relevant regressions for IDs, reasoning mappings, saved settings, filtering of unsupported fields from saved/host values, and visibility of older models.
- Check `//@name`, `//@api 3.0`, and `//@version` at the start of `dist/risu-antigravity.js`. Release artifacts must be reproducible from committed source. Do not distribute a build containing changes intended only for local use.
- Keep `package.json`, `package-lock.json`, and `src/plugin.ts` aligned when changing versions. Keep the README concise and follow the existing release note format. Use the version and release scope requested by the user.
- Preserve API 2.1 on `legacy-api-2.1` and in the existing v1.5.2 tag/release. Do not overwrite legacy release assets with v3 builds.

## GitHub and commit identity

- This personal repository uses **`kangjoseph90`**. Both author and committer must be **`Joseph Kang <kangjoseph90@gmail.com>`**. Do not use the company account.
- Verify local Git identity before committing and the authenticated GitHub login before remote writes. Do not assume the machine's active account is the personal account.
- Pass the personal token only through the process's `GH_TOKEN`, and make Git push use that authentication through its credential helper. Never print or persist the token. Do not change the global active account with `gh auth switch`.
- In completion reports, distinguish sources, account tier, client version, test coverage, failures/unverified cases, and commit/release results.
