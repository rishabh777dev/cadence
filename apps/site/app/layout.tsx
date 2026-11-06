import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cadencevoice.app"),
  title: "Cadence — Voice Dictation at the Speed of Thought",
  description:
    "Local-first AI voice dictation and magic text editing for macOS, Windows, and Linux. Hold a hotkey, speak naturally, and paste clean punctuated text anywhere in milliseconds.",
  keywords: [
    "voice dictation",
    "AI voice typing",
    "whisper desktop",
    "wispr flow alternative",
    "fluid voice",
    "speech to text",
    "local AI dictation",
    "whisper.cpp",
    "mlx transcription",
  ],
  authors: [{ name: "Cadence Voice" }],
  openGraph: {
    title: "Cadence — Voice Dictation at the Speed of Thought",
    description:
      "Speak 4X faster than typing. 100% private on-device Whisper & MLX, magic text rewriting, and system-wide cursor paste.",
    url: "https://cadencevoice.app",
    siteName: "Cadence",
    images: [
      {
        url: "/home-page-demo.png",
        width: 1200,
        height: 630,
        alt: "Cadence Voice Dictation Desktop App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadence — Voice Dictation at the Speed of Thought",
    description:
      "Local-first AI voice dictation & magic text editing. Hold key, speak, paste anywhere.",
    images: ["/home-page-demo.png"],
  },
  icons: {
    icon: "/cadence-logo-square.png",
    apple: "/cadence-logo-square.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/cadence-logo-square.png" />
      </head>
      <body
        className={`${dmSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased selection:bg-[#C15F3D]/20 selection:text-[#C15F3D]`}
      >
        {children}
      </body>
    </html>
  );
}
