import { Lamp, Coins, Stamp, Leaf, FlaskConical, Circle, Flame, Sparkles, Spline, Gem, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  lantern: Lamp,
  coin: Coins,
  seal: Stamp,
  herb: Leaf,
  oil: FlaskConical,
  orb: Circle,
  lit_lantern: Flame,
  waking_orb: Sparkles,
  thread: Spline,
  shard: Gem,
};

const COLORS: Record<string, string> = {
  lantern: "#9aa39c",
  coin: "#e5a93c",
  seal: "#5b7fd6",
  herb: "#b8d8ff",
  oil: "#ffb834",
  orb: "#6b6b7a",
  lit_lantern: "#ffb834",
  waking_orb: "#9fe3ff",
  thread: "#fff4aa",
  shard: "#c084fc",
};

export const ItemIcon = ({ icon, size = 28 }: { icon: string; size?: number }) => {
  const Cmp = ICONS[icon] || Package;
  return <Cmp size={size} strokeWidth={2.2} className="drop-shadow-[2px_2px_0_#000]" style={{ color: COLORS[icon] || "#f4e8c1" }} />;
};
