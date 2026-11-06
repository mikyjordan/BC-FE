import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAdminMutation } from '../../api/hooks';
import type { BoxOfficeReading } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Badge, Button, FieldError, Input, Muted, Stack } from '../../components/ui';
import { formatBc, formatDateTime } from '../../components/format';
import { fromLocalInput, toLocalInput } from './content-fields';
import { t, tx } from '../../i18n';

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
  const [notes, setNotes] = useState(reading.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const base = `/admin/movies/${movieId}/box-office/${reading.id}`;
  const update = useAdminMutation((body: Record<string, unknown>) => api<{ currentGross: number | null }>(base, { method: 'PUT', body }));
  const remove = useAdminMutation(() => api<{ currentGross: number | null }>(base, { method: 'DELETE' }));

  const startEdit = () => {
    setGross(String(reading.grossAmount));
    setWhen(toLocalInput(reading.recordedAt));
    setNotes(reading.notes ?? '');
    setError(null);
    setEditing(true);
  };

  const save = () => {
    const n = Number(gross);
    if (gross === '' || !Number.isInteger(n) || n < 0) return setError(t('admin.boxOfficeReadingRow.incassoObbligatorioNumeroIntero0'));
    if (!when) return setError(t('admin.boxOfficeReadingRow.dataDiRilevazioneObbligatoria'));
    if (new Date(when).getTime() > Date.now() + 60_000) return setError(t('admin.boxOfficeReadingRow.laDataDiRilevazioneNon'));
    setError(null);
    update.mutate(
      { grossAmount: n, recordedAt: fromLocalInput(when), ...(notes.trim() ? { notes: notes.trim() } : {}) },
      {
        onSuccess: (r) => {
          setEditing(false);
          onChanged(t('admin.boxOfficeReadingRow.rilevazioneAggiornataIncassoInVigore', { v: r.currentGross !== null ? formatBc(r.currentGross) : t('admin.boxOfficeReadingRow.nessuno') }));
        },
        onError: (e) => setError(e instanceof ApiError ? e.message : t('admin.boxOfficeReadingRow.salvataggioNonRiuscito')),
      },
    );
  };

  if (editing) {
    return (
      <tr>
        <td><Input type="datetime-local" aria-label={t('admin.boxOfficeReadingRow.dataRilevazione')} value={when} onChange={(e) => setWhen(e.target.value)} style={{ minWidth: 190 }} /></td>
        <td><Input type="number" min={0} aria-label={t('admin.boxOfficeReadingRow.incasso')} value={gross} onChange={(e) => setGross(e.target.value)} style={{ minWidth: 120, textAlign: 'right' }} /></td>
        <td>
          <Stack $gap={6}>
            <Input aria-label={t('admin.boxOfficeReadingRow.note')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            {error && <FieldError role="alert">{error}</FieldError>}
          </Stack>
        </td>
        <td>
          <Stack $row $gap={4} $justify="flex-end">
            <Button $size="sm" onClick={save} disabled={update.isPending} aria-label={t('admin.boxOfficeReadingRow.salvaRilevazione')}><Check size={14} /></Button>
            <Button $size="sm" $variant="ghost" onClick={() => setEditing(false)} disabled={update.isPending} aria-label={t('admin.boxOfficeReadingRow.annullaModifica')}><X size={14} /></Button>
          </Stack>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <Muted $size="0.85rem">{formatDateTime(reading.recordedAt)}</Muted>
        {isCurrent && <Badge $tone="gold" style={{ marginTop: 4 }}>{t('admin.boxOfficeReadingRow.inVigore')}</Badge>}
      </td>
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatBc(reading.grossAmount)}</td>
      <td>
        <Muted $size="0.8rem">{reading.notes ?? ''}</Muted>
        {reading.updatedAt && <Muted $size="0.72rem">{tx('admin.boxOfficeReadingRow.modificataIlUpdatedat', { updatedAt: formatDateTime(reading.updatedAt) })}</Muted>}
      </td>
      <td>
        {canManage && (
          <Stack $row $gap={4} $justify="flex-end">
            <Button $size="sm" $variant="ghost" onClick={startEdit} aria-label={t('admin.boxOfficeReadingRow.modificaRilevazioneDelRecordedat', { recordedAt: formatDateTime(reading.recordedAt) })}><Pencil size={14} /></Button>
            <Button $size="sm" $variant="ghost" onClick={() => { remove.reset(); setConfirmDelete(true); }} aria-label={t('admin.boxOfficeReadingRow.eliminaRilevazioneDelRecordedat', { recordedAt: formatDateTime(reading.recordedAt) })}><Trash2 size={14} /></Button>
          </Stack>
        )}
        {confirmDelete && (
          <ConfirmModal
            title={t('admin.boxOfficeReadingRow.eliminareQuestaRilevazione')}
            message={
              <Stack $gap={8}>
                <span>{tx('admin.boxOfficeReadingRow.rilevazioneDelRecordedatStrong', { recordedAt: formatDateTime(reading.recordedAt), strong: <strong>{formatBc(reading.grossAmount)}</strong> })}</span>
                {isCurrent && <span>{t('admin.boxOfficeReadingRow.eLIncassoInVigore')}</span>}
                <span>{t('admin.boxOfficeReadingRow.iRiscattiGiaEffettuatiNon')}</span>
              </Stack>
            }
            confirmLabel={t('admin.boxOfficeReadingRow.elimina')}
            danger
            pending={remove.isPending}
            error={remove.error?.message}
            onClose={() => setConfirmDelete(false)}
            onConfirm={() =>
              remove.mutate(undefined, {
                onSuccess: (r) => {
                  setConfirmDelete(false);
                  onChanged(t('admin.boxOfficeReadingRow.rilevazioneEliminataIncassoInVigore', { v: r.currentGross !== null ? formatBc(r.currentGross) : t('admin.boxOfficeReadingRow.nessuno') }));
                },
              })
            }
          />
        )}
      </td>
    </tr>
  );
}
