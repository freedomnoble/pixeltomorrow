import { useCallback, useEffect, useRef, useState } from "react";
import type { Effects, GameContent, GameState, Hotspot, DialogueChoice, LogEntry } from "./types";
import { applyEffects, entry, initialState, loadCheckpoint, loadGame, meets, meetsAny, saveCheckpoint, saveGame, clearSaves } from "./engine";
import { encounterAct, telemetry } from "./api";
import { sfx } from "./sounds";

const MAX_LOG = 80;

function push(state: GameState, ...entries: LogEntry[]): GameState {
  return { ...state, log: [...state.log, ...entries].slice(-MAX_LOG) };
}

function die(state: GameState, text: string, image?: string | null): GameState {
  sfx.death();
  telemetry("death", state.scene, { text });
  return { ...state, death: { text, image }, dialogue: null, encounter: null, selectedItem: null, deaths: state.deaths + 1 };
}

function finish(state: GameState, endingId: string): GameState {
  sfx.win();
  telemetry("ending", state.scene, { ending: endingId });
  return { ...state, ending: endingId, dialogue: null, encounter: null, selectedItem: null };
}

function resolveTerminal(state: GameState, effects: Effects | undefined, content: GameContent): GameState {
  if (!effects) return state;
  if (effects.death) return die(state, effects.death.text, effects.death.image);
  if (effects.ending) return finish(state, effects.ending);
  if (effects.goto) return enterScene(state, effects.goto, content);
  return state;
}

function enterDialogueNode(state: GameState, dialogueId: string, nodeId: string, content: GameContent): GameState {
  const node = content.dialogues[dialogueId].nodes[nodeId];
  const portrait = content.portraits[node.portrait];
  let next = applyEffects(state, node.effects);
  next = push(next, entry("speaker", node.text, portrait?.name));
  return { ...next, dialogue: { id: dialogueId, node: nodeId }, selectedItem: null };
}

export function enterScene(state: GameState, sceneId: string, content: GameContent): GameState {
  const scene = content.scenes[sceneId];
  if (!scene) return state;
  sfx.door();
  let next: GameState = { ...state, scene: sceneId, selectedItem: null, dialogue: null, encounter: null };
  next = push(next, entry("system", `— ${scene.name} —`));
  let autoDialogue: string | undefined;
  if (scene.on_enter && !next.flags.includes(scene.on_enter.once_flag)) {
    next = applyEffects(next, { set_flags: [scene.on_enter.once_flag] });
    next = push(next, entry("narration", scene.on_enter.text));
    autoDialogue = scene.on_enter.dialogue;
  }
  saveCheckpoint(next);
  if (autoDialogue) {
    const d = content.dialogues[autoDialogue];
    next = enterDialogueNode(next, autoDialogue, d.start, content);
  }
  return next;
}

export function useGame(content: GameContent | null) {
  const [state, setState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<"title" | "game">("title");
  const [hasSave, setHasSave] = useState<boolean>(() => !!localStorage.getItem("ttk_save_v1"));
  const stateRef = useRef<GameState | null>(null);
  stateRef.current = state;

  useEffect(() => {
    if (state && screen === "game" && !state.ending) {
      saveGame(state);
      setHasSave(true);
    }
  }, [state, screen]);

  const update = useCallback((fn: (s: GameState, c: GameContent) => GameState) => {
    if (!content) return;
    setState((s) => (s ? fn(s, content) : s));
  }, [content]);

  const startNew = useCallback(() => {
    if (!content) return;
    clearSaves();
    const s = enterScene(initialState(content.start_scene), content.start_scene, content);
    setState(s);
    setScreen("game");
    telemetry("new_game");
  }, [content]);

  const continueGame = useCallback(() => {
    const saved = loadGame();
    if (!saved) return;
    setState(push(saved, entry("system", "Save loaded. The fog remembers you.")));
    setScreen("game");
  }, []);

  const toTitle = useCallback(() => setScreen("title"), []);

  const clickHotspot = useCallback((hs: Hotspot) => {
    update((s, c) => {
      if (s.dialogue || s.encounter || s.death) return s;
      if (s.selectedItem) return applyItemOn(s, hs, s.selectedItem, c);
      const a = hs.action;
      sfx.click();
      switch (a.type) {
        case "look": {
          const v = a.variants?.find((x) => meets(x.requires, s));
          const text = v ? v.text : a.text || "";
          let next = applyEffects(s, a.effects);
          return push(next, entry("narration", text));
        }
        case "take": {
          const flag = `took_${a.item}`;
          if (s.flags.includes(flag)) return push(s, entry("narration", a.taken_text || "Nothing more here."));
          sfx.pickup();
          const next = applyEffects(s, { add_items: [a.item!], set_flags: [flag] });
          return push(next, entry("narration", a.text || ""), entry("system", `You take: ${c.items[a.item!]?.name}`));
        }
        case "goto": {
          if (!meets(a.requires, s) || !meetsAny(a.requires_any, s)) {
            sfx.locked();
            return push(s, entry("narration", a.locked_text || "You can't go that way yet."));
          }
          return enterScene(s, a.target!, c);
        }
        case "talk": {
          sfx.talk();
          const d = c.dialogues[a.dialogue!];
          return enterDialogueNode(s, a.dialogue!, d.start, c);
        }
        case "encounter": {
          if (!meets(a.requires, s) || !meetsAny(a.requires_any, s)) {
            sfx.locked();
            return push(s, entry("narration", a.locked_text || "Not yet."));
          }
          if (a.skip_after_flag && s.flags.includes(a.skip_after_flag)) return enterScene(s, a.target!, c);
          sfx.danger();
          const enc = c.encounters[a.encounter!];
          telemetry("encounter_start", s.scene, { encounter: a.encounter });
          return {
            ...s,
            selectedItem: null,
            encounter: {
              id: a.encounter!, step: 0, busy: false, target: a.target!, won: false,
              log: [entry("narration", enc.intro), entry("narration", enc.steps[0].telegraph)],
            },
          };
        }
        case "death":
          return die(s, a.text || "You die.", a.image);
        default:
          return s;
      }
    });
  }, [update]);

  const selectItem = useCallback((itemId: string) => {
    update((s, c) => {
      if (s.selectedItem === itemId) return { ...s, selectedItem: null };
      if (s.selectedItem) return combine(s, s.selectedItem, itemId, c);
      sfx.click();
      return { ...s, selectedItem: itemId };
    });
  }, [update]);

  const examineItem = useCallback((itemId: string) => {
    update((s, c) => push({ ...s, selectedItem: null }, entry("narration", `${c.items[itemId].name}: ${c.items[itemId].desc}`)));
  }, [update]);

  const clearSelection = useCallback(() => update((s) => ({ ...s, selectedItem: null })), [update]);

  const chooseDialogue = useCallback((choice: DialogueChoice) => {
    update((s, c) => {
      if (!s.dialogue) return s;
      sfx.click();
      let next = push(s, entry("player", choice.text));
      next = applyEffects(next, choice.effects);
      if (choice.effects?.death || choice.effects?.ending || choice.effects?.goto) {
        return resolveTerminal({ ...next, dialogue: null }, choice.effects, c);
      }
      if (!choice.next) return { ...next, dialogue: null };
      return enterDialogueNode(next, s.dialogue.id, choice.next, c);
    });
  }, [update]);

  const continueDialogue = useCallback(() => {
    update((s, c) => {
      if (!s.dialogue) return s;
      const node = c.dialogues[s.dialogue.id].nodes[s.dialogue.node];
      sfx.click();
      return resolveTerminal({ ...s, dialogue: null }, node.effects, c);
    });
  }, [update]);

  const submitEncounter = useCallback(async (text: string) => {
    const s = stateRef.current;
    if (!content || !s?.encounter || s.encounter.busy || !text.trim()) return;
    const enc = s.encounter;
    setState((p) => p && p.encounter ? { ...p, encounter: { ...p.encounter, busy: true, log: [...p.encounter.log, entry("player", text)] } } : p);
    try {
      const res = await encounterAct({ encounter_id: enc.id, step: enc.step, text, inventory: s.inventory, flags: s.flags });
      setState((p) => {
        if (!p || !p.encounter) return p;
        let next = applyEffects(p, res.effects);
        const def = content.encounters[enc.id];
        if (res.result === "death") return die(next, res.text, null);
        const log = [...p.encounter.log, entry("narration", res.text)];
        if (res.result === "win") {
          sfx.win();
          next = applyEffects(next, res.win_effects);
          log.push(entry("system", res.win_text || ""));
          return { ...next, encounter: { ...p.encounter, busy: false, won: true, log } };
        }
        if (res.result === "advance") {
          sfx.danger();
          log.push(entry("narration", def.steps[res.next_step].telegraph));
        }
        return { ...next, encounter: { ...p.encounter, busy: false, step: res.next_step, log } };
      });
    } catch {
      setState((p) => p && p.encounter ? { ...p, encounter: { ...p.encounter, busy: false, log: [...p.encounter.log, entry("system", "The world stutters. Try that again.")] } } : p);
    }
  }, [content]);

  const finishEncounter = useCallback(() => {
    update((s, c) => {
      if (!s.encounter?.won) return s;
      const def = c.encounters[s.encounter.id];
      const next = push(s, entry("system", def.win_text));
      return enterScene({ ...next, encounter: null }, s.encounter.target, c);
    });
  }, [update]);

  const reloadCheckpoint = useCallback(() => {
    const cp = loadCheckpoint();
    setState((s) => {
      if (!s) return s;
      const base = cp || s;
      sfx.door();
      return push({ ...base, death: null, dialogue: null, encounter: null, selectedItem: null, deaths: s.deaths },
        entry("system", "You return to where this scene began. The world pretends nothing happened."));
    });
  }, []);

  const restart = useCallback(() => startNew(), [startNew]);

  return {
    state, screen, hasSave,
    startNew, continueGame, toTitle, restart,
    clickHotspot, selectItem, examineItem, clearSelection,
    chooseDialogue, continueDialogue,
    submitEncounter, finishEncounter, reloadCheckpoint,
  };
}

function applyItemOn(s: GameState, hs: Hotspot, itemId: string, c: GameContent): GameState {
  const base = { ...s, selectedItem: null };
  const def = hs.accepts?.[itemId];
  const itemName = c.items[itemId]?.name || itemId;
  if (!def || !meets(def.requires, s)) {
    sfx.locked();
    return push(base, entry("narration", `You try the ${itemName} on the ${hs.label.toLowerCase()}. Nothing happens, except a faint sense of embarrassment.`));
  }
  sfx.combine();
  let next = applyEffects(base, def.effects);
  next = push(next, entry("player", `Use ${itemName} → ${hs.label}`), entry("narration", def.text));
  return resolveTerminal(next, def.effects, c);
}

function combine(s: GameState, a: string, b: string, c: GameContent): GameState {
  const base = { ...s, selectedItem: null };
  const combo = c.combinations.find((k) => k.items.includes(a) && k.items.includes(b));
  if (!combo) {
    sfx.locked();
    return push(base, entry("narration", `${c.items[a].name} and ${c.items[b].name} regard each other with mutual indifference.`));
  }
  sfx.combine();
  const next = applyEffects(base, { remove_items: [a, b], add_items: [combo.result] });
  return push(next, entry("player", `Combine ${c.items[a].name} + ${c.items[b].name}`), entry("narration", combo.text), entry("system", `You now have: ${c.items[combo.result].name}`));
}
