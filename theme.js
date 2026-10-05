// src/theme.js
export const C = {
  indigo: "#5B5CEB",
  indigoLight: "#7B82F8",
  sky: "#7CC8F8",
  mint: "#7DDCB6",
  lavender: "#C8B6FF",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1F2937",
  subtext: "#6B7280",
  border: "#E5E9F2",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
};

export const GRADIENT_PRIMARY = `linear-gradient(135deg, ${C.indigo} 0%, ${C.indigoLight} 100%)`;

export const CATEGORY_META = {
  Academic: { color: "#8B5CF6", icon: "🏫", building: "Library" },
  Digital: { color: C.sky, icon: "💻", building: "Tech Tower" },
  Financial: { color: "#F59E0B", icon: "🏦", building: "Office" },
  Family: { color: C.mint, icon: "🏡", building: "Houses" },
};

export function cardGradient(color, from = "#FFFFFF") {
  return `linear-gradient(165deg, ${from} 0%, ${color}14 100%)`;
}

export const pageMesh = {
  position: "fixed",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
  background: `
    radial-gradient(circle at 6% 10%, rgba(91,92,235,0.14) 0%, transparent 32%),
    radial-gradient(circle at 92% 8%, rgba(124,200,248,0.16) 0%, transparent 36%),
    radial-gradient(circle at 88% 55%, rgba(200,182,255,0.15) 0%, transparent 34%),
    radial-gradient(circle at 8% 55%, rgba(125,220,182,0.14) 0%, transparent 34%),
    radial-gradient(circle at 30% 92%, rgba(91,92,235,0.10) 0%, transparent 30%),
    radial-gradient(circle at 75% 95%, rgba(124,200,248,0.12) 0%, transparent 30%)
  `,
};

export const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeInUp 0.5s ease both; }
  .hover-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .hover-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(15,23,42,0.1); }
  .btn-lift { transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .btn-lift:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(91,92,235,0.3); }
  .input-glow:focus { outline: none; border-color: ${C.indigo} !important; box-shadow: 0 0 0 4px ${C.indigo}1A; }
`;