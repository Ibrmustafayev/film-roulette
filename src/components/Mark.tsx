"use client";

import { useId } from "react";
import { useStore } from "@/store/useStore";

/**
 * The mark: a six-sided aperture ring with three pips knocked out of the
 * negative space, so the same figure reads as a camera iris and as a die face.
 *
 * Drawn once, used everywhere (header, favicon, OG card, loading screen).
 * The pips are knocked out with a mask rather than painted, so the mark stays
 * correct in a single colour on any background.
 */
export function Mark({
  size = 20,
  className,
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  /* The mask id must be unique per instance. With a fixed id, a second Mark on
     the page collides with the first and renders as a solid block. */
  const maskId = `fr-mask-${useId().replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        {/* Aperture ring: outer hexagon minus the hexagonal opening */}
        {/* A thin ring: a thick one reads as a solid polygon, not an iris */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          fill="#fff"
          d="M16 1 28.99 8.5 28.99 23.5 16 31 3.01 23.5 3.01 8.5Z
             M16 6 24.66 11 24.66 21 16 26 7.34 21 7.34 11Z"
        />
        {/* Three blade slits, offset 60° from the pips */}
        <g stroke="#000" strokeWidth="1.5" strokeLinecap="butt">
          <line x1="24.23" y1="11.25" x2="29.42" y2="8.25" />
          <line x1="16" y1="25.5" x2="16" y2="31.5" />
          <line x1="7.77" y1="11.25" x2="2.58" y2="8.25" />
        </g>
        {/* Three pips punched out of the blades between the slits */}
        <circle cx="16" cy="3.5" r="1.3" fill="#000" />
        <circle cx="26.83" cy="22.25" r="1.3" fill="#000" />
        <circle cx="5.17" cy="22.25" r="1.3" fill="#000" />
      </mask>

      <rect width="32" height="32" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}

/** Mark plus wordmark, for the rail head and mobile header, with home navigation */
export function Logo({
  id = "site-logo-btn",
  className,
  markSize = 22,
  onClick,
}: {
  id?: string;
  className?: string;
  markSize?: number;
  onClick?: () => void;
}) {
  const { setMovie, setActiveView, setShowPlayer, setShowTrailer, setMenuOpen } = useStore();

  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setMovie(null);
    setActiveView("random");
    setShowPlayer(false);
    setShowTrailer(false);
    setMenuOpen(false);
    if (onClick) onClick();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      id={id}
      onClick={handleGoHome}
      aria-label="Film Roulette Home"
      className={`group inline-flex items-center gap-2.5 cursor-pointer text-left bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-live transition-opacity hover:opacity-90 ${
        className ?? ""
      }`}
    >
      <Mark size={markSize} className="text-live transition-transform duration-200 group-hover:scale-105" />
      <span className="text-[0.9375rem] font-semibold uppercase leading-none tracking-[0.16em] text-ink-9">
        Film<span className="text-ink-6">/</span>Roulette
      </span>
    </button>
  );
}
