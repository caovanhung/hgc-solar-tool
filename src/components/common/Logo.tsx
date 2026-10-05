import React from 'react';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  lightText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  showSubtitle = true,
  lightText = false,
  size = 'md',
}) => {
  const height = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* SVG Emblem representing HGC Monogram */}
      <svg
        height={height}
        viewBox="0 0 100 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
      >
        {/* Outer Circular/Oval G Ring in Vermilion #E53924 */}
        <path
          d="M 50 10 C 22 10 10 26 10 45 C 10 64 22 80 50 80 C 72 80 84 66 84 50 L 52 50 L 52 40 L 93 40 C 94 43 94 47 94 51 C 94 72 76 89 50 89 C 17 89 0 69 0 45 C 0 21 17 1 50 1 C 72 1 87 13 92 27 L 81 32 C 77 21 66 10 50 10 Z"
          fill="#E53924"
        />
        {/* Bold Serif "H" with distinct top/bottom serifs */}
        <path
          d="M 27 5 L 43 5 L 43 14 L 37 14 L 37 38 L 63 38 L 63 14 L 57 14 L 57 5 L 73 5 L 73 14 L 67 14 L 67 76 L 73 76 L 73 85 L 57 85 L 57 76 L 63 76 L 63 48 L 37 48 L 37 76 L 43 76 L 43 85 L 27 85 L 27 76 L 33 76 L 33 14 L 27 14 Z"
          fill="#E53924"
        />
      </svg>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-serif tracking-wider font-extrabold ${
            size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl'
          } ${lightText ? 'text-white' : 'text-[#3D2E27]'}`}
        >
          HGC
        </span>
        {showSubtitle && (
          <span
            className={`font-sans tracking-[0.22em] font-semibold text-[9px] mt-0.5 uppercase ${
              lightText ? 'text-slate-300' : 'text-[#4A3B32]'
            }`}
          >
            HI-TEK · GREEN · CLEAN
          </span>
        )}
      </div>
    </div>
  );
};
