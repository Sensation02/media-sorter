import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [
                {
                    text: [
                        "eyebrow",
                        "meta-sm",
                        "meta",
                        "caption",
                        "body-sm",
                        "body",
                        "title",
                        "subtitle",
                        "stat",
                        "icon-lg",
                        "display",
                    ],
                },
            ],
            tracking: [
                {
                    tracking: ["eyebrow", "title", "display"],
                },
            ],
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return customTwMerge(clsx(inputs));
}
