// SolvivalIcon: Solvival Corp Red Queen custom logo icon
export default function SolvivalIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Red Queen Logo"
      width={size}
      height={size}
      className={["solvival-icon-image", className].filter(Boolean).join(" ")}
      style={{ display: "inline-block", verticalAlign: "middle", objectFit: "contain", borderRadius: "50%" }}
    />
  );
}
