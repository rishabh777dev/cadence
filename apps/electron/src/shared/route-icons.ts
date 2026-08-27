export type BuiltinRouteIconId =
  | "messages"
  | "whatsapp"
  | "telegram"
  | "discord"
  | "slack"
  | "linkedin"
  | "work_chat"
  | "gmail"
  | "outlook"
  | "apple_mail"
  | "proton"
  | "vscode"
  | "terminal"
  | "github"
  | "cursor"
  | "antigravity"
  | "codex"
  | "chatgpt"
  | "claude";

export function normalizeRouteIconHost(raw: string): string {
  return raw
    .replace(/^www\./, "")
    .trim()
    .toLowerCase();
}
