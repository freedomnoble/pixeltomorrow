import type { Item } from "@/game/types";
import { ItemIcon } from "./ItemIcon";

interface Props {
  inventory: string[];
  items: Record<string, Item>;
  selected: string | null;
  onSelect: (id: string) => void;
  onExamine: (id: string) => void;
  onClear: () => void;
}

const SLOTS = 8;

export const InventoryBar = ({ inventory, items, selected, onSelect, onExamine, onClear }: Props) => {
  const sel = selected ? items[selected] : null;
  return (
    <div className="retro-panel h-full flex flex-col p-3 gap-2 min-h-0">
      <div className="flex items-center justify-between">
        <p className="font-pixel text-[8px] text-[#b8a882] tracking-widest">PACK</p>
        <span className="font-pixel text-[8px] text-[#3a4a44]">{inventory.length}/{SLOTS}</span>
      </div>
      <div className="grid grid-cols-4 gap-2" data-testid="inventory-bar">
        {Array.from({ length: SLOTS }).map((_, i) => {
          const id = inventory[i];
          if (!id) return <div key={i} className="item-slot empty" data-testid={`inventory-slot-empty-${i}`} />;
          return (
            <button
              key={id}
              className={`item-slot ${selected === id ? "selected" : ""}`}
              title={items[id].name}
              onClick={() => onSelect(id)}
              onDoubleClick={() => onExamine(id)}
              data-testid={`inventory-item-${id}`}
            >
              <ItemIcon icon={items[id].icon} />
            </button>
          );
        })}
      </div>
      <div className="mt-auto min-h-[52px] border-t-2 border-dashed border-[#3a4a44] pt-2" data-testid="inventory-status">
        {sel ? (
          <div className="flex flex-col gap-1">
            <p className="font-body text-lg text-[#ffb834] leading-tight">{sel.name} selected — click a hotspot or another item.</p>
            <div className="flex gap-2">
              <button className="font-pixel text-[8px] text-[#b8a882] hover:text-[#ffb834] underline underline-offset-4" onClick={() => onExamine(selected!)} data-testid="examine-item-button">EXAMINE</button>
              <button className="font-pixel text-[8px] text-[#b8a882] hover:text-[#ffb834] underline underline-offset-4" onClick={onClear} data-testid="clear-selection-button">CANCEL</button>
            </div>
          </div>
        ) : (
          <p className="font-body text-base text-[#5f6c66] leading-tight">Click an item to use it on the scene. Click two items to combine. Double-click to examine.</p>
        )}
      </div>
    </div>
  );
};
