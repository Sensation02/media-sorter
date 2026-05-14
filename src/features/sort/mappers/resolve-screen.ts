import { SORT_SCREEN, type SortScreen } from "../constants/screens";
import { JOB_STATUS, type SortJobStatus } from "../hooks/use-sort-job";

export function resolveScreen(screen: SortScreen, jobStatus: SortJobStatus): SortScreen {
    if (screen !== SORT_SCREEN.progress) {
        return screen;
    }

    if (jobStatus === JOB_STATUS.error) {
        return SORT_SCREEN.setup;
    }

    return SORT_SCREEN.progress;
}
