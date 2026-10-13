import { useEffect } from "react";
import type { ActiveDeath } from "@/game/types";

interface Props {
  death: ActiveDeath;
  deaths: number;
  onReload: () => void;
  onRestart: () => void;
}

export const DeathOverlay = ({ death, deaths, onReload, onRestart }: Props) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter") onReload(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onReload]);

  return (
    <div className="absolute inset-0 z-30 shake" data-testid="death-screen">
      {death.image && <img src={death.image} alt="" className="scene-img absolute inset-0" />}
      <div className={`absolute inset-0 ${death.image ? "bg-black/55" : "death-bg"} flex flex-col items-start justify-end p-5 sm:p-10 gap-4`}>
        <p className="font-pixel text-xl sm:text-3xl text-[#e63946] drop-shadow-[4px_4px_0_#000] tracking-widest" data-testid="death-title">YOU HAVE DIED</p>
        <p className="font-body text-lg sm:text-2xl text-[#f4e8c1] max-w-2xl leading-snug drop-shadow-[2px_2px_0_#000]" data-testid="death-text">{death.text}</p>
        <p className="font-pixel text-[9px] text-[#b8a882]">DEATHS SO FAR: {deaths}</p>
        <div className="flex flex-wrap gap-3">
          <button className="retro-btn pulse-gold" onClick={onReload} data-testid="reload-checkpoint-button">↻ Reload checkpoint</button>
          <button className="retro-btn danger" onClick={onRestart} data-testid="restart-adventure-button">Restart adventure</button>
        </div>
      </div>
    </div>
  );
};
