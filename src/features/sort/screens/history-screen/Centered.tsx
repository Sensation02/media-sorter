import type { ReactNode } from "react";

export type CenteredProps = {
    children: ReactNode;
};

export function Centered({ children }: CenteredProps) {
    return (
        <div className="h-full flex items-center justify-center text-body text-fg-3 flex-col">
            {children}
        </div>
    );
}
