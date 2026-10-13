import type { Effects, GameState, LogEntry, Requires } from "./types";

export const SAVE_KEY = "ttk_save_v1";
export const CHECKPOINT_KEY = "ttk_checkpoint_v1";

let logId = 1;
export const nextLogId = () => logId++;

export function entry(kind: LogEntry["kind"], text: string, speaker?: string): LogEntry {
  return { id: nextLogId(), kind, text, speaker };
}

export function meets(req: Requires | undefined, state: Pick<GameState, "flags" | "inventory">): boolean {
  if (!req) return true;
  if (req.flags && !req.flags.every((f) => state.flags.includes(f))) return false;
  if (req.not_flags && req.not_flags.some((f) => state.flags.includes(f))) return false;
  if (req.items && !req.items.every((i) => state.inventory.includes(i))) return false;
  return true;
}

export function meetsAny(reqs: Requires[] | undefined, state: Pick<GameState, "flags" | "inventory">): boolean {
  if (!reqs || reqs.length === 0) return true;
  return reqs.some((r) => meets(r, state));
}

export function applyEffects(state: GameState, effects: Effects | undefined): GameState {
  if (!effects) return state;
  let flags = state.flags;
  let inventory = state.inventory;
  if (effects.set_flags) flags = Array.from(new Set([...flags, ...effects.set_flags]));
  if (effects.clear_flags) flags = flags.filter((f) => !effects.clear_flags!.includes(f));
  if (effects.remove_items) inventory = inventory.filter((i) => !effects.remove_items!.includes(i));
  if (effects.add_items) inventory = Array.from(new Set([...inventory, ...effects.add_items]));
  return { ...state, flags, inventory };
}

export function initialState(startScene: string): GameState {
  return {
    scene: startScene,
    flags: [],
    inventory: [],
    log: [],
    selectedItem: null,
    dialogue: null,
    encounter: null,
    death: null,
    ending: null,
    deaths: 0,
    startedAt: Date.now(),
  };
}

function serializable(state: GameState): GameState {
  return { ...state, dialogue: null, encounter: null, death: null, selectedItem: null, log: state.log.slice(-12) };
}

export function saveGame(state: GameState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(serializable(state)));
}

export function saveCheckpoint(state: GameState) {
  localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(serializable(state)));
}

export function loadGame(): GameState | null {
  return readKey(SAVE_KEY);
}

export function loadCheckpoint(): GameState | null {
  return readKey(CHECKPOINT_KEY);
}

export function clearSaves() {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(CHECKPOINT_KEY);
}

function readKey(key: string): GameState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    parsed.log = (parsed.log || []).map((l) => ({ ...l, id: nextLogId() }));
    return parsed;
  } catch {
    return null;
  }
}

export function objectiveFor(state: GameState, fallback: string): string {
  const f = state.flags;
  const inv = state.inventory;
  if (inv.includes("thread_of_tomorrow")) return "Bring the Thread of Tomorrow to Princess Elowen.";
  if (inv.includes("waking_orb")) return "Return the Waking Orb to the mage twins in the hidden cabin.";
  if (inv.includes("dim_orb")) return "The orb sleeps. Wake it with moonherb (combine items in your pack).";
  if (f.includes("twins_task")) return "Get the Orb of Infinity from Bram's shop in Hollowmere.";
  if (f.includes("met_princess")) return "Find the mage twins' hidden cabin in the Sleeping Woods.";
  if (f.includes("gate_opened") || f.includes("captain_left")) return "Speak with Princess Elowen.";
  if (f.includes("gargoyle_defeated")) return "Reach the castle gate and get past the guards.";
  if (f.includes("met_bram")) return "Cross the bridge and climb to Castle Aurelane.";
  if (f.includes("entered_village")) return "Find Bram's shop and talk to the merchant.";
  if (f.includes("read_carving")) return "Follow the light out of the woods.";
  return fallback;
}
