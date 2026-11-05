import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { z } from 'zod';
import { Award, Camera, Gift, Settings, Trash2 } from 'lucide-react';
import { useAvatar, useFeatures, useHoldings, useUpdateProfile, useWallet } from '../../api/hooks';
import { Avatar } from '../../components/Avatar';
import { Alert, Badge, Bc, Gain, Button, Card, Field, Input, Muted, PageHeader, Stack, Textarea } from '../../components/ui';
import { formatDate, formatPct } from '../../components/format';
import { useAuthStore } from '../../store/auth';

const ROLE_LABEL = { USER: 'Giocatore', ADMIN: 'Amministratore', SUPERADMIN: 'Superadmin' } as const;
const MAX_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  displayName: z.string().trim().min(1, 'Obbligatorio').max(64),
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  bio: z.string().trim().max(500, 'Massimo 500 caratteri'),
});
type Values = z.infer<typeof schema>;

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)!;
  const wallet = useWallet();
  const holdings = useHoldings();
  const features = useFeatures().data;
  const update = useUpdateProfile();
  const avatar = useAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user.profile?.displayName ?? user.username,
      firstName: user.profile?.firstName ?? '',
      lastName: user.profile?.lastName ?? '',
      bio: user.profile?.bio ?? '',
    },
  });

  const onFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setFileError('Formati ammessi: PNG, JPEG, WEBP');
    if (file.size > MAX_BYTES) return setFileError('Dimensione massima 5 MB');
    avatar.mutate(file, { onError: (e) => setFileError(e.message) });
  };

  const movies = holdings.data?.items.filter((h) => h.contentType === 'MOVIE' && h.status === 'OPEN').length ?? 0;
  const series = holdings.data?.items.filter((h) => h.contentType === 'TV_SERIES').length ?? 0;

  return (
    <>
      <PageHeader
        title="Profilo"
        actions={
          <Link to="/app/impostazioni">
            <Button $variant="secondary" $size="sm">
              <Settings size={15} /> Impostazioni
            </Button>
          </Link>
        }
      />
      <Stack $gap={18}>
        <Card>
          <Stack $row $gap={18} $align="center" $wrap>
            <Avatar user={user} size={88} />
            <Stack $gap={6} style={{ flex: 1, minWidth: 200 }}>
              <h2>{user.profile?.displayName ?? user.username}</h2>
              <Muted>@{user.username} · iscritto dal {formatDate(user.createdAt)}</Muted>
              <div><Badge $tone="blue">{ROLE_LABEL[user.role]}</Badge></div>
            </Stack>
            <Stack $row $gap={8}>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              <Button $variant="secondary" $size="sm" onClick={() => fileRef.current?.click()} disabled={avatar.isPending}>
                <Camera size={15} /> {user.profile?.avatarUrl ? 'Cambia foto' : 'Carica foto'}
              </Button>
              {user.profile?.avatarUrl && (
                <Button $variant="ghost" $size="sm" onClick={() => avatar.mutate(null)} disabled={avatar.isPending} aria-label="Rimuovi foto">
                  <Trash2 size={15} />
                </Button>
              )}
            </Stack>
          </Stack>
          {fileError && <Alert $tone="error" style={{ marginTop: 14 }}>{fileError}</Alert>}
        </Card>

        <Stack $row $gap={14} $wrap>
          <Card style={{ flex: '1 1 160px' }}>
            <Muted $size="0.8rem">Saldo</Muted>
            {wallet.data && <Bc value={wallet.data.balance} size={18} />}
          </Card>
          <Card style={{ flex: '1 1 160px' }}>
            <Muted $size="0.8rem">Guadagni</Muted>
            {wallet.data && <Gain value={wallet.data.totalGain} size={18} />}
          </Card>
          <Card style={{ flex: '1 1 160px' }}>
            <Muted $size="0.8rem">Rendimento</Muted>
            <strong style={{ fontSize: 18 }}>{wallet.data ? formatPct(wallet.data.returnPct) : '—'}</strong>
          </Card>
          <Card style={{ flex: '1 1 160px' }}>
            <Muted $size="0.8rem">Titoli posseduti</Muted>
            <strong style={{ fontSize: 18 }}>
              {[features?.movies && `${movies} film`, features?.tvSeries && `${series} serie`].filter(Boolean).join(' · ') || '—'}
            </strong>
          </Card>
        </Stack>

        <Stack $row $gap={14} $wrap>
          <Link to="/app/coppe" style={{ flex: '1 1 200px' }}>
            <Card $padding="16px"><Stack $row $gap={10} $align="center"><Award size={18} /> <strong>Coppe e Hall of Fame</strong></Stack></Card>
          </Link>
          <Link to="/app/premi" style={{ flex: '1 1 200px' }}>
            <Card $padding="16px"><Stack $row $gap={10} $align="center"><Gift size={18} /> <strong>Premi vinti</strong></Stack></Card>
          </Link>
        </Stack>

        <Card>
          <h3 style={{ marginBottom: 14 }}>Dati personali</h3>
          <form
            onSubmit={handleSubmit((v) => {
              setSaved(false);
              update.mutate(v, { onSuccess: () => setSaved(true) });
            })}
          >
            <Stack $gap={14}>
              <Field label="Nome visualizzato" error={formState.errors.displayName?.message}>
                <Input {...register('displayName')} />
              </Field>
              <Stack $row $gap={12} $wrap>
                <div style={{ flex: '1 1 200px' }}>
                  <Field label="Nome"><Input autoComplete="given-name" {...register('firstName')} /></Field>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <Field label="Cognome"><Input autoComplete="family-name" {...register('lastName')} /></Field>
                </div>
              </Stack>
              <Field label="Bio" error={formState.errors.bio?.message}>
                <Textarea {...register('bio')} />
              </Field>
              {update.error && <Alert $tone="error">{update.error.message}</Alert>}
              {saved && <Alert $tone="success">Profilo aggiornato.</Alert>}
              <div>
                <Button type="submit" disabled={update.isPending}>Salva</Button>
              </div>
            </Stack>
          </form>
        </Card>
      </Stack>
    </>
  );
}
