import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@renderer/components/ui/dialog";
import { Button } from "@renderer/components/ui/button";
import { Switch } from "@renderer/components/ui/switch";
import { Label } from "@renderer/components/ui/label";
import { LANGUAGES, LanguageOption } from "@renderer/lib/languages";
import { Search, Globe, Minus } from "lucide-react";
import { cn } from "@renderer/lib/utils";

interface LanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSave: (value: string) => void;
}

export function LanguageModal({
  open,
  onOpenChange,
  value,
  onSave,
}: LanguageModalProps): React.JSX.Element {
  const initialAutoDetect = !value || value === "auto";
  const initialSelected = useMemo(() => {
    if (!value || value === "auto") return ["en", "hinglish"];
    return value.split(",").map((c) => c.trim()).filter(Boolean);
  }, [value]);

  const [autoDetect, setAutoDetect] = useState(initialAutoDetect);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState("");

  // Re-sync local state whenever the modal opens or value changes
  useEffect(() => {
    if (open) {
      const isAuto = !value || value === "auto";
      setAutoDetect(isAuto);
      if (value && value !== "auto") {
        const parsed = value.split(",").map((c) => c.trim()).filter(Boolean);
        setSelected(parsed.length > 0 ? parsed : ["en", "hinglish"]);
      } else {
        setSelected(["en", "hinglish"]);
      }
      setSearch("");
    }
  }, [open, value]);

  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return LANGUAGES;
    const q = search.toLowerCase().trim();
    return LANGUAGES.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.nativeLabel.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q),
    );
  }, [search]);

  const selectedOptions = useMemo(() => {
    const map = new Map(LANGUAGES.map((l) => [l.id, l]));
    return selected
      .map((id) => map.get(id))
      .filter((l): l is LanguageOption => l !== undefined);
  }, [selected]);

  const toggleLanguage = (id: string) => {
    if (autoDetect) return;
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const removeLanguage = (id: string) => {
    if (autoDetect) return;
    setSelected((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item !== id);
    });
  };

  const handleSave = () => {
    if (autoDetect) {
      onSave("auto");
    } else {
      const finalSelected = selected.length > 0 ? selected : ["en"];
      onSave(finalSelected.join(","));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[860px] max-w-[860px] w-[860px] p-0 overflow-hidden rounded-2xl bg-card border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-border/40">
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Languages
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select the languages you want to use with Cadence
            </p>
          </div>

          <div className="flex items-center gap-3 bg-secondary/50 px-3.5 py-1.5 rounded-full border border-border/50">
            <Label
              htmlFor="auto-detect-toggle"
              className="text-xs font-semibold cursor-pointer select-none"
            >
              Auto-detect
            </Label>
            <Switch
              id="auto-detect-toggle"
              checked={autoDetect}
              onCheckedChange={(checked) => {
                setAutoDetect(checked);
                if (!checked && selected.length === 0) {
                  setSelected(["en", "hinglish"]);
                }
              }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex divide-x divide-border/40 h-[480px]">
          {/* Left Grid Panel */}
          <div className="flex-1 min-w-0 flex flex-col p-6 overflow-hidden">
            {autoDetect ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center p-6 bg-secondary/30 rounded-xl border border-dashed border-border/60">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <Globe className="size-6" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  Auto-detect is on
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Cadence will automatically detect whatever language you speak across 99 supported languages.
                </p>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="relative mb-4 shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search for any languages"
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/60 rounded-xl text-sm border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/70"
                  />
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pr-1.5">
                  <div className="grid grid-cols-3 gap-2.5">
                    {filteredLanguages.map((lang) => {
                      const isSelected = selected.includes(lang.id);
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => toggleLanguage(lang.id)}
                          className={cn(
                            "flex flex-col items-start justify-center px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer min-h-[56px]",
                            isSelected
                              ? "border-primary/80 bg-primary/10 shadow-xs ring-1 ring-primary/40"
                              : "border-border/60 bg-secondary/30 hover:bg-secondary/70 hover:border-border",
                          )}
                        >
                          <span
                            className={cn(
                              "text-[13.5px] font-semibold truncate w-full",
                              isSelected ? "text-primary" : "text-foreground",
                            )}
                          >
                            {lang.label}
                          </span>
                          <span className="text-[11.5px] text-muted-foreground/80 truncate w-full mt-0.5">
                            {lang.nativeLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Selected Sidebar */}
          <div className="w-[230px] p-6 flex flex-col justify-between bg-muted/10 shrink-0">
            <div className="min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Selected
              </h4>

              {autoDetect ? (
                <div className="flex items-center gap-2 text-sm font-medium text-foreground py-2">
                  <Globe className="size-4 text-primary shrink-0" />
                  <span>99 languages</span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {selectedOptions.map((lang) => (
                    <div
                      key={lang.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-border/50 text-sm group"
                    >
                      <span className="font-medium text-foreground truncate pr-2">
                        {lang.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLanguage(lang.id)}
                        disabled={selected.length <= 1}
                        className={cn(
                          "size-5 rounded flex items-center justify-center text-muted-foreground transition-colors shrink-0",
                          selected.length > 1
                            ? "hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                            : "opacity-30 cursor-not-allowed",
                        )}
                      >
                        <Minus className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-border/40 mt-auto">
              <Button
                onClick={handleSave}
                className="w-full rounded-xl font-semibold h-10 shadow-sm cursor-pointer"
              >
                Save and close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
