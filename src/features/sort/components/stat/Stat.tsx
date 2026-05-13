import { Eyebrow } from "../eyebrow";

export type StatTone = "default" | "primary" | "warning" | "success";

export type StatProps = {
    label: string;
    value: string | number;
    tone?: StatTone;
};

const TONES: Record<StatTone, string> = {
    default: "text-fg-1",
    primary: "text-primary",
    warning: "text-warning",
    success: "text-success",
};

export function Stat({ label, value, tone = "default" }: StatProps) {
    return (
        <div className="flex-1 bg-surface-1 border border-border rounded-md px-3 py-2.5">
            <Eyebrow>{label}</Eyebrow>
            <div className={`font-mono text-stat font-medium leading-tight mt-0.5 ${TONES[tone]}`}>
                {value}
            </div>
        </div>
    );
}
