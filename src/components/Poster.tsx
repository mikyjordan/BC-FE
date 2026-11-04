import styled from 'styled-components';
import { Clapperboard, Tv } from 'lucide-react';

const Frame = styled.div<{ $ratio: string }>`
  position: relative;
  aspect-ratio: ${({ $ratio }) => $ratio};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background:
    repeating-linear-gradient(90deg, transparent 0 14px, rgba(255,255,255,0.025) 14px 16px),
    linear-gradient(160deg, ${({ theme }) => theme.colors.surfaceAlt}, ${({ theme }) => theme.colors.bgElevated});
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
`;

/** Locandina con segnaposto neutro quando l'immagine non è disponibile. */
export function Poster({ src, alt, kind, ratio = '2 / 3' }: { src: string | null; alt: string; kind: 'MOVIE' | 'TV_SERIES'; ratio?: string }) {
  const Icon = kind === 'MOVIE' ? Clapperboard : Tv;
  return (
    <Frame $ratio={ratio}>
      <Icon size={30} aria-hidden />
      {src && <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
    </Frame>
  );
}
