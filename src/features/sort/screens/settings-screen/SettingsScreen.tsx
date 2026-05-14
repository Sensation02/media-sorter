import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import type { AppSettingsDto } from "../../../../types/ipc";
import { SETTINGS_STATUS, type SettingsHookState } from "../../hooks/use-settings";
import { SettingsForm } from "./SettingsForm";

export type SettingsScreenProps = {
    state: SettingsHookState;
    onSave: (next: AppSettingsDto) => Promise<AppSettingsDto>;
    onReset: () => Promise<AppSettingsDto>;
    onRetry: () => void;
};

export function SettingsScreen({ state, onSave, onReset, onRetry }: SettingsScreenProps) {
    const { t } = useTranslation("settings");
    const { t: tCommon } = useTranslation("common");

    if (state.status === SETTINGS_STATUS.loading) {
        return (
            <div className="flex h-full items-center justify-center text-body text-fg-3">
                {t("loading")}
            </div>
        );
    }

    if (state.status === SETTINGS_STATUS.error) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="text-body">{state.error.title}</div>
                <div className="text-meta text-fg-3">{state.error.detail}</div>
                <Button variant="ghost" size="sm" onClick={onRetry}>
                    {tCommon("retry")}
                </Button>
            </div>
        );
    }

    return <SettingsForm settings={state.settings} onSave={onSave} onReset={onReset} />;
}
