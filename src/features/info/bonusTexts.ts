import { useEconomy } from '../../api/hooks';
import { formatNumber } from '../../components/format';

/** Importi dei bonus già formattati, presi dalla configurazione (mai scritti nei testi). */
export function useBonusAmounts() {
  const economy = useEconomy();
  const e = economy.data;
  return {
    loaded: !!e,
    bonus: e ? formatNumber(e.initialBonus) : '…',
    weekly: e ? formatNumber(e.weeklyBonus) : '…',
    hasWeekly: !!e && e.weeklyBonus > 0,
  };
}
