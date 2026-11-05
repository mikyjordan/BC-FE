import { Link } from 'react-router';
import styled from 'styled-components';
import { CalendarClock, Clapperboard, HandCoins, Ticket, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { CoinIcon } from '../../components/brand/CoinIcon';
import { Alert, Card } from '../../components/ui';
import { PublicHeader, SiteFooter } from '../../components/layout/SiteChrome';
import { useFeatures } from '../../api/hooks';

const Wrap = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 16px 60px;
  h1 { margin: 24px 0 8px; }
  p, li { color: ${({ theme }) => theme.colors.textSecondary}; }
  ul { padding-left: 20px; margin: 8px 0 0; }
  li { margin-bottom: 4px; }
`;

const Up = styled.strong`color: ${({ theme }) => theme.colors.successText};`;
const Down = styled.strong`color: ${({ theme }) => theme.colors.dangerText};`;

const Step = styled(Card)`
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 14px;
  margin-top: 14px;
  h2 { font-size: 1.05rem; margin-bottom: 6px; }
  svg { color: ${({ theme }) => theme.colors.brand}; }
`;

function S({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Step as="section">
      {icon}
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    </Step>
  );
}

/** Regole del gioco spiegate agli utenti (pagina pubblica). */
export function HowItWorksPage() {
  // Le regole delle sezioni disattivate dal Superadmin non vengono mostrate.
  const features = useFeatures().data;
  const movies = !!features?.movies;
  const tvSeries = !!features?.tvSeries;
  return (
    <>
    <PublicHeader />
    <Wrap>
      <h1>Come funziona</h1>
      <p>BusterCinema è un gioco di investimento virtuale sui film in uscita nelle sale italiane.</p>

      <S icon={<CoinIcon size={30} />} title="I Bustercoin">
        <p>Alla registrazione ricevi 1.000.000 di Bustercoin. Sono una valuta virtuale di gioco: non sono denaro, non sono convertibili e non danno diritti reali sui film.</p>
      </S>

      {movies && (
      <>
      <S icon={<Ticket size={28} />} title="Acquista un film prima che esca">
        <ul>
          <li>Ogni film si acquista <strong>una sola volta</strong>, al prezzo stabilito dalla piattaforma.</li>
          <li>
            <strong>La possibilità di acquistare un film termina alla mezzanotte del giorno prima della sua uscita nelle sale</strong>. Esempio: se il film esce
            giovedì, puoi comprarlo fino alle 23:59 di mercoledì.
          </li>
          <li>Sulla scheda di ogni film trovi la data e l’ora esatte di chiusura degli acquisti.</li>
        </ul>
      </S>

      <S icon={<TrendingUp size={28} />} title="Segui l’incasso">
        <p>
          Durante la programmazione la piattaforma aggiorna l’incasso del film (1 € = 1 Bustercoin). Sul tuo portafoglio vedi prezzo pagato e incasso attuale:
          in <Up>verde</Up> se sei in guadagno, in <Down>rosso</Down> se sei in perdita.
        </p>
      </S>

      <S icon={<HandCoins size={28} />} title="Riscatta quando vuoi">
        <p>
          Con il pulsante <strong>Riscatta</strong> ricevi sul wallet l’incasso attuale del film. Esempio: hai pagato 500.000 B e l’incasso è 600.000 → ricevi
          600.000 B e hai guadagnato 100.000 B. Dopo il riscatto il film non può più essere riacquistato.
        </p>
      </S>

      <S icon={<CalendarClock size={28} />} title="Riscatto automatico all’uscita dalle sale">
        <p>Quando il film viene tolto dalle sale (data indicata sotto ogni film), viene riscattato automaticamente a tutti coloro che lo possiedono, con l’incasso in vigore in quel momento.</p>
      </S>
      </>
      )}

      {tvSeries && (
        <S icon={<Clapperboard size={28} />} title="Serie TV">
          <p>Le serie TV si acquistano a quote; le regole di rendimento verranno pubblicate quando la sezione sarà completa.</p>
        </S>
      )}

      <Alert $tone="info" style={{ marginTop: 18 }}>
        Consulta anche i <Link to="/termini" style={{ textDecoration: 'underline' }}>termini e condizioni</Link>.
      </Alert>
    </Wrap>
    <SiteFooter />
    </>
  );
}
