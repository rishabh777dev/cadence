"use client";

import { Check } from "lucide-react";

interface AppBadge {
  name: string;
  category: string;
  color: string;
}

const apps: AppBadge[] = [
  { name: "Slack", category: "Team Chat", color: "#4A154B" },
  { name: "VS Code", category: "Engineering", color: "#007ACC" },
  { name: "Cursor", category: "AI Code Editor", color: "#6366F1" },
  { name: "Notion", category: "Docs & Notes", color: "#000000" },
  { name: "Google Docs", category: "Collaboration", color: "#4285F4" },
  { name: "Apple Mail", category: "Communication", color: "#1D9BF0" },
  { name: "Superhuman", category: "Email", color: "#E01E5A" },
  { name: "Linear", category: "Issue Tracking", color: "#5E6AD2" },
  { name: "Obsidian", category: "Knowledge Base", color: "#7C3AED" },
  { name: "ChatGPT", category: "LLM Prompting", color: "#10A37F" },
  { name: "Claude", category: "AI Workflows", color: "#D97706" },
  { name: "Figma", category: "Design Comments", color: "#F24E1E" },
  { name: "Discord", category: "Community", color: "#5865F2" },
  { name: "Raycast", category: "Launcher", color: "#FF6363" },
  { name: "WhatsApp", category: "Messaging", color: "#25D366" },
  { name: "GitHub PRs", category: "Code Review", color: "#24292F" },
];

export function AppGrid() {
  return (
    <section className="py-20 bg-white/40 dark:bg-black/10 border-b border-[#E2DBD0] dark:border-[#2B2823]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-medium mb-3">
            <Check className="w-3.5 h-3.5" />
            <span>Universal System-Wide Paste</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-normal text-[#1A1815] dark:text-[#EDE9DF]">
            Works wherever your{" "}
            <span className="italic text-[#C15F3D]">cursor</span> can blink.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#787368] dark:text-[#A19B8E]">
            No browser extensions or clunky copy-pasting. Hold your global
            shortcut and clean punctuated text streams in at 160 WPM.
          </p>
        </div>

        {/* Floating App Pills Marquee */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 max-w-6xl mx-auto">
          {apps.map((app, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-2xs hover:border-[#C15F3D]/50 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center group cursor-default"
            >
              <div
                className="w-3 h-3 rounded-full mb-2 opacity-80 group-hover:scale-125 transition-transform"
                style={{ backgroundColor: app.color }}
              />
              <span className="text-xs font-semibold text-[#1A1815] dark:text-[#EDE9DF] tracking-tight">
                {app.name}
              </span>
              <span className="text-[10px] font-mono text-[#787368] dark:text-[#A19B8E] mt-0.5">
                {app.category}
              </span>
            </div>
          ))}
        </div>

        {/* Feature snippet bar */}
        <div className="mt-10 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 text-xs font-mono text-[#787368] dark:text-[#A19B8E]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C15F3D]"></span>
            <span>Simulates native OS keystrokes</span>
          </div>
          <div className="hidden sm:inline">•</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Zero clipboard hijacking</span>
          </div>
          <div className="hidden sm:inline">•</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Instant undo with Ctrl+Z</span>
          </div>
        </div>
      </div>
    </section>
  );
}
