import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAdminMutation } from '../../api/hooks';
import type { BoxOfficeReading } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Badge, Button, FieldError, Input, Muted, Stack } from '../../components/ui';
import { formatBc, formatDateTime, formatNumber } from '../../components/format';
import { fromLocalInput, toLocalInput } from './content-fields';

/**
 * Riga dello storico incassi con modifica in linea ed eliminazione.
 * Incasso e data restano obbligatori anche in modifica; il backend ricalcola l'incasso in vigore.
 */
export function BoxOfficeReadingRow({
  movieId,
  reading,
  isCurrent,
  canManage,
  onChanged,
}: {
  movieId: string;
  reading: BoxOfficeReading;
  isCurrent: boolean;
  canManage: boolean;
  onChanged: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [gross, setGross] = useState(String(reading.grossAmount));
  const [when, setWhen] = useState(toLocalInput(reading.recordedAt));
  const [spectators, setSpectators] = useState(reading.spectators !== null ? String(reading.spectators) : '');
  const [notes, setNotes] = useState(reading.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const base = `/admin/movies/${movieId}/box-office/${reading.id}`;
  const update = useAdminMutation((body: Record<string, unknown>) => api<{ currentGross: number | null }>(base, { method: 'PUT', body }));
  const remove = useAdminMutation(() => api<{ currentGross: number | null }>(base, { method: 'DELETE' }));

  const startEdit = () => {
    setGross(String(reading.grossAmount));
    setWhen(toLocalInput(reading.recordedAt));
    setSpectators(reading.spectators !== null ? String(reading.spectators) : '');
    setNotes(reading.notes ?? '');
    setError(null);
    setEditing(true);
  };

  const save = () => {
    const n = Number(gross);
    if (gross === '' || !Number.isInteger(n) || n < 0) return setError('Incasso obbligatorio (numero intero ≥ 0)');
    if (!when) return setError('Data di rilevazione obbligatoria');
    if (new Date(when).getTime() > Date.now() + 60_000) return setError('La data di rilevazione non può essere futura');
    setError(null);
    update.mutate(
      { grossAmount: n, recordedAt: fromLocalInput(when), ...(spectators ? { spectators: Number(spectators) } : {}), ...(notes.trim() ? { notes: notes.trim() } : {}) },
      {
        onSuccess: (r) => {
          setEditing(false);
          onChanged(`Rilevazione aggiornata. Incasso in vigore: ${r.currentGross !== null ? formatBc(r.currentGross) : 'nessuno'}.`);
        },
        onError: (e) => setError(e instanceof ApiError ? e.message : 'Salvataggio non riuscito'),
      },
    );
  };

  if (editing) {
    return (
      <tr>
        <td><Input type="datetime-local" aria-label="Data rilevazione" value={when} onChange={(e) => setWhen(e.target.value)} style={{ minWidth: 190 }} /></td>
        <td><Input type="number" min={0} aria-label="Incasso" value={gross} onChange={(e) => setGross(e.target.value)} style={{ minWidth: 120, textAlign: 'right' }} /></td>
        <td><Input type="number" min={0} aria-label="Spettatori" value={spectators} onChange={(e) => setSpectators(e.target.value)} style={{ minWidth: 100, textAlign: 'right' }} /></td>
        <td>
          <Stack $gap={6}>
            <Input aria-label="Note" value={notes} onChange={(e) => setNotes(e.target.value)} />
            {error && <FieldError role="alert">{error}</FieldError>}
          </Stack>
        </td>
        <td>
          <Stack $row $gap={4} $justify="flex-end">
            <Button $size="sm" onClick={save} disabled={update.isPending} aria-label="Salva rilevazione"><Check size={14} /></Button>
            <Button $size="sm" $variant="ghost" onClick={() => setEditing(false)} disabled={update.isPending} aria-label="Annulla modifica"><X size={14} /></Button>
          </Stack>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <Muted $size="0.85rem">{formatDateTime(reading.recordedAt)}</Muted>
        {isCurrent && <Badge $tone="gold" style={{ marginTop: 4 }}>In vigore</Badge>}
      </td>
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatBc(reading.grossAmount)}</td>
      <td style={{ textAlign: 'right' }}><Muted $size="0.85rem">{reading.spectators !== null ? formatNumber(reading.spectators) : '—'}</Muted></td>
      <td>
        <Muted $size="0.8rem">{reading.notes ?? ''}</Muted>
        {reading.updatedAt && <Muted $size="0.72rem">Modificata il {formatDateTime(reading.updatedAt)}</Muted>}
      </td>
      <td>
        {canManage && (
          <Stack $row $gap={4} $justify="flex-end">
            <Button $size="sm" $variant="ghost" onClick={startEdit} aria-label={`Modifica rilevazione del ${formatDateTime(reading.recordedAt)}`}><Pencil size={14} /></Button>
            <Button $size="sm" $variant="ghost" onClick={() => { remove.reset(); setConfirmDelete(true); }} aria-label={`Elimina rilevazione del ${formatDateTime(reading.recordedAt)}`}><Trash2 size={14} /></Button>
          </Stack>
        )}
        {confirmDelete && (
          <ConfirmModal
            title="Eliminare questa rilevazione?"
            message={
              <Stack $gap={8}>
                <span>Rilevazione del {formatDateTime(reading.recordedAt)}: <strong>{formatBc(reading.grossAmount)}</strong>.</span>
                {isCurrent && <span>È l’incasso in vigore: tornerà in vigore la rilevazione precedente (o nessun incasso, se non ce ne sono altre).</span>}
                <span>I riscatti già effettuati non cambiano. L’operazione resta registrata nell’audit log.</span>
              </Stack>
            }
            confirmLabel="Elimina"
            danger
            pending={remove.isPending}
            error={remove.error?.message}
            onClose={() => setConfirmDelete(false)}
            onConfirm={() =>
              remove.mutate(undefined, {
                onSuccess: (r) => {
                  setConfirmDelete(false);
                  onChanged(`Rilevazione eliminata. Incasso in vigore: ${r.currentGross !== null ? formatBc(r.currentGross) : 'nessuno'}.`);
                },
              })
            }
          />
        )}
      </td>
    </tr>
  );
}
