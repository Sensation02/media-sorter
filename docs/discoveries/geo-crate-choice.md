# Discovery: offline reverse geocoding crate

**Date:** 2026-05-10
**Author:** Claude (paired with project owner)
**Decision:** `reverse_geocoder` 4.1.1 (cities500 bundled) + `rust_iso3166` 0.1.14 (ISO-3166-1 alpha-2 → English short country name).

## Question

Which Rust crate should we use for offline GPS → city reverse lookup in `geo::reverse(GeoPoint) -> Option<Place>` (EPIC-04)? Constitution Article II forbids any external network calls for user metadata, so the dataset must be embedded.

## Constraints

1. **Offline only.** No network calls at any point — see `CLAUDE.md` and Constitution Article II.
2. **Dataset:** cities500 (resolved in EPIC-04 clarifications — maximum accuracy, ~10 MB acceptable).
3. **Folder name format:** `City, Country` in a single directory (resolved).
4. **Locale handling:** name follows the app locale at the presentation layer; the lookup itself returns ASCII (English-language GeoNames `name`). Localization is a presentation concern owned by EPIC-10.
5. **Sync API tolerable.** Initialization is one-shot at app start; per-lookup calls are microsecond-scale once the index is loaded.
6. **MIT or Apache-2.0** licensing only — no copyleft.

## Candidates

### `reverse_geocoder` 4.1.1

- **Pros:**
  - Bundles cities500 directly (`include_str!("../cities.csv")`), 144,564 entries, ~7.5 MB embedded as a single string. Each release pulls a fresh GeoNames cities500 dump.
  - K-d tree (via `kiddo`) on the unit sphere for nearest-neighbor lookup — O(log n).
  - Tiny API surface: `ReverseGeocoder::new()` plus `geocoder.search((lat, lon)) -> SearchResult { distance, record: &Record }`.
  - `Record { lat, lon, name, admin1, admin2, cc }` exposes everything we need.
  - License: MIT OR Apache-2.0.
  - Active maintenance (last push 2026-04, 139 GitHub stars, monthly downloads on crates.io).
- **Cons:**
  - Bundled name list is ASCII-only — `Lviv`, not `Львів`. Localization requires either a curated mapping or merging the GeoNames `alternateNamesV2` dump (~hundreds of MB). We accept ASCII for v1 and defer Cyrillic / other-script names to EPIC-10.
  - Stores only ISO-3166-1 alpha-2 country code (`UA`, `FR`). To produce `Paris, France` we need a code → English name mapping (handled by `rust_iso3166`, see below).
  - First call to `ReverseGeocoder::new()` parses 144k CSV rows and builds the k-d tree — measurable cold-start cost (~80–200 ms on a modern laptop). We mitigate this by initializing once at process startup behind a `OnceLock` and never re-loading.
  - Synchronous API. Acceptable: any `#[tauri::command]` wrapping it must hop through `tokio::task::spawn_blocking`, but EPIC-04 ships an internal service called from the planner (EPIC-05), which is itself blocking work behind one `spawn_blocking`. No additional concurrency overhead here.

### `rgeo` 0.3.0

- **Pros:**
  - Same shape: offline reverse geocoder over the GeoNames database, MIT/Apache.
- **Cons:**
  - Far less active than `reverse_geocoder` (last release stale, smaller community, fewer dependents).
  - No documented dataset selection knob; the bundled dataset is older.
  - The k-d tree is hand-rolled rather than delegated to a maintained crate (`kiddo`).

### `genom` 1.1.1

- **Pros:**
  - Provides a builder for downloading and zipping a GeoNames dataset on demand.
- **Cons:**
  - Network-fetch-by-default contradicts Constitution Article II; the `no-build-database` feature exists but the workflow assumes downloading.
  - Younger crate, smaller install base.
  - No clear cities500-bundled out-of-the-box mode.

## Decision

**`reverse_geocoder` 4.1.1** for the lookup, **`rust_iso3166` 0.1.14** for the country-code → English country-name mapping. Two small dependencies, no network, no build-time tooling.

The flow inside `geo::reverse`:

1. Validate input (`lat ∈ [-90, 90]`, `lon ∈ [-180, 180]`, both finite). Reject `NaN` / `±Infinity` / out-of-range with `None`. The kd-tree itself does not crash on garbage input (we verified against the upstream test), but it returns nonsense, so we guard.
2. Look up nearest city with `ReverseGeocoder::search`.
3. Resolve the country code via `rust_iso3166::from_alpha2`. If the code is unknown, fall through to `country = None`; the upstream sorter renders `Paris` rather than `Paris, FR`.
4. Build `Place { name, country }`.

`Place::name` always stays in the source-data language (ASCII / English). EPIC-10 owns the locale-aware presentation layer (UA → `Львів`, etc.) and will introduce a separate mapping or i18n table without touching the geo service.

## Trade-offs accepted deliberately

1. **Binary size grows by ~7.5 MB** (the embedded cities.csv) plus the small `rust_iso3166` static tables. Acceptable for a desktop installer; a future "compact" build profile could fall back to `cities15000` if size becomes a sore point. Until that day comes, the cities500 dataset hits the user's stated priority (accuracy > size).
2. **ASCII-only city names in v1.** A user in UA locale will see `Lviv, Ukraine` rather than `Львів, Україна` until EPIC-10 lands its alternate-name table. Documented limitation, not a bug.
3. **Country names are English only** (via `rust_iso3166::CountryCode::name`, the ISO short form). Same reasoning as above — locale-aware country names are EPIC-10's job.
4. **Dataset is frozen at the version embedded by `reverse_geocoder`.** When the upstream crate cuts a new release with a refreshed cities500 dump, we get the update on `cargo update`. We do not chase upstream GeoNames manually.
5. **No per-JPEG accuracy benchmarking against ground truth.** The cities500 nearest-neighbor answer is, by definition, "the largest known place within ~tens of kilometres". This matches user expectations for a folder structure (`Paris, France` for any Parisian arrondissement) and the spec's resolved question 3 (200 m apart → one folder).

## Alternatives revisited if

- The 7.5 MB binary cost shows up in installer size complaints — switch the data layer to a downloadable / on-disk cache and load via `ReverseGeocoder::from_path`.
- Localization in EPIC-10 demands per-record local-script names — augment `Place` with a `local_name: Option<String>` field, source from a curated alternateNames extract, keep `reverse_geocoder` as the index.
- The maintainer of `reverse_geocoder` archives the project — vendor-fork the ~200-line `src/reverse_geocoder.rs` into our tree (it's tiny) and pin a private cities.csv. Documented escape hatch.

## References

- crates.io: <https://crates.io/crates/reverse_geocoder/4.1.1>
- GitHub: <https://github.com/gx0r/rrgeo>
- rust_iso3166: <https://crates.io/crates/rust_iso3166/0.1.14>
- GeoNames cities500: <https://download.geonames.org/export/dump/>
- Licenses: `reverse_geocoder` MIT OR Apache-2.0; `rust_iso3166` Apache-2.0.
