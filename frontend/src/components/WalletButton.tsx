import { CSSProperties, useState } from "react";
import { useWallet } from "../hooks/useWallet";

function truncate(addr: string) {
  return `${addr.slice(0, 5)}…${addr.slice(-5)}`;
}

export function WalletButton() {
  const { address, connecting, error, connect, disconnect } = useWallet();
  const [hovered, setHovered] = useState(false);

  const base: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    borderRadius: "var(--radius-md)",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.18s",
    letterSpacing: "0.01em",
  };

  if (address) {
    return (
      <button
        onClick={disconnect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Click to disconnect"
        style={{
          ...base,
          background: hovered ? "var(--red-dim)" : "var(--accent-dim)",
          border: `1px solid ${hovered ? "rgba(239,68,68,0.3)" : "var(--border-hover)"}`,
          color: hovered ? "var(--red)" : "var(--accent-hover)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: hovered ? "var(--red)" : "var(--green)",
            flexShrink: 0,
            boxShadow: hovered ? "0 0 6px var(--red)" : "0 0 6px var(--green)",
            transition: "all 0.18s",
          }}
        />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          {truncate(address)}
        </span>
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        onClick={connect}
        disabled={connecting}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...base,
          background: "transparent",
          border: `1px solid ${hovered ? "var(--border-hover)" : "var(--border)"}`,
          color: hovered ? "var(--text-primary)" : "var(--text-secondary)",
          opacity: connecting ? 0.6 : 1,
        }}
      >
        {connecting ? (
          <>
            <span
              style={{
                width: 12,
                height: 12,
                border: "2px solid rgba(99,102,241,0.3)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
              }}
            />
            Connecting…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1 6h12" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="4" cy="8.5" r="0.8" fill="currentColor"/>
            </svg>
            Connect Wallet
          </>
        )}
      </button>
      {error && (
        <span style={{ fontSize: 11, color: "var(--red)", fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </span>
      )}
    </div>
  );
}
