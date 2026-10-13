import { useEffect, useState } from "react";
import "@/App.css";
import type { GameContent } from "@/game/types";
import { fetchContent } from "@/game/api";
import { useGame } from "@/game/useGame";
import TitleScreen from "@/components/game/TitleScreen";
import GameScreen from "@/components/game/GameScreen";
import EndingScreen from "@/components/game/EndingScreen";

function App() {
  const [content, setContent] = useState<GameContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const game = useGame(content);

  useEffect(() => {
    fetchContent().then(setContent).catch(() => setError("The kingdom could not be reached. Refresh to try again."));
  }, []);

  useEffect(() => { document.title = "The Tomorrow Kingdom"; }, []);

  if (game.screen === "title" || !content || !game.state) {
    return <TitleScreen hasSave={game.hasSave} onNew={game.startNew} onContinue={game.continueGame} loading={!content && !error} error={error} />;
  }

  if (game.state.ending) {
    const ending = content.endings[game.state.ending];
    const minutes = Math.max(1, Math.round((Date.now() - game.state.startedAt) / 60000));
    return <EndingScreen ending={ending} deaths={game.state.deaths} minutes={minutes} onRestart={game.restart} onTitle={game.toTitle} />;
  }

  return (
    <GameScreen
      content={content}
      state={game.state}
      actions={{
        clickHotspot: game.clickHotspot,
        selectItem: game.selectItem,
        examineItem: game.examineItem,
        clearSelection: game.clearSelection,
        chooseDialogue: game.chooseDialogue,
        continueDialogue: game.continueDialogue,
        submitEncounter: game.submitEncounter,
        finishEncounter: game.finishEncounter,
        reloadCheckpoint: game.reloadCheckpoint,
        restart: game.restart,
        toTitle: game.toTitle,
      }}
    />
  );
}

export default App;
