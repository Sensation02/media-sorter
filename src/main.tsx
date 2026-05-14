import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getSettings } from "./ipc";
import { DEFAULT_LOCALE, initI18n, isSupportedLocale, type Locale } from "./i18n";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Root element #root not found");
}

await bootstrap();

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

async function bootstrap(): Promise<void> {
    const initialLocale = await resolveInitialLocale();
    await initI18n(initialLocale);
}

async function resolveInitialLocale(): Promise<Locale> {
    try {
        const settings = await getSettings();

        if (isSupportedLocale(settings.uiLanguage)) {
            return settings.uiLanguage;
        }

        return DEFAULT_LOCALE;
    } catch (error) {
        console.error("[main] get_settings failed during bootstrap", error);

        return DEFAULT_LOCALE;
    }
}
