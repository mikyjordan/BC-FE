import { useId } from 'react';
import styled from 'styled-components';

/**
 * Logo BusterCinema: scritta in oro metallico con una striscia di pellicola
 * perforata che la incornicia. Variante compatta (solo monogramma) per spazi ridotti.
 */
export function Logo({ height = 34, compact = false }: { height?: number; compact?: boolean }) {
  const id = useId().replace(/:/g, '');
  const gold = (
    <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FCEDB0" />
      <stop offset="45%" stopColor="#E6C058" />
      <stop offset="70%" stopColor="#B4842A" />
      <stop offset="100%" stopColor="#F0D27C" />
    </linearGradient>
  );

  if (compact) {
    return (
      <svg height={height} viewBox="0 0 48 48" role="img" aria-label="BusterCinema">
        <defs>{gold}</defs>
        <rect x="3" y="3" width="42" height="42" rx="10" fill="#0F172E" stroke={`url(#${id}-g)`} strokeWidth="2" />
        {[9, 17, 25, 33].map((x) => (
          <g key={x} fill={`url(#${id}-g)`}>
            <rect x={x} y="7" width="5" height="3.5" rx="1" />
            <rect x={x} y="37.5" width="5" height="3.5" rx="1" />
          </g>
        ))}
        <text x="24" y="31.5" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="17" fill={`url(#${id}-g)`}>
          BC
        </text>
      </svg>
    );
  }

  const perfs = Array.from({ length: 22 }, (_, i) => 6 + i * 10);
  return (
    <svg height={height} viewBox="0 0 232 48" role="img" aria-label="BusterCinema">
      <defs>{gold}</defs>
      <g fill={`url(#${id}-g)`} opacity="0.9">
        <rect x="0" y="1" width="232" height="2" rx="1" />
        <rect x="0" y="45" width="232" height="2" rx="1" />
        {perfs.map((x) => (
          <g key={x}>
            <rect x={x} y="5" width="5" height="3" rx="0.8" />
            <rect x={x} y="40" width="5" height="3" rx="0.8" />
          </g>
        ))}
      </g>
      <text
        x="116"
        y="32.5"
        textAnchor="middle"
        fontFamily="'Playfair Display', Didot, 'Bodoni 72', Georgia, serif"
        fontWeight="700"
        fontSize="24"
        letterSpacing="0.5"
        fill={`url(#${id}-g)`}
      >
        Buster<tspan fontStyle="italic" fontWeight="600">Cinema</tspan>
      </text>
    </svg>
  );
}

export const LogoLink = styled.span`
  display: inline-flex;
  align-items: center;
`;
