# EPIC-10. Localization (UI + folder names)

**Status:** pending
**Depends on:** EPIC-01

## Goal

The UI is currently English. The project description requires Ukrainian month names in the folder structure.

## Subtasks

- [ ] Pick an i18n stack (`react-i18next` / `@lingui/core` / a small homegrown one)
- [ ] Pick a time library (per `CLAUDE.md`: `date-fns` / `dayjs` / `luxon`)
- [ ] Locales: `uk-UA`, `en-US`
- [ ] Folder-name formatter (a domain function, decoupled from UI i18n)
- [ ] Language toggle in `SettingsScreen`

## Open questions

1. **Default UI language:** detect from the OS, fixed UA, or fixed EN?
2. **Month names on disk** when the UI language changes:
   - always follow the UI (change the language and new files go into different folders),
   - fixed to UA (per the project requirements),
   - or a separate "folder language" toggle in settings?
3. **Bilingual fallback:** if a file landed in `February 2024` and the user later switches to UA — merge with `лютий 2024` (the localized Ukrainian equivalent the app would otherwise produce), or leave it alone?
4. **Time library:** any personal preference among date-fns / dayjs / luxon? (date-fns — modular, cheap on bundle size; dayjs — smallest; luxon — most complete on time-zone handling.)
