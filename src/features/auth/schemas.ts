import { z } from 'zod';

// Stesse regole del backend (che resta comunque l'unica validazione autorevole).
export const passwordRule = z
  .string()
  .min(10, 'Almeno 10 caratteri')
  .max(128, 'Password troppo lunga')
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), 'Deve contenere lettere e numeri');

export const loginSchema = z.object({
  email: z.email('Email non valida'),
  password: z.string().min(1, 'Inserisci la password'),
});

export const registerSchema = z
  .object({
    email: z.email('Email non valida'),
    username: z
      .string()
      .min(3, 'Almeno 3 caratteri')
      .max(32, 'Massimo 32 caratteri')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Solo lettere, numeri, punto, trattino e underscore'),
    password: passwordRule,
    confirm: z.string(),
    acceptTerms: z.boolean().refine((v) => v, 'Devi accettare termini e condizioni'),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Le password non coincidono' });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
