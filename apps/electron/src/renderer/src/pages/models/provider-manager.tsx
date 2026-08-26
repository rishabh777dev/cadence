import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { Input } from "@renderer/components/ui/input";
import { apiFetch } from "@renderer/lib/api";
import type { AvailableModel } from "@renderer/lib/models";
import { cn } from "@renderer/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Key,
  Laptop,
  Loader2,
  Mic,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { Eyebrow } from "./page-chrome";
import type { UseModels } from "./use-models";

const ALL_PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    desc: "Ultra-fast inference for Whisper & Llama",
    icon: "⚡",
    hasVoice: true,
    hasLlm: true,
  },
  {
    id: "mistral",
    name: "Mistral AI",
    desc: "Frontier reasoning & multilingual models",
    icon: "🌪️",
    hasVoice: false,
    hasLlm: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    desc: "GPT-4o, o3-mini & Whisper",
    icon: "🤖",
    hasVoice: true,
    hasLlm: true,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    desc: "Claude 3.5 Sonnet, 3.7 Sonnet & Haiku",
    icon: "🧠",
    hasVoice: false,
    hasLlm: true,
  },
  {
    id: "google",
    name: "Google Gemini",
    desc: "Gemini 2.5 Flash, 2.5 Pro & 2.0",
    icon: "🌐",
    hasVoice: false,
    hasLlm: true,
  },
  {
    id: "deepgram",
    name: "Deepgram",
    desc: "High-speed Nova-3 voice models",
    icon: "🎙️",
    hasVoice: true,
    hasLlm: false,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    desc: "Access 100+ AI models via one key",
    icon: "🔀",
    hasVoice: false,
    hasLlm: true,
  },
  {
    id: "local-whisper",
    name: "Local Whisper",
    desc: "100% on-device private voice recognition",
    icon: "💻",
    hasVoice: true,
    hasLlm: false,
  },
  {
    id: "local-llm",
    name: "Local Ollama / LM Studio",
    desc: "Offline local LLMs on localhost:11434",
    icon: "🦙",
    hasVoice: false,
    hasLlm: true,
  },
] as const;

export function ProviderManager({
  m,
  onDeleteKey,
}: {
  m: UseModels;
  onDeleteKey: (provider: string) => void;
}): React.JSX.Element {
  const [selectedProvider, setSelectedProvider] = useState<string>("groq");
  const [keyInput, setKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState(false);

  const queryClient = useQueryClient();

  const activeProvider = useMemo(
    () =>
      ALL_PROVIDERS.find((p) => p.id === selectedProvider) ?? ALL_PROVIDERS[0],
    [selectedProvider],
  );

  const isLocal =
    selectedProvider === "local-whisper" || selectedProvider === "local-llm";
  const hasKey = m.keyProviders.has(selectedProvider);
  const keyEntry = m.apiKeys.find((k) => k.provider === selectedProvider);

  // Live models query for the selected provider
  const liveModelsQuery = useQuery({
    queryKey: ["models", "live", selectedProvider],
    queryFn: async () => {
      if (selectedProvider === "local-whisper") {
        return m.available.filter(
          (item) => item.provider_id === "local-whisper",
        );
      }
      const res = await apiFetch(`/api/models/live/${selectedProvider}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { models?: AvailableModel[] };
      return data.models ?? [];
    },
    enabled: hasKey || isLocal,
    staleTime: 5 * 60 * 1000,
  });

  const liveModels = useMemo(() => {
    if (selectedProvider === "local-whisper") {
      return m.available.filter((item) => item.provider_id === "local-whisper");
    }
    const live = liveModelsQuery.data ?? [];
    if (live.length > 0) return live;
    // Fallback to cached available
    return m.available.filter((item) => item.provider_id === selectedProvider);
  }, [selectedProvider, liveModelsQuery.data, m.available]);

  const handleSaveKey = useCallback(async () => {
    if (!keyInput.trim()) return;
    setSavingKey(true);
    setKeyError(null);
    try {
      const err = await m.saveKey(selectedProvider, keyInput.trim());
      if (err) {
        setKeyError(err);
      } else {
        setKeyInput("");
        setEditingKey(false);
        queryClient.invalidateQueries({
          queryKey: ["models", "live", selectedProvider],
        });
      }
    } finally {
      setSavingKey(false);
    }
  }, [keyInput, selectedProvider, m, queryClient]);

  const [testingModels, setTestingModels] = useState<
    Record<
      string,
      {
        loading?: boolean;
        ok?: boolean;
        latencyMs?: number;
        error?: string;
        message?: string;
      }
    >
  >({});

  const handleTestModel = useCallback(async (model: AvailableModel) => {
    const modelKey = `${model.provider_id}:${model.model_id}`;
    setTestingModels((prev) => ({ ...prev, [modelKey]: { loading: true } }));

    try {
      const res = await apiFetch("/api/models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: model.provider_id,
          model_id: model.model_id,
          type: model.type,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        latencyMs?: number;
        error?: string;
        message?: string;
      };

      if (data.ok) {
        setTestingModels((prev) => ({
          ...prev,
          [modelKey]: {
            loading: false,
            ok: true,
            latencyMs: data.latencyMs,
            message: data.message,
          },
        }));
      } else {
        setTestingModels((prev) => ({
          ...prev,
          [modelKey]: {
            loading: false,
            ok: false,
            error: data.error ?? "Connection failed",
          },
        }));
      }
    } catch (err) {
      setTestingModels((prev) => ({
        ...prev,
        [modelKey]: {
          loading: false,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        },
      }));
    }
  }, []);

  const handleSelectModel = useCallback(
    async (model: AvailableModel, type: "voice" | "llm") => {
      await m.configureModel(model, type);
    },
    [m],
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <Eyebrow text="Providers & Live Model Discovery" />
        <span className="text-muted-foreground text-xs">
          Select a provider to view & configure its live models
        </span>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-[14px] border shadow-sm">
        {/* Provider Tabs / Buttons */}
        <div className="border-border flex flex-wrap items-center gap-1.5 border-b bg-card/60 p-3">
          {ALL_PROVIDERS.map((p) => {
            const pHasKey = m.keyProviders.has(p.id);
            const isPLocal = p.id === "local-whisper" || p.id === "local-llm";
            const isSelected = selectedProvider === p.id;
            const isVoiceActive = m.defaultVoice?.provider === p.id;
            const isLlmActive = m.defaultLlm?.provider === p.id;

            return (
              <Button
                key={p.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedProvider(p.id);
                  setEditingKey(false);
                  setKeyError(null);
                }}
                className={cn(
                  "rounded-xl h-8 px-3 text-xs font-medium transition-all gap-1.5 cursor-pointer",
                  isSelected
                    ? "shadow-sm"
                    : "bg-background/70 hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
                {(pHasKey || isPLocal) && (
                  <span
                    className={cn(
                      "size-1.5 rounded-full inline-block shrink-0",
                      isSelected ? "bg-white" : "bg-emerald-400",
                    )}
                    title="Active / Configured"
                  />
                )}
                {(isVoiceActive || isLlmActive) && (
                  <span
                    className={cn(
                      "text-[9px] px-1 py-0.2 rounded font-mono uppercase font-bold",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    Active
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Selected Provider Details & Live Model Bar */}
        <div className="p-6 space-y-6">
          {/* Provider Header & Key Configuration */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border/80 border-b pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeProvider.icon}</span>
                <h3 className="text-foreground text-base font-semibold">
                  {activeProvider.name}
                </h3>
                {hasKey ? (
                  <Badge
                    variant="outline"
                    className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[11px] gap-1"
                  >
                    <Check className="size-3" /> Key Active
                  </Badge>
                ) : isLocal ? (
                  <Badge
                    variant="outline"
                    className="text-primary border-primary/30 bg-primary/10 text-[11px] gap-1"
                  >
                    <Laptop className="size-3" /> Ready On-Device
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-muted-foreground border-border text-[11px] gap-1"
                  >
                    No API Key Configured
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {activeProvider.desc}
              </p>
            </div>

            {/* Key Actions */}
            {!isLocal && (
              <div className="flex items-center gap-2">
                {hasKey && !editingKey ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono bg-secondary/80 px-2 py-1 rounded-md">
                      {keyEntry?.hint ?? "Key Stored"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingKey(true)}
                      className="h-8 text-xs gap-1.5 cursor-pointer"
                    >
                      <Pencil className="size-3" /> Edit Key
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteKey(selectedProvider)}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ) : !editingKey ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingKey(true)}
                    className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <Plus className="size-3" /> Add {activeProvider.name} API
                    Key
                  </Button>
                ) : null}
              </div>
            )}
          </div>

          {/* Inline Key Entry Form */}
          {editingKey && !isLocal && (
            <div className="bg-secondary/40 border-border/80 border p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Key className="size-3.5 text-primary" /> Enter{" "}
                  {activeProvider.name} API Key:
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingKey(false);
                    setKeyError(null);
                  }}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={`Paste your ${activeProvider.name} API key (e.g. ${activeProvider.id === "groq" ? "gsk_..." : "sk-..."})`}
                  className="text-xs font-mono h-9 bg-background"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveKey}
                  disabled={savingKey || !keyInput.trim()}
                  className="h-9 px-4 text-xs shrink-0 cursor-pointer"
                >
                  {savingKey ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-3 animate-spin" /> Saving…
                    </span>
                  ) : (
                    "Save & Discover Models"
                  )}
                </Button>
              </div>

              {keyError && (
                <p className="text-destructive text-xs leading-snug">
                  {keyError}
                </p>
              )}
            </div>
          )}

          {/* Dynamic Model Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Available Live Models ({liveModels.length})
                </h4>
                {liveModelsQuery.isFetching && (
                  <span className="flex items-center gap-1 text-[11px] text-primary">
                    <Loader2 className="size-3 animate-spin" /> Fetching models
                    from {activeProvider.name}…
                  </span>
                )}
              </div>

              {(hasKey || isLocal) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => liveModelsQuery.refetch()}
                  disabled={liveModelsQuery.isFetching}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                  title="Refresh live models"
                >
                  <RefreshCw
                    className={cn(
                      "size-3",
                      liveModelsQuery.isFetching && "animate-spin text-primary",
                    )}
                  />
                  <span>Refresh Models</span>
                </Button>
              )}
            </div>

            {!hasKey && !isLocal ? (
              <div className="border border-dashed border-border/80 rounded-xl p-8 text-center space-y-3">
                <Key className="size-8 text-muted-foreground/50 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    No API Key Configured for {activeProvider.name}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Add your {activeProvider.name} key above to automatically
                    load all models available on your account.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingKey(true)}
                  className="text-xs gap-1.5 cursor-pointer"
                >
                  <Plus className="size-3.5" /> Add API Key
                </Button>
              </div>
            ) : liveModels.length === 0 && !liveModelsQuery.isFetching ? (
              <div className="border border-border/80 rounded-xl p-6 text-center text-xs text-muted-foreground">
                No models returned by {activeProvider.name}. Click "Refresh
                Models" or check your key permissions.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {liveModels.map((model) => {
                  const isVoiceCurrent =
                    m.defaultVoice?.provider === model.provider_id &&
                    m.defaultVoice?.model_id === model.model_id;
                  const isLlmCurrent =
                    m.defaultLlm?.provider === model.provider_id &&
                    m.defaultLlm?.model_id === model.model_id;

                  const isVoiceCapable =
                    model.type === "voice" ||
                    model.model_id.includes("whisper") ||
                    model.model_id.includes("stt") ||
                    model.model_id.includes("transcribe");

                  const isLlmCapable =
                    model.type === "llm" ||
                    !isVoiceCapable ||
                    model.provider_id !== "deepgram";

                  const modelKey = `${model.provider_id}:${model.model_id}`;
                  const testState = testingModels[modelKey];

                  return (
                    <div
                      key={model.model_id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all gap-3",
                        isVoiceCurrent || isLlmCurrent
                          ? "bg-primary/5 border-primary/50 shadow-sm"
                          : "bg-background/80 hover:bg-secondary/50 border-border/80",
                      )}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {model.model_name}
                          </span>
                          {model.curated && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-primary/10 text-primary font-medium">
                              Curated
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">
                          {model.model_id}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Test Endpoint Button */}
                        {(hasKey || isLocal) && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleTestModel(model)}
                            disabled={testState?.loading}
                            className={cn(
                              "h-7 text-[11px] px-2 gap-1 cursor-pointer transition-all border",
                              testState?.ok
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono"
                                : testState?.error
                                  ? "border-destructive/40 text-destructive bg-destructive/10"
                                  : "border-border/60 hover:bg-secondary text-muted-foreground hover:text-foreground",
                            )}
                            title={
                              testState?.error
                                ? `Test failed: ${testState.error}`
                                : testState?.ok
                                  ? `Response verified (${testState.latencyMs}ms)`
                                  : "Test model availability & latency"
                            }
                          >
                            {testState?.loading ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : testState?.ok ? (
                              <>
                                <Check className="size-3 text-emerald-400" />
                                <span>{testState.latencyMs}ms</span>
                              </>
                            ) : testState?.error ? (
                              <>
                                <AlertCircle className="size-3 text-destructive" />
                                <span className="max-w-[70px] truncate">
                                  {testState.error}
                                </span>
                              </>
                            ) : (
                              <>
                                <Zap className="size-3" />
                                <span>Test</span>
                              </>
                            )}
                          </Button>
                        )}
                        {isVoiceCapable && activeProvider.hasVoice && (
                          <Button
                            variant={isVoiceCurrent ? "default" : "outline"}
                            size="xs"
                            onClick={() => handleSelectModel(model, "voice")}
                            className={cn(
                              "h-7 text-[11px] gap-1 cursor-pointer",
                              isVoiceCurrent
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "",
                            )}
                          >
                            <Mic className="size-3" />
                            <span>
                              {isVoiceCurrent ? "Voice ✓" : "Set Voice"}
                            </span>
                          </Button>
                        )}

                        {isLlmCapable && activeProvider.hasLlm && (
                          <Button
                            variant={isLlmCurrent ? "default" : "outline"}
                            size="xs"
                            onClick={() => handleSelectModel(model, "llm")}
                            className={cn(
                              "h-7 text-[11px] gap-1 cursor-pointer",
                              isLlmCurrent
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "",
                            )}
                          >
                            <Sparkles className="size-3" />
                            <span>
                              {isLlmCurrent ? "Cleanup ✓" : "Set Cleanup"}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
