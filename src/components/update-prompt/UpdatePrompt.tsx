import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "sonner";

import { useAppUpdateContext } from "@/hooks/app-update-context";
import { UPDATE_STATUS } from "@/hooks/use-app-update";
import { UpdateAvailableToast } from "./UpdateAvailableToast";

const UPDATE_TOAST_ID = "app-update";

export function UpdatePrompt() {
    const { t } = useTranslation("common");
    const { state, downloadAndInstall, dismiss } = useAppUpdateContext();

    useEffect(() => {
        if (state.status === UPDATE_STATUS.available) {
            toast.custom(
                () => (
                    <UpdateAvailableToast
                        version={state.version}
                        onUpdate={() => {
                            void downloadAndInstall();
                        }}
                        onLater={() => {
                            toast.dismiss(UPDATE_TOAST_ID);
                            dismiss();
                        }}
                    />
                ),
                { id: UPDATE_TOAST_ID, duration: Infinity },
            );

            return;
        }

        if (state.status === UPDATE_STATUS.downloading) {
            toast.loading(t("updateDownloading"), { id: UPDATE_TOAST_ID, duration: Infinity });

            return;
        }

        if (state.status === UPDATE_STATUS.installed) {
            toast.success(t("updateInstalledTitle"), {
                id: UPDATE_TOAST_ID,
                description: t("updateInstalledDescription"),
                duration: Infinity,
            });

            return;
        }

        if (state.status === UPDATE_STATUS.downloadError) {
            toast.error(state.error.title, {
                id: UPDATE_TOAST_ID,
                description: state.error.detail,
            });
        }
    }, [state, downloadAndInstall, dismiss, t]);

    return null;
}
