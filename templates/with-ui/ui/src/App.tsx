import type { CadenceBridge } from "cadence-voice";

declare global {
  interface Window {
    cadence?: CadenceBridge;
    freestyle?: CadenceBridge;
  }
}

export function App() {
  const bridge = window.cadence || window.freestyle;
  return (
    <div className="page">
      <button
        type="button"
        className="back-btn"
        onClick={() => bridge?.invoke("navigate", { to: "/plugins" })}
      >
        &larr; Back
      </button>

      <h1>My Plugin</h1>
      <p>
        Edit <code>ui/src/App.tsx</code> to build your plugin UI.
      </p>
      <p>
        Use <code>window.cadence.api()</code> to call the Cadence server, or add
        custom API routes via <code>middleware</code> in your plugin.
      </p>

      <style>{`
        .page {
          font-family: 'DM Sans', system-ui, sans-serif;
          padding: 16px 48px 48px;
          max-width: 640px;
          color: var(--foreground, #1a1a1a);
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          width: max-content;
          padding: 6px 12px;
          margin-bottom: 16px;
          border: 1px solid var(--border, #e5e5e5);
          border-radius: 6px;
          background: var(--card, #fff);
          color: var(--foreground, #1a1a1a);
          font: inherit;
          font-size: 13px;
          cursor: pointer;
        }
        .back-btn:hover {
          background: var(--accent, #f5f5f5);
        }
        h1 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px;
        }
        p {
          font-size: 14px;
          line-height: 1.6;
          color: var(--muted-foreground, #666);
          margin: 0 0 8px;
        }
        code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          background: var(--muted, #f5f5f5);
          padding: 2px 5px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
