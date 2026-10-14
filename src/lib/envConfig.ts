/**
 * SENTINEL GESTION — Validation des Variables d'Environnement
 * Vérifie et expose de façon sécurisée les variables d'environnement de production.
 */

export interface AppEnvConfig {
  appName: string;
  appUrl: string;
  defaultLocale: string;
  defaultTimezone: string;
  defaultCurrency: string;
  isProduction: boolean;
}

export function getAppEnvConfig(): AppEnvConfig {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'SENTINEL GESTION',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'fr-FR',
    defaultTimezone: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Europe/Paris',
    defaultCurrency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'EUR',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

export function validateEnvironment(): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === 'production') {
    warnings.push('La variable NEXT_PUBLIC_APP_URL n’est pas définie. Repli sur http://localhost:3000.');
  }

  return {
    isValid: true,
    warnings,
  };
}
