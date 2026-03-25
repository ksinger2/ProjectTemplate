interface BlockbusterLogoProps {
  width?: number;
  height?: number;
  className?: string;
  /** Extra pixels the logo hangs below its container */
  overhang?: number;
  /** Show the warm yellow backlight glow (like the storefront sign) */
  glow?: boolean;
}

export function BlockbusterLogo({
  width = 160,
  height = 48,
  className,
  overhang = 0,
  glow = false,
}: BlockbusterLogoProps) {
  return (
    <span
      className={className}
      style={{
        position: 'relative',
        zIndex: 1,
        marginTop: overhang ? `${overhang}px` : undefined,
        filter: glow
          ? [
              // Tight warm glow right against the sign
              'drop-shadow(0 0 4px rgba(255, 209, 0, 0.7))',
              // Medium halo
              'drop-shadow(0 0 14px rgba(255, 209, 0, 0.45))',
              // Wide ambient backlight
              'drop-shadow(0 0 32px rgba(255, 209, 0, 0.2))',
              // Subtle downward shadow (sign mounted on wall)
              'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))',
            ].join(' ')
          : // Even without glow prop, give it a subtle mounted feel
            'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
      }}
    >
      <img
        src="/blockbuster-logo.png"
        alt="Blockbuster"
        width={width}
        height={height}
        draggable={false}
      />
    </span>
  );
}

export default BlockbusterLogo;
