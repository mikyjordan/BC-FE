import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { Button, Stack } from './ui';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(3, 6, 14, 0.72);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const Dialog = styled.div<{ $wide?: boolean }>`
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? '960px' : '480px')};
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 22px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
`;

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <Overlay onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Dialog role="dialog" aria-modal="true" aria-label={title} $wide={wide}>
        <Stack $row $justify="space-between" $align="center" style={{ marginBottom: 16 }}>
          <h2>{title}</h2>
          <Button $variant="ghost" $size="sm" onClick={onClose} aria-label="Chiudi">
            <X size={18} />
          </Button>
        </Stack>
        {children}
      </Dialog>
    </Overlay>,
    document.body,
  );
}

/** Conferma esplicita per azioni sensibili (pubblicazione, archiviazione, rettifiche). */
export function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <Stack $gap={16}>
        <div style={{ color: '#C3CBE0' }}>{message}</div>
        {error && <div role="alert" style={{ color: '#FF9AA9' }}>{error}</div>}
        <Stack $row $gap={8} $justify="flex-end">
          <Button $variant="secondary" onClick={onClose} disabled={pending}>Annulla</Button>
          <Button $variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={pending}>
            {pending ? 'Attendere…' : confirmLabel}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
