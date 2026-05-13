import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import type { AppSettingsDto } from "../../../../types/ipc";
import { ScreenFrame } from "../../components/screen-frame";
import { LANGUAGE_NATIVE_NAME, UNKNOWN_DATE_FOLDER_PLACEHOLDER } from "../../constants/locale";
import { RETENTION_PRESETS } from "../../constants/retention";
import { retentionLabel, snapToPreset } from "../../mappers/retention";

import { SettingsRow } from "./SettingsRow";

const SETTINGS_CONTROL_WIDTH = "w-44";
const SETTINGS_CONTROL_SHAPE = "h-9 rounded-md";

export type SettingsFormProps = {
    settings: AppSettingsDto;
    onSave: (next: AppSettingsDto) => Promise<AppSettingsDto>;
    onReset: () => Promise<AppSettingsDto>;
};

export function SettingsForm({ settings, onSave, onReset }: SettingsFormProps) {
    const [prevSettings, setPrevSettings] = useState(settings);
    const [folderDraft, setFolderDraft] = useState(settings.unknownDateFolderName ?? "");

    if (settings !== prevSettings) {
        setPrevSettings(settings);
        setFolderDraft(settings.unknownDateFolderName ?? "");
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

    const handleRetentionChange = useCallback(
        (next: string) => {
            const days = Number.parseInt(next, 10);

            if (!Number.isFinite(days) || days === settings.historyRetentionDays) {
                return;
            }

            void onSave({ ...settings, historyRetentionDays: days });
        },
        [settings, onSave],
    );

    const placeholder =
        UNKNOWN_DATE_FOLDER_PLACEHOLDER[settings.uiLanguage] ?? UNKNOWN_DATE_FOLDER_PLACEHOLDER.en;
    const languageDisplay =
        LANGUAGE_NATIVE_NAME[settings.uiLanguage] ?? settings.uiLanguage.toUpperCase();

    return (
        <ScreenFrame bodyClassName="space-y-5">
            <Card className="overflow-hidden">
                <ul className="divide-y divide-divider-soft">
                    <SettingsRow
                        label="Remember last sort rule"
                        description="Start each session with the rule you used last time."
                        control={
                            <Switch
                                checked={settings.rememberLastSortRule}
                                onCheckedChange={(value) => {
                                    handleToggle("rememberLastSortRule", value);
                                }}
                            />
                        }
                    />
                    <SettingsRow
                        label="Remember last destination"
                        description="Preselect the destination folder from the last sort."
                        control={
                            <Switch
                                checked={settings.rememberLastDestination}
                                onCheckedChange={(value) => {
                                    handleToggle("rememberLastDestination", value);
                                }}
                            />
                        }
                    />
                </ul>
            </Card>

            <Card className="overflow-hidden">
                <ul className="divide-y divide-divider-soft">
                    <SettingsRow
                        label="Unknown-date folder name"
                        description="Files without a capture date land here. Leave empty for the locale default."
                        control={
                            <Input
                                value={folderDraft}
                                placeholder={placeholder}
                                maxLength={64}
                                onChange={(event) => {
                                    setFolderDraft(event.target.value);
                                }}
                                onBlur={handleFolderBlur}
                                className={SETTINGS_CONTROL_WIDTH}
                            />
                        }
                    />
                    <SettingsRow
                        label="History retention"
                        description="Undo logs older than this are cleared at startup."
                        control={
                            <div className={SETTINGS_CONTROL_WIDTH}>
                                <Select
                                    value={String(snapToPreset(settings.historyRetentionDays))}
                                    onValueChange={handleRetentionChange}
                                >
                                    <SelectTrigger size="sm" className="rounded-md">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RETENTION_PRESETS.map((preset) => (
                                            <SelectItem
                                                key={preset.days}
                                                value={String(preset.days)}
                                            >
                                                {retentionLabel(preset, settings.uiLanguage)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        }
                    />
                    <SettingsRow
                        label="Language"
                        description="Available in a follow-up release (EPIC-10)."
                        control={<div className="text-body text-fg-3">{languageDisplay}</div>}
                    />
                </ul>
            </Card>

            <div className="flex justify-end">
                <Button
                    variant="secondary"
                    radius="lg"
                    onClick={() => void onReset()}
                    className={SETTINGS_CONTROL_SHAPE}
                >
                    Reset to defaults
                </Button>
            </div>
        </ScreenFrame>
    );
}
