import type { SortSettingsDto } from "../../../types/ipc";

export const IMMUTABLE_SORT_FLAGS: SortSettingsDto = {
    copy: false,
    skipDuplicates: true,
    watchSource: false,
    writeReport: true,
    probeBandwidth: true,
};
