"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface AppItem {
  name: string;
  category: string;
  icon: ReactNode;
}

/* ---------------- Authentic Vector Brand Logos ---------------- */

function SlackLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"
        fill="#36C5F0"
      />
      <path
        d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
        fill="#36C5F0"
      />
      <path
        d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z"
        fill="#2EB67D"
      />
      <path
        d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
        fill="#2EB67D"
      />
      <path
        d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z"
        fill="#ECB22E"
      />
      <path
        d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
        fill="#ECB22E"
      />
      <path
        d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z"
        fill="#E01E5A"
      />
      <path
        d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
        fill="#E01E5A"
      />
    </svg>
  );
}

function VSCodeLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .32 8.752L4.015 12 .32 15.248a1 1 0 0 0 .007 1.491l1.322 1.202a1 1 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.94-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"
        fill="#007ACC"
      />
    </svg>
  );
}

function CursorLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z"
        fill="#1A1815"
        className="fill-[#1A1815] dark:fill-[#EDE9DF]"
      />
      <path d="M12 2l8.5 5-8.5 5-8.5-5L12 2z" fill="white" fillOpacity="0.25" />
      <path d="M3.5 7l8.5 5v10l-8.5-5V7z" fill="black" fillOpacity="0.2" />
      <path d="M20.5 7l-8.5 5v10l8.5-5V7z" fill="white" fillOpacity="0.1" />
      <path
        d="M12 22V12M3.5 7l8.5 5 8.5-5"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1"
      />
    </svg>
  );
}

function NotionLogo() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.83c-.42-.326-.98-.7-2.053-.607L3.107 2.296c-.466.046-.56.326-.373.513l1.725 1.399zm-.746 3.172v13.52c0 .84.42 1.12 1.353 1.073l14.475-.84c.933-.046 1.12-.513 1.12-1.213V6.26c0-.7-.373-.933-.933-.887l-15.08.887c-.653.047-.935.373-.935.84zm13.483 1.633c.093.42 0 .84-.42.887l-.933.14v8.398c-.653.373-1.306.56-1.82.56-.84 0-1.073-.28-1.726-1.073l-4.572-7.091v6.858l1.4.327c.42.093.466.513.466.793 0 .14-.046.28-.233.28l-3.872.233c-.093 0-.28-.14-.28-.373 0-.327.186-.607.56-.653l1.12-.234V9.851l-1.307-.14c-.373-.047-.466-.467-.466-.747 0-.14.047-.28.233-.28l3.686-.233c.887 0 1.4.373 1.96 1.073l4.386 6.765V9.944l-1.26-.14c-.373-.047-.42-.513-.42-.747 0-.14.093-.28.28-.28l3.22.187z" />
    </svg>
  );
}

function GoogleDocsLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
        fill="#4285F4"
      />
      <path d="M14 2v6h6L14 2z" fill="#A1C2FA" />
      <path
        d="M8 12h8M8 15h8M8 18h5"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppleMailLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="4.5" fill="#0A84FF" />
      <path
        d="M2.5 7.5L12 14L21.5 7.5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 18l5.5-5.5M21 18l-5.5-5.5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

function SuperhumanLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5.5"
        fill="#E01E5A"
        fillOpacity="0.12"
      />
      <path
        d="M3.5 7.5L12 13.5L20.5 7.5M3.5 7.5L12 3.5L20.5 7.5M3.5 7.5V16.5L12 20.5L20.5 16.5V7.5"
        stroke="#E01E5A"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinearLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.24 13.88c-.38.38-.87.76-.87 1.26 0 .44.33.82.84 1.33l5.56 5.56c.51.51.89.84 1.33.84.5 0 .88-.49 1.26-.87l9.4-9.4A11.94 11.94 0 0 0 12.64 4.48L3.24 13.88z"
        fill="#5E6AD2"
      />
      <path
        d="M1.39 10.51a11.94 11.94 0 0 1 8.13-8.13L1.39 10.51z"
        fill="#5E6AD2"
        opacity="0.5"
      />
      <path
        d="M22.61 13.49a11.94 11.94 0 0 1-8.13 8.13l8.13-8.13z"
        fill="#5E6AD2"
        opacity="0.5"
      />
    </svg>
  );
}

function ObsidianLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17.5 3.5L8.5 2L5 8.5L2 14.5L5.5 21L14 22L21 16.5L22 9.5L17.5 3.5Z"
        fill="#7C3AED"
        fillOpacity="0.15"
      />
      <path d="M8.5 2L5 8.5L9.5 13.5L17.5 3.5L8.5 2Z" fill="#8B5CF6" />
      <path d="M5 8.5L2 14.5L5.5 21L9.5 13.5L5 8.5Z" fill="#6D28D9" />
      <path d="M9.5 13.5L5.5 21L14 22L17.5 15.5L9.5 13.5Z" fill="#7C3AED" />
      <path d="M17.5 3.5L9.5 13.5L17.5 15.5L22 9.5L17.5 3.5Z" fill="#A78BFA" />
      <path d="M17.5 15.5L14 22L21 16.5L22 9.5L17.5 15.5Z" fill="#5B21B6" />
    </svg>
  );
}

function ChatGPTLogo() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="#10A37F"
      aria-hidden="true"
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.487a4.485 4.485 0 0 1 2.365-1.98v.166l4.77 2.756a.798.798 0 0 0 .79.006l5.836-3.37-2.02-1.166a.08.08 0 0 1-.038-.057L9.2 2.37a4.5 4.5 0 0 1 5.967 1.63M10.74 1.57a4.476 4.476 0 0 1 2.876 1.04l-.141.081-4.779 2.758a.795.795 0 0 0-.392.681v6.737l-2.02-1.168a.071.071 0 0 1-.038-.052V6.064a4.504 4.504 0 0 1 4.494-4.494zM20.4 5.696a4.47 4.47 0 0 1 .535 3.014l-.142-.085-4.783-2.759a.771.771 0 0 0-.78 0L9.387 9.235V6.903a.08.08 0 0 1 .033-.062L14.26 4.05a4.5 4.5 0 0 1 6.14 1.646zM21.66 15.513a4.485 4.485 0 0 1-2.365 1.98v-.166l-4.77-2.756a.798.798 0 0 0-.79-.006l-5.836 3.37 2.02 1.166a.08.08 0 0 1 .038.057l4.84 2.793a4.5 4.5 0 0 1-5.967-1.63" />
    </svg>
  );
}

function ClaudeLogo() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="#D97706"
      aria-hidden="true"
    >
      <path d="M12 2a1 1 0 0 1 1 1v4.27l3.02-3.02a1 1 0 0 1 1.42 1.42L14.42 8.7H19a1 1 0 0 1 1 1v.6a1 1 0 0 1-1 1h-4.58l3.02 3.02a1 1 0 0 1-1.42 1.42L13 12.73V19a1 1 0 0 1-1 1h-.6a1 1 0 0 1-1-1v-6.27l-3.02 3.02a1 1 0 0 1-1.42-1.42L8.98 11.3H5a1 1 0 0 1-1-1v-.6a1 1 0 0 1 1-1h3.98L5.96 5.68a1 1 0 0 1 1.42-1.42L10.4 7.28V3a1 1 0 0 1 1-1h.6z" />
    </svg>
  );
}

function FigmaLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z"
        fill="#0ACF83"
      />
      <path
        d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z"
        fill="#A259FF"
      />
      <path
        d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z"
        fill="#F24E1E"
      />
      <path d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z" fill="#FF7262" />
      <path
        d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z"
        fill="#1ABCFE"
      />
    </svg>
  );
}

function DiscordLogo() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="#5865F2"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function RaycastLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="#FF6363" />
      <path
        d="M7.5 16.5L16.5 7.5M16.5 7.5H10.5M16.5 7.5V13.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppLogo() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="#25D366"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function GitHubLogo() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

/* ---------------- Row Definitions (8 Apps Each) ---------------- */

const row1: AppItem[] = [
  { name: "Slack", category: "Team Chat", icon: <SlackLogo /> },
  { name: "VS Code", category: "Engineering", icon: <VSCodeLogo /> },
  { name: "Cursor", category: "AI Code Editor", icon: <CursorLogo /> },
  { name: "Notion", category: "Docs & Notes", icon: <NotionLogo /> },
  { name: "Google Docs", category: "Collaboration", icon: <GoogleDocsLogo /> },
  { name: "Apple Mail", category: "Communication", icon: <AppleMailLogo /> },
  { name: "Superhuman", category: "Email", icon: <SuperhumanLogo /> },
  { name: "Linear", category: "Issue Tracking", icon: <LinearLogo /> },
];

const row2: AppItem[] = [
  { name: "Obsidian", category: "Knowledge Base", icon: <ObsidianLogo /> },
  { name: "ChatGPT", category: "LLM Prompting", icon: <ChatGPTLogo /> },
  { name: "Claude", category: "AI Workflows", icon: <ClaudeLogo /> },
  { name: "Figma", category: "Design Comments", icon: <FigmaLogo /> },
  { name: "Discord", category: "Community", icon: <DiscordLogo /> },
  { name: "Raycast", category: "Launcher", icon: <RaycastLogo /> },
  { name: "WhatsApp", category: "Messaging", icon: <WhatsAppLogo /> },
  { name: "GitHub PRs", category: "Code Review", icon: <GitHubLogo /> },
];

// Repeat 4x to guarantee buttery-smooth infinite loop with no pop on any screen size
const row1Duplicated = [...row1, ...row1, ...row1, ...row1];
const row2Duplicated = [...row2, ...row2, ...row2, ...row2];

/* ---------------- Reusable App Card ---------------- */

function AppCard({ app }: { app: AppItem }) {
  return (
    <div className="w-36 sm:w-44 shrink-0 p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-2xs hover:border-[#C15F3D]/50 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center group cursor-default select-none">
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#25221E] border border-[#E8E2D8] dark:border-[#332F2A] shadow-2xs flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
        {app.icon}
      </div>
      <span className="text-xs sm:text-sm font-semibold text-[#1A1815] dark:text-[#EDE9DF] tracking-tight">
        {app.name}
      </span>
      <span className="text-[10px] sm:text-[11px] font-mono text-[#787368] dark:text-[#A19B8E] mt-0.5">
        {app.category}
      </span>
    </div>
  );
}

/* ---------------- Main Section Component ---------------- */

export function AppGrid() {
  return (
    <section className="py-20 bg-white/40 dark:bg-black/10 border-b border-[#E2DBD0] dark:border-[#2B2823] overflow-hidden">
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

        {/* Infinite Dual-Row Horizontal Marquee with Blurry Edge Overlays */}
        <div className="relative w-full overflow-hidden py-2">
          {/* Frosted / Blurry Left Edge */}
          <div
            className="pointer-events-none absolute left-0 inset-y-0 w-24 sm:w-44 md:w-56 z-20 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/80 to-transparent dark:from-[#11100E] dark:via-[#11100E]/80 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Frosted / Blurry Right Edge */}
          <div
            className="pointer-events-none absolute right-0 inset-y-0 w-24 sm:w-44 md:w-56 z-20 bg-gradient-to-l from-[#FAF7F2] via-[#FAF7F2]/80 to-transparent dark:from-[#11100E] dark:via-[#11100E]/80 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-4 sm:gap-5 [mask-image:linear-gradient(to_right,transparent_0%,black_6%,black_94%,transparent_100%)]">
            {/* Row 1: Scrolling Left Infinitely */}
            <div className="animate-marquee-left flex gap-3 sm:gap-4">
              {row1Duplicated.map((app, i) => (
                <AppCard key={`r1-${i}-${app.name}`} app={app} />
              ))}
            </div>

            {/* Row 2: Scrolling Right Infinitely */}
            <div className="animate-marquee-right flex gap-3 sm:gap-4">
              {row2Duplicated.map((app, i) => (
                <AppCard key={`r2-${i}-${app.name}`} app={app} />
              ))}
            </div>
          </div>
        </div>

        {/* Feature snippet bar */}
        <div className="mt-12 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 text-xs font-mono text-[#787368] dark:text-[#A19B8E]">
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
