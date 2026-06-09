import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { useAppUpdateContext } from "@/hooks/app-update-context";
import { UPDATE_STATUS } from "@/hooks/use-app-update";

import { SettingsRow } from "./SettingsRow";

export function UpdatesRow() {
    const { t } = useTranslation("settings");
    const { state, checkForUpdates } = useAppUpdateContext();

    const checking = state.status === UPDATE_STATUS.checking;
    const hint = updateHintKey(state.status);

    return (
        <SettingsRow
            label={t("updates")}
            description={hint === null ? t("updatesDescription") : t(hint)}
            control={
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={checking}
                    onClick={() => {
                        void checkForUpdates();
                    }}
                >
                    {checking ? t("checkingForUpdates") : t("checkForUpdates")}
                </Button>
            }
        />
    );
}

function updateHintKey(status: string): "upToDate" | "updateCheckFailed" | null {
    if (status === UPDATE_STATUS.upToDate) {
        return "upToDate";
    }

    if (status === UPDATE_STATUS.error) {
        return "updateCheckFailed";
    }

    return null;
}
