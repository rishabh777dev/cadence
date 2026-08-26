import markDark from "@renderer/assets/mark-dark.svg";
import markLight from "@renderer/assets/mark-light.svg";
import {
  CloudProfileButton,
  UpgradeCtaCard,
} from "@renderer/components/cloud-profile";
import { Badge } from "@renderer/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { useCloudAuth } from "@renderer/lib/auth-context";
import { LINKS } from "@renderer/lib/links";
import { IS_MAC, MOD_LABEL } from "@renderer/lib/platform";
import { listPlugins } from "@renderer/lib/plugins-api";
import { settingsQueryOptions } from "@renderer/lib/query";
import { cn } from "@renderer/lib/utils";
import {
  pluginDisplayName,
  resolvePluginIcon,
} from "@renderer/pages/plugins/helpers";
import type { PluginInfo } from "@shared/plugins";
import { SETTINGS_KEYS } from "@shared/settings-keys";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Book,
  BookOpen,
  CircleHelp,
  Cpu,
  FileText,
  PanelLeftClose,
  Puzzle,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SiDiscord, SiGithub } from "react-icons/si";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Keyboard shortcut digit (e.g. "1" for Cmd+1). Omit for plugin items. */
  shortcut?: string;
  /** Renders in the bottom group of the sidebar instead of the top. */
  footer?: boolean;
  /** Whether this is a local dev plugin (shows a "Dev" badge). */
  isDev?: boolean;
};

const STATIC_NAV: {
  to: string;
  icon: LucideIcon;
  shortcut: string;
  labelKey: string;
  footer?: boolean;
}[] = [
  { to: "/today", icon: BookOpen, shortcut: "1", labelKey: "shell.nav.today" },
  {
    to: "/settings/vocabulary",
    icon: Book,
    shortcut: "2",
    labelKey: "shell.nav.vocabulary",
  },
  {
    to: "/settings/dictionary",
    icon: Zap,
    shortcut: "3",
    labelKey: "shell.nav.dictionary",
  },
  {
    to: "/settings/tone",
    icon: FileText,
    shortcut: "4",
    labelKey: "shell.nav.tone",
  },
  {
    to: "/magic-edit",
    icon: Sparkles,
    shortcut: "5",
    labelKey: "shell.nav.magicEdit",
  },
  {
    to: "/settings/models",
    icon: Cpu,
    shortcut: "6",
    labelKey: "shell.nav.models",
  },
  {
    to: "/plugins",
    icon: Puzzle,
    shortcut: "7",
    labelKey: "shell.nav.plugins",
  },
  {
    to: "/settings",
    icon: Settings,
    shortcut: "8",
    labelKey: "shell.nav.settings",
    footer: true,
  },
  {
    to: "/help",
    icon: CircleHelp,
    shortcut: "9",
    labelKey: "shell.nav.help",
    footer: true,
  },
];

function NavList({
  items,
  compact = false,
}: {
  items: NavItem[];
  compact?: boolean;
}): React.JSX.Element {
  return (
    <nav
      className={cn("flex flex-col gap-1", compact ? "px-1.5" : "px-3")}
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/settings" || item.to === "/plugins"}
            className="block"
          >
            {({ isActive }) => {
              if (compact) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex h-9 w-9 mx-auto items-center justify-center rounded-lg border transition-all cursor-pointer",
                          isActive
                            ? "glass-nav-active text-primary bg-card/80 border-border shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/50 border-transparent",
                        )}
                      >
                        <Icon size={16} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      <span>{item.label}</span>
                      {item.shortcut ? (
                        <span className="mono ml-1.5 text-[10px] text-muted-foreground">
                          {MOD_LABEL}
                          {item.shortcut}
                        </span>
                      ) : null}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <div
                  className={cn(
                    "flex items-center gap-2.5 rounded-[7px] border px-2.5 py-1.5 text-[13px] transition-colors",
                    isActive
                      ? "glass-nav-active text-foreground font-medium"
                      : "text-secondary-foreground/80 hover:bg-card/50 border-transparent font-normal",
                  )}
                >
                  <Icon
                    size={14}
                    className={
                      isActive ? "text-primary" : "text-muted-foreground"
                    }
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.isDev ? (
                    <Badge
                      variant="outline"
                      className="mono h-4 shrink-0 border-yellow-500/30 bg-yellow-500/15 px-1 text-[9px] text-yellow-700 uppercase tracking-[0.12em] dark:text-yellow-300"
                    >
                      dev
                    </Badge>
                  ) : null}
                  {item.shortcut ? (
                    <span
                      className={cn(
                        "mono shrink-0 text-[9.5px] tabular-nums",
                        isActive
                          ? "text-muted-foreground/80"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {MOD_LABEL}
                      {item.shortcut}
                    </span>
                  ) : null}
                </div>
              );
            }}
          </NavLink>
        );
      })}
    </nav>
  );
}

/** Derive sidebar nav items from installed plugins that have UI pages. */
function usePluginNavItems(plugins: PluginInfo[]): NavItem[] {
  return useMemo(() => {
    const items: NavItem[] = [];
    for (const plugin of plugins) {
      if (!plugin.enabled || plugin.missing) continue;
      for (const page of plugin.pages) {
        items.push({
          to: `/plugins/${plugin.slug}/${page.id}`,
          label:
            plugin.pages.length === 1 ? pluginDisplayName(plugin) : page.title,
          icon: resolvePluginIcon(page.icon ?? plugin.icon),
          isDev: plugin.slug.endsWith("-dev"),
        });
      }
    }
    return items;
  }, [plugins]);
}

export default function AppShell(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("cadence_sidebar_open");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const { t } = useTranslation();
  const { user } = useCloudAuth();

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("cadence_sidebar_open", String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut: Cmd+\ or Ctrl+\ to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // A plugin page renders a native WebContentsView that paints above the DOM,
  // so the floating social bar would be occluded. Hide it while a plugin page
  // is open. Matches /plugins/<slug>/<pageId>.
  const onPluginPage = /^\/plugins\/[^/]+\/[^/]+/.test(location.pathname);

  const { data: plugins = [] } = useQuery({
    queryKey: ["plugins"],
    queryFn: () => listPlugins(),
  });

  const pluginNav = usePluginNavItems(plugins);

  // Advanced mode gates the Models page. Read from the shared settings cache so
  // toggling it in Settings updates the sidebar without a full refetch.
  const { data: settings } = useQuery(settingsQueryOptions());
  const advancedMode = settings?.[SETTINGS_KEYS.advancedMode] === "true";

  // Filter the static nav (hide Models when advanced mode is off) and re-number
  // the Cmd+N shortcuts sequentially so there's no gap when an item is hidden
  // (e.g. Plugins becomes Cmd+5 when Models is absent).
  const staticNav = useMemo(
    () =>
      STATIC_NAV.filter(
        (item) => item.to !== "/settings/models" || advancedMode,
      ).map((item, idx) => ({ ...item, shortcut: String(idx + 1) })),
    [advancedMode],
  );

  const navItems: NavItem[] = useMemo(
    () =>
      staticNav.map((item) => ({
        ...item,
        label: t(item.labelKey) as string,
      })),
    [staticNav, t],
  );
  const mainNav = navItems.filter((item) => !item.footer);
  const footerNav = navItems.filter((item) => item.footer);

  // Cmd/Ctrl+1..9 jumps between sidebar items
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < staticNav.length) {
        e.preventDefault();
        navigate(staticNav[idx].to);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, staticNav]);

  useEffect(() => {
    return window.api?.onFullscreenChanged(setIsFullscreen);
  }, []);

  return (
    <div className="glass-window-shell relative flex h-screen min-h-0 overflow-hidden">
      {/* Ambient background atmospheric glass aura */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[480px] w-[480px] rounded-full bg-primary/10 blur-[110px] dark:bg-primary/15" />
        <div className="absolute top-[35%] -right-[15%] h-[520px] w-[520px] rounded-full bg-amber-500/8 blur-[130px] dark:bg-amber-600/10" />
        <div className="absolute -bottom-[15%] left-[25%] h-[420px] w-[420px] rounded-full bg-primary/6 blur-[120px] dark:bg-primary/10" />
      </div>

      <aside
        className={cn(
          "glass-sidebar z-10 flex min-h-0 shrink-0 flex-col border-r transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
          sidebarOpen ? "w-[220px]" : "w-[58px]",
        )}
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        {/* Header / Brand row */}
        {sidebarOpen ? (
          <div
            className={cn(
              "flex items-center justify-between px-3.5 pb-5",
              !IS_MAC || isFullscreen ? "pt-4" : "pt-[44px]",
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={markLight}
                alt="Cadence"
                className="block h-7 w-7 shrink-0 dark:hidden"
              />
              <img
                src={markDark}
                alt="Cadence"
                className="hidden h-7 w-7 shrink-0 dark:block"
              />
              <span className="serif text-foreground text-[19px] font-medium tracking-tight truncate">
                Cadence
              </span>
              {import.meta.env.DEV && (
                <Badge
                  variant="outline"
                  className="mono h-4 shrink-0 border-yellow-500/30 bg-yellow-500/15 px-1.5 text-[9px] text-yellow-700 uppercase tracking-[0.12em] dark:text-yellow-300"
                >
                  dev
                </Badge>
              )}
            </div>

            <button
              type="button"
              onClick={toggleSidebar}
              title={`Collapse sidebar (${MOD_LABEL}\\)`}
              aria-label="Collapse sidebar"
              className="text-muted-foreground hover:text-foreground hover:bg-card/70 flex h-7 w-7 items-center justify-center rounded-lg border border-transparent transition-all hover:border-border/50 cursor-pointer shrink-0"
              style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center pb-4",
              !IS_MAC || isFullscreen ? "pt-3.5" : "pt-[42px]",
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label="Expand sidebar"
                  className="text-muted-foreground hover:text-foreground hover:bg-card flex h-9 w-9 items-center justify-center rounded-xl border border-transparent hover:border-border transition-all cursor-pointer group"
                  style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
                >
                  <img
                    src={markLight}
                    alt="Cadence"
                    className="block h-6 w-6 dark:hidden group-hover:scale-105 transition-transform"
                  />
                  <img
                    src={markDark}
                    alt="Cadence"
                    className="hidden h-6 w-6 dark:block group-hover:scale-105 transition-transform"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Expand sidebar ({MOD_LABEL}\)
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <div
          className="no-scrollbar min-h-0 flex-1 overflow-y-auto"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <NavList items={mainNav} compact={!sidebarOpen} />
          {pluginNav.length > 0 ? (
            <>
              <div
                className={cn(
                  "border-sidebar-border my-1.5 border-t",
                  sidebarOpen ? "mx-3" : "mx-2",
                )}
              />
              <NavList items={pluginNav} compact={!sidebarOpen} />
            </>
          ) : null}
        </div>
        {!user ? (
          <>
            {pluginNav.length > 0 ? (
              <div
                className={cn(
                  "border-sidebar-border my-1.5 border-t",
                  sidebarOpen ? "mx-3" : "mx-2",
                )}
              />
            ) : null}
            <NavList items={footerNav} compact={!sidebarOpen} />
          </>
        ) : null}
        {sidebarOpen ? <UpgradeCtaCard /> : null}
        <div
          className={cn(
            "border-sidebar-border mt-2 border-t pt-2",
            sidebarOpen ? "mx-3" : "mx-1.5",
          )}
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <CloudProfileButton compact={!sidebarOpen} />
        </div>
        <div className="h-3" />
      </aside>

      <div className="glass-content relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className={cn(
            "glass-topbar absolute top-0 right-0 z-40 flex items-center gap-1.5 rounded-bl-[14px] border-b border-l px-3 py-2",
            onPluginPage && "hidden",
          )}
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <a
            href={LINKS.repo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repo"
            className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-md p-1.5 transition-colors"
          >
            <SiGithub className="h-3.5 w-3.5" />
          </a>
          <a
            href={LINKS.discord}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join our Discord"
            className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-md p-1.5 transition-colors"
          >
            <SiDiscord className="h-3.5 w-3.5" />
          </a>
        </div>

        <main
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
