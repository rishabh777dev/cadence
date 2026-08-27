import { cn } from "@renderer/lib/utils";
import { Code2, GitCommit, Terminal } from "lucide-react";

export function CodePreview({
  sample,
  selected,
  mode = "commits",
}: {
  sample: string;
  selected: boolean;
  mode?: "commits" | "docstrings" | "terminal" | "technical" | "off";
}): React.JSX.Element {
  const getHeaderInfo = () => {
    switch (mode) {
      case "commits":
        return {
          icon: <GitCommit className="size-3.5 text-indigo-400" />,
          title: "git commit -m",
          tag: "conventional",
        };
      case "terminal":
        return {
          icon: <Terminal className="size-3.5 text-emerald-400" />,
          title: "zsh / bash",
          tag: "cli",
        };
      case "docstrings":
        return {
          icon: <Code2 className="size-3.5 text-sky-400" />,
          title: "editor / markdown",
          tag: "docs",
        };
      default:
        return {
          icon: <Code2 className="size-3.5 text-amber-400" />,
          title: "technical note",
          tag: "dev",
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[18px] border transition-all font-mono text-[13px]",
        selected
          ? "border-primary/40 bg-zinc-950 text-zinc-100 shadow-sm"
          : "border-border bg-zinc-900 text-zinc-300",
      )}
    >
      {/* Terminal / Editor Chrome */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/90 px-3.5 py-2">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-rose-500/80" />
          <div className="size-2.5 rounded-full bg-amber-500/80" />
          <div className="size-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-sans font-medium">
          {header.icon}
          <span>{header.title}</span>
        </div>
        <div className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
          {header.tag}
        </div>
      </div>

      {/* Terminal / Code Body */}
      <div className="p-4 leading-relaxed whitespace-pre-wrap select-text">
        {mode === "terminal" ? (
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold select-none">$</span>
            <span className="text-emerald-300">{sample}</span>
          </div>
        ) : mode === "commits" ? (
          <div>
            <span className="text-indigo-300 font-semibold">{sample}</span>
          </div>
        ) : (
          <div className="text-zinc-200">{sample}</div>
        )}
      </div>
    </div>
  );
}
