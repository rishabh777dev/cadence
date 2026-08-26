import * as React from "react";
import { cn } from "@renderer/lib/utils";
import type { LucideIcon } from "lucide-react";

export type SegmentedOption = {
  value: string;
  label: React.ReactNode;
  icon?: LucideIcon;
};

/**
 * An animated single-select sliding segmented control.
 * Smoothly glides an active background pill between selected options.
 */
export function SegmentedControl({
  options,
  value,
  onValueChange,
  size = "default",
  className,
  wrap,
}: {
  options: readonly SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
  size?: "sm" | "default";
  className?: string;
  wrap?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = React.useState<React.CSSProperties>({
    opacity: 0,
  });

  const updateSlider = React.useCallback(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(
      `button[data-value="${value}"]`,
    );
    if (activeBtn) {
      setSliderStyle({
        transform: `translate3d(${activeBtn.offsetLeft}px, ${activeBtn.offsetTop}px, 0)`,
        width: `${activeBtn.offsetWidth}px`,
        height: `${activeBtn.offsetHeight}px`,
        opacity: 1,
      });
    }
  }, [value]);

  React.useLayoutEffect(() => {
    updateSlider();
    const ro = new ResizeObserver(() => updateSlider());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateSlider]);

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      className={cn(
        "relative inline-flex items-center p-1 rounded-xl bg-secondary/70 border border-border/60 select-none max-w-full",
        wrap && "grid w-full grid-cols-2 min-[1360px]:flex min-[1360px]:w-fit",
        className,
      )}
    >
      {/* Sliding Active Indicator Pill */}
      <div
        className="absolute top-0 left-0 bg-card rounded-[8px] shadow-sm border border-border/80 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
        style={sliderStyle}
      />

      {options.map((o) => {
        const Icon = o.icon;
        const isActive = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            data-value={o.value}
            onClick={() => onValueChange(o.value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 font-medium transition-colors duration-150 rounded-[8px] cursor-pointer",
              size === "sm"
                ? "px-3 py-1 text-xs"
                : "px-3.5 py-1.5 text-xs font-semibold",
              isActive
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground",
              wrap && "w-full justify-center min-[1360px]:w-auto",
            )}
          >
            {Icon && <Icon className="size-3.5 shrink-0" />}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
