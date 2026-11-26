import { useId } from 'react';
import { useTheme } from 'styled-components';
import { t } from '../../i18n';

/**
 * Moneta Bustercoin: oro metallico, bordo zigrinato, effetto tridimensionale
 * e ciak cinematografico stilizzato inciso a rilievo al centro.
 */
export function CoinIcon({ size = 20, title = t('components.coinIcon.bustercoin') }: { size?: number; title?: string }) {
  const id = useId().replace(/:/g, '');
  // Colori della moneta: coinLight (riflessi), coin, coinDark, coinDeep (incisioni e bordo).
  const { colors: c } = useTheme();
  const ticks = Array.from({ length: 48 }, (_, i) => i * 7.5);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title} style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id={`${id}-face`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={c.coinLight} />
          <stop offset="35%" stopColor={c.coin} />
          <stop offset="75%" stopColor={c.coinDark} />
          <stop offset="100%" stopColor={c.coinDeep} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.coinLight} />
          <stop offset="50%" stopColor={c.coinDark} />
          <stop offset="100%" stopColor={c.coinDeep} />
        </linearGradient>
        <linearGradient id={`${id}-emboss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.coinLight} />
          <stop offset="100%" stopColor={c.coin} />
        </linearGradient>
      </defs>
      {/* ombra e bordo */}
      <circle cx="32" cy="33.5" r="30" fill={c.coinDeep} opacity="0.28" />
      <circle cx="32" cy="32" r="30" fill={`url(#${id}-rim)`} />
      {/* zigrinatura */}
      <g stroke={c.coinDeep} strokeWidth="1.1" opacity="0.75">
        {ticks.map((deg) => (
          <line key={deg} x1="32" y1="3.2" x2="32" y2="6.4" transform={`rotate(${deg} 32 32)`} />
        ))}
      </g>
      {/* faccia */}
      <circle cx="32" cy="32" r="25" fill={`url(#${id}-face)`} />
      <circle cx="32" cy="32" r="22.5" fill="none" stroke={c.coinDark} strokeWidth="1" opacity="0.7" />
      <circle cx="32" cy="32" r="22" fill="none" stroke={c.coinLight} strokeWidth="0.6" opacity="0.6" />
      {/* ciak inciso: ombra in basso a destra + rilievo chiaro */}
      <g transform="translate(0.8 0.9)" fill={c.coinDeep} opacity="0.55">
        <rect x="20" y="30" width="24" height="14" rx="1.6" />
        <path d="M19.4 22.8 L42.6 18.6 L43.6 24.2 L20.4 28.4 Z" />
      </g>
      <g fill={`url(#${id}-emboss)`} stroke={c.coinDark} strokeWidth="0.7">
        <rect x="20" y="30" width="24" height="14" rx="1.6" />
        <path d="M19.4 22.8 L42.6 18.6 L43.6 24.2 L20.4 28.4 Z" />
      </g>
      <g fill={c.coinDark} opacity="0.85">
        <path d="M24.2 22 L27.6 21.4 L25.4 27 L22 27.6 Z" />
        <path d="M31.2 20.8 L34.6 20.2 L32.4 25.8 L29 26.4 Z" />
        <path d="M38.2 19.5 L41.6 18.9 L39.4 24.5 L36 25.1 Z" />
        <rect x="20" y="30" width="24" height="3.4" rx="1" />
      </g>
      {/* riflesso */}
      <ellipse cx="24" cy="18" rx="9" ry="4.5" fill={c.coinLight} opacity="0.35" transform="rotate(-28 24 18)" />
    </svg>
  );
}
