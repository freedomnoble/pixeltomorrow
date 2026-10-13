import { useEffect } from "react";
import type { Dialogue, DialogueChoice, GameState, Portrait } from "@/game/types";
import { meets } from "@/game/engine";

interface Props {
  dialogue: Dialogue;
  nodeId: string;
  portraits: Record<string, Portrait>;
  state: GameState;
  onChoose: (c: DialogueChoice) => void;
  onContinue: () => void;
}

export const DialogueOverlay = ({ dialogue, nodeId, portraits, state, onChoose, onContinue }: Props) => {
  const node = dialogue.nodes[nodeId];
  const portrait = portraits[node.portrait];
  const choices = node.choices.filter((c) => meets(c.requires, state));
  const terminal = choices.length === 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (terminal && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onContinue(); return; }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= choices.length) onChoose(choices[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choices, terminal, onChoose, onContinue]);

  return (
    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 z-20" data-testid="dialogue-overlay">
      <div className="retro-panel flex flex-col sm:flex-row gap-3 sm:gap-5 p-3 sm:p-4 max-h-[78%]">
        <div className="shrink-0 flex sm:flex-col items-center sm:items-stretch gap-3">
          <div className="w-20 h-20 sm:w-32 sm:h-32 border-4 border-black shadow-[0_0_0_2px_var(--gold)] overflow-hidden bg-black">
            <img src={portrait.src} alt={portrait.name} className="w-full h-full object-cover" style={{ objectPosition: portrait.pos, imageRendering: "pixelated" }} data-testid="dialogue-portrait" />
          </div>
          <p className="font-pixel text-[9px] sm:text-[10px] text-[#e5a93c] sm:text-center leading-relaxed" data-testid="dialogue-speaker">{portrait.name}</p>
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <p className="font-body text-lg sm:text-[22px] leading-snug text-[#f4e8c1]" data-testid="dialogue-text">{node.text}</p>
          <div className="flex flex-col gap-1 mt-auto">
            {choices.map((c, i) => (
              <button key={i} className="choice-btn" data-index={i + 1} onClick={() => onChoose(c)} data-testid={`dialogue-choice-${i + 1}`}>
                {c.text}
              </button>
            ))}
            {terminal && (
              <button className="retro-btn self-end mt-1" onClick={onContinue} data-testid="dialogue-continue-button">Continue ▶</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
