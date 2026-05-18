import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useState, CSSProperties } from "react";
import { HomePage } from "./pages/HomePage";
import { CreateEscrowPage } from "./pages/CreateEscrowPage";
import { EscrowDetailPage } from "./pages/EscrowDetailPage";
import { WalletButton } from "./components/WalletButton";

// ── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const s: Record<string, CSSProperties> = {
    nav: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      height: 64,
      background: "rgba(6, 9, 26, 0.85)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(99,102,241,0.10)",
    },
    left: { display: "flex", alignItems: "center", gap: 32 },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      cursor: "pointer",
      userSelect: "none",
    },
    logoIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: "linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      fontWeight: 700,
      color: "#fff",
      fontFamily: "'Syne', sans-serif",
      letterSpacing: "-0.5px",
      flexShrink: 0,
    },
    logoText: {
      fontFamily: "'Syne', sans-serif",
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: "-0.3px",
      color: "var(--text-primary)",
    },
    logoDot: {
      color: "var(--accent)",
    },
    newBtn: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "8px 18px",
      background: hovered ? "var(--accent-hover)" : "var(--accent)",
      color: "#fff",
      borderRadius: "var(--radius-md)",
      fontSize: 13,
      fontWeight: 600,
      fontFamily: "'DM Sans', sans-serif",
      transition: "background 0.18s, box-shadow 0.18s",
      boxShadow: hovered ? "0 0 20px var(--accent-glow)" : "none",
      letterSpacing: "0.01em",
    },
  };

  return (
    <nav style={s.nav}>
      <div style={s.left}>
        <div style={s.logo} onClick={() => navigate("/")}>
          <div style={s.logoIcon}>M</div>
          <span style={s.logoText}>
            Mile<span style={s.logoDot}>Pay</span>
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <WalletButton />
        <button
          style={s.newBtn}
          onClick={() => navigate("/create")}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Escrow
        </button>
      </div>
    </nav>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateEscrowPage />} />
        <Route path="/escrow/:id" element={<EscrowDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
