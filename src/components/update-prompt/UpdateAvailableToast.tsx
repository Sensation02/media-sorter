import { useTranslation } from "react-i18next";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export type UpdateAvailableToastProps = {
    version: string;
    onUpdate: () => void;
    onLater: () => void;
};

export function UpdateAvailableToast({ version, onUpdate, onLater }: UpdateAvailableToastProps) {
    const { t } = useTranslation("common");

    return (
        <div className="flex w-full items-start gap-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                    <span className="text-body font-medium text-fg-1">
                        {t("updateAvailableTitle")}
                    </span>
                    <span className="text-meta text-fg-3">
                        {t("updateAvailableDescription", { version })}
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={onUpdate}>
                        {t("updateNow")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onLater}>
                        {t("updateLater")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
