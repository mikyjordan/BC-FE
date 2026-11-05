import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { ArrowLeft, CalendarClock, Eye } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAdminContent, useAdminMutation } from '../../api/hooks';
import type { AdminContent, ContentKindPath } from '../../api/types';
import { Alert, Badge, Bc, Button, Card, Checkbox, Field, Input, Muted, PageHeader, Select, Spinner, Stack, Textarea } from '../../components/ui';
import { formatDate, formatDateTime, STATUS_LABELS } from '../../components/format';
import { hasPermission, useAuthStore } from '../../store/auth';
import { media } from '../../theme/theme';
import { FIELDS, fromLocalInput, toFormValues, toLocalInput, toPayload, type FormValues } from './content-fields';
import { PublicationActions } from './publication-actions';
import { PreviewModal } from './PreviewModal';
import { statusTone } from './PublicationPage';
import { SeasonsSection } from './SeasonsSection';
import { BoxOfficeSection } from './BoxOfficeSection';
import { PosterField } from './PosterField';
import { AutoRedeemSection } from './AutoRedeemSection';

const FormGrid = styled.div`
  display: grid;
  gap: 14px;
  ${media.sm} { grid-template-columns: 1fr 1fr; }
  .wide { grid-column: 1 / -1; }
`;

const Columns = styled.div`
  display: grid;
  gap: 18px;
  ${media.lg} { grid-template-columns: 1.6fr 1fr; align-items: start; }
`;

function Section({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <Card>
      <h3 style={{ marginBottom: note ? 4 : 14 }}>{title}</h3>
      {note && <Muted $size="0.82rem" style={{ marginBottom: 14 }}>{note}</Muted>}
      {children}
    </Card>
  );
}

function errorText(e: unknown) {
  if (e instanceof ApiError) return e.details?.length ? `${e.message}: ${e.details.map((d) => `${d.path} — ${d.message}`).join('; ')}` : e.message;
  return e instanceof Error ? e.message : null;
}

/* ---------------- Dati editoriali ---------------- */
function EditorialForm({ kind, item }: { kind: ContentKindPath; item?: AdminContent }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canEdit = item ? hasPermission(user, 'content.edit') : hasPermission(user, 'content.create');
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset, formState, watch, setValue } = useForm<FormValues>({ defaultValues: toFormValues(kind, item) });
  useEffect(() => reset(toFormValues(kind, item)), [item, kind, reset]);

  const mutation = useAdminMutation((payload: Record<string, unknown>) =>
    item
      ? api<AdminContent>(`/admin/${kind}/${item.id}`, { method: 'PATCH', body: payload })
      : api<AdminContent>(`/admin/${kind}`, { method: 'POST', body: payload }),
  );

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    mutation.mutate(toPayload(kind, values), {
      onSuccess: (res) => {
        const created = res as AdminContent;
        if (!item) navigate(`/admin/contenuti/${kind}/${created.id}`, { replace: true });
        else setSaved(true);
      },
    });
  });

  return (
    <Section title="Dati editoriali" note={!item ? 'Il titolo verrà creato in BOZZA: non sarà visibile finché non lo pubblichi.' : undefined}>
      <form onSubmit={onSubmit}>
        <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0 }}>
          <FormGrid>
            {FIELDS[kind].map((f) => (
              <div key={f.name} className={f.wide || f.type === 'textarea' ? 'wide' : undefined}>
                <Field label={`${f.label}${f.required ? ' *' : ''}`} hint={f.hint}>
                  {f.type === 'image' ? (
                    <PosterField
                      value={watch(f.name) ?? ''}
                      onChange={(v) => setValue(f.name, v, { shouldDirty: true })}
                      disabled={!canEdit}
                      kind={kind === 'movies' ? 'MOVIE' : 'TV_SERIES'}
                    />
                  ) : f.type === 'textarea' ? (
                    <Textarea {...register(f.name, { required: f.required })} />
                  ) : f.type === 'select' ? (
                    <Select {...register(f.name)}>
                      {f.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </Select>
                  ) : (
                    <Input
                      type={f.type === 'date' ? 'date' : f.type === 'int' ? 'number' : 'text'}
                      aria-invalid={!!formState.errors[f.name]}
                      {...register(f.name, { required: f.required })}
                    />
                  )}
                </Field>
              </div>
            ))}
          </FormGrid>
        </fieldset>
        <Stack $gap={10} style={{ marginTop: 16 }}>
          {mutation.error && <Alert $tone="error">{errorText(mutation.error)}</Alert>}
          {saved && <Alert $tone="success">Modifiche salvate.</Alert>}
          {canEdit ? (
            <div><Button type="submit" disabled={mutation.isPending}>{item ? 'Salva modifiche' : 'Crea in bozza'}</Button></div>
          ) : (
            <Muted $size="0.85rem">Non hai il permesso di modificare i dati editoriali.</Muted>
          )}
        </Stack>
      </form>
    </Section>
  );
}

/* ---------------- Pubblicazione e programmazione ---------------- */
function PublicationSection({ kind, item }: { kind: ContentKindPath; item: AdminContent }) {
  const user = useAuthStore((s) => s.user);
  const canPublish = hasPermission(user, 'content.publish');
  const [when, setWhen] = useState('');
  const [confirm, setConfirm] = useState(false);
  const schedule = useAdminMutation((publishAt: string) =>
    api(`/admin/${kind}/${item.id}/schedule`, { method: 'POST', body: { publishAt, confirm: true } }),
  );
  const cancel = useAdminMutation(() => api(`/admin/${kind}/${item.id}/schedule`, { method: 'DELETE' }));
  const canSchedule = canPublish && (item.publicationStatus === 'DRAFT' || item.publicationStatus === 'HIDDEN');

  return (
    <Section title="Pubblicazione">
      <Stack $gap={14}>
        <Stack $row $gap={10} $align="center" $wrap>
          <Badge $tone={statusTone(item.publicationStatus)}>{STATUS_LABELS[item.publicationStatus]}</Badge>
          <Muted $size="0.85rem">{item.publishedAt ? `Ultima pubblicazione: ${formatDateTime(item.publishedAt)}` : 'Mai pubblicato'}</Muted>
        </Stack>
        <PublicationActions kind={kind} item={item} size="md" />
        {!canPublish && <Muted $size="0.85rem">Non hai il permesso di pubblicare.</Muted>}

        {item.scheduledPublishAt ? (
          <Alert $tone="warning">
            <Stack $row $justify="space-between" $align="center" $wrap $gap={8}>
              <span><CalendarClock size={14} /> Pubblicazione programmata e confermata per {formatDateTime(item.scheduledPublishAt)}</span>
              {canPublish && <Button $size="sm" $variant="secondary" onClick={() => cancel.mutate(undefined)} disabled={cancel.isPending}>Annulla programmazione</Button>}
            </Stack>
          </Alert>
        ) : (
          canSchedule && (
            <Stack $gap={10}>
              <Field label="Programma la pubblicazione" hint="Avverrà automaticamente solo dopo la tua conferma esplicita.">
                <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              </Field>
              <Checkbox>
                <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
                Confermo che il titolo dovrà essere pubblicato alla data indicata.
              </Checkbox>
              {schedule.error && <Alert $tone="error">{errorText(schedule.error)}</Alert>}
              <div>
                <Button $variant="secondary" disabled={!when || !confirm || schedule.isPending} onClick={() => schedule.mutate(fromLocalInput(when)!, { onSuccess: () => { setWhen(''); setConfirm(false); } })}>
                  <CalendarClock size={15} /> Programma
                </Button>
              </div>
            </Stack>
          )
        )}
      </Stack>
    </Section>
  );
}

/* ---------------- Visibilità ---------------- */
function VisibilitySection({ kind, item }: { kind: ContentKindPath; item: AdminContent }) {
  const user = useAuthStore((s) => s.user);
  const can = hasPermission(user, 'content.publish');
  const [availableFrom, setAvailableFrom] = useState(toLocalInput(item.availableFrom));
  const mutation = useAdminMutation((body: Record<string, unknown>) => api(`/admin/${kind}/${item.id}/visibility`, { method: 'PATCH', body }));
  useEffect(() => setAvailableFrom(toLocalInput(item.availableFrom)), [item.availableFrom]);

  type FlagKey = 'showOnHomepage' | 'showInLeaderboards' | 'featured';
  // Stato ottimistico: la casella cambia subito e torna indietro se il server rifiuta.
  const [flags, setFlags] = useState({ showOnHomepage: item.showOnHomepage, showInLeaderboards: item.showInLeaderboards, featured: item.featured });
  useEffect(
    () => setFlags({ showOnHomepage: item.showOnHomepage, showInLeaderboards: item.showInLeaderboards, featured: item.featured }),
    [item.showOnHomepage, item.showInLeaderboards, item.featured],
  );
  const toggle = (key: FlagKey, label: string) => (
    <Checkbox>
      <input
        type="checkbox"
        disabled={!can}
        checked={flags[key]}
        onChange={(e) => {
          const value = e.target.checked;
          setFlags((f) => ({ ...f, [key]: value }));
          mutation.mutate({ [key]: value }, { onError: () => setFlags((f) => ({ ...f, [key]: !value })) });
        }}
      />
      {label}
    </Checkbox>
  );

  return (
    <Section title="Visibilità" note="Questi flag hanno effetto solo quando il titolo è pubblicato.">
      <Stack $gap={10}>
        {toggle('showOnHomepage', 'Mostra nella homepage')}
        {toggle('featured', 'Metti in evidenza')}
        {toggle('showInLeaderboards', 'Includi nelle classifiche')}
        <Field label="Disponibile dal" hint="Facoltativo: prima di questa data il titolo resta invisibile anche se pubblicato.">
          <Input type="datetime-local" value={availableFrom} disabled={!can} onChange={(e) => setAvailableFrom(e.target.value)} />
        </Field>
        <div>
          <Button $variant="secondary" disabled={!can || mutation.isPending} onClick={() => mutation.mutate({ availableFrom: fromLocalInput(availableFrom) })}>Salva disponibilità</Button>
        </div>
        {mutation.error && <Alert $tone="error">{errorText(mutation.error)}</Alert>}
      </Stack>
    </Section>
  );
}

/* ---------------- Acquisti ---------------- */
/** Mezzanotte tra il giorno prima dell'uscita e il giorno d'uscita (ora locale), per <input type="datetime-local">. */
export const releaseMidnightInput = (releaseDate: string | null | undefined) => (releaseDate ? `${releaseDate}T00:00` : '');

type PurchaseField = 'priceBc' | 'purchaseOpensAt' | 'purchaseClosesAt';

function PurchaseSection({ kind, item }: { kind: ContentKindPath; item: AdminContent }) {
  const user = useAuthStore((s) => s.user);
  const can = hasPermission(user, 'content.purchases');
  // Valori iniziali: quelli salvati; altrimenti apertura = adesso e, per i film,
  // chiusura = mezzanotte del giorno prima dell'uscita in sala.
  const initial = () => ({
    price: item.priceBc ? String(item.priceBc) : '',
    opens: toLocalInput(item.purchaseOpensAt) || toLocalInput(new Date().toISOString()),
    closes: toLocalInput(item.purchaseClosesAt) || (kind === 'movies' ? releaseMidnightInput(item.italianReleaseDate) : ''),
  });
  const [price, setPrice] = useState(initial().price);
  const [opens, setOpens] = useState(initial().opens);
  const [closes, setCloses] = useState(initial().closes);
  const [errors, setErrors] = useState<Partial<Record<PurchaseField, string>>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const mutation = useAdminMutation((body: Record<string, unknown>) => api(`/admin/${kind}/${item.id}/purchase-settings`, { method: 'PATCH', body }));
  // Riallinea i campi quando il record viene ricaricato dal server.
  useEffect(() => {
    const v = initial();
    setPrice(v.price);
    setOpens(v.opens);
    setCloses(v.closes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.priceBc, item.purchaseOpensAt, item.purchaseClosesAt, item.italianReleaseDate]);
  const seasonScoped = kind === 'tv-series' && item.holdingScope === 'SEASON';
  const suggestedClose = kind === 'movies' ? releaseMidnightInput(item.italianReleaseDate) : '';

  /** Validazione lato frontend: tutti e tre i campi sono obbligatori (il backend applica le stesse regole). */
  const validate = () => {
    const e: Partial<Record<PurchaseField, string>> = {};
    const n = Number(price);
    if (!price) e.priceBc = 'Il prezzo è obbligatorio';
    else if (!Number.isInteger(n) || n <= 0) e.priceBc = 'Inserisci un numero intero maggiore di zero';
    if (!opens) e.purchaseOpensAt = 'L’apertura degli acquisti è obbligatoria';
    if (!closes) e.purchaseClosesAt = 'La chiusura degli acquisti è obbligatoria';
    else if (opens && new Date(closes) <= new Date(opens)) e.purchaseClosesAt = 'La chiusura deve seguire l’apertura';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = (extra: Record<string, unknown> = {}, message = 'Impostazioni salvate.') => {
    setSaved(null);
    if (!validate()) return;
    mutation.mutate(
      { priceBc: Number.parseInt(price, 10), purchaseOpensAt: fromLocalInput(opens), purchaseClosesAt: fromLocalInput(closes), ...extra },
      {
        onSuccess: () => setSaved(message),
        onError: (err) => {
          if (err instanceof ApiError && err.details) {
            setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])) as Partial<Record<PurchaseField, string>>);
          }
        },
      },
    );
  };

  const suspend = () => {
    setSaved(null);
    mutation.mutate({ purchasesEnabled: false }, { onSuccess: () => setSaved('Acquisti sospesi.') });
  };

  return (
    <Section title="Acquisti" note={seasonScoped ? 'Serie acquistabile per stagione: il prezzo della stagione, se impostato, prevale su quello della serie.' : 'Tutti i campi sono obbligatori.'}>
      <Stack $gap={12}>
        <Stack $row $justify="space-between" $align="center">
          <Badge $tone={item.purchasesEnabled ? 'green' : 'neutral'}>{item.purchasesEnabled ? 'Acquisti attivi' : 'Acquisti disattivati'}</Badge>
          {item.priceBc ? <Bc value={item.priceBc} size={14} /> : null}
        </Stack>
        <Field label={kind === 'movies' ? 'Prezzo del film (Bustercoin) *' : 'Prezzo per quota (Bustercoin) *'} error={errors.priceBc}>
          <Input type="number" min={1} required aria-invalid={!!errors.priceBc} value={price} disabled={!can} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Apertura acquisti *" error={errors.purchaseOpensAt}>
          <Input type="datetime-local" required aria-invalid={!!errors.purchaseOpensAt} value={opens} disabled={!can} onChange={(e) => setOpens(e.target.value)} />
        </Field>
        <Field
          label="Chiusura acquisti *"
          error={errors.purchaseClosesAt}
          hint={
            kind === 'movies'
              ? suggestedClose
                ? 'Regola: mezzanotte del giorno prima dell’uscita nelle sale (precompilata dalla data d’uscita italiana).'
                : 'Regola: mezzanotte del giorno prima dell’uscita nelle sale. Imposta la data d’uscita italiana nei dati editoriali per precompilarla.'
              : undefined
          }
        >
          <Input type="datetime-local" required aria-invalid={!!errors.purchaseClosesAt} value={closes} disabled={!can} onChange={(e) => setCloses(e.target.value)} />
        </Field>
        {kind === 'movies' && suggestedClose && closes !== suggestedClose && can && (
          <div>
            <Button $size="sm" $variant="ghost" onClick={() => setCloses(suggestedClose)}>
              Usa la mezzanotte prima dell’uscita ({formatDate(item.italianReleaseDate)})
            </Button>
          </div>
        )}
        {mutation.error && !Object.keys(errors).length && <Alert $tone="error">{errorText(mutation.error)}</Alert>}
        {saved && <Alert $tone="success">{saved}</Alert>}
        {can ? (
          <Stack $row $gap={8} $wrap>
            <Button $variant="gold" disabled={mutation.isPending} onClick={() => save()}>Salva prezzo e date</Button>
            {item.purchasesEnabled ? (
              <Button $variant="secondary" disabled={mutation.isPending} onClick={suspend}>Sospendi acquisti</Button>
            ) : (
              <Button $variant="secondary" disabled={mutation.isPending || item.publicationStatus === 'ARCHIVED'} onClick={() => save({ purchasesEnabled: true }, 'Acquisti abilitati.')}>
                Abilita acquisti
              </Button>
            )}
          </Stack>
        ) : (
          <Muted $size="0.85rem">Non hai il permesso di gestire prezzi e acquisti.</Muted>
        )}
      </Stack>
    </Section>
  );
}

export function ContentEditorPage() {
  const { kind: kindParam, id } = useParams();
  const kind: ContentKindPath = kindParam === 'tv-series' ? 'tv-series' : 'movies';
  const isNew = id === 'nuovo';
  const q = useAdminContent(kind, isNew ? undefined : id);
  const [preview, setPreview] = useState(false);
  const label = kind === 'movies' ? 'film' : 'serie TV';

  if (!isNew && q.isLoading) return <Spinner />;
  if (!isNew && !q.data) return <Alert $tone="error">Contenuto non trovato.</Alert>;
  const item = q.data;

  return (
    <>
      <Link to={`/admin/pubblicazione?tipo=${kind}${item ? `&stato=${item.publicationStatus}` : ''}`} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginBottom: 14, color: '#8592B3' }}>
        <ArrowLeft size={16} /> Pubblicazione
      </Link>
      <PageHeader
        title={item ? item.title : `Nuovo ${label}`}
        subtitle={item ? `ID ${item.id} · fonte ${item.source}${item.externalId ? ` (${item.externalId})` : ''}` : undefined}
        actions={item && <Button $variant="secondary" onClick={() => setPreview(true)}><Eye size={15} /> Anteprima pubblica</Button>}
      />
      <Columns>
        <Stack $gap={18}>
          <EditorialForm kind={kind} item={item} />
          {item && kind === 'movies' && <BoxOfficeSection movie={item} />}
          {item && kind === 'movies' && <AutoRedeemSection movie={item} />}
          {item && kind === 'tv-series' && <SeasonsSection seriesId={item.id} />}
        </Stack>
        {item && (
          <Stack $gap={18}>
            <PublicationSection kind={kind} item={item} />
            <VisibilitySection kind={kind} item={item} />
            <PurchaseSection kind={kind} item={item} />
          </Stack>
        )}
      </Columns>
      {preview && item && <PreviewModal kind={kind} id={item.id} status={item.publicationStatus} onClose={() => setPreview(false)} />}
    </>
  );
}
