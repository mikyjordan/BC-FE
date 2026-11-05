import styled from 'styled-components';
import { Check, X } from 'lucide-react';
import type { AdminContent } from '../api/types';
import { t } from '../i18n';

const Pill = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 11px 3px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
  color: #ffffff;
  background: ${({ $active, theme }) => ($active ? theme.colors.success : theme.colors.danger)};
`;

const Wrap = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const Reason = styled.span`
  font-size: 0.76rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * Stato di acquistabilità: ovale verde "Acquisti attivi" se il titolo si può comprare,
 * rosso "Acquisti non attivi" altrimenti (con il motivo, se noto). Icona + testo: lo stato
 * non è affidato al solo colore.
 */
export function PurchaseBadge({ active, reason, showReason = true }: { active: boolean; reason?: string | null; showReason?: boolean }) {
  return (
    <Wrap data-testid="purchase-badge" data-active={active}>
      <Pill $active={active}>
        {active ? <Check size={13} aria-hidden strokeWidth={3} /> : <X size={13} aria-hidden strokeWidth={3} />}
        {active ? t('components.purchaseBadge.acquistiAttivi') : t('components.purchaseBadge.acquistiNonAttivi')}
      </Pill>
      {!active && showReason && reason && <Reason>{reason}</Reason>}
    </Wrap>
  );
}

/**
 * Acquistabilità reale di un titolo nell'area admin (stesse regole del backend):
 * pubblicato, acquisti abilitati, prezzo, finestra valida e, per i film, non uscito dalle sale.
 */
export function adminPurchaseState(c: AdminContent, now = Date.now()): { active: boolean; reason: string | null } {
  if (c.publicationStatus !== 'PUBLISHED') return { active: false, reason: t('components.purchaseBadge.titoloNonPubblicato') };
  if (c.availableFrom && new Date(c.availableFrom).getTime() > now) return { active: false, reason: t('components.purchaseBadge.nonAncoraDisponibile') };
  if (!c.purchasesEnabled) return { active: false, reason: t('components.purchaseBadge.acquistiDisattivati') };
  if (!c.priceBc) return { active: false, reason: t('components.purchaseBadge.prezzoNonImpostato') };
  if (c.purchaseOpensAt && new Date(c.purchaseOpensAt).getTime() > now) return { active: false, reason: t('components.purchaseBadge.acquistiNonAncoraAperti') };
  if (c.purchaseClosesAt && new Date(c.purchaseClosesAt).getTime() <= now) return { active: false, reason: t('components.purchaseBadge.acquistiChiusi') };
  if (c.autoRedeemAt && new Date(c.autoRedeemAt).getTime() <= now) return { active: false, reason: t('components.purchaseBadge.uscitoDalleSale') };
  return { active: true, reason: null };
}
