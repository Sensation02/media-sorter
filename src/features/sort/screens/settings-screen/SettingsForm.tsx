import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { changeLocale, isSupportedLocale, SUPPORTED_LOCALES } from "../../../../i18n";
import { ScreenFrame } from "../../components/screen-frame";
import { UNKNOWN_DATE_FOLDER_PLACEHOLDER } from "../../constants/locale";
import { RETENTION_PRESETS } from "../../constants/retention";
import { retentionLabelKey, snapToPreset } from "../../mappers/retention";

import { SettingsRow } from "./SettingsRow";

const SETTINGS_CONTROL_WIDTH = "w-44";
const SETTINGS_CONTROL_SHAPE = "h-9";

export type SettingsFormProps = {
    settings: AppSettingsDto;
    onSave: (next: AppSettingsDto) => Promise<AppSettingsDto>;
    onReset: () => Promise<AppSettingsDto>;
};

export function SettingsForm({ settings, onSave, onReset }: SettingsFormProps) {
    const { t } = useTranslation("settings");
    const { t: tCommon } = useTranslation("common");
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

    const handleLanguageChange = useCallback(
        (next: string) => {
            if (!isSupportedLocale(next) || next === settings.uiLanguage) {
                return;
            }

            void onSave({ ...settings, uiLanguage: next }).then((saved) => {
                if (isSupportedLocale(saved.uiLanguage)) {
                    void changeLocale(saved.uiLanguage);
                }
            });
        },
        [settings, onSave],
    );

    const placeholder =
        UNKNOWN_DATE_FOLDER_PLACEHOLDER[settings.uiLanguage] ?? UNKNOWN_DATE_FOLDER_PLACEHOLDER.en;

    return (
        <ScreenFrame bodyClassName="space-y-5">
            <Card className="overflow-hidden">
                <ul className="divide-y divide-divider-soft">
                    <SettingsRow
                        label={t("rememberLastSortRule")}
                        description={t("rememberLastSortRuleDescription")}
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
                        label={t("rememberLastDestination")}
                        description={t("rememberLastDestinationDescription")}
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
                        label={t("unknownDateFolderName")}
                        description={t("unknownDateFolderNameDescription")}
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
                        label={t("historyRetention")}
                        description={t("historyRetentionDescription")}
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
                                                {t(retentionLabelKey(preset.days))}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        }
                    />
                    <SettingsRow
                        label={t("language")}
                        description={t("languageDescription")}
                        control={
                            <div className={SETTINGS_CONTROL_WIDTH}>
                                <Select
                                    value={settings.uiLanguage}
                                    onValueChange={handleLanguageChange}
                                >
                                    <SelectTrigger size="sm" className="rounded-md">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUPPORTED_LOCALES.map((entry) => (
                                            <SelectItem key={entry.code} value={entry.code}>
                                                {entry.nativeName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        }
                    />
                </ul>
            </Card>

            <div className="flex justify-end">
                <Button
                    variant="secondary"
                    onClick={() => void onReset()}
                    className={SETTINGS_CONTROL_SHAPE}
                >
                    {tCommon("reset")}
                </Button>
            </div>
        </ScreenFrame>
    );
}
