import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { JobId } from "../../../../types/ipc";
import { HISTORY_STATUS, type HistoryHookState } from "../../hooks/use-history";
import { Centered } from "./Centered";
import { HistoryRow } from "./HistoryRow";

export type HistoryScreenProps = {
    state: HistoryHookState;
    onRevert: (jobId: JobId) => void;
    onRetry: () => void;
    nowMs?: number;
};

export function HistoryScreen({ state, onRevert, onRetry, nowMs }: HistoryScreenProps) {
    const { t } = useTranslation("history");
    const { t: tCommon } = useTranslation("common");
    const [mountedNowMs] = useState(() => Date.now());
    const referenceNowMs = nowMs ?? mountedNowMs;

    if (state.status === HISTORY_STATUS.loading) {
        return <Centered>{t("loading")}</Centered>;
    }

    if (state.status === HISTORY_STATUS.error) {
        return (
            <Centered>
                <p className="text-body mb-3">{state.error.title}</p>
                <Button variant="ghost" size="sm" onClick={onRetry}>
                    {tCommon("tryAgain")}
                </Button>
            </Centered>
        );
    }

    if (state.items.length === 0) {
        return <Centered>{t("emptyState")}</Centered>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-7 py-7">
                <Card className="overflow-hidden">
                    <ul className="divide-y divide-divider-soft">
                        {state.items.map((job) => (
                            <HistoryRow
                                key={job.id}
                                job={job}
                                nowMs={referenceNowMs}
                                onRevert={onRevert}
                            />
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
}
