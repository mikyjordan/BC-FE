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
import { hasWallet, useAuthStore } from '../../store/auth';
import { t, tx } from '../../i18n';

const ROLE_LABEL = { USER: t('profile.profilePage.giocatore'), ADMIN: t('profile.profilePage.amministratore'), SUPERADMIN: t('profile.profilePage.superadmin') } as const;
const MAX_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  bio: z.string().trim().max(500, t('profile.profilePage.massimo500Caratteri')),
});
type Values = z.infer<typeof schema>;

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)!;
  const withWallet = hasWallet(user);
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
      firstName: user.profile?.firstName ?? '',
      lastName: user.profile?.lastName ?? '',
      bio: user.profile?.bio ?? '',
    },
  });

  const onFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setFileError(t('profile.profilePage.formatiAmmessiPngJpegWebp'));
    if (file.size > MAX_BYTES) return setFileError(t('profile.profilePage.dimensioneMassima5Mb'));
    avatar.mutate(file, { onError: (e) => setFileError(e.message) });
  };

  const movies = holdings.data?.items.filter((h) => h.contentType === 'MOVIE' && h.status === 'OPEN').length ?? 0;
  const series = holdings.data?.items.filter((h) => h.contentType === 'TV_SERIES').length ?? 0;

  return (
    <>
      <PageHeader
        title={t('profile.profilePage.profilo')}
        actions={
          <Link to="/app/impostazioni">
            <Button $variant="secondary" $size="sm">
              <Settings size={15} />{' '}{t('profile.profilePage.impostazioni')}</Button>
          </Link>
        }
      />
      <Stack $gap={18}>
        <Card>
          <Stack $row $gap={18} $align="center" $wrap>
            <Avatar user={user} size={88} />
            <Stack $gap={6} style={{ flex: 1, minWidth: 200 }}>
              <h2>{user.username}</h2>
              <Muted>{tx('profile.profilePage.usernameIscrittoDalCreatedat', { username: user.username, createdAt: formatDate(user.createdAt) })}</Muted>
              <div><Badge $tone="blue">{ROLE_LABEL[user.role]}</Badge></div>
            </Stack>
            <Stack $row $gap={8}>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              <Button $variant="secondary" $size="sm" onClick={() => fileRef.current?.click()} disabled={avatar.isPending}>
                <Camera size={15} /> {user.profile?.avatarUrl ? t('profile.profilePage.cambiaFoto') : t('profile.profilePage.caricaFoto')}
              </Button>
              {user.profile?.avatarUrl && (
                <Button $variant="ghost" $size="sm" onClick={() => avatar.mutate(null)} disabled={avatar.isPending} aria-label={t('profile.profilePage.rimuoviFoto')}>
                  <Trash2 size={15} />
                </Button>
              )}
            </Stack>
          </Stack>
          {fileError && <Alert $tone="error" style={{ marginTop: 14 }}>{fileError}</Alert>}
        </Card>

        {withWallet && (
        <Stack $row $gap={14} $wrap>
          <Card style={{ flex: '1 1 160px' }}>
            <Muted $size="0.8rem">{t('profile.profilePage.saldo')}</Muted>
            {wallet.data && <Bc value={wallet.data.balance} size={18} />}
          </Card>
          <Card style={{ flex: '1 1 160px' }}>
            <Muted $size="0.8rem">{t('profile.profilePage.guadagni')}</Muted>
            {wallet.data && <Gain value={wallet.data.totalGain} size={18} />}
          </Card>
          <Card style={{ flex: '1 1 160px' }}>
            <Muted $size="0.8rem">{t('profile.profilePage.rendimento')}</Muted>
            <strong style={{ fontSize: 18 }}>{wallet.data ? formatPct(wallet.data.returnPct) : '—'}</strong>
          </Card>
          <Card style={{ flex: '1 1 160px' }}>
            <Muted $size="0.8rem">{t('profile.profilePage.titoliPosseduti')}</Muted>
            <strong style={{ fontSize: 18 }}>
              {[features?.movies && t('profile.profilePage.contaFilm', { count: movies }), features?.tvSeries && t('profile.profilePage.contaSerie', { count: series })].filter(Boolean).join(' · ') || '—'}
            </strong>
          </Card>
        </Stack>
        )}

        <Stack $row $gap={14} $wrap>
          <Link to="/app/coppe" style={{ flex: '1 1 200px' }}>
            <Card $padding="16px"><Stack $row $gap={10} $align="center"><Award size={18} /> <strong>{t('profile.profilePage.coppeEHallOfFame')}</strong></Stack></Card>
          </Link>
          <Link to="/app/premi" style={{ flex: '1 1 200px' }}>
            <Card $padding="16px"><Stack $row $gap={10} $align="center"><Gift size={18} /> <strong>{t('profile.profilePage.premiVinti')}</strong></Stack></Card>
          </Link>
        </Stack>

        <Card>
          <h3 style={{ marginBottom: 14 }}>{t('profile.profilePage.datiPersonali')}</h3>
          <form
            onSubmit={handleSubmit((v) => {
              setSaved(false);
              update.mutate(v, { onSuccess: () => setSaved(true) });
            })}
          >
            <Stack $gap={14}>
              <Field label={t('profile.profilePage.nomeUtente')} hint={t('profile.profilePage.nomeUtenteNonModificabile')}>
                <Input value={user.username} readOnly disabled />
              </Field>
              <Stack $row $gap={12} $wrap>
                <div style={{ flex: '1 1 200px' }}>
                  <Field label={t('profile.profilePage.nome')}><Input autoComplete="given-name" {...register('firstName')} /></Field>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <Field label={t('profile.profilePage.cognome')}><Input autoComplete="family-name" {...register('lastName')} /></Field>
                </div>
              </Stack>
              <Field label={t('profile.profilePage.bio')} error={formState.errors.bio?.message}>
                <Textarea {...register('bio')} />
              </Field>
              {update.error && <Alert $tone="error">{update.error.message}</Alert>}
              {saved && <Alert $tone="success">{t('profile.profilePage.profiloAggiornato')}</Alert>}
              <div>
                <Button type="submit" disabled={update.isPending}>{t('profile.profilePage.salva')}</Button>
              </div>
            </Stack>
          </form>
        </Card>
      </Stack>
    </>
  );
}
