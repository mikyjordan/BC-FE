import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import styled from 'styled-components';
import { CalendarClock, Eye, Home, Pencil, Plus, Search, Star } from 'lucide-react';
import { useAdminContentList, useFeatures, useStatusCounts } from '../../api/hooks';
import type { AdminContent, ContentKindPath, PublicationStatus } from '../../api/types';
import { Alert, Badge, Bc, Button, Card, EmptyState, Input, Muted, PageHeader, Pagination, Spinner, Stack, Tab, Tabs } from '../../components/ui';
import { formatDateTime, STATUS_LABELS } from '../../components/format';
import { Poster } from '../../components/Poster';
import { hasPermission, useAuthStore } from '../../store/auth';
import { PublicationActions } from './publication-actions';
import { adminPurchaseState, PurchaseBadge } from '../../components/PurchaseBadge';
import { PreviewModal } from './PreviewModal';
import { media } from '../../theme/theme';

const STATUS_TABS: Array<{ key: PublicationStatus; label: string }> = [
  { key: 'DRAFT', label: 'Bozze' },
  { key: 'PUBLISHED', label: 'Pubblicati' },
  { key: 'HIDDEN', label: 'Nascosti' },
  { key: 'ARCHIVED', label: 'Archiviati' },
];

export const statusTone = (s: PublicationStatus) => (({ DRAFT: 'neutral', PUBLISHED: 'green', HIDDEN: 'amber', ARCHIVED: 'red' }) as const)[s];

const Row = styled(Card)`
  display: grid;
  gap: 14px;
  grid-template-columns: 56px 1fr;
  align-items: center;
  padding: 14px;
  ${media.md} { grid-template-columns: 56px 1fr auto; }
`;

const Actions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  ${media.md} { grid-column: auto; justify-content: flex-end; }
`;

function ContentRow({ kind, item, onPreview }: { kind: ContentKindPath; item: AdminContent; onPreview: () => void }) {
  return (
    <Row>
      <Poster src={item.posterUrl} alt="" kind={kind === 'movies' ? 'MOVIE' : 'TV_SERIES'} />
      <Stack $gap={6} style={{ minWidth: 0 }}>
        <Stack $row $gap={8} $align="center" $wrap>
          <strong>{item.title}</strong>
          <Badge $tone={statusTone(item.publicationStatus)}>{STATUS_LABELS[item.publicationStatus]}</Badge>
          {item.source !== 'MANUAL' && <Badge>Importato · {item.source}</Badge>}
        </Stack>
        <Stack $row $gap={10} $wrap $align="center">
          <PurchaseBadge {...adminPurchaseState(item)} />
          {item.priceBc ? <Bc value={item.priceBc} size={12} /> : <Muted $size="0.8rem">Prezzo non impostato</Muted>}
          {item.showOnHomepage && <Badge $tone="blue"><Home size={11} /> Homepage</Badge>}
          {item.featured && <Badge $tone="blue"><Star size={11} /> Evidenza</Badge>}
          {item.scheduledPublishAt && <Badge $tone="amber"><CalendarClock size={11} /> Programmato {formatDateTime(item.scheduledPublishAt)}</Badge>}
        </Stack>
        <Muted $size="0.78rem">
          {item.publishedAt ? `Pubblicato il ${formatDateTime(item.publishedAt)}` : 'Mai pubblicato'} · aggiornato {formatDateTime(item.updatedAt)}
        </Muted>
      </Stack>
      <Actions>
        <Button $size="sm" $variant="ghost" onClick={onPreview}><Eye size={14} /> Anteprima</Button>
        <Link to={`/admin/contenuti/${kind}/${item.id}`}>
          <Button $size="sm" $variant="secondary"><Pencil size={14} /> Gestisci</Button>
        </Link>
        <PublicationActions kind={kind} item={item} />
      </Actions>
    </Row>
  );
}

export function PublicationPage() {
  const user = useAuthStore((s) => s.user);
  const [params, setParams] = useSearchParams();
  const kind = (params.get('tipo') === 'tv-series' ? 'tv-series' : 'movies') as ContentKindPath;
  const status = (STATUS_TABS.find((t) => t.key === params.get('stato'))?.key ?? 'PUBLISHED') as PublicationStatus;
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState<string | undefined>();
  const [preview, setPreview] = useState<AdminContent | null>(null);
  const list = useAdminContentList(kind, status, page, search);
  const counts = useStatusCounts(kind);
  const features = useFeatures().data;

  const update = (next: Record<string, string>) => {
    setPage(1);
    setParams((p) => {
      const n = new URLSearchParams(p);
      for (const [k, v] of Object.entries(next)) n.set(k, v);
      return n;
    });
  };

  return (
    <>
      <PageHeader
        title="Pubblicazione contenuti"
        subtitle="Nessun titolo è visibile agli utenti finché non lo pubblichi esplicitamente."
        actions={
          hasPermission(user, 'content.create') && (
            <Link to={`/admin/contenuti/${kind}/nuovo`}>
              <Button><Plus size={16} /> {kind === 'movies' ? 'Nuovo film' : 'Nuova serie'}</Button>
            </Link>
          )
        }
      />

      {features && !features[kind === 'movies' ? 'movies' : 'tvSeries'] && (
        <Alert $tone="warning" style={{ marginBottom: 14 }}>
          La sezione {kind === 'movies' ? 'Film' : 'Serie TV'} è disattivata: i titoli non sono visibili agli utenti anche se pubblicati.
          {user?.role === 'SUPERADMIN' && <> Puoi attivarla da <Link to="/admin/impostazioni" style={{ textDecoration: 'underline' }}>Impostazioni</Link>.</>}
        </Alert>
      )}
      <Stack $row $gap={8} $wrap style={{ marginBottom: 14 }}>
        <Tab $active={kind === 'movies'} onClick={() => update({ tipo: 'movies' })}>Film</Tab>
        <Tab $active={kind === 'tv-series'} onClick={() => update({ tipo: 'tv-series' })}>Serie TV</Tab>
      </Stack>

      <Tabs>
        {STATUS_TABS.map((t) => (
          <Tab key={t.key} $active={status === t.key} onClick={() => update({ stato: t.key })}>
            {t.label} {counts.data ? `(${counts.data[t.key]})` : ''}
          </Tab>
        ))}
      </Tabs>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q.trim() || undefined);
        }}
        style={{ marginBottom: 16, position: 'relative', maxWidth: 420 }}
      >
        <Search size={16} style={{ position: 'absolute', left: 12, top: 13, opacity: 0.5 }} />
        <Input placeholder="Cerca per titolo…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 36 }} aria-label="Cerca" />
      </form>

      {list.isLoading ? (
        <Spinner />
      ) : !list.data?.items.length ? (
        <EmptyState title={`Nessun contenuto in “${STATUS_TABS.find((t) => t.key === status)!.label}”`} />
      ) : (
        <Stack $gap={10}>
          {list.data.items.map((item) => (
            <ContentRow key={item.id} kind={kind} item={item} onPreview={() => setPreview(item)} />
          ))}
          <Pagination page={page} totalPages={list.data.totalPages} onChange={setPage} />
        </Stack>
      )}

      {preview && <PreviewModal kind={kind} id={preview.id} status={preview.publicationStatus} onClose={() => setPreview(null)} />}
    </>
  );
}
