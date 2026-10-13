import { useEffect, useState } from "react";
import type { Ending } from "@/game/types";

interface Props {
  ending: Ending;
  deaths: number;
  minutes: number;
  onRestart: () => void;
  onTitle: () => void;
}

export default function EndingScreen({ ending, deaths, minutes, onRestart, onTitle }: Props) {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= ending.text.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), 1800);
    return () => clearTimeout(t);
  }, [shown, ending.text.length]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 grain" data-testid="ending-screen">
      <div className="retro-frame w-full max-w-5xl relative overflow-hidden title-in">
        <div className="relative aspect-video w-full bg-black vignette">
          <img src={ending.image} alt="" className="scene-img" style={{ filter: "brightness(0.5)" }} />
          <div className="absolute inset-0 p-5 sm:p-10 flex flex-col gap-3 overflow-y-auto">
            <p className="font-pixel text-[10px] sm:text-xs text-[#ffb834] tracking-[0.3em]" data-testid="ending-title">{ending.title.toUpperCase()}</p>
            <div className="flex-1 flex flex-col gap-2 sm:gap-3 max-w-2xl">
              {ending.text.slice(0, shown).map((t, i) => (
                <p key={i} className="log-entry font-body text-lg sm:text-2xl text-[#f4e8c1] leading-snug drop-shadow-[2px_2px_0_#000]">{t}</p>
              ))}
              {shown < ending.text.length && (
                <button className="font-pixel text-[9px] text-[#b8a882] text-left hover:text-[#ffb834]" onClick={() => setShown(ending.text.length)} data-testid="ending-skip-button">▼ skip</button>
              )}
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-pixel text-[9px] sm:text-[10px] text-[#e5a93c]">{ending.footer}</p>
                <p className="font-body text-base text-[#b8a882] mt-1" data-testid="ending-stats">Deaths: {deaths} · Time: {minutes} min</p>
              </div>
              <div className="flex gap-3">
                <button className="retro-btn" onClick={onTitle} data-testid="ending-title-button">Title</button>
                <button className="retro-btn pulse-gold" onClick={onRestart} data-testid="ending-restart-button">Play again</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
