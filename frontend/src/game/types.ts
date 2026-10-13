export interface Requires {
  flags?: string[];
  not_flags?: string[];
  items?: string[];
}

export interface DeathDef {
  text: string;
  image?: string | null;
}

export interface Effects {
  set_flags?: string[];
  clear_flags?: string[];
  add_items?: string[];
  remove_items?: string[];
  goto?: string;
  death?: DeathDef;
  ending?: string;
}

export interface LookVariant {
  requires?: Requires;
  text: string;
}

export interface HotspotAction {
  type: "look" | "take" | "goto" | "talk" | "encounter" | "death";
  text?: string;
  taken_text?: string;
  variants?: LookVariant[];
  item?: string;
  target?: string;
  dialogue?: string;
  encounter?: string;
  requires?: Requires;
  requires_any?: Requires[];
  locked_text?: string;
  skip_after_flag?: string;
  effects?: Effects;
  image?: string | null;
}

export interface AcceptDef {
  requires?: Requires;
  text: string;
  effects?: Effects;
}

export interface Hotspot {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible_requires?: Requires;
  action: HotspotAction;
  accepts?: Record<string, AcceptDef>;
}

export interface Scene {
  name: string;
  image: string;
  objective_default: string;
  on_enter?: { once_flag: string; text: string; dialogue?: string };
  hotspots: Hotspot[];
}

export interface Item {
  name: string;
  icon: string;
  desc: string;
}

export interface Combination {
  items: string[];
  result: string;
  text: string;
}

export interface Portrait {
  src: string;
  pos: string;
  name: string;
}

export interface DialogueChoice {
  text: string;
  next?: string | null;
  requires?: Requires;
  effects?: Effects;
}

export interface DialogueNode {
  portrait: string;
  text: string;
  effects?: Effects;
  choices: DialogueChoice[];
}

export interface Dialogue {
  start: string;
  nodes: Record<string, DialogueNode>;
}

export interface EncounterStep {
  telegraph: string;
  hints: string[];
}

export interface Encounter {
  title: string;
  image: string;
  filter: string;
  intro: string;
  steps: EncounterStep[];
  win_text: string;
  win_effects?: Effects;
}

export interface Ending {
  title: string;
  image: string;
  text: string[];
  footer: string;
}

export interface GameContent {
  version: number;
  start_scene: string;
  scenes: Record<string, Scene>;
  items: Record<string, Item>;
  dialogues: Record<string, Dialogue>;
  encounters: Record<string, Encounter>;
  endings: Record<string, Ending>;
  combinations: Combination[];
  portraits: Record<string, Portrait>;
  intents: string[];
}

export interface LogEntry {
  id: number;
  kind: "narration" | "player" | "system" | "speaker";
  speaker?: string;
  text: string;
}

export interface ActiveDialogue {
  id: string;
  node: string;
}

export interface ActiveEncounter {
  id: string;
  step: number;
  log: LogEntry[];
  busy: boolean;
  target: string;
  won: boolean;
}

export interface ActiveDeath {
  text: string;
  image?: string | null;
}

export interface GameState {
  scene: string;
  flags: string[];
  inventory: string[];
  log: LogEntry[];
  selectedItem: string | null;
  dialogue: ActiveDialogue | null;
  encounter: ActiveEncounter | null;
  death: ActiveDeath | null;
  ending: string | null;
  deaths: number;
  startedAt: number;
}

export interface ActResponse {
  parsed: { intent: string | null; target: string | null; confidence: number };
  result: "advance" | "stay" | "death" | "win";
  text: string;
  effects?: Effects;
  next_step: number;
  hints: string[];
  win_text?: string;
  win_effects?: Effects;
}
