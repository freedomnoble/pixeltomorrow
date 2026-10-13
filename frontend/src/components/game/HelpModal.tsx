export const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-4" onClick={onClose} data-testid="help-modal">
    <div className="retro-panel p-5 sm:p-7 max-w-xl w-full space-y-3" onClick={(e) => e.stopPropagation()}>
      <p className="font-pixel text-[10px] text-[#e5a93c] tracking-widest">HOW TO PLAY</p>
      <ul className="font-body text-lg sm:text-xl text-[#f4e8c1] space-y-2 leading-snug">
        <li><span className="text-[#ffb834]">Click</span> things in the scene to look, take, talk, or travel. Use the eye button to reveal hotspots.</li>
        <li><span className="text-[#ffb834]">Pack:</span> click an item, then a hotspot to use it. Click two items to combine them. Double-click to examine.</li>
        <li><span className="text-[#ffb834]">Dialogue:</span> pick a reply (keys 1–4 work). Some replies have consequences. Some are vertical.</li>
        <li><span className="text-[#ffb834]">Encounters:</span> type what you do — "dodge", "say tomorrow", "use lantern". The game understands plain words. Type "help" for ideas.</li>
        <li><span className="text-[#ffb834]">Death</span> returns you to where this scene began. The game autosaves whenever you move.</li>
      </ul>
      <div className="flex justify-end pt-1">
        <button className="retro-btn" onClick={onClose} data-testid="help-close-button">Close (Esc)</button>
      </div>
    </div>
  </div>
);
