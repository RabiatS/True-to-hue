import React, { useState } from "react";
import {
  clearUserApiSettings,
  defaultModelFor,
  loadUserApiSettings,
  saveUserApiSettings,
  type ThemeProviderId
} from "../services/userApiSettings.ts";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const PROVIDERS: { id: ThemeProviderId; label: string; hint: string }[] = [
  {
    id: "openai",
    label: "OpenAI",
    hint: "Dashboard → API keys"
  },
  {
    id: "gemini",
    label: "Google Gemini",
    hint: "Google AI Studio"
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    hint: "Console API keys"
  }
];

export default function ApiKeyModal({ open, onClose, onSaved }: Props) {
  const existing = loadUserApiSettings();
  const [provider, setProvider] = useState<ThemeProviderId>(existing?.provider ?? "openai");
  const [apiKey, setApiKey] = useState(existing?.apiKey ?? "");
  const [model, setModel] = useState(existing?.model?.trim() ? existing.model : defaultModelFor(existing?.provider ?? "openai"));

  if (!open) {
    return null;
  }

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      alert("Paste your API key or use Clear to remove a saved key.");
      return;
    }
    const m = model.trim() || defaultModelFor(provider);
    saveUserApiSettings({
      provider,
      apiKey: trimmed,
      model: model.trim()
    });
    onSaved();
    onClose();
  };

  const handleClear = () => {
    clearUserApiSettings();
    setApiKey("");
    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-modal-title"
    >
      <div className="w-full max-w-md border border-white/15 bg-[#0f0f0f] text-[#F5F5F0] shadow-2xl font-mono">
        <div className="px-5 py-4 border-b border-white/10 flex justify-between items-start gap-4">
          <div>
            <h2 id="api-modal-title" className="text-sm tracking-[0.2em] uppercase">
              API key
            </h2>
            <p className="text-[11px] mt-2 leading-relaxed text-[#A0A09A]">
              Keys stay in <strong className="text-[#F5F5F0]">this browser only</strong> (localStorage). They are not sent to our GitHub Pages site beyond
              direct calls to the provider you pick.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] tracking-widest uppercase text-[#A0A09A] hover:text-white border border-white/20 px-2 py-1"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <label className="block space-y-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#A0A09A]">Provider</span>
            <select
              value={provider}
              onChange={(e) => {
                const p = e.target.value as ThemeProviderId;
                setProvider(p);
                setModel(defaultModelFor(p));
              }}
              className="w-full bg-[#1a1a1a] border border-white/15 px-3 py-2 text-sm outline-none focus:border-[#A81C1C]"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <p className="text-[10px] text-[#666]">
            {PROVIDERS.find((p) => p.id === provider)?.hint}
          </p>

          <label className="block space-y-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#A0A09A]">API key</span>
            <input
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste key"
              className="w-full bg-[#1a1a1a] border border-white/15 px-3 py-2 text-sm outline-none focus:border-[#A81C1C]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#A0A09A]">
              Model <span className="normal-case text-[#666]">(optional)</span>
            </span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={defaultModelFor(provider)}
              className="w-full bg-[#1a1a1a] border border-white/15 px-3 py-2 text-xs outline-none focus:border-[#A81C1C]"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 min-w-[120px] bg-[#A81C1C] text-white px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="border border-white/20 text-[#A0A09A] px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase hover:text-white"
            >
              Clear saved key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
