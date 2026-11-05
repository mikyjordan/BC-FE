import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { PublicHeader, SiteFooter } from '../../components/layout/SiteChrome';
import { Alert, Card } from '../../components/ui';

const Wrap = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 16px 60px;
  h1 { margin: 24px 0 16px; }
  h2 { margin: 22px 0 8px; }
  p, li { color: ${({ theme }) => theme.colors.textSecondary}; }
  ul { padding-left: 20px; }
`;

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
    <PublicHeader />
    <Wrap>
      <h1>{title}</h1>
      <Alert $tone="warning" style={{ marginBottom: 18 }}>
        Bozza da sottoporre a verifica legale e fiscale prima del lancio. Il testo definitivo deve essere redatto da un professionista.
      </Alert>
      <Card>{children}</Card>
      <p style={{ marginTop: 16 }}>
        <Link to="/come-funziona" style={{ textDecoration: 'underline' }}>Come funziona BusterCinema</Link>
      </p>
    </Wrap>
    <SiteFooter />
    </>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Termini e condizioni">
      <h2>Natura del servizio</h2>
      <p>BusterCinema è un gioco di investimento virtuale nel settore cinematografico e televisivo.</p>
      <h2>Bustercoin</h2>
      <ul>
        <li>Bustercoin è una valuta virtuale utilizzabile esclusivamente all’interno della piattaforma.</li>
        <li>Non è denaro, non è una criptovaluta, non è uno strumento finanziario e non è convertibile in denaro reale.</li>
        <li>Le partecipazioni acquistate sono virtuali e non attribuiscono proprietà, diritti economici o quote su film, serie TV o piattaforme.</li>
      </ul>
      <h2>Acquisto dei film</h2>
      <ul>
        <li>Ogni film può essere acquistato una sola volta, al prezzo stabilito dalla piattaforma.</li>
        <li>La possibilità di acquistare un film termina alla mezzanotte del giorno prima della sua uscita nelle sale italiane.</li>
        <li>Il riscatto accredita l’incasso del film in vigore (1 € = 1 Bustercoin); un film riscattato non può essere riacquistato.</li>
        <li>All’uscita dalle sale il film viene riscattato automaticamente a tutti i possessori.</li>
      </ul>
      <h2>Dati sui contenuti</h2>
      <p>I rendimenti virtuali si basano su dati del mercato italiano provenienti da fonti indicate in ciascuna scheda. Le posizioni in classifica non rappresentano numeri certificati di spettatori.</p>
      <h2>Premi</h2>
      <p>Eventuali premi e voucher sono regolati da un regolamento specifico, pubblicato prima dell’attivazione delle relative competizioni.</p>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Informativa privacy">
      <h2>Dati trattati</h2>
      <ul>
        <li>Dati di account: email, nome utente, password (memorizzata solo come hash).</li>
        <li>Dati di profilo facoltativi: nome, cognome, bio, foto profilo.</li>
        <li>Dati di gioco: movimenti Bustercoin, partecipazioni virtuali, classifiche.</li>
        <li>Dati tecnici di sessione: indirizzo IP e user agent delle sessioni attive, per sicurezza.</li>
      </ul>
      <h2>Cookie</h2>
      <p>Utilizziamo un solo cookie tecnico (httpOnly) necessario a mantenere la sessione. Non utilizziamo cookie di profilazione.</p>
      <h2>Diritti</h2>
      <p>Puoi chiedere accesso, rettifica o cancellazione dei tuoi dati contattando il titolare del trattamento.</p>
    </LegalLayout>
  );
}
