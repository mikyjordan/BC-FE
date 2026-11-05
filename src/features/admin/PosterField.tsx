import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { Poster } from '../../components/Poster';
import { Button, FieldError, Input, Muted, Stack } from '../../components/ui';

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
    if (!TYPES.includes(file.type)) return setError('Formati ammessi: PNG, JPEG, WEBP');
    if (file.size > MAX_BYTES) return setError('Dimensione massima 5 MB');
    setUploading(true);
    try {
      const res = await api<{ url: string }>('/admin/uploads/poster', { method: 'POST', rawBody: file, contentType: file.type });
      onChange(res.url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Caricamento non riuscito');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Stack $row $gap={14} $align="flex-start" $wrap>
      <div style={{ width: 96, flexShrink: 0 }}>
        <Poster src={value || null} alt="Anteprima locandina" kind={kind} />
      </div>
      <Stack $gap={8} style={{ flex: '1 1 240px' }}>
        <Input id={id} value={value} disabled={disabled} placeholder="https://… oppure carica un file" onChange={(e) => onChange(e.target.value)} />
        <input ref={fileRef} type="file" accept={TYPES.join(',')} hidden onChange={(e) => upload(e.target.files?.[0])} data-testid="poster-file" />
        <Stack $row $gap={8} $wrap>
          <Button type="button" $size="sm" $variant="secondary" disabled={disabled || uploading} onClick={() => fileRef.current?.click()}>
            <ImagePlus size={15} /> {uploading ? 'Caricamento…' : 'Carica dal computer'}
          </Button>
          {value && (
            <Button type="button" $size="sm" $variant="ghost" disabled={disabled || uploading} onClick={() => onChange('')}>
              <Trash2 size={14} /> Rimuovi
            </Button>
          )}
        </Stack>
        {value.startsWith('/uploads/') && <Muted $size="0.75rem">Immagine caricata sul server. Ricorda di salvare le modifiche.</Muted>}
        {error && <FieldError role="alert">{error}</FieldError>}
      </Stack>
    </Stack>
  );
}
