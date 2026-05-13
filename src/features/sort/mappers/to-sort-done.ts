import type { SortDoneDto } from "../../../types/ipc";
import type { SortDone } from "../../../types/sort";
import { formatHistoryDuration } from "./history-format";

export function toSortDone(dto: SortDoneDto): SortDone {
    return {
        duration: formatHistoryDuration(dto.durationMs),
        moved: dto.moved,
        skipped: dto.skipped,
        folders: dto.folders,
        destination: dto.destination,
    };
}
