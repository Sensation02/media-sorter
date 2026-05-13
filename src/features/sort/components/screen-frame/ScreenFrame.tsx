import type { ReactNode } from "react";

export type ScreenFrameFooterPadding = "default" | "tight";

export type ScreenFrameProps = {
    footer?: ReactNode;
    footerPadding?: ScreenFrameFooterPadding;
    bodyClassName?: string;
    children: ReactNode;
};

const DEFAULT_BODY_CLASSES = "flex-1 overflow-y-auto px-7 py-7 space-y-7";
const FOOTER_BASE = "h-12 border-t border-border flex items-center gap-2 bg-surface-1";
const FOOTER_PADDING: Record<ScreenFrameFooterPadding, string> = {
    default: "px-5",
    tight: "px-2 justify-end",
};

export function ScreenFrame({
    footer,
    footerPadding = "default",
    bodyClassName,
    children,
}: ScreenFrameProps) {
    const bodyClasses = bodyClassName
        ? `${DEFAULT_BODY_CLASSES} ${bodyClassName}`
        : DEFAULT_BODY_CLASSES;

    return (
        <div className="flex flex-col h-full">
            <div data-slot="screen-frame-body" className={bodyClasses}>
                {children}
            </div>
            {footer !== undefined && (
                <footer className={`${FOOTER_BASE} ${FOOTER_PADDING[footerPadding]}`}>
                    {footer}
                </footer>
            )}
        </div>
    );
}
