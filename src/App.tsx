import { SortApp } from "./features/sort";
import { AppUpdateProvider } from "./hooks/AppUpdateProvider";

export default function App() {
    return (
        <AppUpdateProvider>
            <SortApp />
        </AppUpdateProvider>
    );
}
