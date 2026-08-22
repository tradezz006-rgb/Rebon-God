import { useEffect, useState } from "react";

type Props = {
  /** Absolute position inside the console stage */
  x: number;
  y: number;
  visible: boolean;
  clicking?: boolean;
  label?: string;
};

/** Ren's shared-screen cursor — orange AWS-style pointer with soft trail. */
export function RenCursor({ x, y, visible, clicking, label }: Props) {
  const [trail, setTrail] = useState({ x, y });

  useEffect(() => {
    const t = window.setTimeout(() => setTrail({ x, y }), 40);
    return () => window.clearTimeout(t);
  }, [x, y]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[60] overflow-hidden">
      <div
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff9900]/25 transition-[left,top] duration-500 ease-out"
        style={{ left: trail.x, top: trail.y }}
      />
      <div
        className="absolute transition-[left,top] duration-500 ease-out"
        style={{ left: x, top: y }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          className={`-translate-x-1 -translate-y-1 drop-shadow-md transition-transform ${
            clicking ? "scale-90" : "scale-100"
          }`}
        >
          <path
            d="M5 3l14 8.5-6.2 1.4L9.5 21 5 3z"
            fill="#232f3e"
            stroke="#ff9900"
            strokeWidth="1.2"
          />
        </svg>
        {clicking && (
          <span className="absolute left-3 top-3 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-[#ff9900]/50" />
        )}
        {label && (
          <span className="absolute left-5 top-0 whitespace-nowrap rounded bg-[#232f3e] px-2 py-0.5 text-[10px] text-[#ff9900]">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
