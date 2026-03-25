interface BlockbusterLogoProps {
  width?: number;
  height?: number;
  className?: string;
  /** Extra pixels the logo hangs below its container */
  overhang?: number;
}

export function BlockbusterLogo({
  width = 160,
  height = 48,
  className,
  overhang = 0,
}: BlockbusterLogoProps) {
  return (
    <img
      src="/blockbuster-logo.png"
      alt="Blockbuster"
      width={width}
      height={height}
      className={className}
      style={overhang ? { marginBottom: `-${overhang}px`, position: 'relative', zIndex: 30 } : undefined}
      draggable={false}
    />
  );
}

export default BlockbusterLogo;
