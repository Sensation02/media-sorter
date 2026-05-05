# EPIC-04. Reverse geocoding (offline)

**Status:** pending
**Depends on:** EPIC-01, EPIC-03

## Goal

GPS-координати → назва міста, без зовнішніх API (вимога з `CLAUDE.md`).

## Subtasks

- [ ] Discovery: dataset (cities500 / cities1000 / cities15000) + crate (`reverse_geocoder`, `rgeo`)
- [ ] Бенчмарк: розмір бінарника vs точність vs швидкість lookup
- [ ] Запис рішення у `docs/discoveries/`
- [ ] Сервіс `geo::reverse(GeoPoint) -> Option<Place>`
- [ ] Кеш в пам'яті на job (одна координата = один lookup)
- [ ] Юніт-тести: відома координата → відоме місто

## Open questions

1. **Точність vs розмір:** cities500 (~10 MB, ~200k міст) vs cities15000 (~2 MB, тільки великі)? Що важливіше — щоб маленькі населені пункти знаходились, чи компактний бінарник?
2. **Що писати у назві теки:** тільки місто (`Paris`), `Country/City` (`France/Paris`), чи `City, Country`?
3. **Радіус "те саме місце":** дві точки за 200 м — одна тека чи дві? (вирішується автоматично через nearest-neighbor lookup, але треба підтвердити)
4. **Якщо GPS немає:** окрема тека `Unknown location` чи без піддерева взагалі (тільки за датою)?
5. **Локалізація назв міст:** ASCII (`Lviv`) чи local (`Львів`)?
6. **Update dataset:** embed на момент білду, чи завантаження по запиту?
