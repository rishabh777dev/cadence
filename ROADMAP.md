<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="media/cadence-logo-full-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="media/cadence-logo-full-light.png">
    <img alt="Cadence" src="media/cadence-logo-full-light.png" width="460">
  </picture>
</p>

# Cadence Roadmap

Below is the high-level roadmap for Cadence. This roadmap outlines key focus areas across core capabilities, client apps, and integrations.

If you'd like to suggest improvements or contribute to any of these initiatives, please open an issue or pull request on [GitHub](https://github.com/rishabh777dev/cadence).

---

## 🎯 Core Engine & Architecture

**Objective:** Ultra-low latency, accurate, and private voice dictation.

1. **Local Model Acceleration**: Continuous optimization of `whisper.cpp` and Apple MLX runtimes for instant offline inference.
2. **Streaming STT Improvements**: Low-latency token-streaming for real-time word output directly into target input fields.
3. **Smart Post-Processing**: Enhanced context-aware grammar correction and vocabulary biasing based on active window context.

---

## 💻 Desktop Application

**Objective:** Delightful, native user experience across Windows, macOS, and Linux.

1. **Customizable Floating UI**: Polished overlay controls, visual recording indicators, and audio level visualizations.
2. **Per-App Dictionary & Tones**: Granular profile matching for developer tools (VS Code, Terminal), messaging (Slack, WhatsApp), and document writing.
3. **Robust Hotkey Engine**: Cross-platform global input capture and reliable clipboard pasting.

---

## 🧩 Plugin Ecosystem & SDK

**Objective:** Empower developers to build audio and text workflows.

1. **Cadence Voice SDK**: Simplified event hooks (`onTranscription`, `onMagicEdit`, `transform`).
2. **Plugin Store / Registry**: Streamlined discovery, installation, and auto-updating of plugins.

---

For development setup and guidelines, see [**CONTRIBUTING.md**](CONTRIBUTING.md).
