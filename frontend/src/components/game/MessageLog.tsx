import { useEffect, useRef } from "react";
import type { LogEntry } from "@/game/types";

export const MessageLog = ({ log }: { log: LogEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }); }, [log.length]);
  return (
    <div className="retro-panel h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 pt-2">
        <p className="font-pixel text-[8px] text-[#b8a882] tracking-widest">CHRONICLE</p>
        <span className="font-pixel text-[8px] text-[#3a4a44]">{log.length}</span>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0" data-testid="message-log">
        {log.slice(-30).map((l) => (
          <p key={l.id} className={`log-entry log-${l.kind} font-body text-lg sm:text-[21px] leading-snug`} data-testid={`log-${l.kind}`}>
            {l.kind === "speaker" && <b>{l.speaker}</b>}
            {l.text}
          </p>
        ))}
        <span className="font-body text-[#ffb834] blink">▌</span>
      </div>
    </div>
  );
};
