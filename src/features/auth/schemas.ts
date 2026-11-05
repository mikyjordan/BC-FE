import { z } from 'zod';
import { t } from '../../i18n';

// Stesse regole del backend (che resta comunque l'unica validazione autorevole).
export const passwordRule = z
  .string()
  .min(10, t('auth.schemas.almeno10Caratteri'))
  .max(128, t('auth.schemas.passwordTroppoLunga'))
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), t('auth.schemas.deveContenereLettereENumeri'));

export const loginSchema = z.object({
  email: z.email(t('auth.schemas.emailNonValida')),
  password: z.string().min(1, t('auth.schemas.inserisciLaPassword')),
});

export const registerSchema = z
  .object({
    email: z.email(t('auth.schemas.emailNonValida')),
    username: z
      .string()
      .min(3, t('auth.schemas.almeno3Caratteri'))
      .max(32, t('auth.schemas.massimo32Caratteri'))
      .regex(/^[a-zA-Z0-9_.-]+$/, t('auth.schemas.soloLettereNumeriPuntoTrattino')),
    password: passwordRule,
    confirm: z.string(),
    acceptTerms: z.boolean().refine((v) => v, t('auth.schemas.deviAccettareTerminiECondizioni')),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: t('common.lePasswordNonCoincidono') });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
