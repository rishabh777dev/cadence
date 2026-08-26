import { KeyComboDisplay } from "@renderer/components/key-combo";
import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { SegmentedControl } from "@renderer/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select";
import { Textarea } from "@renderer/components/ui/textarea";
import {
  comboDisplayKeys,
  formatAcceleratorKeys,
  keyDisplayLabel,
  useHotkeyRecorder,
} from "@renderer/hooks/use-hotkey-recorder";
import { apiFetch, getClient } from "@renderer/lib/api";
import type { AvailableModel } from "@renderer/lib/models";
import { settingsQueryOptions } from "@renderer/lib/query";
import { getDefaultMagicEditHotkey } from "@shared/hotkey-defaults";
import { SETTINGS_KEYS } from "@shared/settings-keys";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Cpu,
  Key,
  Keyboard,
  Languages,
  Loader2,
  MessageSquareQuote,
  Mic,
  RefreshCw,
  Sliders,
  Sparkles,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { PageHeader, PageShell } from "./models/page-chrome";
import type { ApiKeyEntry } from "./models/types";

const PROVIDERS = [
  { id: "auto", name: "Auto (Configured Default LLM)" },
  { id: "groq", name: "Groq (Ultra-Fast Inference)" },
  { id: "mistral", name: "Mistral AI" },
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic (Claude)" },
  { id: "google", name: "Google Gemini" },
  { id: "openrouter", name: "OpenRouter" },
  { id: "local-llm", name: "Local LLM (Ollama / Local Endpoint)" },
] as const;

const VOICE_PROVIDERS = [
  { id: "auto", name: "Auto (Default Voice Engine)" },
  { id: "local-whisper", name: "Local Whisper (100% On-Device)" },
  { id: "groq", name: "Groq Whisper (whisper-large-v3-turbo)" },
  { id: "openai", name: "OpenAI Whisper (whisper-1)" },
  { id: "deepgram", name: "Deepgram (Nova-3)" },
] as const;

const TONE_OPTIONS = [
  {
    id: "balanced",
    title: "Balanced",
    desc: "Accurate, faithful & natural in-place rewrite",
  },
  {
    id: "professional",
    title: "Professional",
    desc: "Polished, executive, business-ready syntax",
  },
  {
    id: "casual",
    title: "Casual",
    desc: "Relaxed, friendly and conversational",
  },
  {
    id: "concise",
    title: "Concise",
    desc: "High-impact, direct, minimal fluff",
  },
  {
    id: "academic",
    title: "Academic",
    desc: "Formal, articulate & rigorous terminology",
  },
  {
    id: "direct",
    title: "Direct",
    desc: "Action-oriented & punchy",
  },
] as const;

export default function MagicEditPage(): React.JSX.Element {
  const settingsQuery = useQuery(settingsQueryOptions());

  // Dynamic models and API keys queries from backend
  const availableQuery = useQuery({
    queryKey: ["models", "available"],
    queryFn: async () => {
      const res = await getClient().api.models.available.$get();
      if (!res.ok) throw new Error("Failed to load available models");
      return (await res.json()) as AvailableModel[];
    },
  });

  const keysQuery = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await getClient().api.keys.$get();
      if (!res.ok) throw new Error("Failed to load API keys");
      return (await res.json()) as ApiKeyEntry[];
    },
  });

  const availableModels = availableQuery.data ?? [];
  const apiKeys = keysQuery.data ?? [];
  const keyProviders = useMemo(
    () => new Set(apiKeys.map((k) => k.provider)),
    [apiKeys],
  );

  // Group LLM models dynamically by provider from models API
  const dynamicModelsByProvider = useMemo(() => {
    const map = new Map<string, AvailableModel[]>();
    for (const m of availableModels) {
      if (m.type !== "llm") continue;
      const list = map.get(m.provider_id) ?? [];
      list.push(m);
      map.set(m.provider_id, list);
    }
    return map;
  }, [availableModels]);

  const [hotkey, setHotkey] = useState(
    window.api?.defaultMagicEditHotkey ?? getDefaultMagicEditHotkey(),
  );
  const [provider, setProvider] = useState("auto");

  // Dynamic live models query for selected provider
  const liveModelsQuery = useQuery({
    queryKey: ["models", "live", provider],
    queryFn: async () => {
      if (!provider || provider === "auto") return [];
      const res = await apiFetch(`/api/models/live/${provider}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { models?: AvailableModel[] };
      return data.models ?? [];
    },
    enabled: provider !== "auto",
    staleTime: 5 * 60 * 1000,
  });

  const [model, setModel] = useState("");
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState("auto");
  const [tone, setTone] = useState("balanced");
  const [script, setScript] = useState("roman");
  const [customPrompt, setCustomPrompt] = useState("");

  // Seed form state once settings query resolves
  const seeded = useRef(false);
  useEffect(() => {
    const s = settingsQuery.data;
    if (!s || seeded.current) return;
    seeded.current = true;

    if (s[SETTINGS_KEYS.magicEditHotkey])
      setHotkey(s[SETTINGS_KEYS.magicEditHotkey]);
    if (s[SETTINGS_KEYS.magicEditProvider])
      setProvider(s[SETTINGS_KEYS.magicEditProvider]);
    if (s[SETTINGS_KEYS.magicEditModel])
      setModel(s[SETTINGS_KEYS.magicEditModel]);
    if (s[SETTINGS_KEYS.magicEditVoiceProvider])
      setVoiceProvider(s[SETTINGS_KEYS.magicEditVoiceProvider]);
    if (s[SETTINGS_KEYS.magicEditTone]) setTone(s[SETTINGS_KEYS.magicEditTone]);
    if (s[SETTINGS_KEYS.magicEditScript])
      setScript(s[SETTINGS_KEYS.magicEditScript]);
    if (s[SETTINGS_KEYS.magicEditCustomPrompt])
      setCustomPrompt(s[SETTINGS_KEYS.magicEditCustomPrompt]);
  }, [settingsQuery.data]);

  const handleHotkeyRecorded = useCallback((accelerator: string) => {
    setHotkey(accelerator);
    window.api?.updateMagicEditHotkey?.(accelerator);
    getClient()
      .api.settings[":key"].$put({
        param: { key: SETTINGS_KEYS.magicEditHotkey },
        json: { value: accelerator },
      })
      .catch(() => {});
  }, []);

  const {
    state: recorderState,
    liveModifiers,
    capturedCombo,
    canSaveRecording,
    needsModifierOrMouseButton,
    invalidReleaseNotice,
    startRecording,
    cancelRecording,
  } = useHotkeyRecorder(handleHotkeyRecorded, { target: "magic-edit" });

  const liveKeys = liveModifiers.map(keyDisplayLabel);
  const draftKeys = capturedCombo ? comboDisplayKeys(capturedCombo) : liveKeys;

  const captureHint = needsModifierOrMouseButton
    ? "Add a modifier or side mouse button · Esc to cancel"
    : canSaveRecording
      ? "Release to save · Esc to cancel"
      : "Press a modifier or side mouse button... · Esc to cancel";

  const handleProviderChange = useCallback(
    (newProvider: string) => {
      setProvider(newProvider);
      getClient()
        .api.settings[":key"].$put({
          param: { key: SETTINGS_KEYS.magicEditProvider },
          json: { value: newProvider },
        })
        .catch(() => {});

      if (newProvider !== "auto") {
        const modelsForProvider =
          dynamicModelsByProvider.get(newProvider) ?? [];
        const isCurrentModelValid = modelsForProvider.some(
          (m) => m.model_id === model,
        );
        if (
          !isCurrentModelValid &&
          !isCustomModel &&
          modelsForProvider.length > 0
        ) {
          const firstModel =
            modelsForProvider.find((m) => m.curated)?.model_id ??
            modelsForProvider[0]?.model_id ??
            "";
          setModel(firstModel);
          getClient()
            .api.settings[":key"].$put({
              param: { key: SETTINGS_KEYS.magicEditModel },
              json: { value: firstModel },
            })
            .catch(() => {});
        }
      }
    },
    [dynamicModelsByProvider, model, isCustomModel],
  );

  const handleModelChange = useCallback((newModel: string) => {
    setModel(newModel);
    getClient()
      .api.settings[":key"].$put({
        param: { key: SETTINGS_KEYS.magicEditModel },
        json: { value: newModel },
      })
      .catch(() => {});
  }, []);

  const handleVoiceProviderChange = useCallback((newVoiceProvider: string) => {
    setVoiceProvider(newVoiceProvider);
    getClient()
      .api.settings[":key"].$put({
        param: { key: SETTINGS_KEYS.magicEditVoiceProvider },
        json: { value: newVoiceProvider },
      })
      .catch(() => {});
  }, []);

  const handleToneChange = useCallback((newTone: string) => {
    setTone(newTone);
    getClient()
      .api.settings[":key"].$put({
        param: { key: SETTINGS_KEYS.magicEditTone },
        json: { value: newTone },
      })
      .catch(() => {});
  }, []);

  const handleScriptChange = useCallback((newScript: string) => {
    setScript(newScript);
    getClient()
      .api.settings[":key"].$put({
        param: { key: SETTINGS_KEYS.magicEditScript },
        json: { value: newScript },
      })
      .catch(() => {});
  }, []);

  const handleCustomPromptChange = useCallback((newPrompt: string) => {
    setCustomPrompt(newPrompt);
    getClient()
      .api.settings[":key"].$put({
        param: { key: SETTINGS_KEYS.magicEditCustomPrompt },
        json: { value: newPrompt },
      })
      .catch(() => {});
  }, []);

  const currentProviderModels = useMemo(() => {
    if (provider === "auto") return [];
    const live = liveModelsQuery.data;
    if (live && live.length > 0) return live;
    return dynamicModelsByProvider.get(provider) ?? [];
  }, [provider, liveModelsQuery.data, dynamicModelsByProvider]);

  return (
    <PageShell>
      <PageHeader
        title="Magic Edit"
        subtitle="Highlight text in any application and speak commands to rewrite, reformat, translate, or refine it instantly in-place."
        badge="VOICE AGENT"
      />

      <div className="flex flex-col gap-6 max-w-4xl pb-16">
        {/* Section 1: Hotkey */}
        <div className="bg-card/70 border-border rounded-2xl border p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Keyboard className="text-primary size-4" />
                <h3 className="text-foreground text-[16px] font-medium">
                  Magic Edit Shortcut
                </h3>
              </div>
              <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed max-w-xl">
                Global hotkey to trigger voice rewrites. Select text in any
                window, press your shortcut, and speak what to edit or rewrite.
              </p>
            </div>

            <div className="shrink-0">
              {recorderState === "idle" ? (
                <div className="relative inline-flex">
                  <Button
                    variant="outline"
                    onClick={startRecording}
                    className="h-auto max-w-full flex-wrap gap-3 px-4 py-2.5 cursor-pointer bg-background/80 hover:bg-secondary/60 rounded-xl"
                  >
                    <Sparkles className="text-primary size-4 shrink-0" />
                    <KeyComboDisplay keys={formatAcceleratorKeys(hotkey)} />
                    <span className="text-muted-foreground ml-1 text-xs font-semibold">
                      Change
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="border-primary/60 bg-primary/5 relative inline-flex max-w-full flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5">
                  <Sparkles className="text-primary h-4 w-4 shrink-0" />
                  {draftKeys.length > 0 ? (
                    <>
                      <KeyComboDisplay keys={draftKeys} variant="dim" />
                      <span className="text-muted-foreground text-xs">
                        {captureHint}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground animate-pulse text-xs">
                      {captureHint}
                    </span>
                  )}
                  {invalidReleaseNotice && (
                    <div className="bg-popover text-popover-foreground border-border shadow-soft absolute top-[calc(100%+6px)] right-0 z-20 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs">
                      Press at least one key or modifier
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelRecording}
                    className="ml-1 cursor-pointer h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: AI Rewrite Model & Provider */}
        <div className="bg-card/70 border-border rounded-2xl border p-6 shadow-sm flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="text-primary size-4" />
              <h3 className="text-foreground text-[16px] font-medium">
                AI Rewrite Model & Provider
              </h3>
            </div>
            <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
              Dynamically powered by your configured provider keys and local
              models. Choose which LLM executes in-place transformations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provider Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                Provider
              </label>
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-full h-10 rounded-xl bg-background/80">
                  <SelectValue placeholder="Select LLM Provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => {
                    const hasKey = keyProviders.has(p.id);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{p.name}</span>
                          {p.id !== "auto" && p.id !== "local-llm" && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                hasKey
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {hasKey ? "Key Active" : "No Key"}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selector */}
            {provider !== "auto" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Available Model
                    </label>
                    {liveModelsQuery.isFetching ? (
                      <span className="flex items-center gap-1 text-[10px] text-primary">
                        <Loader2 className="size-2.5 animate-spin" /> Live sync…
                      </span>
                    ) : liveModelsQuery.data &&
                      liveModelsQuery.data.length > 0 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400">
                        {liveModelsQuery.data.length} live models
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => liveModelsQuery.refetch()}
                      disabled={liveModelsQuery.isFetching}
                      className="h-6 w-6 rounded-md hover:bg-secondary/80 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Sync live models from provider API"
                    >
                      <RefreshCw
                        className={`size-3 ${liveModelsQuery.isFetching ? "animate-spin text-primary" : ""}`}
                      />
                    </Button>
                    {!keyProviders.has(provider) &&
                      provider !== "local-llm" && (
                        <Link
                          to="/settings/models"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1"
                        >
                          <Key className="size-3" /> Add Key
                        </Link>
                      )}
                  </div>
                </div>

                <Select
                  value={
                    currentProviderModels.some((m) => m.model_id === model)
                      ? model
                      : isCustomModel
                        ? "__custom__"
                        : (currentProviderModels[0]?.model_id ?? "__custom__")
                  }
                  onValueChange={(val) => {
                    if (val === "__custom__") {
                      setIsCustomModel(true);
                    } else {
                      setIsCustomModel(false);
                      handleModelChange(val);
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl bg-background/80 font-mono text-xs">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {currentProviderModels.map((m) => (
                      <SelectItem key={m.model_id} value={m.model_id}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-sans font-medium">
                            {m.model_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono bg-secondary/80 px-1.5 py-0.5 rounded">
                            {m.model_id}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">
                      Custom Model Identifier…
                    </SelectItem>
                  </SelectContent>
                </Select>

                {(isCustomModel ||
                  (model &&
                    !currentProviderModels.some(
                      (m) => m.model_id === model,
                    ))) && (
                  <Input
                    placeholder="Enter custom model identifier (e.g. gpt-4o-mini)"
                    value={model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="text-xs font-mono rounded-xl h-9 mt-1"
                    autoFocus
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Speech-to-Text Model */}
        <div className="bg-card/70 border-border rounded-2xl border p-6 shadow-sm flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Mic className="text-primary size-4" />
              <h3 className="text-foreground text-[16px] font-medium">
                Speech-to-Text Model
              </h3>
            </div>
            <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
              Speech recognition engine used to transcribe your spoken edit
              instructions.
            </p>
          </div>

          <div className="max-w-md">
            <Select
              value={voiceProvider}
              onValueChange={handleVoiceProviderChange}
            >
              <SelectTrigger className="w-full h-10 rounded-xl bg-background/80">
                <SelectValue placeholder="Select Voice Engine" />
              </SelectTrigger>
              <SelectContent>
                {VOICE_PROVIDERS.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Section 4: Transformation Tone */}
        <div className="bg-card/70 border-border rounded-2xl border p-6 shadow-sm flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="text-primary size-4" />
              <h3 className="text-foreground text-[16px] font-medium">
                Transformation Tone & Demeanor
              </h3>
            </div>
            <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
              Default style and phrasing tone applied to every in-place voice
              transformation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {TONE_OPTIONS.map((tOpt) => {
              const active = tone === tOpt.id;
              return (
                <button
                  key={tOpt.id}
                  type="button"
                  onClick={() => handleToneChange(tOpt.id)}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? "bg-primary/10 border-primary/60 text-foreground ring-1 ring-primary/30"
                      : "bg-background/60 border-border/70 hover:bg-secondary/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-foreground">
                      {tOpt.title}
                    </span>
                    {active && <Check className="size-4 text-primary" />}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 leading-snug">
                    {tOpt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Multilingual Script */}
        <div className="bg-card/70 border-border rounded-2xl border p-6 shadow-sm flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Languages className="text-primary size-4" />
              <h3 className="text-foreground text-[16px] font-medium">
                Multilingual Script Preference
              </h3>
            </div>
            <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
              Controls whether Hinglish, Hindi, and multilingual output is
              rendered in the Latin alphabet or native Devanagari script.
            </p>
          </div>

          <SegmentedControl
            value={script}
            onValueChange={handleScriptChange}
            options={[
              {
                value: "roman",
                label:
                  "Roman Script (English Alphabet - Recommended for Hinglish)",
              },
              {
                value: "native",
                label: "Native Script (Devanagari)",
              },
            ]}
          />
        </div>

        {/* Section 6: Custom Persona Instructions */}
        <div className="bg-card/70 border-border rounded-2xl border p-6 shadow-sm flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="text-primary size-4" />
              <h3 className="text-foreground text-[16px] font-medium">
                Custom Persona Instructions
              </h3>
            </div>
            <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
              Appended to every Magic Edit prompt. Provide specific rules,
              custom formatting preferences, or vocabulary constraints.
            </p>
          </div>

          <Textarea
            className="bg-background/80 border-border placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20 min-h-[120px] w-full rounded-xl border p-3.5 text-xs leading-relaxed transition-colors"
            placeholder="e.g. Always format lists with clean markdown bullets. Keep rewrites crisp and concise. Avoid corporate buzzwords."
            value={customPrompt}
            onChange={(e) => handleCustomPromptChange(e.target.value)}
          />
        </div>
      </div>
    </PageShell>
  );
}
