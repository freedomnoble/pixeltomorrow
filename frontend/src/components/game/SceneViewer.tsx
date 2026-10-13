import type { GameState, Hotspot, Scene } from "@/game/types";
import { meets } from "@/game/engine";
import { sfx } from "@/game/sounds";

interface Props {
  scene: Scene;
  sceneId: string;
  state: GameState;
  showLabels: boolean;
  onHotspot: (hs: Hotspot) => void;
  dimmed: boolean;
}

export const SceneViewer = ({ scene, sceneId, state, showLabels, onHotspot, dimmed }: Props) => {
  const visible = scene.hotspots.filter((h) => meets(h.visible_requires, state));
  return (
    <div className={`absolute inset-0 ${showLabels ? "show-labels" : ""}`} data-testid={`scene-${sceneId}`}>
      <img key={sceneId} src={scene.image} alt={scene.name} className="scene-img scene-in" draggable={false} />
      {!dimmed && visible.map((hs) => (
        <button
          key={hs.id}
          className="hotspot"
          style={{ left: `${hs.x}%`, top: `${hs.y}%`, width: `${hs.w}%`, height: `${hs.h}%`, cursor: state.selectedItem ? "cell" : "pointer" }}
          onMouseEnter={() => sfx.hover()}
          onClick={() => onHotspot(hs)}
          aria-label={hs.label}
          data-testid={`hotspot-${hs.id}`}
        >
          <span className="hotspot-label">{hs.label}</span>
        </button>
      ))}
    </div>
  );
};
