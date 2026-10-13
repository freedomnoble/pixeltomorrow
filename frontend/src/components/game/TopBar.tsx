import { useState } from "react";
import { Volume2, VolumeX, HelpCircle, Eye, EyeOff, Home, Save } from "lucide-react";
import { isMuted, toggleMute, sfx } from "@/game/sounds";

interface Props {
  sceneName: string;
  objective: string;
  showLabels: boolean;
  onToggleLabels: () => void;
  onHelp: () => void;
  onTitle: () => void;
  saved: boolean;
}

export const TopBar = ({ sceneName, objective, showLabels, onToggleLabels, onHelp, onTitle, saved }: Props) => {
  const [muted, setMuted] = useState(isMuted());
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-between" data-testid="top-bar">
      <div className="min-w-0">
        <p className="font-pixel text-[9px] text-[#e5a93c] tracking-widest truncate" data-testid="scene-name">{sceneName.toUpperCase()}</p>
        <p className="font-body text-lg sm:text-xl text-[#f4e8c1] leading-tight truncate" data-testid="objective-text">
          <span className="text-[#b8a882]">Quest: </span>{objective}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-pixel text-[8px] text-[#2a6e49] flex items-center gap-1 transition-opacity ${saved ? "opacity-100" : "opacity-0"}`} data-testid="autosave-indicator"><Save size={10} /> SAVED</span>
        <button className="retro-btn !px-3 !py-2" onClick={() => { sfx.click(); onToggleLabels(); }} title="Show hotspots" data-testid="toggle-hotspots-button">
          {showLabels ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        <button className="retro-btn !px-3 !py-2" onClick={() => setMuted(toggleMute())} title="Sound" data-testid="mute-button">
          {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
        <button className="retro-btn !px-3 !py-2" onClick={() => { sfx.click(); onHelp(); }} title="Help" data-testid="help-button">
          <HelpCircle size={13} />
        </button>
        <button className="retro-btn !px-3 !py-2" onClick={() => { sfx.click(); onTitle(); }} title="Title screen" data-testid="title-button">
          <Home size={13} />
        </button>
      </div>
    </div>
  );
};
