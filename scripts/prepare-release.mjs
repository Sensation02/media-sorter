import { readFileSync, writeFileSync } from "node:fs";

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const APP_PACKAGE_NAME = "media-sorter";
const RELEASE_COMMIT_TYPE = "chore(release)";

const PACKAGE_JSON_PATH = "package.json";
const TAURI_CONF_PATH = "src-tauri/tauri.conf.json";
const CARGO_TOML_PATH = "src-tauri/Cargo.toml";
const CARGO_LOCK_PATH = "src-tauri/Cargo.lock";
const CHANGELOG_PATH = "CHANGELOG.md";

const JSON_VERSION_PATTERN = /("version":\s*")[^"]+(")/;
const CARGO_TOML_VERSION_PATTERN = /^version = "[^"]+"$/m;
const RELEASE_HEADING_PATTERN = /^## \[/;
const SUBSECTION_PATTERN = /^### /;

const UNRELEASED_HEADING = "## [Unreleased]";
const UNRELEASED_TEMPLATE_LINES = [
    UNRELEASED_HEADING,
    "",
    "### Features",
    "",
    "### Bug Fixes",
    "",
    "### Performance",
    "",
    "### Reverts",
    "",
];

main();

function main() {
    const version = process.argv[2];

    if (!version || !SEMVER_PATTERN.test(version)) {
        fail("Usage: node scripts/prepare-release.mjs <major.minor.patch>");
    }

    replaceInFile(PACKAGE_JSON_PATH, JSON_VERSION_PATTERN, `$1${version}$2`);
    replaceInFile(TAURI_CONF_PATH, JSON_VERSION_PATTERN, `$1${version}$2`);
    replaceInFile(CARGO_TOML_PATH, CARGO_TOML_VERSION_PATTERN, `version = "${version}"`);
    replaceInFile(CARGO_LOCK_PATH, buildCargoLockPattern(), `$1${version}$2`);
    cutChangelogSection(version);

    console.log(
        `Prepared release ${version}. Review the diff, then commit as '${RELEASE_COMMIT_TYPE}: prepare ${version}'.`,
    );
}

function cutChangelogSection(version) {
    const lines = readFileSync(CHANGELOG_PATH, "utf8").split("\n");
    const start = lines.indexOf(UNRELEASED_HEADING);

    if (start === -1) fail(`${CHANGELOG_PATH}: "${UNRELEASED_HEADING}" heading not found`);

    const end = findSectionEnd(lines, start);
    const releasedEntries = compactSubsections(lines.slice(start + 1, end));

    if (releasedEntries.length === 0) {
        fail(`${CHANGELOG_PATH}: no entries under ${UNRELEASED_HEADING} — nothing to release`);
    }

    const releasedHeading = `## [${version}] - ${currentDate()}`;
    const updated = [
        ...lines.slice(0, start),
        ...UNRELEASED_TEMPLATE_LINES,
        releasedHeading,
        "",
        ...releasedEntries,
        ...lines.slice(end),
    ];
    writeFileSync(CHANGELOG_PATH, updated.join("\n"));
}

function findSectionEnd(lines, start) {
    for (let i = start + 1; i < lines.length; i++) {
        if (RELEASE_HEADING_PATTERN.test(lines[i])) return i;
    }

    return lines.length;
}

function compactSubsections(lines) {
    const kept = [];
    let heading = null;
    let entries = [];

    const flush = () => {
        if (heading !== null && entries.length > 0) kept.push(heading, "", ...entries, "");
        heading = null;
        entries = [];
    };

    for (const line of lines) {
        if (SUBSECTION_PATTERN.test(line)) {
            flush();
            heading = line;
        } else if (heading !== null && line.trim() !== "") {
            entries.push(line);
        }
    }
    flush();

    return kept;
}

function buildCargoLockPattern() {
    return new RegExp(`(\\[\\[package\\]\\]\\nname = "${APP_PACKAGE_NAME}"\\nversion = ")[^"]+(")`);
}

function replaceInFile(path, pattern, replacement) {
    const raw = readFileSync(path, "utf8");
    const updated = raw.replace(pattern, replacement);

    if (updated === raw) {
        fail(`${path}: version pattern not found or already at the target version`);
    }

    writeFileSync(path, updated);
}

function currentDate() {
    return new Date().toISOString().slice(0, 10);
}

function fail(message) {
    console.error(message);
    process.exit(1);
}
