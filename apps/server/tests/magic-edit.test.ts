import { describe, expect, it } from "vitest";
import { buildMagicEditPrompt } from "../src/lib/editor/magic-edit.js";

describe("buildMagicEditPrompt", () => {
  it("constructs system and user prompt with selected text and instruction", () => {
    const { system, prompt } = buildMagicEditPrompt({
      selectedText: "i thinks this is broken",
      instruction: "fix grammar and make it formal",
    });

    expect(system).toContain("You are an expert, precise in-place text editor");
    expect(system).toContain("Return ONLY the final replacement text");
    expect(prompt).toContain("<instruction>\nfix grammar and make it formal\n</instruction>");
    expect(prompt).toContain("<selected_text>\ni thinks this is broken\n</selected_text>");
  });

  it("includes app context in the system prompt when provided", () => {
    const { system } = buildMagicEditPrompt({
      selectedText: "def foo(): pass",
      instruction: "add docstring",
      appContext: JSON.stringify({ app: "VS Code", windowTitle: "main.py - Project" }),
    });

    expect(system).toContain("VS Code (main.py - Project)");
  });

  it("includes Hinglish Roman script instruction rule in system prompt", () => {
    const { system } = buildMagicEditPrompt({
      selectedText: "Let's meet at 5pm",
      instruction: "translate to hindi",
      script: "roman",
    });

    expect(system).toContain("Roman script");
  });

  it("applies tone and custom instructions when configured", () => {
    const { system } = buildMagicEditPrompt({
      selectedText: "Hey what's up",
      instruction: "make it professional",
      tone: "professional",
      customPrompt: "Always use bullet points.",
    });

    expect(system).toContain("polished, professional, business-appropriate tone");
    expect(system).toContain("Always use bullet points.");
  });
});
