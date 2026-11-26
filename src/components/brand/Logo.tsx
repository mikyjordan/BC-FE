import { useTheme } from 'styled-components';
import { t } from '../../i18n';

/**
 * Logo BusterCinema: scritta con una striscia di pellicola perforata che la incornicia.
 * Monocromatico (l'oro è riservato alla moneta): "light" = bianco per header/footer blu,
 * "brand" = blu del marchio per gli sfondi chiari. Variante compatta (monogramma) per spazi ridotti.
 */
export function Logo({ height = 34, compact = false, tone = 'light' }: { height?: number; compact?: boolean; tone?: 'light' | 'brand' }) {
  const { colors } = useTheme();
  const fill = tone === 'light' ? colors.onBrand : colors.brand;

  if (compact) {
    return (
      <svg height={height} viewBox="0 0 48 48" role="img" aria-label={t('components.logo.bustercinema')}>
        <rect x="3" y="3" width="42" height="42" rx="10" fill="none" stroke={fill} strokeWidth="2" />
        {[9, 17, 25, 33].map((x) => (
          <g key={x} fill={fill}>
            <rect x={x} y="7" width="5" height="3.5" rx="1" />
            <rect x={x} y="37.5" width="5" height="3.5" rx="1" />
          </g>
        ))}
        <text x="24" y="31.5" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="17" fill={fill}>{t('components.logo.bc')}</text>
      </svg>
    );
  }

  const perfs = Array.from({ length: 22 }, (_, i) => 6 + i * 10);
  return (
    <svg height={height} viewBox="0 0 232 48" role="img" aria-label={t('components.logo.bustercinema')}>
      <g fill={fill} opacity="0.85">
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
        fill={fill}
      >{t('components.logo.buster')}<tspan fontStyle="italic" fontWeight="600">{t('components.logo.cinema')}</tspan>
      </text>
    </svg>
  );
}
