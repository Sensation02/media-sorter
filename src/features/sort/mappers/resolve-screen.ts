import { SORT_SCREEN, type SortScreen } from "../constants/screens";
import type { SortJobStatus } from "../use-sort-job";

export function resolveScreen(screen: SortScreen, jobStatus: SortJobStatus): SortScreen {
    if (screen !== SORT_SCREEN.progress) {
        return screen;
    }

    if (jobStatus === "done") {
        return SORT_SCREEN.done;
    }

    if (jobStatus === "error") {
        return SORT_SCREEN.setup;
    }

    return SORT_SCREEN.progress;
}
