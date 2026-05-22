export default function SolvivorIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  const color = "#ff4d4d";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer circle */}
      <circle cx="50" cy="50" r="48" stroke={color} strokeWidth="3" />
      {/* Umbrella arcs - top hemisphere */}
      <path d="M 50 8 A 42 42 0 0 1 92 50" stroke={color} strokeWidth="3" fill="none"/>
      <path d="M 50 8 A 42 42 0 0 0 8 50" stroke={color} strokeWidth="3" fill="none"/>
      {/* Dividing lines */}
      <line x1="50" y1="8" x2="50" y2="92" stroke={color} strokeWidth="3"/>
      <line x1="8" y1="50" x2="92" y2="50" stroke={color} strokeWidth="3"/>
      {/* Mid arcs - classic Umbrella quartered look */}
      <path d="M 8 50 A 21 21 0 0 1 50 50" stroke={color} strokeWidth="3" fill="none"/>
      <path d="M 50 50 A 21 21 0 0 1 92 50" stroke={color} strokeWidth="3" fill="none"/>
      {/* Center dot */}
      <circle cx="50" cy="50" r="5" fill={color}/>
    </svg>
  );
}
