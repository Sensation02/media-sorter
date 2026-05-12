import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import type { AppSettingsDto } from "../../../../types/ipc";
import type { SettingsHookState } from "../../use-settings";

export type SettingsScreenProps = {
    state: SettingsHookState;
    onSave: (next: AppSettingsDto) => Promise<AppSettingsDto>;
    onReset: () => Promise<AppSettingsDto>;
    onRetry: () => void;
};

const LANGUAGE_NATIVE_NAME: Record<string, string> = {
    en: "English",
    uk: "Українська",
};

const UNKNOWN_DATE_FOLDER_PLACEHOLDER: Record<string, string> = {
    en: "Misc",
    uk: "Різне",
};

const MIN_RETENTION_DAYS = 7;
const MAX_RETENTION_DAYS = 365;

export function SettingsScreen({ state, onSave, onReset, onRetry }: SettingsScreenProps) {
    if (state.status === "loading") {
        return (
            <div className="flex h-full items-center justify-center text-body text-fg-3">
                Loading settings…
            </div>
        );
    }

    if (state.status === "error") {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="text-body">{state.error.title}</div>
                <div className="text-meta text-fg-3">{state.error.detail}</div>
                <Button variant="ghost" size="sm" onClick={onRetry}>
                    Retry
                </Button>
            </div>
        );
    }

    return <SettingsForm settings={state.settings} onSave={onSave} onReset={onReset} />;
}

type SettingsFormProps = {
    settings: AppSettingsDto;
    onSave: (next: AppSettingsDto) => Promise<AppSettingsDto>;
    onReset: () => Promise<AppSettingsDto>;
};

function SettingsForm({ settings, onSave, onReset }: SettingsFormProps) {
    const [prevSettings, setPrevSettings] = useState(settings);
    const [folderDraft, setFolderDraft] = useState(settings.unknownDateFolderName ?? "");
    const [retentionDraft, setRetentionDraft] = useState(String(settings.historyRetentionDays));

    if (settings !== prevSettings) {
        setPrevSettings(settings);
        setFolderDraft(settings.unknownDateFolderName ?? "");
        setRetentionDraft(String(settings.historyRetentionDays));
    }

    const handleToggle = useCallback(
        (key: "rememberLastSortRule" | "rememberLastDestination", value: boolean) => {
            void onSave({ ...settings, [key]: value });
        },
        [settings, onSave],
    );

    const handleFolderBlur = useCallback(() => {
        const trimmed = folderDraft.trim();
        const next = trimmed.length === 0 ? null : trimmed;

        if (next === settings.unknownDateFolderName) {
            return;
        }

        void onSave({ ...settings, unknownDateFolderName: next });
    }, [folderDraft, settings, onSave]);

    const handleRetentionBlur = useCallback(() => {
        const parsed = Number.parseInt(retentionDraft, 10);
        const clamped = Number.isFinite(parsed)
            ? Math.min(Math.max(parsed, MIN_RETENTION_DAYS), MAX_RETENTION_DAYS)
            : settings.historyRetentionDays;

        if (clamped === settings.historyRetentionDays) {
            setRetentionDraft(String(settings.historyRetentionDays));

            return;
        }

        void onSave({ ...settings, historyRetentionDays: clamped });
    }, [retentionDraft, settings, onSave]);

    const placeholder =
        UNKNOWN_DATE_FOLDER_PLACEHOLDER[settings.uiLanguage] ?? UNKNOWN_DATE_FOLDER_PLACEHOLDER.en;
    const languageDisplay =
        LANGUAGE_NATIVE_NAME[settings.uiLanguage] ?? settings.uiLanguage.toUpperCase();

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-7 py-7 space-y-5">
                <Card className="overflow-hidden">
                    <ul className="divide-y divide-divider-soft">
                        <li className="px-4 py-3.5 flex items-center gap-4">
                            <div className="flex-1">
                                <div className="text-body">Remember last sort rule</div>
                                <div className="text-meta text-fg-3 mt-0.5">
                                    Start each session with the rule you used last time.
                                </div>
                            </div>
                            <Switch
                                checked={settings.rememberLastSortRule}
                                onCheckedChange={(value) => {
                                    handleToggle("rememberLastSortRule", value);
                                }}
                            />
                        </li>
                        <li className="px-4 py-3.5 flex items-center gap-4">
                            <div className="flex-1">
                                <div className="text-body">Remember last destination</div>
                                <div className="text-meta text-fg-3 mt-0.5">
                                    Preselect the destination folder from the last sort.
                                </div>
                            </div>
                            <Switch
                                checked={settings.rememberLastDestination}
                                onCheckedChange={(value) => {
                                    handleToggle("rememberLastDestination", value);
                                }}
                            />
                        </li>
                    </ul>
                </Card>

                <Card className="overflow-hidden">
                    <ul className="divide-y divide-divider-soft">
                        <li className="px-4 py-3.5 flex items-center gap-4">
                            <div className="flex-1">
                                <div className="text-body">Unknown-date folder name</div>
                                <div className="text-meta text-fg-3 mt-0.5">
                                    Files without a capture date land here. Leave empty for the
                                    locale default.
                                </div>
                            </div>
                            <input
                                type="text"
                                value={folderDraft}
                                placeholder={placeholder}
                                maxLength={64}
                                onChange={(event) => {
                                    setFolderDraft(event.target.value);
                                }}
                                onBlur={handleFolderBlur}
                                className="w-44 rounded-md border border-divider-soft bg-surface-2 px-2.5 py-1.5 text-body outline-none focus:border-fg-2"
                            />
                        </li>
                        <li className="px-4 py-3.5 flex items-center gap-4">
                            <div className="flex-1">
                                <div className="text-body">History retention (days)</div>
                                <div className="text-meta text-fg-3 mt-0.5">
                                    Undo logs older than this are cleared at startup. Min{" "}
                                    {MIN_RETENTION_DAYS}, max {MAX_RETENTION_DAYS}.
                                </div>
                            </div>
                            <input
                                type="number"
                                value={retentionDraft}
                                min={MIN_RETENTION_DAYS}
                                max={MAX_RETENTION_DAYS}
                                onChange={(event) => {
                                    setRetentionDraft(event.target.value);
                                }}
                                onBlur={handleRetentionBlur}
                                className="w-24 rounded-md border border-divider-soft bg-surface-2 px-2.5 py-1.5 text-body outline-none focus:border-fg-2"
                            />
                        </li>
                        <li className="px-4 py-3.5 flex items-center gap-4">
                            <div className="flex-1">
                                <div className="text-body">Language</div>
                                <div className="text-meta text-fg-3 mt-0.5">
                                    Available in a follow-up release (EPIC-10).
                                </div>
                            </div>
                            <div className="text-body text-fg-3">{languageDisplay}</div>
                        </li>
                    </ul>
                </Card>

                <div className="flex justify-end">
                    <Button variant="secondary" size="sm" onClick={() => void onReset()}>
                        Reset to defaults
                    </Button>
                </div>
            </div>
        </div>
    );
}
