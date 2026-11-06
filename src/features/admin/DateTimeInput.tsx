import styled from 'styled-components';
import { Input } from '../../components/ui';
import { t } from '../../i18n';

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 8px;
`;

/** Ora proposta per chiusure e scadenze: fine giornata. */
export const END_OF_DAY = '23:59';

/**
 * Data e ora in due campi separati: l'ora è precompilata (di default 23:59) e si cambia solo
 * se serve. Valore nel formato di <input type="datetime-local">: "AAAA-MM-GGTHH:MM" oppure "".
 * L'id (passato da <Field>) va sul campo data, così l'etichetta del Field si riferisce a esso.
 */
export function DateTimeInput({
  id,
  value,
  onChange,
  disabled,
  invalid,
  defaultTime = END_OF_DAY,
  'aria-describedby': describedBy,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  defaultTime?: string;
  'aria-describedby'?: string;
}) {
  const [date, time] = value ? value.split('T') : ['', ''];
  const shownTime = time || defaultTime;
  return (
    <Row>
      <Input
        id={id}
        type="date"
        value={date}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value ? `${e.target.value}T${shownTime}` : '')}
      />
      <Input
        type="time"
        value={shownTime}
        disabled={disabled}
        aria-label={t('admin.dateTimeInput.ora')}
        onChange={(e) => onChange(date ? `${date}T${e.target.value || defaultTime}` : '')}
      />
    </Row>
  );
}

/** Le 23:59 del giorno prima dell'uscita al cinema (ora locale), nel formato del campo. */
export function dayBeforeReleaseAt2359(releaseDate: string | null | undefined): string {
  if (!releaseDate) return '';
  const [y, m, d] = releaseDate.split('-').map(Number);
  const prev = new Date(y, m - 1, d - 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-${pad(prev.getDate())}T${END_OF_DAY}`;
}
