import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { Poster } from '../../components/Poster';
import { Button, FieldError, Input, Muted, Stack } from '../../components/ui';
import { t } from '../../i18n';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Locandina: link esterno oppure file caricato dal computer. Il file viene inviato al server,
 * validato (formato reale e dimensione) e salvato con un nome generato; nel campo resta l'URL interno.
 */
export function PosterField({
  id,
  value,
  onChange,
  disabled,
  kind,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  kind: 'MOVIE' | 'TV_SERIES';
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError(t('admin.posterField.formatiAmmessiPngJpegWebp'));
    if (file.size > MAX_BYTES) return setError(t('admin.posterField.dimensioneMassima5Mb'));
    setUploading(true);
    try {
      const res = await api<{ url: string }>('/admin/uploads/poster', { method: 'POST', rawBody: file, contentType: file.type });
      onChange(res.url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('admin.posterField.caricamentoNonRiuscito'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Stack $row $gap={14} $align="flex-start" $wrap>
      <div style={{ width: 96, flexShrink: 0 }}>
        <Poster src={value || null} alt={t('admin.posterField.anteprimaLocandina')} kind={kind} />
      </div>
      <Stack $gap={8} style={{ flex: '1 1 240px' }}>
        <Input id={id} value={value} disabled={disabled} placeholder={t('admin.posterField.httpsOppureCaricaUnFile')} onChange={(e) => onChange(e.target.value)} />
        <input ref={fileRef} type="file" accept={TYPES.join(',')} hidden onChange={(e) => upload(e.target.files?.[0])} data-testid="poster-file" />
        <Stack $row $gap={8} $wrap>
          <Button type="button" $size="sm" $variant="secondary" disabled={disabled || uploading} onClick={() => fileRef.current?.click()}>
            <ImagePlus size={15} /> {uploading ? t('admin.posterField.caricamento') : t('admin.posterField.caricaDalComputer')}
          </Button>
          {value && (
            <Button type="button" $size="sm" $variant="ghost" disabled={disabled || uploading} onClick={() => onChange('')}>
              <Trash2 size={14} />{' '}{t('admin.posterField.rimuovi')}</Button>
          )}
        </Stack>
        {value.startsWith('/uploads/') && <Muted $size="0.75rem">{t('admin.posterField.immagineCaricataSulServerRicorda')}</Muted>}
        {error && <FieldError role="alert">{error}</FieldError>}
      </Stack>
    </Stack>
  );
}
