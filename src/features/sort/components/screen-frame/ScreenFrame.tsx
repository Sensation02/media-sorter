import type { ReactNode } from "react";

export type ScreenFrameProps = {
    footer?: ReactNode;
    bodyClassName?: string;
    children: ReactNode;
};

const DEFAULT_BODY_CLASSES = "flex-1 overflow-y-auto px-7 py-7 space-y-7";
const FOOTER_CLASSES = "h-12 px-2 border-t border-border flex items-center gap-2 bg-surface-1";

export function ScreenFrame({ footer, bodyClassName, children }: ScreenFrameProps) {
    const bodyClasses = bodyClassName
        ? `${DEFAULT_BODY_CLASSES} ${bodyClassName}`
        : DEFAULT_BODY_CLASSES;

    return (
        <div className="flex flex-col h-full">
            <div data-slot="screen-frame-body" className={bodyClasses}>
                {children}
            </div>
            {footer !== undefined && <footer className={FOOTER_CLASSES}>{footer}</footer>}
        </div>
    );
}
