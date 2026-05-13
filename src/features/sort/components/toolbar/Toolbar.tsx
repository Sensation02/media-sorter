import { StatusDot } from "../status-dot";
import type { SortStatus } from "../../../../types/sort";

export type ToolbarProps = {
    jobName: string;
    status?: SortStatus;
    subtitle?: string | undefined;
};

export function Toolbar({ jobName, status = "idle", subtitle }: ToolbarProps) {
    return (
        <header className="h-12 px-5 border-b border-border flex items-center gap-3 bg-surface-1">
            <StatusDot status={status} />
            <div className="flex items-baseline gap-2">
                <h1 className="text-title font-medium tracking-[-0.1px]">{jobName}</h1>
                {subtitle && (
                    <span className="font-mono text-meta-sm text-fg-3">
                        {"· "}
                        {subtitle}
                    </span>
                )}
            </div>
        </header>
    );
}
