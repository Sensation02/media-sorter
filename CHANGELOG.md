# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1](https://github.com/Sensation02/media-sorter/compare/media-sorter-v0.1.0...media-sorter-v0.1.1) (2026-06-09)


### Features

* **claude:** add tester, refactoring, security, docs agents ([60446bf](https://github.com/Sensation02/media-sorter/commit/60446bf541e489567049b3662971548c152ed6e6))
* **core:** add cross-platform volume_id helper in utils ([a54be65](https://github.com/Sensation02/media-sorter/commit/a54be65ee1d73d8f97d5ef22f33c8418100ad1a1))
* **core:** add per-root probe cache for estimate service ([1b79688](https://github.com/Sensation02/media-sorter/commit/1b796884f3ea0f5dc96509c2ec7147ad767b2cf9))
* **core:** add PlanEstimate, EstimateMode, EstimateConfidence to domain ([441d0a3](https://github.com/Sensation02/media-sorter/commit/441d0a303f0bcd54e8e6035d084108ec23ee6b87))
* **core:** add probe_bandwidth flag to SortSettings ([d484f20](https://github.com/Sensation02/media-sorter/commit/d484f202e0a39e64b13f0aa377082c58e62525a1))
* **core:** add sorting::estimate static pre-flight ETA service ([21ea199](https://github.com/Sensation02/media-sorter/commit/21ea1994de2b4711d904bded5d91e2d9c5ae5ae8))
* **core:** add utils::probe::bandwidth_probe with Drop guard cleanup ([d939bad](https://github.com/Sensation02/media-sorter/commit/d939bade303aa765adf1ff6928c3560e0113d228))
* **core:** localized month-name tables in i18n::months ([83b86c4](https://github.com/Sensation02/media-sorter/commit/83b86c4ac97d6e2c1d948ce66e03c0eaef760daa))
* **core:** thread settings.ui_language through preview_plan pipeline ([46311be](https://github.com/Sensation02/media-sorter/commit/46311be78c2559b39e52a358896aae2a288893ee))
* **core:** wire bandwidth probe into estimate service ([997c82d](https://github.com/Sensation02/media-sorter/commit/997c82d2af6b9a231cdec6dc308fbb41354be090))
* **domain:** add media extension classifier ([3505b3a](https://github.com/Sensation02/media-sorter/commit/3505b3a157d726df1aee038bbd5e97e79e44abe4))
* **epic-13:** wire Reveal in Finder to OS file manager ([ca8d2d4](https://github.com/Sensation02/media-sorter/commit/ca8d2d458eb41b2ea001cc12586a44e32d3282d0))
* **events:** EPIC-08 PR-1 — backend progress events ([#28](https://github.com/Sensation02/media-sorter/issues/28)) ([f074266](https://github.com/Sensation02/media-sorter/commit/f074266dc4ba92e5bc4f696214166106fc2f4697))
* **events:** EPIC-08 PR-2 — useSortJob hook and ProgressScreen wiring ([#31](https://github.com/Sensation02/media-sorter/issues/31)) ([f1e3a37](https://github.com/Sensation02/media-sorter/commit/f1e3a37be2431f382851f137c5e7f633df7cd895))
* **fs:** EPIC-06 PR1 — runner module foundation ([#24](https://github.com/Sensation02/media-sorter/issues/24)) ([879d213](https://github.com/Sensation02/media-sorter/commit/879d213221fb0a117c06421e9b4a74f035b1b231))
* **geo:** offline reverse geocoding ([#20](https://github.com/Sensation02/media-sorter/issues/20)) ([0a0e4c1](https://github.com/Sensation02/media-sorter/commit/0a0e4c1507e87e9d1662ed5321d03001e83f47d1))
* **history:** EPIC-07 PR1 — history backend and revert engine ([#26](https://github.com/Sensation02/media-sorter/issues/26)) ([6bea21d](https://github.com/Sensation02/media-sorter/commit/6bea21d7afc2aecf342e808deb0c4430d3763b89))
* **history:** EPIC-09 PR-5 — retention GC closes the epic ([#40](https://github.com/Sensation02/media-sorter/issues/40)) ([9cdcede](https://github.com/Sensation02/media-sorter/commit/9cdcedeed424179a8ded0872378f4ea31d3af86d))
* **metadata:** extract capture date, GPS and camera from media files ([5ef47fa](https://github.com/Sensation02/media-sorter/commit/5ef47fa48bd498976a4fc3f0df1a76990997f440))
* **planner:** sort strategies and build_plan ([#21](https://github.com/Sensation02/media-sorter/issues/21)) ([9d98148](https://github.com/Sensation02/media-sorter/commit/9d981483bed0fbfba87362c526d9254ebd9cef52))
* scaffold Tauri 2 + React 19 + TS 6 with full toolchain ([64b74b6](https://github.com/Sensation02/media-sorter/commit/64b74b6fc3726842dafb58aea532333e4a489a4f))
* **scanning:** EPIC-02 backend — folder picker + flat media scan ([28584cb](https://github.com/Sensation02/media-sorter/commit/28584cbcca117cbb2f4c7a225977b3172cdc67c0))
* **scanning:** EPIC-02 backend — folder picker + flat media scan ([#4](https://github.com/Sensation02/media-sorter/issues/4)) ([28584cb](https://github.com/Sensation02/media-sorter/commit/28584cbcca117cbb2f4c7a225977b3172cdc67c0))
* **scanning:** EPIC-02 UI — Browse + native folder scan preview ([4d64a77](https://github.com/Sensation02/media-sorter/commit/4d64a77604dbd75fe8e34ea5ca7b9adf4e182a51))
* **scanning:** implement flat directory scan service ([5afeb53](https://github.com/Sensation02/media-sorter/commit/5afeb53059b379a4cb6d64c89cf8c1c3722f7ffc))
* **scanning:** wire SetupScreen Browse button to native folder scan ([940eba2](https://github.com/Sensation02/media-sorter/commit/940eba26e24c5836d2f71938a560b50864e66aaf))
* **settings:** EPIC-09 PR-1 — backend foundation + i18n registry ([#35](https://github.com/Sensation02/media-sorter/issues/35)) ([346d7f9](https://github.com/Sensation02/media-sorter/commit/346d7f902c84416243dbe942e7581ed87c3eaf36))
* **settings:** EPIC-09 PR-3 — session memo prefill ([#38](https://github.com/Sensation02/media-sorter/issues/38)) ([259fc95](https://github.com/Sensation02/media-sorter/commit/259fc95e9ebcbdea748e87ea67731249ef851a21))
* **sort:** add isSortRuleId type guard; remove cast in RuleSelector ([d194c58](https://github.com/Sensation02/media-sorter/commit/d194c5881e5cc9dfe18a6dbe2e31772950875eea))
* **sort:** centralize async-hook status + reducer action-type constants ([ff66a7e](https://github.com/Sensation02/media-sorter/commit/ff66a7e0a25cb81e76917bc913136151bc83fe69))
* **sort:** centralize JOB_STATUS constants and replace cross-file magic ([4fb0e60](https://github.com/Sensation02/media-sorter/commit/4fb0e60bc24ba0b676b7988365979bf8c581c269))
* **sort:** centralize LOG_LEVEL and SORT_STATUS constants ([40ebc81](https://github.com/Sensation02/media-sorter/commit/40ebc81a23f9d60798e997a2d18e761f05542eef))
* **sort:** centralize screens constants (SORT_SCREEN, TOOLBAR_*, SIDEBAR_ITEMS) ([8d1a59d](https://github.com/Sensation02/media-sorter/commit/8d1a59dd75163c23abd54bf5aa443a25039e203a))
* **sorting:** EPIC-06 PR2 — runner + IPC commands closes EPIC-06 ([#25](https://github.com/Sensation02/media-sorter/issues/25)) ([c858119](https://github.com/Sensation02/media-sorter/commit/c858119ad99f95c9826a607f04a858224c217be4))
* **sorting:** EPIC-09 PR-4 — planner uses settings.unknownDateFolderName ([#39](https://github.com/Sensation02/media-sorter/issues/39)) ([a6de546](https://github.com/Sensation02/media-sorter/commit/a6de54651ddef2e7107d6c6f0b7bc4b55c47df32))
* **sorting:** real preview_plan with ScanSession cache ([#22](https://github.com/Sensation02/media-sorter/issues/22)) ([6199532](https://github.com/Sensation02/media-sorter/commit/61995321c4d5a48c71a82eda2a90f8e0c64431f6))
* **sort:** retention picker + SettingsRow primitive + locale constants ([7a68752](https://github.com/Sensation02/media-sorter/commit/7a6875269119282c8eeb0b809377d5f3885a2884))
* **tauri:** add reveal_directory command for OS file manager ([e65a163](https://github.com/Sensation02/media-sorter/commit/e65a163b32df790eba4c31510383467651e9bff7))
* **tauri:** register updater plugin with GitHub Releases endpoint ([9763a31](https://github.com/Sensation02/media-sorter/commit/9763a316edf7b0038d9f79848496cdeb418092aa))
* **tauri:** wire estimate into preview_plan IPC ([4ab629f](https://github.com/Sensation02/media-sorter/commit/4ab629fd759e3a1a08252e35f0fa711a7d8d7a6e))
* **ui:** add English i18n namespace resources ([4a985cd](https://github.com/Sensation02/media-sorter/commit/4a985cd93d7c5f77399bc747cf1dc2692e72e910))
* **ui:** add ErrorBoundary around SortApp screen area ([23c1de0](https://github.com/Sensation02/media-sorter/commit/23c1de0d6973ea7904a41b8e275d0e96e55f639f))
* **ui:** add estimate DTOs and shared IMMUTABLE_SORT_FLAGS constants ([75f2a6b](https://github.com/Sensation02/media-sorter/commit/75f2a6bed6e2633b9b779b9bee5d595dbdba5fc6))
* **ui:** add estimate-format mapper and i18n keys for the pre-flight pill ([591c8bf](https://github.com/Sensation02/media-sorter/commit/591c8bf63e63089b062378a3caccfa7f84adcee9))
* **ui:** add Eyebrow primitive with default/warning/destructive/muted tones ([93fa750](https://github.com/Sensation02/media-sorter/commit/93fa750ba718cdb0678770d7887fa84d0850928f))
* **ui:** add hover-soft and divider-soft tokens ([453bef0](https://github.com/Sensation02/media-sorter/commit/453bef0c7c5cf5c391112fefcc1931a72c4c96f4))
* **ui:** add Input primitive + Button radius variant + Select size variant ([8c31d5e](https://github.com/Sensation02/media-sorter/commit/8c31d5e17dab2c93e3f838a1a5d9a8ee25f7836f))
* **ui:** add lucide-react icon manifest at constants/icons.tsx ([e0e7036](https://github.com/Sensation02/media-sorter/commit/e0e70368e4f6662cc87c20d6d183e28f17e2a9d6))
* **ui:** add PlanEstimate component with confidence dot ([84a91a3](https://github.com/Sensation02/media-sorter/commit/84a91a313ea6f26c865a322d5a25a10aa45032a2))
* **ui:** add ScreenFrame primitive for screen body + footer composition ([a57d9d8](https://github.com/Sensation02/media-sorter/commit/a57d9d8e228d1542dea85f1b538d793ef44034b8))
* **ui:** add shadcn primitives (Button, Card, Progress, Switch, Sonner) ([683197a](https://github.com/Sensation02/media-sorter/commit/683197a28349b4c6ce7c14ab9c8caaf1d2b4b0d2))
* **ui:** add sort domain types ([8bd56d0](https://github.com/Sensation02/media-sorter/commit/8bd56d0296967feaa3573365c260783a9e678f6f))
* **ui:** add sort feature constants and mock data ([15c7105](https://github.com/Sensation02/media-sorter/commit/15c7105bd9c9e3bcc2f94bbc8652b982e763df33))
* **ui:** add sort feature primitives ([e79195b](https://github.com/Sensation02/media-sorter/commit/e79195bf18c72cc7ae32c11a5786b9d6ab9f029f))
* **ui:** add sort feature screens ([bfbf4e2](https://github.com/Sensation02/media-sorter/commit/bfbf4e2a6e52b529a386b17037a3379047b3a918))
* **ui:** add Spinner, Toast and ScanBreakdown components ([a68e91d](https://github.com/Sensation02/media-sorter/commit/a68e91d98ed8eea6d518648682e2072d62186968))
* **ui:** add Ukrainian i18n namespace resources ([a9a539d](https://github.com/Sensation02/media-sorter/commit/a9a539d0ba8106cf5dddfd28537a091a791905d0))
* **ui:** bootstrap i18n at app entry and add locale-aware number helper ([b60abe0](https://github.com/Sensation02/media-sorter/commit/b60abe039ee907155aaa4fccf55bf1a6bf45a70f))
* **ui:** check for app updates and prompt to install ([47a5aee](https://github.com/Sensation02/media-sorter/commit/47a5aeee1e4cf63c91241fd2822799b02d239c0f))
* **ui:** EPIC-07 PR2 — HistoryScreen wired to real IPC closes EPIC-07 ([#27](https://github.com/Sensation02/media-sorter/issues/27)) ([537a6d9](https://github.com/Sensation02/media-sorter/commit/537a6d9a67dc343d2d961dd9ee6cf3b55241d051))
* **ui:** EPIC-09 PR-2 — SettingsScreen wired to real settings store ([#37](https://github.com/Sensation02/media-sorter/issues/37)) ([ec1d85f](https://github.com/Sensation02/media-sorter/commit/ec1d85fcda6d0daa0512fc3acca4a0764de6fa12))
* **ui:** EPIC-11 batch-01 — UI polish (5 items) ([#41](https://github.com/Sensation02/media-sorter/issues/41)) ([1840024](https://github.com/Sensation02/media-sorter/commit/1840024d8bb4f32833079b3f6fd56824a27aae78))
* **ui:** EPIC-11 batch-02 — UI polish (rows 06, 07) ([#42](https://github.com/Sensation02/media-sorter/issues/42)) ([2d38e7d](https://github.com/Sensation02/media-sorter/commit/2d38e7d793602f6c66956627a67499869f05c121))
* **ui:** extend [@theme](https://github.com/theme) with design system tokens ([5a52731](https://github.com/Sensation02/media-sorter/commit/5a52731290ae8933f1424ca177a2ae997c218438))
* **ui:** formatDateTime helper using date-fns + active locale ([f855b66](https://github.com/Sensation02/media-sorter/commit/f855b669f059acccb2aa3c449455a92f66ae3fcb))
* **ui:** i18next bootstrap with SUPPORTED_LOCALES registry ([eadc2d6](https://github.com/Sensation02/media-sorter/commit/eadc2d6b820273db1564829fb1f14e2ba16e66f6))
* **ui:** keep progress screen visible after sort completes ([8ced481](https://github.com/Sensation02/media-sorter/commit/8ced481a5baf97a9c61818166ded68685ddf8c22))
* **ui:** live preview tree closes EPIC-05 ([#23](https://github.com/Sensation02/media-sorter/issues/23)) ([2523f97](https://github.com/Sensation02/media-sorter/commit/2523f97d9215d1780765c323f98eb0997bc0d0bd))
* **ui:** localize sort screens and components via react-i18next ([53a9b8f](https://github.com/Sensation02/media-sorter/commit/53a9b8f2cbf7649b9e5de1dee68234838c6ba253))
* **ui:** per-variant disabled state — fix unreadable primary CTA ([819c96f](https://github.com/Sensation02/media-sorter/commit/819c96ffb3ab3732d9bc838553c53368b79295e8))
* **ui:** pipe estimate end-to-end through preview hook ([036f7bb](https://github.com/Sensation02/media-sorter/commit/036f7bb12a491842728ba5358696b335c8b787ae))
* **ui:** retention picker + UI primitives polish ([5554421](https://github.com/Sensation02/media-sorter/commit/555442120878e8cb720a946ef48f86b1aded1652))
* **ui:** show pre-flight ETA pill next to Start sort on SetupScreen ([6ec16b2](https://github.com/Sensation02/media-sorter/commit/6ec16b20d7c31391b4cebb2168ac870f044e4d47))
* **ui:** show sub-second durations as "0.4 s" instead of "00:00" ([0d38abf](https://github.com/Sensation02/media-sorter/commit/0d38abf8344892a35b3bf913d46f951915c4eaa9))
* **ui:** wire Reveal in Finder button to reveal_directory IPC ([fc9b24e](https://github.com/Sensation02/media-sorter/commit/fc9b24ed1e03eda996e8e89f4b17a9700771e8bb))
* **ui:** wire SortApp into App.tsx ([4201b71](https://github.com/Sensation02/media-sorter/commit/4201b718e26dc8621af21f202317ceff437d8b03))
* **utils:** add formatBytes and AppError view helpers ([0cd9e3d](https://github.com/Sensation02/media-sorter/commit/0cd9e3dea7ae5bad52743f23c06bf003472ff52c))


### Bug Fixes

* **sort:** drop SidebarItem from sidebar barrel after C18 migration ([bce7ec7](https://github.com/Sensation02/media-sorter/commit/bce7ec7d4bf76d44388b86bba36b4a3a359a8dad))
* **sort:** update vi.mock paths after hooks moved to hooks/ subdir ([e84553c](https://github.com/Sensation02/media-sorter/commit/e84553c108ce91bb33c66cde9e6ab7b5a2329290))
* **tauri:** prevent macOS hang when picking source folder ([#17](https://github.com/Sensation02/media-sorter/issues/17)) ([dae431b](https://github.com/Sensation02/media-sorter/commit/dae431b5f1fe692632faaf47fc37120d01a91225))
* **ui:** conditional spread of optional Toolbar subtitle ([7f9cf2e](https://github.com/Sensation02/media-sorter/commit/7f9cf2e82a705b10754fbf10b4b13748b465a9c9))
* **ui:** contrast and a literal-escape rendering bug in Tree ([66a9440](https://github.com/Sensation02/media-sorter/commit/66a944097ee387f4c0815ccf74b9ca63c75f3379))
* **ui:** Eyebrow primitive — avoid tailwind-merge collapsing text-eyebrow ([34cf28d](https://github.com/Sensation02/media-sorter/commit/34cf28d99d746c769aca3072aa741ef98c433d32))
* **ui:** guard division by zero in ProgressScreen percent calc ([d5f383e](https://github.com/Sensation02/media-sorter/commit/d5f383ef11e1d6041f6fb0ba06d0e79e75d4f693))
* **ui:** make SortTreeNode a discriminated union ([05a9109](https://github.com/Sensation02/media-sorter/commit/05a9109133a8d162169fc4e653c3b712adb417c3))
* **ui:** render middot character (not literal escape) in Tree ([de74de9](https://github.com/Sensation02/media-sorter/commit/de74de9828af26c59e13035d18df977a12c8198a))
* **ui:** set color-scheme on :root / .dark so native form controls adapt ([4bf6931](https://github.com/Sensation02/media-sorter/commit/4bf6931f797458645677ead0c5497599c7834a8f))
* **ui:** teach tailwind-merge about custom [@theme](https://github.com/theme) typography tokens ([16a4ad5](https://github.com/Sensation02/media-sorter/commit/16a4ad54159123b74a67a67beefc82246878adaf))


### Refactoring

* **core:** adopt hybrid feature-based module layout ([2975700](https://github.com/Sensation02/media-sorter/commit/29757005f88842883ffca5f93b42b5f987b17715))
* **core:** registry-driven language codes for month names ([c03cdbc](https://github.com/Sensation02/media-sorter/commit/c03cdbc8ec31c9c5a8804ee0ff292cf213c1762f))
* **core:** split backend stubs into feature modules ([5acb8ed](https://github.com/Sensation02/media-sorter/commit/5acb8ed4c6ee863e64c24715957899fd7c41301d))
* **error:** structure AppError for i18n-ready IPC payloads ([4330e25](https://github.com/Sensation02/media-sorter/commit/4330e25db17b57bd0bb082e23a3ed6bfa35fff21))
* **sort:** adopt UI primitives across sort screens ([dcc993d](https://github.com/Sensation02/media-sorter/commit/dcc993dae73acca2189c7796bf35c1d406a8896b))
* **sort:** extract resolveDefaultRule from SetupScreen into mappers ([07b741a](https://github.com/Sensation02/media-sorter/commit/07b741a8512101012ffc75ac6fae8c65b4170f6d))
* **sort:** extract resolveScreen, toSortDone, revertSummary, preferredDefaultRule ([4b01077](https://github.com/Sensation02/media-sorter/commit/4b01077580eb982582ec1031ae6e9fd5f6e68ce1))
* **sort:** extract useSortOrchestration hook from SortApp ([6bc334b](https://github.com/Sensation02/media-sorter/commit/6bc334b6e7097e1e22b7ff15179c71e8fd396322))
* **sort:** move hooks/mappers/constants into subdirectories; update imports ([e78a8cc](https://github.com/Sensation02/media-sorter/commit/e78a8ccb88ddcbcd5edb9cdd5de6b709f0d2129f))
* **sort:** SetupScreen grouped props (AP-014) + document the rule ([f8fd62a](https://github.com/Sensation02/media-sorter/commit/f8fd62ac4a25b29f32c3d77e709a07ebf8006d2c))
* **ui:** collapse ScreenFrame footer padding to a single value ([dca75a5](https://github.com/Sensation02/media-sorter/commit/dca75a5261f8af338cdf4876976f548d703e0aa1))
* **ui:** EPIC-12 frontend foundations ([9d7a8cb](https://github.com/Sensation02/media-sorter/commit/9d7a8cb80bdefb9f8791a6c694df923eab99a636))
* **ui:** make lg the default Button radius ([23807c3](https://github.com/Sensation02/media-sorter/commit/23807c338aa5446508d184ecb96de8dc340c8d18))
* **ui:** migrate primitives to shadcn/ui (Radix + Sonner + cva) ([32bceb2](https://github.com/Sensation02/media-sorter/commit/32bceb2eb773aa9613fc2ca684e2674bbe489778))
* **ui:** migrate remaining Unicode icons to lucide-react ([b2cf51a](https://github.com/Sensation02/media-sorter/commit/b2cf51a473cf8796f64b02d1869378ab6d49b14e))
* **ui:** migrate Sidebar icons to lucide-react ([f976a78](https://github.com/Sensation02/media-sorter/commit/f976a7824ca4cb7fa18958b533ee9b319b192279))
* **ui:** pure mappers and discriminated unions for i18n consumers ([01e4e4b](https://github.com/Sensation02/media-sorter/commit/01e4e4b26fe7b281398eda72a75ddda65715ff28))
* **ui:** replace 4 screen frame copies with &lt;ScreenFrame&gt; ([2a34a4c](https://github.com/Sensation02/media-sorter/commit/2a34a4c710c0b4f5549c46cf5ae0f8ab302dee66))
* **ui:** replace 8 eyebrow copies with &lt;Eyebrow&gt;; fix Stat drift ([0f9d657](https://github.com/Sensation02/media-sorter/commit/0f9d6571320b5060b36f651ea06120717505b2b7))
* **ui:** replace bespoke primitives with shadcn equivalents ([955f57d](https://github.com/Sensation02/media-sorter/commit/955f57d11dec91494f1db1c407639fff460300e8))
* **ui:** replace bg/text-[var(--color-X)] with [@theme](https://github.com/theme) classes ([217bfa2](https://github.com/Sensation02/media-sorter/commit/217bfa2cf965afd5516bfcaca5ec02b398e267e6))
* **ui:** replace border/divide/ring-[var(--color-X)] with [@theme](https://github.com/theme) classes ([2088ae8](https://github.com/Sensation02/media-sorter/commit/2088ae8aa92b9f8aa87ac3104850a4e3bbd6eb0e))
* **ui:** replace inline &lt;button&gt; in ErrorBoundary with &lt;Button&gt; ([aa494d5](https://github.com/Sensation02/media-sorter/commit/aa494d5dd4c3f4afac3bc8316f4b7fbda3d17ce2))
* **ui:** replace switch/select/progress geometry magic with tokens ([7b848d0](https://github.com/Sensation02/media-sorter/commit/7b848d05e9058899cff82c57c720716d6c41dc1d))
* **ui:** replace text-[Npx] arbitrary sizes with typography tokens ([2346880](https://github.com/Sensation02/media-sorter/commit/2346880460c82e71d12ce7f2bc229dd419937c5a))
* **ui:** SettingsScreen.onChange takes whole SortSettings ([8b4b4f5](https://github.com/Sensation02/media-sorter/commit/8b4b4f50b4b5bf128138800168881180efb9d5dd))
* **ui:** split HistoryScreen co-located components ([c0de14e](https://github.com/Sensation02/media-sorter/commit/c0de14e3277dbda3abae6b68e6560258cd9d08d9))
* **ui:** split PreviewTree co-located Placeholder into its own file ([1418dc6](https://github.com/Sensation02/media-sorter/commit/1418dc63effb9b447abeb5fd3eff0b54e0267aaa))
* **ui:** split SettingsScreen co-located SettingsForm ([820fed2](https://github.com/Sensation02/media-sorter/commit/820fed2c726326920e68a0924a9b89d4d17d4697))

## [Unreleased]

### Features

- The app now checks for updates on launch and offers to install them with one click; you can also check manually from Settings
- Releases are now built automatically for macOS, Windows, and Linux; install instructions are in the README
- Pre-flight ETA on the Setup screen: a small "≈ 15 sec" / "30 sec – 1 min" / "> 1 min" pill now appears next to the Run sort button before you click it, so you know what to expect for a 200 GB copy to a slow drive before it starts; a coloured dot signals how much the estimate is trusted (green when the app has measured the destination, amber for a generic guess, gray when the source and destination live on different drives without a probe)
- Pre-flight ETA accuracy: when copying to a different drive (e.g. external USB, network share), the app now does a quick 32 MiB write probe at the destination to measure real write speed instead of guessing; the result is cached per destination so flipping between sorting rules stays instant, and a read-only destination falls back to the static estimate without an error
- Refreshed UI: dark workbench layout for sort jobs (setup, progress, done, history, settings)
- Design system tokens extended (@theme): surface scale, fg scale, semantic colors (warning/success), radius scale
- Source folder scan engine: counts photo, RAW and video files in the chosen folder; skips hidden, system and symlinked entries (UI wiring lands in a follow-up release)
- Pick a source folder from Setup: Browse opens the system folder dialog and shows file count, total size and a photo / RAW / video breakdown for the chosen folder
- Inline scan progress and error toasts when reading the chosen source folder fails
- Reads capture date, GPS coordinates and camera make / model from photos (JPEG, HEIC, TIFF, RAW) and videos (MP4, MOV, M4V); files without metadata fall through to "Unknown date" so the rest of the batch is unaffected (used by the upcoming sort planner)
- Offline reverse geocoding turns photo and video GPS into a "City, Country" label (e.g. "Paris, France"), with a per-job in-memory cache so a burst from the same spot is looked up once; works without any internet connection (used by the upcoming sort planner)
- Sort planner core: builds a deterministic folder layout for each photo and video based on date, date and place, file type or camera, with "Misc" for files missing the chosen grouping (UI preview and execution wiring land in follow-up releases)
- Folder scan now extracts photo and video metadata up front and caches the result on the app side, so previewing a sort layout is instant when switching between rules; the visual preview tree lands in a follow-up release
- Setup screen now shows a real preview tree of the chosen sorting layout for the scanned folder, with file counts per destination directory; "By date and place" is the new default rule and matches the project's headline use case
- Sort engine moves photos and videos into the planned folders with a per-job log written before every move so a future revert can roll the job back; same-name collisions get a `(1)`, `(2)` suffix automatically, identical files are detected by name, size and content fingerprint when "Skip duplicates" is on, and a one-off "Dry run" flag lets the engine rehearse a job without touching any file (UI wiring lands in a follow-up release)
- Job history backend records every completed sort with how many files were moved, skipped, errored and how long it took; `Revert` reverses every move from a chosen job back to its source path, skips conflicts safely (never overwrites a manually-restored or replaced file) and cleans up empty folders the sort created (HistoryScreen wiring lands in a follow-up release)
- History screen now lists real completed sorts from disk with a Revert button per row; clicking Revert reverses the job and shows a toast with how many files were restored, skipped or errored, and the row updates to show "Reverted" so it can't be undone twice by mistake
- Live progress and activity log during a sort run
- Real-time progress screen during sort runs
- Settings persistence engine remembers your last sort rule, destination folder, unknown-date folder name and history retention window across app launches; on first launch the app detects the language from your operating system (English or Ukrainian today), with the settings UI and runtime language switching landing in follow-up releases
- Settings screen now reads and writes real persisted values: toggles for "Remember last sort rule" and "Remember last destination", an editable Unknown-date folder name (with locale-aware placeholder), a History retention number input (7-365 days), a language indicator (switching arrives with EPIC-10), and a Reset to defaults button that preserves your last sort rule and destination
- App now remembers your last session: when "Remember last sort rule" is on, the sort rule from your previous run is preselected on launch; when "Remember last destination" is on, the app re-scans the last folder you sorted automatically so you can jump straight into another pass
- Files without a capture date now land in a folder whose name comes from your settings (or the locale default — "Misc" in English, "Різне" in Ukrainian); changing the Unknown-date folder name in Settings is reflected the next time you preview a sort
- History retention now runs automatically at app startup: undo logs and summaries older than your configured window are removed so the app data folder doesn't grow indefinitely; active jobs and entries with future timestamps are never touched (Article I — user files are sacred)
- Sort setup now shows the source folder and the sorting rule side-by-side on wide windows, and the sorting rule cards lay out in a balanced 2×2 grid instead of leaving one card alone on its own row
- App window title now reads `sort-my-media`, matching the in-app branding (the duplicate label in the workbench header is gone)
- Sidebar navigation icons are larger and easier to scan
- Removed two non-functional UI elements from the sort setup: a "Save preset" button that did nothing, and an always-green decorative status dot at the top of the sidebar (the toolbar status dot remains and continues to reflect real sort status)
- Sorting rule is now a compact dropdown — the trigger shows the active rule, the open list shows each rule's name and what its folder layout looks like, replacing the previous 2×2 grid of cards
- History retention is now a dropdown with preset windows (1 week, 1 month, 3 / 6 / 12 months) instead of a free-text day count
- Photos and videos sorted with the Ukrainian UI now go into Ukrainian-named month folders (наприклад, "Лютий 2024" замість "February 2024")
- New language picker in Settings — switch between English and Ukrainian; takes effect immediately for the UI and for future sorts
- After a sort finishes the progress screen now stays on screen with the final counters, so quick jobs no longer flash past; tap "Continue" when you're ready to see the result summary
- Durations under one second now show as "0.4 s" (or "0,4 с" in Ukrainian) on the progress, done, and history screens instead of a stuck "00:00"
- Buttons now use the larger pill-style rounding everywhere by default for a more consistent look across screens
- "Reveal in Finder" on the Done screen now opens the destination folder in Finder (macOS), Explorer (Windows) or your default file manager (Linux); if the folder was removed between sort and click, an error toast appears instead

### Bug Fixes

- "Browse…" no longer freezes the app on macOS when picking a source folder

### Performance

### Reverts
