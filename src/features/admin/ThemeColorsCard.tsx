import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, RotateCcw } from 'lucide-react';
import { api } from '../../api/client';
import { ConfirmModal } from '../../components/Modal';
import { Alert, Badge, Button, Card, Input, Muted, Spinner, Stack } from '../../components/ui';
import { t } from '../../i18n';
import { DEFAULT_COLORS, type ColorKey, type ThemeColors } from '../../theme/theme';
import { cleanColors, isCssColor, mergeColors, THEME_QUERY_KEY, useCustomColors, useThemePreview, type ColorOverrides } from '../../theme/ThemeColorsProvider';

/** Gruppi e nomi leggibili di tutti i colori del tema (ognuno compare una sola volta). */
export function colorGroups(): Array<{ title: string; keys: Array<{ key: ColorKey; label: string }> }> {
  return [
    {
      title: t('admin.themeColors.g.sfondi'),
      keys: [
        { key: 'bg', label: t('admin.themeColors.c.bg') },
        { key: 'bgElevated', label: t('admin.themeColors.c.bgElevated') },
        { key: 'surface', label: t('admin.themeColors.c.surface') },
        { key: 'surfaceAlt', label: t('admin.themeColors.c.surfaceAlt') },
        { key: 'surfaceHover', label: t('admin.themeColors.c.surfaceHover') },
        { key: 'border', label: t('admin.themeColors.c.border') },
        { key: 'borderStrong', label: t('admin.themeColors.c.borderStrong') },
        { key: 'shadow', label: t('admin.themeColors.c.shadow') },
        { key: 'shadowStrong', label: t('admin.themeColors.c.shadowStrong') },
        { key: 'overlay', label: t('admin.themeColors.c.overlay') },
        { key: 'posterStripe', label: t('admin.themeColors.c.posterStripe') },
      ],
    },
    {
      title: t('admin.themeColors.g.testi'),
      keys: [
        { key: 'text', label: t('admin.themeColors.c.text') },
        { key: 'textSecondary', label: t('admin.themeColors.c.textSecondary') },
        { key: 'textMuted', label: t('admin.themeColors.c.textMuted') },
      ],
    },
    {
      title: t('admin.themeColors.g.marchio'),
      keys: [
        { key: 'brand', label: t('admin.themeColors.c.brand') },
        { key: 'brandAccent', label: t('admin.themeColors.c.brandAccent') },
        { key: 'brandDark', label: t('admin.themeColors.c.brandDark') },
        { key: 'brandDarker', label: t('admin.themeColors.c.brandDarker') },
        { key: 'onBrand', label: t('admin.themeColors.c.onBrand') },
        { key: 'onBrandMuted', label: t('admin.themeColors.c.onBrandMuted') },
        { key: 'brandShadow', label: t('admin.themeColors.c.brandShadow') },
        { key: 'tabIndicator', label: t('admin.themeColors.c.tabIndicator') },
      ],
    },
    {
      title: t('admin.themeColors.g.pulsanti'),
      keys: [
        { key: 'primary', label: t('admin.themeColors.c.primary') },
        { key: 'primaryHover', label: t('admin.themeColors.c.primaryHover') },
        { key: 'onPrimary', label: t('admin.themeColors.c.onPrimary') },
        { key: 'primarySoft', label: t('admin.themeColors.c.primarySoft') },
        { key: 'primaryText', label: t('admin.themeColors.c.primaryText') },
        { key: 'action', label: t('admin.themeColors.c.action') },
        { key: 'actionHover', label: t('admin.themeColors.c.actionHover') },
        { key: 'onAction', label: t('admin.themeColors.c.onAction') },
        { key: 'actionGlow', label: t('admin.themeColors.c.actionGlow') },
      ],
    },
    {
      title: t('admin.themeColors.g.stati'),
      keys: [
        { key: 'success', label: t('admin.themeColors.c.success') },
        { key: 'successSoft', label: t('admin.themeColors.c.successSoft') },
        { key: 'successBorder', label: t('admin.themeColors.c.successBorder') },
        { key: 'successText', label: t('admin.themeColors.c.successText') },
        { key: 'redeemed', label: t('admin.themeColors.c.redeemed') },
        { key: 'onStatus', label: t('admin.themeColors.c.onStatus') },
        { key: 'danger', label: t('admin.themeColors.c.danger') },
        { key: 'dangerSoft', label: t('admin.themeColors.c.dangerSoft') },
        { key: 'dangerSoftHover', label: t('admin.themeColors.c.dangerSoftHover') },
        { key: 'dangerBorder', label: t('admin.themeColors.c.dangerBorder') },
        { key: 'dangerText', label: t('admin.themeColors.c.dangerText') },
      ],
    },
    {
      title: t('admin.themeColors.g.avvisi'),
      keys: [
        { key: 'warning', label: t('admin.themeColors.c.warning') },
        { key: 'warningStripe', label: t('admin.themeColors.c.warningStripe') },
        { key: 'warningSoft', label: t('admin.themeColors.c.warningSoft') },
        { key: 'warningBorder', label: t('admin.themeColors.c.warningBorder') },
        { key: 'infoSoft', label: t('admin.themeColors.c.infoSoft') },
        { key: 'infoBorder', label: t('admin.themeColors.c.infoBorder') },
      ],
    },
    {
      title: t('admin.themeColors.g.moneta'),
      keys: [
        { key: 'coinLight', label: t('admin.themeColors.c.coinLight') },
        { key: 'coin', label: t('admin.themeColors.c.coin') },
        { key: 'coinDark', label: t('admin.themeColors.c.coinDark') },
        { key: 'coinDeep', label: t('admin.themeColors.c.coinDeep') },
        { key: 'chart1', label: t('admin.themeColors.c.chart1') },
        { key: 'chart2', label: t('admin.themeColors.c.chart2') },
      ],
    },
  ];
}

const Group = styled.fieldset`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 12px 14px 14px;
  margin: 0;
  legend { font-weight: 700; padding: 0 6px; }
`;

const Rows = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px 18px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 10px;
  align-items: center;
  label { font-size: 0.85rem; font-weight: 600; display: block; }
`;

/** Riquadro del colore: scacchiera sotto, così si vedono anche i colori trasparenti. */
const Swatch = styled.label<{ $color: string }>`
  position: relative;
  width: 44px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background:
    linear-gradient(${({ $color }) => $color}, ${({ $color }) => $color}),
    repeating-conic-gradient(${({ theme }) => theme.colors.border} 0 25%, ${({ theme }) => theme.colors.surface} 0 50%) 0 0 / 12px 12px;
  cursor: pointer;
  overflow: hidden;
  input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
`;

const ColorInput = styled(Input)`
  padding: 5px 8px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.82rem;
`;

const isHex6 = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

/** Solo i colori diversi dal default: è quello che si salva. */
function diffFromDefault(colors: ThemeColors): ColorOverrides {
  const out: ColorOverrides = {};
  for (const k of Object.keys(DEFAULT_COLORS) as ColorKey[]) {
    if (colors[k].trim().toLowerCase() !== DEFAULT_COLORS[k].toLowerCase()) out[k] = colors[k].trim();
  }
  return out;
}

/** Superadmin: tutti i colori del sito, con anteprima immediata, salvataggio e ripristino dei default. */
export function ThemeColorsCard() {
  const qc = useQueryClient();
  const custom = useCustomColors();
  const setPreview = useThemePreview((s) => s.setPreview);
  const saved = useMemo(() => mergeColors(custom.data ?? {}), [custom.data]);
  const [draft, setDraft] = useState<ThemeColors>(saved);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Allinea la bozza ai colori salvati quando arrivano dal server.
  useEffect(() => setDraft(saved), [saved]);

  const invalid = (Object.keys(draft) as ColorKey[]).filter((k) => !isCssColor(draft[k]));
  const changed = (Object.keys(draft) as ColorKey[]).some((k) => draft[k].trim() !== saved[k]);

  // Anteprima: i colori validi in modifica si vedono subito su tutto il sito (solo per chi modifica).
  useEffect(() => {
    if (!changed) return setPreview(null);
    setPreview(cleanColors(draft));
  }, [draft, changed, setPreview]);
  useEffect(() => () => setPreview(null), [setPreview]);

  const done = (colors: Record<string, unknown>, message: string) => {
    qc.setQueryData(THEME_QUERY_KEY, cleanColors(colors));
    setPreview(null);
    setNotice(message);
  };
  const save = useMutation({
    mutationFn: () => api<{ colors: Record<string, string> }>('/admin/settings/theme', { method: 'PUT', body: { colors: diffFromDefault(draft) } }),
    onSuccess: (r) => done(r.colors, t('admin.themeColors.salvati')),
  });
  const reset = useMutation({
    mutationFn: () => api<{ colors: Record<string, string> }>('/admin/settings/theme', { method: 'DELETE' }),
    onSuccess: (r) => {
      done(r.colors, t('admin.themeColors.ripristinati'));
      setConfirmReset(false);
    },
  });

  const set = (k: ColorKey, v: string) => {
    setNotice(null);
    setDraft((d) => ({ ...d, [k]: v }));
  };
  const customCount = Object.keys(custom.data ?? {}).length;

  return (
    <Card data-testid="theme-colors">
      <Stack $row $gap={10} $align="center" style={{ marginBottom: 6 }}>
        <Palette size={24} aria-hidden />
        <h2>{t('admin.themeColors.titolo')}</h2>
        <Badge $tone={customCount ? 'blue' : 'neutral'}>{customCount ? t('admin.themeColors.inUso', { n: customCount }) : t('admin.themeColors.tuttiDefault')}</Badge>
      </Stack>
      <Muted $size="0.88rem" style={{ marginBottom: 14 }}>{t('admin.themeColors.spiegazione')}</Muted>

      {custom.isLoading ? <Spinner /> : (
        <Stack $gap={14}>
          {colorGroups().map((g) => (
            <Group key={g.title}>
              <legend>{g.title}</legend>
              <Rows>
                {g.keys.map(({ key, label }) => {
                  const value = draft[key];
                  const ok = isCssColor(value);
                  const isCustom = value.trim().toLowerCase() !== DEFAULT_COLORS[key].toLowerCase();
                  return (
                    <Row key={key}>
                      <Swatch $color={ok ? value : 'transparent'} title={t('admin.themeColors.selettore', { label })}>
                        <input
                          type="color"
                          aria-label={t('admin.themeColors.selettore', { label })}
                          value={isHex6(value) ? value : '#000000'}
                          onChange={(e) => set(key, e.target.value.toUpperCase())}
                        />
                      </Swatch>
                      <div style={{ minWidth: 0 }}>
                        <label htmlFor={`color-${key}`}>
                          {label} {isCustom && <Badge $tone="blue">{t('admin.themeColors.personalizzato')}</Badge>}
                        </label>
                        <ColorInput
                          id={`color-${key}`}
                          data-testid={`color-${key}`}
                          value={value}
                          aria-invalid={!ok}
                          onChange={(e) => set(key, e.target.value)}
                        />
                        <Muted $size="0.74rem">{ok ? (isCustom ? t('admin.themeColors.predefinito', { value: DEFAULT_COLORS[key] }) : null) : t('admin.themeColors.coloreNonValido')}</Muted>
                      </div>
                      <Button
                        $variant="ghost"
                        $size="sm"
                        disabled={!isCustom}
                        aria-label={t('admin.themeColors.ripristinaQuesto', { label })}
                        title={t('admin.themeColors.ripristinaQuesto', { label })}
                        onClick={() => set(key, DEFAULT_COLORS[key])}
                      >
                        <RotateCcw size={15} aria-hidden />
                      </Button>
                    </Row>
                  );
                })}
              </Rows>
            </Group>
          ))}

          {changed && <Alert $tone="info">{t('admin.themeColors.modificheNonSalvate')}</Alert>}
          {(save.error || reset.error) && <Alert $tone="error">{(save.error ?? reset.error)!.message}</Alert>}
          {notice && !changed && <Alert $tone="success">{notice}</Alert>}

          <Stack $row $gap={10} $wrap>
            <Button data-testid="theme-save" disabled={!changed || invalid.length > 0 || save.isPending} onClick={() => save.mutate()}>
              {t('admin.themeColors.salva')}
            </Button>
            <Button $variant="secondary" disabled={!changed} onClick={() => { setNotice(null); setDraft(saved); }}>
              {t('admin.themeColors.annulla')}
            </Button>
            <Button data-testid="theme-reset" $variant="danger" disabled={customCount === 0 && !changed} onClick={() => { reset.reset(); setConfirmReset(true); }}>
              <RotateCcw size={16} aria-hidden /> {t('admin.themeColors.ripristina')}
            </Button>
          </Stack>
        </Stack>
      )}

      {confirmReset && (
        <ConfirmModal
          title={t('admin.themeColors.ripristinaTitolo')}
          message={t('admin.themeColors.ripristinaMessaggio')}
          confirmLabel={t('admin.themeColors.ripristina')}
          danger
          pending={reset.isPending}
          error={reset.error?.message}
          onClose={() => setConfirmReset(false)}
          onConfirm={() => reset.mutate()}
        />
      )}
    </Card>
  );
}
