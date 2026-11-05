import type { ReactNode } from 'react';
import { Award, Bell, Coins, Gift, Trophy } from 'lucide-react';
import { EmptyState, PageHeader } from '../../components/ui';
import { t } from '../../i18n';

/**
 * Sezioni previste ma non ancora implementate: sono dichiarate esplicitamente come
 * "in sviluppo" (nessun pulsante finto, nessun dato simulato).
 */
function ComingSoon({ title, icon, phase, children }: { title: string; icon: ReactNode; phase: string; children: ReactNode }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={icon} title={t('upcoming.comingSoonPage.inSviluppoPhase', { phase })}>
        {children}
      </EmptyState>
    </>
  );
}

export const LeaderboardsPage = () => (
  <ComingSoon title={t('upcoming.comingSoonPage.classifiche')} icon={<Trophy size={34} />} phase={t('upcoming.comingSoonPage.fase9')}>{t('upcoming.comingSoonPage.classificheSettimanaliMensiliEStagionali')}</ComingSoon>
);
export const RewardsPage = () => (
  <ComingSoon title={t('common.premi')} icon={<Gift size={34} />} phase={t('upcoming.comingSoonPage.fase9')}>{t('upcoming.comingSoonPage.voucherCinemaBigliettiEPremi')}</ComingSoon>
);
export const TrophiesPage = () => (
  <ComingSoon title={t('upcoming.comingSoonPage.coppeEHallOfFame')} icon={<Award size={34} />} phase={t('upcoming.comingSoonPage.fase9')}>{t('upcoming.comingSoonPage.riconoscimentiPermanentiMigliorStrategiaMiglior')}</ComingSoon>
);
export const NotificationsPage = () => (
  <ComingSoon title={t('upcoming.comingSoonPage.notifiche')} icon={<Bell size={34} />} phase={t('upcoming.comingSoonPage.fase10')}>{t('upcoming.comingSoonPage.avvisiSuBonusAcquistiAccrediti')}</ComingSoon>
);
export const BuyCoinsPage = () => (
  <ComingSoon title={t('upcoming.comingSoonPage.acquistaBustercoin')} icon={<Coins size={34} />} phase={t('upcoming.comingSoonPage.fase8')}>{t('upcoming.comingSoonPage.iPacchettiBustercoinConPagamento')}</ComingSoon>
);
