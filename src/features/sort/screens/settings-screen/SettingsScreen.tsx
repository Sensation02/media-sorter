import { Button } from "@/components/ui/button";

import type { AppSettingsDto } from "../../../../types/ipc";
import type { SettingsHookState } from "../../use-settings";
import { SettingsForm } from "./SettingsForm";

export type SettingsScreenProps = {
    state: SettingsHookState;
    onSave: (next: AppSettingsDto) => Promise<AppSettingsDto>;
    onReset: () => Promise<AppSettingsDto>;
    onRetry: () => void;
};

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
