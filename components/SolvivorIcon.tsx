// SolvivorIcon — Minimalist AI/Survival icon: a stylized eye inside a targeting crosshair
// Red lines on transparent (black) background
export default function SolvivorIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer targeting ring */}
      <circle cx="50" cy="50" r="44" stroke="#ff4d4d" strokeWidth="1.5" />

      {/* Crosshair lines — top */}
      <line x1="50" y1="2" x2="50" y2="22" stroke="#ff4d4d" strokeWidth="1.5" />
      {/* bottom */}
      <line x1="50" y1="78" x2="50" y2="98" stroke="#ff4d4d" strokeWidth="1.5" />
      {/* left */}
      <line x1="2" y1="50" x2="22" y2="50" stroke="#ff4d4d" strokeWidth="1.5" />
      {/* right */}
      <line x1="78" y1="50" x2="98" y2="50" stroke="#ff4d4d" strokeWidth="1.5" />

      {/* Inner circle — iris */}
      <circle cx="50" cy="50" r="18" stroke="#ff4d4d" strokeWidth="1.5" />

      {/* Pupil dot — the AI eye */}
      <circle cx="50" cy="50" r="5" fill="#ff4d4d" />

      {/* Corner brackets — top-left */}
      <path d="M14 26 L14 14 L26 14" stroke="#ff4d4d" strokeWidth="1.5" strokeLinecap="round" />
      {/* top-right */}
      <path d="M86 26 L86 14 L74 14" stroke="#ff4d4d" strokeWidth="1.5" strokeLinecap="round" />
      {/* bottom-left */}
      <path d="M14 74 L14 86 L26 86" stroke="#ff4d4d" strokeWidth="1.5" strokeLinecap="round" />
      {/* bottom-right */}
      <path d="M86 74 L86 86 L74 86" stroke="#ff4d4d" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
