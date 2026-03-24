interface BlockbusterLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function BlockbusterLogo({
  width = 200,
  height = 48,
  className,
}: BlockbusterLogoProps) {
  const id = `bb-torn-${width}-${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Blockbuster"
    >
      <defs>
        <clipPath id={id}>
          <path
            d={[
              'M 6 0',
              'H 186',
              // Torn/zigzag right edge
              'L 190 4',
              'L 186 8',
              'L 191 12',
              'L 185 16',
              'L 190 20',
              'L 186 24',
              'L 191 28',
              'L 185 32',
              'L 190 36',
              'L 186 40',
              'L 191 44',
              'L 186 48',
              'H 6',
              // Rounded bottom-left corner
              'Q 0 48 0 42',
              'V 6',
              // Rounded top-left corner
              'Q 0 0 6 0',
              'Z',
            ].join(' ')}
          />
        </clipPath>
      </defs>

      {/* Blue ticket background */}
      <rect
        x="0"
        y="0"
        width="200"
        height="48"
        rx="6"
        fill="#0033A0"
        clipPath={`url(#${id})`}
      />

      {/* Yellow BLOCKBUSTER text */}
      <text
        x="93"
        y="32"
        fill="#FFD100"
        fontFamily="'Arial Black', 'Impact', 'Helvetica Neue', sans-serif"
        fontWeight="900"
        fontSize="18"
        letterSpacing="2.5"
        textAnchor="middle"
      >
        BLOCKBUSTER
      </text>
    </svg>
  );
}

export default BlockbusterLogo;
