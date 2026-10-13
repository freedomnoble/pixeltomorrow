import { useEffect, useState } from "react";
import type { GameContent, GameState, Hotspot, DialogueChoice } from "@/game/types";
import { objectiveFor } from "@/game/engine";
import { SceneViewer } from "./SceneViewer";
import { DialogueOverlay } from "./DialogueOverlay";
import { EncounterPanel } from "./EncounterPanel";
import { DeathOverlay } from "./DeathOverlay";
import { MessageLog } from "./MessageLog";
import { InventoryBar } from "./InventoryBar";
import { TopBar } from "./TopBar";
import { HelpModal } from "./HelpModal";

interface Props {
  content: GameContent;
  state: GameState;
  actions: {
    clickHotspot: (hs: Hotspot) => void;
    selectItem: (id: string) => void;
    examineItem: (id: string) => void;
    clearSelection: () => void;
    chooseDialogue: (c: DialogueChoice) => void;
    continueDialogue: () => void;
    submitEncounter: (text: string) => void;
    finishEncounter: () => void;
    reloadCheckpoint: () => void;
    restart: () => void;
    toTitle: () => void;
  };
}

export default function GameScreen({ content, state, actions }: Props) {
  const [showLabels, setShowLabels] = useState(false);
  const [help, setHelp] = useState(false);
  const [saved, setSaved] = useState(false);
  const scene = content.scenes[state.scene];
  const busy = !!(state.dialogue || state.encounter || state.death);

  useEffect(() => {
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(t);
  }, [state.scene]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setHelp(false); actions.clearSelection(); }
      if (e.key.toLowerCase() === "h" && !state.encounter) setShowLabels((s) => !s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, state.encounter]);

  return (
    <div className="min-h-screen w-full grain">
      <div className="max-w-6xl mx-auto p-3 sm:p-6 flex flex-col gap-4 sm:gap-5" data-testid="game-screen">
        <TopBar
          sceneName={scene.name}
          objective={objectiveFor(state, scene.objective_default)}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels((s) => !s)}
          onHelp={() => setHelp(true)}
          onTitle={actions.toTitle}
          saved={saved}
        />

        <div className="retro-frame relative mx-auto w-full" style={{ maxWidth: "calc((100vh - 320px) * 16 / 9)", minWidth: "min(100%, 640px)" }}>
          <div className="relative aspect-video w-full overflow-hidden bg-black vignette" data-testid="scene-stage">
            <SceneViewer scene={scene} sceneId={state.scene} state={state} showLabels={showLabels} onHotspot={actions.clickHotspot} dimmed={busy} />
            {state.dialogue && (
              <DialogueOverlay
                dialogue={content.dialogues[state.dialogue.id]}
                nodeId={state.dialogue.node}
                portraits={content.portraits}
                state={state}
                onChoose={actions.chooseDialogue}
                onContinue={actions.continueDialogue}
              />
            )}
            {state.encounter && (
              <EncounterPanel encounter={content.encounters[state.encounter.id]} active={state.encounter} onSubmit={actions.submitEncounter} onFinish={actions.finishEncounter} />
            )}
            {state.death && <DeathOverlay death={state.death} deaths={state.deaths} onReload={actions.reloadCheckpoint} onRestart={actions.restart} />}
            {help && <HelpModal onClose={() => setHelp(false)} />}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:h-[220px]">
          <div className="md:col-span-2 min-h-0 h-[180px] md:h-auto">
            <MessageLog log={state.log} />
          </div>
          <div className="min-h-0">
            <InventoryBar inventory={state.inventory} items={content.items} selected={state.selectedItem} onSelect={actions.selectItem} onExamine={actions.examineItem} onClear={actions.clearSelection} />
          </div>
        </div>
        <p className="font-pixel text-[8px] text-[#3a4a44] text-right">THE TOMORROW KINGDOM · CHAPTER ONE · PRESS H TO REVEAL HOTSPOTS</p>
      </div>
    </div>
  );
}
