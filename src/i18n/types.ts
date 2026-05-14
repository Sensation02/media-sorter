import "react-i18next";

import type enCommon from "./en/common";
import type enDone from "./en/done";
import type enHistory from "./en/history";
import type enProgress from "./en/progress";
import type enRules from "./en/rules";
import type enSettings from "./en/settings";
import type enSetup from "./en/setup";

declare module "react-i18next" {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation
    interface CustomTypeOptions {
        defaultNS: "common";
        resources: {
            common: typeof enCommon;
            setup: typeof enSetup;
            progress: typeof enProgress;
            done: typeof enDone;
            history: typeof enHistory;
            settings: typeof enSettings;
            rules: typeof enRules;
        };
    }
}
