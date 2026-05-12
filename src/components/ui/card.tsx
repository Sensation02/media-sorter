import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-slot="card"
            className={cn("bg-surface-1 border border-border rounded-lg", className)}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
    return <div data-slot="card-header" className={cn("px-4 py-3", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
    return <div data-slot="card-content" className={cn("px-4 py-3", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn("px-4 py-3 flex items-center", className)}
            {...props}
        />
    );
}
