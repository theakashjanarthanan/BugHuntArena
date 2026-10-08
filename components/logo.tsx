import type React from "react";

/**
 * BugHuntArena logo icon — a crosshair with a bug at center.
 * Used in the sidebar header (collapsed + expanded states).
 */
export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-label="BugHuntArena"
    {...props}
  >
    {/* Crosshair ring */}
    <circle cx="12" cy="12" r="9" strokeOpacity="0.35" />
    <circle cx="12" cy="12" r="5.5" />

    {/* Crosshair ticks */}
    <line x1="12" y1="2"   x2="12" y2="5"   strokeOpacity="0.5" />
    <line x1="12" y1="19"  x2="12" y2="22"  strokeOpacity="0.5" />
    <line x1="2"  y1="12"  x2="5"  y2="12"  strokeOpacity="0.5" />
    <line x1="19" y1="12"  x2="22" y2="12"  strokeOpacity="0.5" />

    {/* Bug body (ellipse) */}
    <ellipse cx="12" cy="12.3" rx="2.2" ry="2.8" fill="currentColor" stroke="none" />

    {/* Bug head */}
    <circle cx="12" cy="9.2" r="1.1" fill="currentColor" stroke="none" />

    {/* Bug antennae */}
    <line x1="11.2" y1="8.4" x2="10"  y2="7"  strokeWidth="1.2" />
    <line x1="12.8" y1="8.4" x2="14"  y2="7"  strokeWidth="1.2" />

    {/* Bug legs */}
    <line x1="9.8"  y1="11.2" x2="8.2" y2="10.5" strokeWidth="1.1" />
    <line x1="9.8"  y1="12.5" x2="8.2" y2="12.5" strokeWidth="1.1" />
    <line x1="9.8"  y1="13.8" x2="8.2" y2="14.5" strokeWidth="1.1" />
    <line x1="14.2" y1="11.2" x2="15.8" y2="10.5" strokeWidth="1.1" />
    <line x1="14.2" y1="12.5" x2="15.8" y2="12.5" strokeWidth="1.1" />
    <line x1="14.2" y1="13.8" x2="15.8" y2="14.5" strokeWidth="1.1" />
  </svg>
);

// Keep Logo as an alias so any other import doesn't break
export const Logo = LogoIcon;
