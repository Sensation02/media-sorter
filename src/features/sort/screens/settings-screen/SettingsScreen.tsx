import { Card } from "../../components/card";
import { Toggle } from "../../components/toggle";
import type { SortSettings } from "../../../../types/sort";

export type SettingsScreenProps = {
  settings: SortSettings;
  onChange: (key: keyof SortSettings, value: boolean) => void;
};

const ROWS: {
  key: keyof SortSettings;
  title: string;
  hint: string;
}[] = [
  {
    key: "copy",
    title: "Copy instead of move",
    hint: "Originals stay where they are.",
  },
  {
    key: "skipDuplicates",
    title: "Skip duplicates",
    hint: "Identical files are not re-copied.",
  },
  {
    key: "watchSource",
    title: "Watch source folder",
    hint: "Auto-sort new files added later.",
  },
  {
    key: "writeReport",
    title: "Write report.json",
    hint: "Save a manifest in the destination root.",
  },
];

export function SettingsScreen({ settings, onChange }: SettingsScreenProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-7 py-7">
        <Card className="overflow-hidden">
          <ul className="divide-y divide-white/[.04]">
            {ROWS.map((row) => (
              <li key={row.key} className="px-4 py-3.5 flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[13px]">{row.title}</div>
                  <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">{row.hint}</div>
                </div>
                <Toggle
                  checked={settings[row.key]}
                  onChange={(value) => {
                    onChange(row.key, value);
                  }}
                />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
