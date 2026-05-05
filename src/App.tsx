import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    const message = await invoke<string>("greet", { name });
    setGreetMsg(message);
  }

  return (
    <main className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">media-sorter</h1>
      <p className="text-[color:var(--color-muted)]">
        Desktop scaffold ready. Wire up your first command and walk the IPC path end-to-end.
      </p>

      <form
        className="flex w-full max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void greet();
        }}
      >
        <input
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
          onChange={(e) => {
            setName(e.currentTarget.value);
          }}
          placeholder="Enter a name…"
        />
        <button
          type="submit"
          className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 font-medium text-white transition hover:opacity-90"
        >
          Greet
        </button>
      </form>
      {greetMsg && <p className="text-sm text-[color:var(--color-muted)]">{greetMsg}</p>}
    </main>
  );
}

export default App;
