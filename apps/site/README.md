# Cadence Web Landing Page

Marketing site and official download hub for **Cadence** (Voice Dictation at the speed of thought), modeled after Wispr Flow and Fluid Voice.

## 🚀 Quick Start

From repository root:
```bash
# Start Next.js development server
pnpm dev:site

# Or directly in this folder:
cd apps/site
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the site.

## 📦 Building for Production

```bash
pnpm build:site
```

## 🌐 Deploying to Vercel

### Option 1: Vercel Dashboard (GitHub Integration)
1. Push your changes to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repo (`rishabh777dev/cadence`).
3. Under **Build and Output Settings**:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `apps/site`
4. Click **Deploy**.

### Option 2: Vercel CLI
```bash
cd apps/site
npx vercel
```
For production:
```bash
npx vercel --prod
```

## ✨ Included Features & Sections
- **Hero**: Atmospheric typography, dynamic OS detection, primary download CTA with multi-platform dropdown.
- **Universal Cursor Paste**: Animated app grid (Slack, VS Code, Notion, Google Docs, Superhuman, etc.).
- **Interactive Voice Playground**: Live interactive simulation modeled after Wispr Flow with real-time soundwave visualizer, filler-word removal strikethrough, and contextual pastings.
- **Bento Capabilities**: 100% on-device Whisper.cpp & MLX privacy, Magic Edit in-place rewriting, BYOK cloud models (Groq, OpenAI, Claude, Gemini), custom acronym dictionary, 100+ languages.
- **Competitive Matrix**: Feature breakdown comparing Cadence vs Wispr Flow vs Superwhisper vs Apple Dictation.
- **Shortcuts Showcase**: Visual keyboard shortcuts (`Ctrl+Space`, `Alt+X`, `Escape`).
- **Official Download Hub**: Direct links for macOS (Apple Silicon & Intel DMG), Windows (.exe installer & portable ZIP), Linux (.AppImage & .deb), and mobile beta, complete with SHA-256 verification hashes.
- **Testimonials & FAQ**: Accordion answering privacy, hardware, latency, and open-source questions.
