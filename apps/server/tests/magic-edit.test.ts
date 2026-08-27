import { describe, expect, it } from "vitest";
import { buildMagicEditPrompt } from "../src/lib/editor/magic-edit.js";

describe("buildMagicEditPrompt", () => {
  it("constructs system and user prompt with selected text and instruction", () => {
    const { system, prompt } = buildMagicEditPrompt({
      selectedText: "i thinks this is broken",
      instruction: "fix grammar and make it formal",
    });

    expect(system).toContain("You are an elite, direct in-place text editor");
    expect(system).toContain("Return ONLY the final rewritten text");
    expect(prompt).toContain(
      "<instruction_how_to_rewrite>\nfix grammar and make it formal\n</instruction_how_to_rewrite>",
    );
    expect(prompt).toContain(
      "<original_text_to_be_replaced>\ni thinks this is broken\n</original_text_to_be_replaced>",
    );
  });

  it("includes app context in the system prompt when provided", () => {
    const { system } = buildMagicEditPrompt({
      selectedText: "def foo(): pass",
      instruction: "add docstring",
      appContext: JSON.stringify({
        app: "VS Code",
        windowTitle: "main.py - Project",
      }),
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

  it("constructs smart reply prompt when user asks to reply to a selected message", () => {
    const { system, prompt } = buildMagicEditPrompt({
      selectedText: "Hey, are you free for a quick call tomorrow at 3pm?",
      instruction: "reply saying I'm interested and ask for Friday instead",
    });

    expect(system).toContain(
      "You are an elite AI communication partner and ghostwriter",
    );
    expect(system).toContain("FIRST-PERSON REPLY");
    expect(prompt).toContain(
      "<reply_instruction>\nreply saying I'm interested and ask for Friday instead\n</reply_instruction>",
    );
    expect(prompt).toContain(
      "<incoming_message_to_reply_to>\nHey, are you free for a quick call tomorrow at 3pm?\n</incoming_message_to_reply_to>",
    );
  });

  it("handles open-ended reply requests like 'help me reply to this'", () => {
    const { system, prompt } = buildMagicEditPrompt({
      selectedText: "Can you send the contract review by EOD?",
      instruction: "help me reply to this",
    });

    expect(system).toContain(
      "You are an elite AI communication partner and ghostwriter",
    );
    expect(system).toContain("OPEN-ENDED & SPECIFIC INSTRUCTIONS");
    expect(prompt).toContain(
      "<reply_instruction>\nhelp me reply to this\n</reply_instruction>",
    );
  });

  it("constructs direct ghostwriting prompt when no text was selected", () => {
    const { system, prompt } = buildMagicEditPrompt({
      selectedText: "",
      instruction: "write a cold email to a client offering AI consulting",
    });

    expect(system).toContain("You are an elite, highly capable AI ghostwriter");
    expect(system).toContain("GHOSTWRITER & FIRST-PERSON PERSPECTIVE");
    expect(prompt).toContain(
      "<user_request>\nwrite a cold email to a client offering AI consulting\n</user_request>",
    );
  });
});
