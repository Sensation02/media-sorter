# EPIC-10. Localization (UI + folder names)

**Status:** pending
**Depends on:** EPIC-01

## Goal

UI зараз англійською. Опис проєкту вимагає українські назви місяців у структурі тек.

## Subtasks

- [ ] Обрати i18n-стек (`react-i18next` / `@lingui/core` / власний простий)
- [ ] Обрати time-бібліотеку (з `CLAUDE.md`: `date-fns` / `dayjs` / `luxon`)
- [ ] Локалі: `uk-UA`, `en-US`
- [ ] Folder-name formatter (домен-функція, не зав'язана на UI-i18n)
- [ ] Toggle мови у `SettingsScreen`

## Open questions

1. **UI-мова за замовчуванням:** detect від OS, фіксована (UA), чи фіксована (EN)?
2. **Назви місяців на диску** при зміні UI-мови:
   - завжди слідують за UI (зміниш мову — нові файли йдуть в інші теки),
   - фіксовані на UA (як у вимогах),
   - окремий toggle "folder language" в settings?
3. **Bilingual fallback:** якщо файл потрапив у `February 2024`, а потім користувач переключив на UA — мерджити з `лютий 2024`, чи лишати як є?
4. **Time library:** є особисті вподобання серед date-fns / dayjs / luxon? (date-fns — модульний, дешевий по bundle; dayjs — найменший; luxon — найповніший по TZ).
