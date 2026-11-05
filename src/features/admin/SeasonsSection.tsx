import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAdminMutation, useAdminSeasons } from '../../api/hooks';
import type { AdminSeason } from '../../api/types';
import { Alert, Badge, Bc, Button, Card, Checkbox, FieldError, Input, Muted, Stack, Table, TableScroll } from '../../components/ui';
import { hasPermission, useAuthStore } from '../../store/auth';
import { t } from '../../i18n';

function SeasonRow({ seriesId, s }: { seriesId: string; s: AdminSeason }) {
  const user = useAuthStore((st) => st.user);
  const canPurchases = hasPermission(user, 'content.purchases') && hasPermission(user, 'content.edit');
  const [price, setPrice] = useState(s.priceBc ? String(s.priceBc) : '');
  const m = useAdminMutation((body: Record<string, unknown>) => api(`/admin/tv-series/${seriesId}/seasons/${s.id}`, { method: 'PATCH', body }));
  return (
    <tr>
      <td><strong>S{s.seasonNumber}</strong> {s.title && <Muted $size="0.8rem">{s.title}</Muted>}</td>
      <td>{s.episodesCount ?? '—'}</td>
      <td>
        {canPurchases ? (
          <Stack $row $gap={6}>
            <Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} style={{ maxWidth: 140 }} aria-label={t('admin.seasonsSection.prezzoStagioneSeasonnumber', { seasonNumber: s.seasonNumber })} />
            <Button $size="sm" $variant="secondary" disabled={m.isPending} onClick={() => m.mutate({ priceBc: price ? Number(price) : null })}>{t('admin.seasonsSection.salva')}</Button>
          </Stack>
        ) : s.priceBc ? <Bc value={s.priceBc} size={13} /> : <Muted>—</Muted>}
      </td>
      <td>
        {canPurchases ? (
          <Checkbox>
            <input type="checkbox" checked={s.purchasesEnabled} disabled={m.isPending} onChange={(e) => m.mutate({ purchasesEnabled: e.target.checked })} />
            {s.purchasesEnabled ? t('admin.seasonsSection.attivi') : t('admin.seasonsSection.disattivati')}
          </Checkbox>
        ) : (
          <Badge $tone={s.purchasesEnabled ? 'green' : 'neutral'}>{s.purchasesEnabled ? t('admin.seasonsSection.attivi') : t('admin.seasonsSection.disattivati')}</Badge>
        )}
        {m.error && <FieldError>{m.error.message}</FieldError>}
      </td>
    </tr>
  );
}

export function SeasonsSection({ seriesId }: { seriesId: string }) {
  const user = useAuthStore((s) => s.user);
  const canEdit = hasPermission(user, 'content.edit');
  const seasons = useAdminSeasons(seriesId);
  const [number, setNumber] = useState('');
  const [episodes, setEpisodes] = useState('');
  const create = useAdminMutation(() =>
    api(`/admin/tv-series/${seriesId}/seasons`, {
      method: 'POST',
      body: { seasonNumber: Number(number), ...(episodes ? { episodesCount: Number(episodes) } : {}) },
    }),
  );
  const items = seasons.data?.items ?? [];

  return (
    <Card>
      <h3 style={{ marginBottom: 4 }}>{t('admin.seasonsSection.stagioni')}</h3>
      <Muted $size="0.82rem" style={{ marginBottom: 12 }}>{t('admin.seasonsSection.leStagioniSeguonoLaVisibilita')}</Muted>
      {items.length ? (
        <TableScroll>
          <Table>
            <thead><tr><th>{t('admin.seasonsSection.stagione')}</th><th>{t('admin.seasonsSection.episodi')}</th><th>{t('admin.seasonsSection.prezzo')}</th><th>{t('admin.seasonsSection.acquisti')}</th></tr></thead>
            <tbody>{items.map((s) => <SeasonRow key={s.id} seriesId={seriesId} s={s} />)}</tbody>
          </Table>
        </TableScroll>
      ) : (
        <Muted>{t('admin.seasonsSection.nessunaStagioneInserita')}</Muted>
      )}
      {canEdit && (
        <Stack $row $gap={8} $wrap $align="flex-end" style={{ marginTop: 14 }}>
          <Input type="number" min={1} placeholder={t('admin.seasonsSection.nStagione')} value={number} onChange={(e) => setNumber(e.target.value)} style={{ maxWidth: 140 }} aria-label={t('admin.seasonsSection.numeroStagione')} />
          <Input type="number" min={0} placeholder={t('admin.seasonsSection.episodi')} value={episodes} onChange={(e) => setEpisodes(e.target.value)} style={{ maxWidth: 120 }} aria-label={t('admin.seasonsSection.episodi')} />
          <Button $variant="secondary" disabled={!number || create.isPending} onClick={() => create.mutate(undefined, { onSuccess: () => { setNumber(''); setEpisodes(''); } })}>
            <Plus size={15} />{' '}{t('admin.seasonsSection.aggiungiStagione')}</Button>
        </Stack>
      )}
      {create.error && <Alert $tone="error" style={{ marginTop: 10 }}>{create.error instanceof ApiError && create.error.status === 409 ? t('admin.seasonsSection.stagioneGiaEsistente') : create.error.message}</Alert>}
    </Card>
  );
}
