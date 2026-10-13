import { useEffect, useRef, useState } from "react";
import type { ActiveEncounter, Encounter } from "@/game/types";
import { sfx } from "@/game/sounds";

interface Props {
  encounter: Encounter;
  active: ActiveEncounter;
  onSubmit: (text: string) => void;
  onFinish: () => void;
}

export const EncounterPanel = ({ encounter, active, onSubmit, onFinish }: Props) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const hints = encounter.steps[Math.min(active.step, encounter.steps.length - 1)].hints;

  useEffect(() => { inputRef.current?.focus(); }, [active.busy]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [active.log.length]);

  const submit = () => {
    if (!text.trim() || active.busy) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col" data-testid="encounter-panel">
      <img src={encounter.image} alt="" className="scene-img absolute inset-0" style={{ filter: encounter.filter }} />
      <div className="relative flex-1 flex flex-col p-3 sm:p-5 gap-3 min-h-0">
        <div className="flex items-center justify-between">
          <p className="font-pixel text-[10px] sm:text-xs text-[#e63946] drop-shadow-[2px_2px_0_#000] tracking-widest" data-testid="encounter-title">⚔ {encounter.title}</p>
          <p className="font-pixel text-[9px] text-[#b8a882] drop-shadow-[2px_2px_0_#000]">ROUND {Math.min(active.step + 1, encounter.steps.length)} / {encounter.steps.length}</p>
        </div>
        <div ref={logRef} className="retro-panel flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 min-h-0" data-testid="encounter-log">
          {active.log.map((l) => (
            <p key={l.id} className={`log-entry font-body text-lg sm:text-[21px] leading-snug log-${l.kind}`}>{l.text}</p>
          ))}
          {active.busy && <p className="font-pixel text-[9px] text-[#b8a882] blink">...</p>}
        </div>
        {active.won ? (
          <div className="flex justify-end">
            <button className="retro-btn pulse-gold" onClick={onFinish} data-testid="encounter-continue-button">Continue ▶</button>
          </div>
        ) : (
          <div className="retro-panel p-2 sm:p-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <span className="font-pixel text-[#ffb834] text-xs self-center pl-1">&gt;</span>
              <input
                ref={inputRef}
                className="typed-input"
                value={text}
                onChange={(e) => { setText(e.target.value); sfx.type(); }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="What do you do? (type, then Enter)"
                disabled={active.busy}
                maxLength={120}
                data-testid="typed-action-input"
              />
              <button className="retro-btn whitespace-nowrap" onClick={submit} disabled={active.busy || !text.trim()} data-testid="typed-action-submit">Do it</button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-pixel text-[8px] text-[#b8a882]">IDEAS:</span>
              {hints.map((h) => (
                <button key={h} className="font-body text-base text-[#b8a882] hover:text-[#ffb834] underline decoration-dotted underline-offset-4" onClick={() => setText(h)} data-testid={`hint-${h.replace(/\s+/g, "-")}`}>{h}</button>
              ))}
              <span className="font-body text-base text-[#5f6c66] ml-auto hidden sm:inline">type "help" if stuck</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
