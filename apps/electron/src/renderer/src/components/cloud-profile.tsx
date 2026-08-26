import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@renderer/components/ui/dropdown-menu";
import { Progress } from "@renderer/components/ui/progress";
import { useUpgradeModal } from "@renderer/components/upgrade-modal";
import { useCloudAuth } from "@renderer/lib/auth-context";
import { usagePercent, useCloudUsage } from "@renderer/lib/use-cloud-usage";
import { cn } from "@renderer/lib/utils";
import {
  ChevronsUpDown,
  CircleHelp,
  Cloud,
  CreditCard,
  Loader2,
  LogIn,
  LogOut,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router";

const ROW =
  "flex w-full items-center gap-2.5 rounded-[7px] border border-transparent px-2.5 py-1.5 text-[13px] transition-colors";

export function UpgradeCtaCard(): React.JSX.Element | null {
  const { user } = useCloudAuth();
  const { balance, isPro } = useCloudUsage(!!user);
  const { openUpgradeModal } = useUpgradeModal();

  if (!user || isPro || !balance) return null;

  const pct = usagePercent(balance);

  return (
    <div
      className="glass-card mx-3 mt-2 rounded-[10px] border p-3"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <div className="text-foreground text-[12px] font-medium">
        {balance.remaining.toLocaleString()}
        <span className="text-muted-foreground font-normal">
          {" "}
          / {balance.limit.toLocaleString()}
        </span>{" "}
        words left
      </div>
      <Progress value={pct} className="mt-1.5 h-1.5" />
      <p className="text-muted-foreground mt-2.5 text-[11px] leading-snug">
        Currently on a free plan, upgrade to Pro for unlimited dictation.
      </p>
      <Button
        size="sm"
        onClick={() => openUpgradeModal()}
        className="mt-2.5 w-full"
      >
        Upgrade to Pro
      </Button>
    </div>
  );
}

export function CloudProfileButton({
  compact = false,
}: {
  compact?: boolean;
} = {}): React.JSX.Element {
  const { user, loading, signingIn, signIn, signOut } = useCloudAuth();
  const { isPro, openBillingPortal } = useCloudUsage(!!user);
  const navigate = useNavigate();

  if (loading) {
    return compact ? (
      <div className="flex h-8 w-8 mx-auto items-center justify-center text-muted-foreground/50">
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
      </div>
    ) : (
      <div className={cn(ROW, "text-muted-foreground/50")}>
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
        <span className="flex-1 text-left">…</span>
      </div>
    );
  }

  if (!user) {
    if (compact) {
      return (
        <button
          type="button"
          onClick={() => void signIn()}
          disabled={signingIn}
          title="Sign in to Cadence"
          className="flex h-8 w-8 mx-auto items-center justify-center rounded-lg hover:bg-card text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors cursor-pointer"
        >
          {signingIn ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <LogIn className="size-4" />
          )}
        </button>
      );
    }
    return (
      <div className="glass-card rounded-[10px] border p-3">
        <div className="flex items-center gap-1.5">
          <Cloud className="text-primary size-3.5 shrink-0" />
          <span className="text-foreground text-[12.5px] font-medium">
            Cadence Transcribe
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
          Fast, accurate transcription, no API key required.
        </p>
        <Button
          size="sm"
          onClick={() => void signIn()}
          disabled={signingIn}
          className="bg-accent text-accent-foreground hover:bg-accent/70 mt-2.5 w-full"
        >
          {signingIn ? (
            <>
              <Loader2 className="animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn />
              Sign in
            </>
          )}
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={user.name || user.email}
            className="flex h-8 w-8 mx-auto items-center justify-center rounded-full hover:ring-2 hover:ring-primary/40 cursor-pointer transition-all focus:outline-none"
          >
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="size-8 shrink-0 rounded-full object-cover border border-border/80"
              />
            ) : (
              <div className="size-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center border border-border/80">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="end"
          sideOffset={10}
          className="w-[200px]"
        >
          <div className="px-1.5 py-1">
            <div className="text-foreground truncate text-[13px] font-medium">
              {user.name || user.email}
            </div>
            <div className="text-muted-foreground truncate text-[11px]">
              {user.email}
            </div>
          </div>
          <DropdownMenuSeparator />
          {isPro ? (
            <>
              <DropdownMenuItem onSelect={() => void openBillingPortal()}>
                <CreditCard />
                Manage subscription
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem onSelect={() => navigate("/settings")}>
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate("/help")}>
            <CircleHelp />
            Help
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            ROW,
            "text-foreground hover:bg-card/50 cursor-pointer data-[state=open]:bg-card data-[state=open]:border-border",
          )}
        >
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="size-7 shrink-0 rounded-full object-cover"
            />
          ) : null}
          <span className="min-w-0 flex-1 text-left leading-tight">
            <span className="flex items-center gap-1.5">
              <span className="text-foreground min-w-0 truncate font-medium">
                {user.name || user.email}
              </span>
              {isPro ? (
                <Badge className="mono h-4 shrink-0 px-1.5 text-[9px] uppercase tracking-[0.12em]">
                  Pro
                </Badge>
              ) : null}
            </span>
            {user.name ? (
              <span className="text-muted-foreground block truncate text-[11px]">
                {user.email}
              </span>
            ) : null}
          </span>
          <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={6}
        className="w-[200px]"
      >
        <div className="px-1.5 py-1">
          <div className="text-foreground truncate text-[13px] font-medium">
            {user.name || user.email}
          </div>
          <div className="text-muted-foreground truncate text-[11px]">
            {user.email}
          </div>
        </div>
        <DropdownMenuSeparator />
        {isPro ? (
          <>
            <DropdownMenuItem onSelect={() => void openBillingPortal()}>
              <CreditCard />
              Manage subscription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/help")}>
          <CircleHelp />
          Help
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
