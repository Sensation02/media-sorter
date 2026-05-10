# EPIC-04. Reverse geocoding (offline)

**Status:** 🟢 complete
**Branch:** `feat/epic-04-geo`
**Depends on:** EPIC-01, EPIC-03
**Last updated:** 2026-05-10

## Goal

Turn a `GeoPoint` (latitude, longitude) into a human-readable `Place { name, country }` using a fully offline dataset. The output is consumed by EPIC-05 (sort planner) to build the `<destination-root>/<Month Year>/<City, Country>/` folder hierarchy.

## Decisions

### Dataset — **cities500 (bundled)**

`reverse_geocoder` v4.1.1 ships the GeoNames cities500 export as `include_str!("../cities.csv")` — 144,564 entries, ~7.5 MB embedded in the binary. The user's stated priority was accuracy over installer size, so this beats cities15000 (~2 MB, only large cities) and cities1000 (~5 MB, mid-sized). Full rationale lives in [`docs/discoveries/geo-crate-choice.md`](../discoveries/geo-crate-choice.md).

### Crate — **`reverse_geocoder` + `rust_iso3166`**

`reverse_geocoder` 4.1.1 owns the kd-tree lookup; `rust_iso3166` 0.1.14 supplies the ISO-3166-1 alpha-2 → English short country-name mapping (`FR` → `France`, `US` → `United States of America`). `rgeo` and `genom` were rejected on activity / network-fetch grounds; `celes` was considered for the country mapping but its `long_name` field is the official state form (`The French Republic`) which reads awkwardly in folder paths. Full rationale in the discovery doc.

### Folder name format — **`City, Country` (single directory)**

`Paris, France`, `Lviv, Ukraine`, etc. Resolved Q2 from the original spec. We do **not** nest `Country/City` (extra hierarchy adds nothing for the user) and we do **not** emit `City` alone (collisions in cross-border libraries). When `rust_iso3166` cannot resolve the country code we fall back to `City` only — the planner renders `Paris` rather than `Paris, FR`.

### Files without GPS — **`Unknown location` (English fallback)**

Files with no `Metadata::geo` land in a dedicated `Unknown location/` subdirectory inside `<Month Year>/`. Resolved Q4. The label is intentionally an English fallback — locale-aware presentation is EPIC-10's job (per Constitution Article VIII). The `geo::reverse` service does **not** emit this string — it returns `None`, and the planner is responsible for choosing the placeholder.

### Locale handling — **lookup returns ASCII; locale wraps later**

`Place::name` always carries the GeoNames ASCII spelling (`Lviv`, not `Львів`). The bundled dataset has no alternate-script names, and shipping the full `alternateNamesV2` dump (hundreds of MB) is out of scope for v1. Resolved Q5: the user's preference is "follow the app locale", which we honour at the presentation layer in EPIC-10 — the geo service stays pure.

### "Same place" radius — **delegated to the kd-tree**

Two photos taken 200 m apart resolve to the same nearest GeoNames record because cities500 has a coarse density. Resolved Q3 trivially: no extra clustering layer needed. The nearest-neighbor lookup handles this in one step.

### Per-job in-memory cache — **rounded coordinate key**

Reverse-lookup results are cached for the lifetime of one sort job. Cache key is the GeoPoint rounded to 3 decimal places (~111 m), so a burst of photos taken at the same spot does the kd-tree walk once. The cache is intentionally per-job: a long-running app should not retain GPS coordinates between sessions in process memory longer than necessary (Constitution Article II — privacy by default).

### Initialization — **lazy `OnceLock` at process scope**

The `ReverseGeocoder` is built lazily on the first lookup via `std::sync::OnceLock`, then shared by reference across the process. Cold-start cost (~80–200 ms parsing 144k CSV rows plus building the kd-tree) is paid once. The first sort job after launch sees a small one-time delay; subsequent jobs see microsecond per-lookup latency.

### Out-of-range / invalid coordinates — **return `None`**

`(lat, lon)` outside `[-90, 90] × [-180, 180]` or non-finite (`NaN`, `±Inf`) returns `None` from `geo::reverse`. The kd-tree itself does not crash on garbage input but returns nonsense, so we guard at the boundary. EPIC-03 already filters most of these in `metadata::extract`; the guard here is defense in depth.

## Scope

- `src-tauri/src/geo/` (new feature module):
  - `mod.rs` — barrel
  - `service.rs` — `reverse(point) -> Option<Place>`, `GeoCache::new()`, `cache.lookup(point)`
  - `repository.rs` — lazy `ReverseGeocoder` initialization behind `OnceLock`
- No `command.rs` / `dto.rs` — EPIC-04 is internal-only. Consumer is the EPIC-05 planner.
- `Cargo.toml` adds `reverse_geocoder` 4.1.1 and `rust_iso3166` 0.1.14.

## IPC contract

(none — internal service)

## Subtasks

- [x] Discovery: dataset (cities500) + crate (`reverse_geocoder`)
- [x] Pick country-name source (`rust_iso3166`)
- [x] Record decision in `docs/discoveries/geo-crate-choice.md`
- [x] Lock open questions in this file
- [x] Add `reverse_geocoder` and `rust_iso3166` to `Cargo.toml`
- [x] Service `geo::reverse(GeoPoint) -> Option<Place>`
- [x] Per-job in-memory cache (`GeoCache`)
- [x] Unit tests: known coordinates, out-of-range guards, country fallback, cache hit
- ~~Benchmark binary-size impact~~ — decided up front (cities500 ≈ +7.5 MB), no separate benchmark needed

## Resolved questions

1. **Accuracy vs. size** → cities500. Maximum accuracy, ~7.5 MB embedded.
2. **Folder name** → `City, Country`. Single directory.
3. **"Same place" radius** → delegated to kd-tree nearest-neighbor (cities500 density resolves this).
4. **No-GPS files** → `Unknown location/` subfolder; placeholder owned by the planner.
5. **City localization** → ASCII in v1; locale-aware presentation deferred to EPIC-10.
6. **Dataset updates** → frozen at the version embedded by `reverse_geocoder`; refreshed on `cargo update`.

## Out of scope

- Country-name localization (EPIC-10 — i18n).
- City-name localization (EPIC-10).
- A Tauri command for ad-hoc geocoding (planner consumes the service directly).
- Custom on-disk dataset override (escape hatch via `ReverseGeocoder::from_path` documented in discovery; not wired up).
- Postal address / street resolution (cities500 is city-level only).

## References

- Constitution articles touched: II (offline / privacy), III (simplicity), V (type safety).
- Related specs: [EPIC-01](epic-01-foundation.md) (`Place`, `GeoPoint` domain types), [EPIC-03](epic-03-metadata.md) (`Metadata::geo` source), EPIC-05 (planner consumer), EPIC-10 (i18n consumer).
- Discovery: [`docs/discoveries/geo-crate-choice.md`](../discoveries/geo-crate-choice.md).
