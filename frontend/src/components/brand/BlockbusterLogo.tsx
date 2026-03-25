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
        display: 'inline-block',
        position: 'relative',
        zIndex: 30,
        marginTop: overhang ? `${overhang}px` : undefined,
        filter: glow ? 'drop-shadow(0 0 12px rgba(255, 209, 0, 0.5)) drop-shadow(0 0 30px rgba(255, 209, 0, 0.25))' : undefined,
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
