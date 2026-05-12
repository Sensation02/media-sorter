import type { SortRule } from "../../../types/sort";

export const DEFAULT_RULES: SortRule[] = [
    {
        id: "by-date-and-place",
        name: "By date and place",
        hint: "<Month Year>/<City, Country>",
        description: "Group by capture month, then by reverse-geocoded city.",
    },
    {
        id: "by-date",
        name: "By date",
        hint: "<Month Year>",
        description: "Group by capture month.",
    },
    {
        id: "by-type",
        name: "By type",
        hint: "Photos / Videos / RAW",
        description: "Group by file kind.",
    },
    {
        id: "by-camera",
        name: "By camera",
        hint: "EXIF make + model",
        description: "Group by camera make and model.",
    },
];
