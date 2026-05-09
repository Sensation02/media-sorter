# EPIC-04. Reverse geocoding (offline)

**Status:** ⚪ pending
**Depends on:** EPIC-01, EPIC-03

## Goal

GPS coordinates → city name, with no external API (a hard requirement from `CLAUDE.md`).

## Subtasks

- [ ] Discovery: dataset (cities500 / cities1000 / cities15000) + crate (`reverse_geocoder`, `rgeo`)
- [ ] Benchmark: binary size vs. accuracy vs. lookup speed
- [ ] Record the decision in `docs/discoveries/`
- [ ] Service `geo::reverse(GeoPoint) -> Option<Place>`
- [ ] In-memory per-job cache (one coordinate = one lookup)
- [ ] Unit tests: known coordinate → known city

## Open questions

1. **Accuracy vs. size:** cities500 (~10 MB, ~200k cities) vs. cities15000 (~2 MB, only large cities)? What matters more — finding small towns, or a compact binary?
2. **What to write in the folder name:** city only (`Paris`), `Country/City` (`France/Paris`), or `City, Country`?
3. **"Same place" radius:** two points 200 m apart — one folder or two? (Resolved automatically via nearest-neighbor lookup, but we should confirm.)
4. **If GPS is missing:** dedicated `Unknown location` folder, or no sub-tree at all (date only)?
5. **City name localization:** ASCII (`Lviv`) or local script (`Львів`)?
6. **Dataset updates:** embed at build time, or download on demand?
