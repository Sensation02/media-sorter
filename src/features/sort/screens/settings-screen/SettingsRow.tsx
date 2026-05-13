import type { ReactNode } from "react";

import { Eyebrow } from "../../components/eyebrow";

export type SettingsRowProps = {
    label: string;
    description: string;
    control: ReactNode;
};

export function SettingsRow({ label, description, control }: SettingsRowProps) {
    return (
        <li className="px-4 py-3.5 flex items-center gap-4">
            <div className="flex-1">
                <Eyebrow tone="muted">{label}</Eyebrow>
                <div className="font-mono text-meta text-fg-3 mt-0.5">{description}</div>
            </div>
            {control}
        </li>
    );
}
