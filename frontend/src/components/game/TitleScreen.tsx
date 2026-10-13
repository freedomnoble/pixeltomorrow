import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, toggleMute, sfx } from "@/game/sounds";

interface Props {
  hasSave: boolean;
  onNew: () => void;
  onContinue: () => void;
  loading: boolean;
  error: string | null;
}

export default function TitleScreen({ hasSave, onNew, onContinue, loading, error }: Props) {
  const [muted, setMuted] = useState(isMuted());
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !loading) (hasSave ? onContinue : onNew)();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasSave, onContinue, onNew, loading]);

  const handleNew = () => {
    if (hasSave && !confirmNew) { setConfirmNew(true); return; }
    sfx.click();
    onNew();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 grain" data-testid="title-screen">
      <div className="retro-frame w-full max-w-5xl relative overflow-hidden title-in">
        <div className="relative aspect-video w-full bg-black vignette">
          <img src="/assets/forest_edge.jpg" alt="" className="scene-img" style={{ filter: "brightness(0.55) saturate(0.9)" }} />
          <div className="absolute inset-0 flex flex-col items-start justify-end p-6 sm:p-12 gap-5 sm:gap-7">
            <div>
              <p className="font-pixel text-[9px] sm:text-[11px] text-[#ffb834] tracking-[0.3em] mb-3 sm:mb-4" data-testid="title-kicker">A RETRO FANTASY ADVENTURE</p>
              <h1 className="font-pixel text-2xl sm:text-4xl lg:text-5xl text-[#f4e8c1] leading-[1.35] drop-shadow-[4px_4px_0_#000]" data-testid="title-heading">
                THE TOMORROW<br />KINGDOM
              </h1>
              <p className="font-body text-lg sm:text-2xl text-[#b8a882] mt-3 sm:mt-4 max-w-md">Tomorrow is late. Someone has to go get it.</p>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
              {hasSave && (
                <button className="retro-btn pulse-gold" onClick={() => { sfx.click(); onContinue(); }} disabled={loading} data-testid="continue-game-button">
                  ▶ Continue
                </button>
              )}
              <button className={`retro-btn ${!hasSave ? "pulse-gold" : ""}`} onClick={handleNew} disabled={loading} data-testid="new-game-button">
                {confirmNew ? "Erase save & start?" : "New Game"}
              </button>
              {confirmNew && (
                <button className="retro-btn" onClick={() => setConfirmNew(false)} data-testid="cancel-new-game-button">Cancel</button>
              )}
              <button className="retro-btn !px-3" onClick={() => setMuted(toggleMute())} aria-label="Toggle sound" data-testid="title-mute-button">
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
            {loading && <p className="font-pixel text-[10px] text-[#b8a882] blink" data-testid="title-loading">LOADING THE KINGDOM...</p>}
            {error && <p className="font-pixel text-[10px] text-[#e63946]" data-testid="title-error">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
