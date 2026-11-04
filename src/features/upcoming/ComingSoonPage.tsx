import type { ReactNode } from 'react';
import { Award, Bell, Coins, Gift, Trophy } from 'lucide-react';
import { EmptyState, PageHeader } from '../../components/ui';

/**
 * Sezioni previste ma non ancora implementate: sono dichiarate esplicitamente come
 * "in sviluppo" (nessun pulsante finto, nessun dato simulato).
 */
function ComingSoon({ title, icon, phase, children }: { title: string; icon: ReactNode; phase: string; children: ReactNode }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={icon} title={`In sviluppo — ${phase}`}>
        {children}
      </EmptyState>
    </>
  );
}

export const LeaderboardsPage = () => (
  <ComingSoon title="Classifiche" icon={<Trophy size={34} />} phase="Fase 9">
    Classifiche settimanali, mensili e stagionali per rendimento e guadagni, con filtri Film / Serie TV.
  </ComingSoon>
);
export const RewardsPage = () => (
  <ComingSoon title="Premi" icon={<Gift size={34} />} phase="Fase 9">
    Voucher cinema, biglietti e premi promozionali con stato di consegna.
  </ComingSoon>
);
export const TrophiesPage = () => (
  <ComingSoon title="Coppe e Hall of Fame" icon={<Award size={34} />} phase="Fase 9">
    Riconoscimenti permanenti: Miglior Strategia, Miglior Rendimento, Campione del Mese e della Stagione.
  </ComingSoon>
);
export const NotificationsPage = () => (
  <ComingSoon title="Notifiche" icon={<Bell size={34} />} phase="Fase 10">
    Avvisi su bonus, acquisti, accrediti e nuovi contenuti pubblicati.
  </ComingSoon>
);
export const BuyCoinsPage = () => (
  <ComingSoon title="Acquista Bustercoin" icon={<Coins size={34} />} phase="Fase 8">
    I pacchetti Bustercoin con pagamento Stripe saranno attivati dopo la configurazione di Stripe e la verifica legale e fiscale.
  </ComingSoon>
);
