import { useRef, useState } from "react";

/**
 * SpotlightCard - ReactBits-inspired luxury cursor-following spotlight container.
 * Casts a subtle, smooth radial glow that follows the user's cursor over the dark surface.
 */
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(99, 102, 241, 0.12)",
  ...props
}) {
  const cardRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl bg-slate-900/70 border border-white/[0.08] transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(450px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {/* Content wrapper */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
