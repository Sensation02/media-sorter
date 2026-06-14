# EPIC-16. Distribution website (marketing + downloads)

**Status:** ⚪ pending — spec draft, awaiting owner approval
**Branch:** `feat/epic-16-distribution-website-spec` (spec), then implementation in the separate `media-sorter-web` repo
**Depends on:** EPIC-15 (distribution pipeline — provides the GitHub Releases channel this site links to; read-only dependency, EPIC-15 is not modified)
**Last updated:** 2026-06-10

## Goal

Give people a public, branded place to learn about media-sorter and download
the right installer for their OS — a fast, bilingual (EN/UA) marketing landing
site plus a changelog, hosted for free with no vendor lock-in, that reuses the
desktop app's visual identity and serves installers from the existing GitHub
Releases channel without surfacing the source repository to visitors.

## Clarifications

### Assumptions

- The website lives in a **separate, public repository** (`media-sorter-web`),
  not in the app repo. This matches the EPIC-15 boundary (its Q9: "landing site
  → EPIC-16, separate repo, separate stack").
- The app repo (`Sensation02/media-sorter`) **is and remains public**
  (verified 2026-06-10: `gh repo view … --json visibility` → `PUBLIC`), so its
  GitHub Release assets are anonymously downloadable. The owner's requirement is
  **branding** — the website UI must not surface the `github.com/Sensation02/…`
  URL — not access control.
- Installers continue to be produced and published by EPIC-15's `release.yml`
  to GitHub Releases. EPIC-16 **consumes** that channel and never edits it.
- The desktop app's auto-updater (`latest.json` on GitHub Releases) is owned by
  EPIC-15 and is out of scope here.
- The owner's hard priorities for technology choice: **never be forced to pay**
  for hosting, and **never be locked to a vendor**. These outrank convenience.
- Monetization (selling the app) is **possible but undecided**; the spec only
  documents readiness, it builds nothing for it.
- The owner will provide three.js / animation inspiration later; animated
  visuals are a progressive enhancement, not a launch blocker.

### Resolved questions

| #   | Question                                                                                  | Decision                                                                                                                                                                                                                                                                                  | Resolved at |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Q1  | One repo (mono) or a separate repo?                                                        | **Separate public repo** `media-sorter-web`. Independent deploy, keeps the app repo focused (Art. IV), loose coupling (the site reads releases, shares no code).                                                                                                                            | 2026-06-10  |
| Q2  | Frontend framework?                                                                        | **Astro (`output: 'static'`) + React islands.** Host-agnostic static build (zero frontend lock-in), first-class EN/UA i18n, three.js in a `client:visible` island, reuses shadcn/Tailwind v4 + the app's OKLCH tokens 1:1. Next.js static export loses both i18n and API routes; rejected. | 2026-06-10  |
| Q3  | Styling — shadcn+Tailwind or custom SCSS?                                                  | **shadcn/ui (new-york, neutral) + Tailwind v4**, reusing the token block copied from the app's `src/index.css`. SCSS would re-derive the design system from scratch (DRY violation). The app already ships exactly this stack.                                                              | 2026-06-10  |
| Q4  | Is a backend / owner admin needed?                                                         | **No backend (T0).** Empirically, indie/OSS desktop apps do not build a backend to serve downloads (11/18 surveyed have none; backends that exist serve product features like accounts/sync). media-sorter is free/offline/no-accounts — nothing to bolt onto.                              | 2026-06-10  |
| Q5  | Where are installers hosted?                                                              | **Public GitHub Releases** — the free, unmetered primitive (no bandwidth/size billing, no card on file). Directly answers "never forced to pay." Same single binary source the EPIC-15 updater already uses (DRY).                                                                          | 2026-06-10  |
| Q6  | How are branded, version-proof download links produced?                                   | **One stateless edge resolver** `/download/<os>` that queries the GitHub Releases API server-side (edge-cached), matches the asset by OS+arch, and 302-redirects. A static `_redirects` rule cannot work — Tauri bundle filenames are versioned (`media-sorter_0.2.1_x64.dmg`).             | 2026-06-10  |
| Q7  | Hosting provider?                                                                          | **Cloudflare Pages** (static assets + one Pages Function for Q6). GitHub Pages can't run the resolver; Netlify/Vercel have tightened free tiers / Vercel Hobby is non-commercial. CF static is unlimited + free + no commercial clause, and CF has expanded (not contracted) free tiers.    | 2026-06-10  |
| Q8  | Branding strictness — must `github.com` be invisible everywhere?                          | **Cosmetic.** The button/href shows the branded domain; the final CDN hop (`objects.githubusercontent.com`) may still appear in a network inspector. Fully hiding it would need an R2 mirror + sync job — overkill since the repo is already public.                                        | 2026-06-10  |
| Q9  | Site scope for v1?                                                                         | **Full marketing landing** (hero, features, real screenshots, downloads, install instructions, FAQ, footer) **+ `/changelog`**, bilingual EN/UA.                                                                                                                                           | 2026-06-10  |
| Q10 | Languages?                                                                                 | **EN + UA from v1**, via Astro i18n routing (`/en`, `/uk`), mirroring the app's existing UA/EN content.                                                                                                                                                                                    | 2026-06-10  |
| Q11 | If the app is sold later, does it change the site?                                        | **No.** Freemium-readiness only: a static Pricing/Buy page links to a hosted Merchant-of-Record checkout; license validation is an **app-side** call behind the resolver seam, addable later with zero site rework. Nothing built now.                                                      | 2026-06-10  |
| Q12 | Website analytics in v1?                                                                   | **Deferred (YAGNI).** Cookieless analytics (Plausible/Umami) is a one-script-tag addition later, behind the seam. No analytics ship in v1 unless the owner asks.                                                                                                                            | 2026-06-10  |

### Open questions

| #   | Question                                                                 | Proposed answer                                                                                                  | Status                          |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Q13 | Exact domain name?                                                        | Owner's choice (e.g. `media-sorter.app`). Host-agnostic; affects only DNS + the branded `/download/*` base path. | open — owner decides            |
| Q14 | Does the GitHub Releases API rate limit (60/hr/IP unauth) bite the edge resolver from Cloudflare's shared egress IPs? | Mitigate with an edge cache (`caches.default`, TTL ~10 min). Releases are infrequent; a short cache stays fresh. Verify under load in implementation. | open — verify in implementation |
| Q15 | three.js hero — in v1 or a fast-follow?                                   | Progressive-enhancement island, gated on the owner's inspiration screenshots. Site must look complete without it. | open — pending owner assets     |

### Edge cases

> These become the resolver's test cases (the one piece of real logic).

- No published release yet, or `assets[]` empty → resolver falls back to a branded "all downloads" page; buttons degrade to a single "Releases" CTA.
- GitHub API returns 403/429 (rate-limited) → serve last cached result; if none, fall back to the branded downloads page.
- A requested OS/arch asset is missing from the latest release → that button is disabled with a tooltip + fallback link; the page still renders.
- macOS Apple Silicon vs Intel **cannot be reliably detected in the browser** → always offer both `aarch64` and `x64` `.dmg`, Apple Silicon as the primary.
- Visitor on an unsupported platform (mobile, ChromeOS) → no auto-highlight; show all desktop options.
- Missing i18n translation key → fall back to the default locale (EN), never render an empty string.

### Constraints

- **$0 and no card on file** for the v1 hosting path (Art. III; owner priority). Domain (~$10–15/yr) is the only acknowledged recurring cost and is host-agnostic.
- **Host-agnostic static build** — `output: 'static'`, no SSR adapter. The only host-specific artifact is the single edge resolver, written portably (see Decisions).
- **Never surface the source repo URL** in the website UI (Q8 branding).
- **Do not edit EPIC-15 infra** (`release.yml`, `tauri.conf.json`, `latest.json`) — Art. IV (scope) and Art. VI (reversibility); EPIC-15 is shipped/approved (Art. X).
- **Privacy on the website surface** (Art. II, adapted): if analytics is ever added it must be cookieless and PII-free; no in-app telemetry is in scope here.

## Scope

- New public repo `media-sorter-web`: Astro + React islands, Tailwind v4, shadcn/ui.
- Design tokens: copy the OKLCH token block + font stack (Inter Tight, JetBrains Mono) from the app's `src/index.css`; light/dark via `prefers-color-scheme` (+ optional toggle island).
- Bilingual routing EN/UA (`/en`, `/uk`) via Astro i18n; shared string catalogs.
- Landing sections: hero (name, value line, OS-detecting primary CTA, optional three.js island), features, real screenshots, downloads (per-OS, all platforms), install instructions (sourced from the app's `docs/install-*.md`), FAQ (unsigned/Gatekeeper/SmartScreen, privacy, how updates work), footer.
- `/changelog` page (content mirrored from the app's `CHANGELOG.md`).
- **Download resolver** (see contract below): one Cloudflare Pages Function `/download/<os>` + a client `getDownloadUrl(os)`/asset-matching module (the testable core).
- Cloudflare Pages project: production deploy on push to the production branch, PR preview URLs; custom domain (Q13).
- CI for the site repo: `pnpm lint` + `pnpm build` (+ optional Lighthouse budget) on PRs.

## Download resolver contract

> This is the EPIC-16 equivalent of an IPC contract — the one interface with real logic. It is the portability seam: a plain `Request → Response` handler with no proprietary bindings, hostable on Cloudflare Pages Functions, Netlify Functions, or self-host unchanged.

| Route               | Input             | Behavior                                                                                                                   | Output                          |
| ------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `GET /download/:os` | `os` ∈ `mac \| windows \| linux` (+ optional `?arch=`) | Look up the latest release (GitHub Releases API, edge-cached ~10 min), match the asset by extension + arch substring, then redirect. | `302` → asset URL, or `404`/fallback page on miss |

Asset-matching rules (pure, unit-tested):

- **macOS** → `.dmg`; arch by `aarch64` (Apple Silicon, primary) / `x64` (Intel). Offer both.
- **Windows** → `.msi` (x64).
- **Linux** → `.AppImage` (primary), `.deb`, `.rpm`.
- Match by **extension + arch substring**, never by exact filename → resilient to version changes.
- On no match / API failure → branded fallback (downloads page), never a broken link.

## Decisions

### Astro static + React islands, not Next.js or a Vite SPA

A marketing+downloads site is content-first, SEO/perf-sensitive, with little interactivity. Astro's `output: 'static'` produces a host-agnostic `dist/` (zero frontend lock-in), ships ~0 JS by default, and confines interactivity (three.js hero, OS detection, theme toggle) to React islands that reuse the app's shadcn components and tokens. Next.js static export loses both i18n and API routes and needs a Cloudflare adapter; a Vite SPA fights SEO. Astro is the best-fit-for-the-task KISS choice.

### Installers stay on GitHub Releases; the site never hosts binaries

GitHub Releases is unmetered and free with no card on file, which directly satisfies the owner's "never forced to pay." It is also the **single binary source of truth** the EPIC-15 updater already consumes — hosting binaries elsewhere (R2, a mirror) would create a second store to keep in sync for no benefit while the repo is public (DRY, Art. III).

### One stateless edge resolver for branded, version-proof downloads

Tauri bundle filenames are versioned, so a static `_redirects` rule (which needs an exact target name) cannot point at "the latest dmg," and build-time link generation would require a release-triggered website rebuild (rejected). A single edge function that queries the Releases API at request time and 302-redirects keeps links branded, version-proof, and fresh with no rebuild. It is written as a portable `Request → Response` handler — this **is** the future-proofing seam, not a stateful backend.

### No backend now; future auth/admin/paid-tier addable behind the seam

The only future feature that needs an owned endpoint is a paid tier (low probability for a free utility), and even then the website stays static: checkout is a hosted Merchant-of-Record page and license validation is an **app-side** call. Everything else (analytics, newsletter, crash reporting) is a third-party embed. So v1 is T0, and the seam (one configurable base URL; `output: 'static'` with per-route `prerender = false` available later; portable handler signature) keeps every escalation a no-rework addition.

### Cloudflare Pages as host — a deliberate, reversible choice

The site is hosted on Cloudflare — the exact vendor the owner is wary of — for one reason: the branded resolver needs a function host, which GitHub Pages lacks, while Netlify/Vercel have a worse free-tier-tightening history (Vercel Hobby also forbids commercial use). This is low-risk and reversible: the static build deploys anywhere, the resolver is a portable handler, and migrating off Cloudflare is an afternoon, not a rewrite. CF static serving is unlimited/free with no commercial clause and CF has historically expanded its free tiers.

### Branding is cosmetic, not access control

Because the repo is public, hiding the GitHub URL is presentation, not security. The branded `/download/*` href satisfies the requirement at the UI layer; chasing a fully-branded final CDN URL (R2 mirror + sync) is unjustified cost. Documented so it is a conscious trade, not an oversight.

## Subtasks

> Implementation happens in the `media-sorter-web` repo and is gated on owner approval of this spec. This list is the v1 build order.

- [ ] Scaffold `media-sorter-web`: Astro + React + Tailwind v4 + shadcn/ui (new-york, neutral), pnpm.
- [ ] Port the OKLCH token block + font stack from the app's `src/index.css`; wire light/dark.
- [ ] Set up Astro i18n (EN/UA) routing + string catalogs.
- [ ] Build the download resolver: `getDownloadUrl`/asset-matching module + unit tests (edge cases above), then the `/download/<os>` Pages Function with edge caching + fallback.
- [ ] Landing sections: hero (+ OS-detect CTA), features, screenshots, downloads, install instructions, FAQ, footer.
- [ ] `/changelog` page from the app's `CHANGELOG.md`.
- [ ] Cloudflare Pages project + custom domain + PR preview deploys + site CI (lint/build).
- [ ] (Deferred-ready, not built) seam stubs for analytics / pricing-legal / license validation.
- [ ] New-repo `.claude/` bootstrap (Appendix A).

## Out of scope

- The desktop app's auto-updater and `latest.json` — owned by EPIC-15; not hosted or proxied here.
- Any edit to EPIC-15 infra (`release.yml`, `tauri.conf.json`).
- A stateful backend, owner admin UI, R2/D1/KV/Cloudflare Access, true server-side download counters.
- Building monetization (checkout, license keys, pricing logic) — only readiness is documented.
- Website analytics in v1 (deferred behind the seam).
- Code-signing / notarization — tracked as EPIC-17 / EPIC-18.
- Closed-source / private-repo distribution — only noted as a future branch the resolver seam would absorb (swap to a public mirror repo or R2); not built.

## Monetization-readiness (documentation only — nothing is built)

- **Pricing / legal pages** would be additional **static** Astro pages.
- **Checkout** would be an external **Merchant-of-Record** (Lemon Squeezy / Paddle / Polar) hosted page — no payment infra, no card handling, tax/VAT outsourced, revenue-linked fee only.
- **License validation** is an **app-side** concern (the desktop app calls the MoR License API or a tiny portable validation function behind the seam) — it does not change the static site.
- **Pay-to-download** or **closed source → private repo** would change only the download channel: the `getDownloadUrl` seam would resolve to a public mirror repo or an S3-compatible bucket (R2/B2). Documented as a future branch; not built.

## References

- Constitution articles touched: II (privacy, adapted to the website surface), III (KISS — no premature backend), IV (scope discipline), VI (reversibility), VII (docs ship with the work).
- Related specs: EPIC-15 (distribution pipeline — the GitHub Releases channel this site consumes; read-only). EPIC-17 / EPIC-18 (signing — promoted in priority if the app is monetized).
- External docs:
  - GitHub Releases — unmetered bandwidth/size: <https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases>
  - Astro static output (host-agnostic) + i18n routing: <https://docs.astro.build/>
  - Cloudflare Pages (static + Functions) limits: <https://developers.cloudflare.com/pages/platform/limits/>
  - Merchant-of-Record (Lemon Squeezy License API): <https://docs.lemonsqueezy.com/api/license-api>

---

## Appendix A — new-repo `.claude/` bootstrap (separate concern)

> Not part of the website's runtime scope. This is the tooling/governance bootstrap for the new `media-sorter-web` repo. Kept here for the owner's review in one place; it can graduate into the new repo's own docs once scaffolded. Standardize on **pnpm** (consistent with media-sorter).

**Borrow _patterns_ from handy-partners, adapt the _protocol_ from media-sorter, build content fresh.**

```
.claude/
├── CLAUDE.md                    # adapted: Astro/React islands + shadcn/Tailwind + CF Pages; Working Protocol; Code Rules; conventional commits + CHANGELOG-per-PR; bilingual EN/UA; privacy re-framed for the website surface (cookieless analytics, no PII) vs the desktop "no metadata leaves the machine"
├── settings.json                # hook registration (PreToolUse/PostToolUse)
├── settings.local.json          # personal permissions
├── agents/
│   ├── frontend-developer.md    # Astro + React islands + shadcn/Tailwind tokens + i18n + three.js; scope: src/
│   ├── backend-developer.md     # the one edge resolver / future serverless; portable Request→Response; escalation path to a real backend only on a real trigger
│   ├── reviewer.md              # review vs CLAUDE.md + anti-patterns (Astro hydration, token drift, i18n escapes)
│   ├── team-lead.md             # planning, Strategy A–D
│   ├── documentation-writer.md  # changelog, deploy runbooks, env docs
│   ├── pattern-guard.md         # scan staged diffs vs anti-patterns; no code
│   └── devops.md                # CF Pages deploy + GitHub Actions CI
├── hooks/                       # borrow HP's event model only: pre-edit (secrets leak-scan), pre-bash (pnpm-only, branch protect)
├── skills/                      # deploy-to-cloudflare, changelog-entry, pr-delivery, frontend-i18n
└── rules/                       # frontend-rules.md, backend-rules.md
```

**Skip (YAGNI for a static site):** the 6 handy-partners adversary agents, database-specialist, security-auditor (desktop/Tauri-specific), researcher/tester/refactoring-specialist (fold into reviewer; re-introduce only on a real escalation such as a paid-tier backend). No migrations, no RAG, no worktrees.
