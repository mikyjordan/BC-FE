import { useId } from 'react';
import { t } from '../../i18n';

/**
 * Moneta Bustercoin: oro metallico, bordo zigrinato, effetto tridimensionale
 * e ciak cinematografico stilizzato inciso a rilievo al centro.
 */
export function CoinIcon({ size = 20, title = t('components.coinIcon.bustercoin') }: { size?: number; title?: string }) {
  const id = useId().replace(/:/g, '');
  const ticks = Array.from({ length: 48 }, (_, i) => i * 7.5);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title} style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id={`${id}-face`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#FFF4BF" />
          <stop offset="35%" stopColor="#F0CC62" />
          <stop offset="75%" stopColor="#C4952F" />
          <stop offset="100%" stopColor="#8E6418" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF0A8" />
          <stop offset="50%" stopColor="#B8862A" />
          <stop offset="100%" stopColor="#6E4C10" />
        </linearGradient>
        <linearGradient id={`${id}-emboss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF6C9" />
          <stop offset="100%" stopColor="#D9AE48" />
        </linearGradient>
      </defs>
      {/* ombra e bordo */}
      <circle cx="32" cy="33.5" r="30" fill="#000" opacity="0.28" />
      <circle cx="32" cy="32" r="30" fill={`url(#${id}-rim)`} />
      {/* zigrinatura */}
      <g stroke="#7A5514" strokeWidth="1.1" opacity="0.75">
        {ticks.map((deg) => (
          <line key={deg} x1="32" y1="3.2" x2="32" y2="6.4" transform={`rotate(${deg} 32 32)`} />
        ))}
      </g>
      {/* faccia */}
      <circle cx="32" cy="32" r="25" fill={`url(#${id}-face)`} />
      <circle cx="32" cy="32" r="22.5" fill="none" stroke="#9C7120" strokeWidth="1" opacity="0.7" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#FFF1B3" strokeWidth="0.6" opacity="0.6" />
      {/* ciak inciso: ombra in basso a destra + rilievo chiaro */}
      <g transform="translate(0.8 0.9)" fill="#7E5814" opacity="0.55">
        <rect x="20" y="30" width="24" height="14" rx="1.6" />
        <path d="M19.4 22.8 L42.6 18.6 L43.6 24.2 L20.4 28.4 Z" />
      </g>
      <g fill={`url(#${id}-emboss)`} stroke="#A67A22" strokeWidth="0.7">
        <rect x="20" y="30" width="24" height="14" rx="1.6" />
        <path d="M19.4 22.8 L42.6 18.6 L43.6 24.2 L20.4 28.4 Z" />
      </g>
      <g fill="#A67A22" opacity="0.85">
        <path d="M24.2 22 L27.6 21.4 L25.4 27 L22 27.6 Z" />
        <path d="M31.2 20.8 L34.6 20.2 L32.4 25.8 L29 26.4 Z" />
        <path d="M38.2 19.5 L41.6 18.9 L39.4 24.5 L36 25.1 Z" />
        <rect x="20" y="30" width="24" height="3.4" rx="1" />
      </g>
      {/* riflesso */}
      <ellipse cx="24" cy="18" rx="9" ry="4.5" fill="#FFFBE6" opacity="0.35" transform="rotate(-28 24 18)" />
    </svg>
  );
}
