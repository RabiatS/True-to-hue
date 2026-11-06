import React, { useEffect, useState } from "react";
import type { ThemeData } from "@/shared/themeTypes.ts";
import {
  clearHistory,
  isHistoryAvailable,
  loadHistory,
  removeFromHistory,
  type ThemeHistoryEntry
} from "../services/themeHistory.ts";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenEntry: (theme: ThemeData) => void;
};

export default function HistoryPanel({ open, onClose, onOpenEntry }: Props) {
  const [entries, setEntries] = useState<ThemeHistoryEntry[]>([]);
  const [confirmingClear, setConfirmingClear] = useState(false);

  // Re-read on every open so the list reflects generations from this session
  // as well as anything stored in a previous one.
  useEffect(() => {
    if (open) {
      setEntries(loadHistory());
      setConfirmingClear(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const storageBlocked = !isHistoryAvailable();

  const handleDelete = (id: string) => {
    setEntries(removeFromHistory(id));
  };

  const handleClearAll = () => {
    clearHistory();
    setEntries([]);
    setConfirmingClear(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
    >
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col border border-white/15 bg-[#0f0f0f] text-[#F5F5F0] shadow-2xl font-mono">
        <div className="px-5 py-4 border-b border-white/10 flex justify-between items-start gap-4">
          <div>
            <h2 id="history-title" className="text-sm tracking-[0.2em] uppercase">
              History
            </h2>
            <p className="text-[11px] mt-2 leading-relaxed text-[#A0A09A]">
              Saved in <strong className="text-[#F5F5F0]">this browser only</strong>. Clearing your browser data erases
              it, and it is never uploaded anywhere.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-[10px] tracking-widest uppercase text-[#A0A09A] hover:text-white border border-white/20 px-2 py-1"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {storageBlocked ? (
            <p className="px-5 py-8 text-[11px] leading-relaxed text-[#A0A09A]">
              This browser is blocking local storage, so history cannot be saved. Turn off private browsing, or allow
              site data for this page.
            </p>
          ) : entries.length === 0 ? (
            <p className="px-5 py-8 text-[11px] leading-relaxed text-[#A0A09A]">
              No saved systems yet. Every system you generate is added here automatically.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {entries.map((entry) => (
                <li key={entry.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex shrink-0" aria-hidden="true">
                    {entry.swatches.map((hex, i) => (
                      <span
                        key={`${entry.id}-${i}`}
                        className="w-5 h-8 border-r border-black/40 last:border-r-0"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate">{entry.themeName}</p>
                    <p className="text-[10px] text-[#A0A09A] truncate mt-1">
                      {entry.appName} · {entry.mode?.toUpperCase()} · {formatWhen(entry.savedAt)}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenEntry(entry.theme)}
                      className="bg-[#A81C1C] text-white px-3 py-2 text-[10px] tracking-[0.15em] uppercase"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      aria-label={`Delete ${entry.themeName}`}
                      className="border border-white/20 text-[#A0A09A] px-3 py-2 text-[10px] tracking-[0.15em] uppercase hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {entries.length > 0 ? (
          <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-[10px] text-[#666]">
              {entries.length} saved · newest 25 kept
            </span>
            {confirmingClear ? (
              <span className="flex items-center gap-2">
                <span className="text-[10px] text-[#A0A09A]">Delete all?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-[#A81C1C] text-white px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase"
                >
                  Yes, clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="border border-white/20 text-[#A0A09A] px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase hover:text-white"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="border border-white/20 text-[#A0A09A] px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase hover:text-white"
              >
                Clear all
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatWhen(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) {
    return "unknown date";
  }
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
