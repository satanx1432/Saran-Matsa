import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function MaverickLogo({ size, width, height, className, ...props }: LogoProps) {
  // Tight bounds: x ranges from 45 to 255 (width 210), y ranges from 43 to 128 (height 85)
  // We add elegant margins to the bounds: viewport x=35 to 265 (width=230), y=38 to 133 (height=95)
  // This gives an aspect ratio of exactly 2.42 (230 / 95)
  const finalWidth = width || size || 24;
  const finalHeight = height || (size ? Math.round((Number(size) * 95) / 230) : undefined);

  return (
    <svg
      viewBox="35 38 230 95"
      width={finalWidth}
      height={finalHeight}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      id="maverick-custom-logo"
      {...props}
    >
      <path
        d="M 45,90 C 45,48 95,43 150,43 C 205,43 255,48 255,90 C 255,118 220,128 198,124 C 194,123 194,65 194,65 L 150,115 L 106,65 C 106,65 106,123 102,124 C 80,128 45,118 45,90 Z"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 2px currentColor)" }}
      />
    </svg>
  );
}
