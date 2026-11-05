import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { Button, FieldError, Stack } from './ui';
import { t } from '../i18n';

const Message = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background: ${({ theme }) => theme.colors.overlay};
  backdrop-filter: blur(2px);
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
  box-shadow: ${({ theme }) => theme.shadow.raised};
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
          <Button $variant="ghost" $size="sm" onClick={onClose} aria-label={t('components.modal.chiudi')}>
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
        <Message>{message}</Message>
        {error && <FieldError role="alert">{error}</FieldError>}
        <Stack $row $gap={8} $justify="flex-end">
          <Button $variant="secondary" onClick={onClose} disabled={pending}>{t('components.modal.annulla')}</Button>
          <Button $variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={pending}>
            {pending ? t('components.modal.attendere') : confirmLabel}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
