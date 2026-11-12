import styled from 'styled-components';
import { assetUrl } from '../api/origin';
import type { Me } from '../api/types';

const Circle = styled.span<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 700;
  font-size: ${({ $size }) => Math.round($size * 0.4)}px;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

export function Avatar({ user, size = 40 }: { user: Pick<Me, 'username' | 'profile'> | null; size?: number }) {
  const name = user?.username || '?';
  return (
    <Circle $size={size}>
      {user?.profile?.avatarUrl ? <img src={assetUrl(user.profile.avatarUrl) ?? undefined} alt="" /> : name.slice(0, 1).toUpperCase()}
    </Circle>
  );
}
