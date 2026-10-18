/**
 * SENTINEL GESTION - Utilitaires de Devise et Monnaie
 * Conforme au cadre monétaire officiel : République du Congo (Brazzaville)
 * Devise officielle : FCFA CEMAC (Code ISO : XAF)
 * Parité fixe : 1 EUR = 655.957 FCFA (pour la migration et compatibilité)
 */

export const DEFAULT_CURRENCY = 'XAF';
export const EUR_TO_XAF_RATE = 655.957;

/**
 * Formate un montant numérique selon les conventions monétaires congolaises / CEMAC.
 * Exemple : formatCurrency(150000) => "150 000 FCFA"
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'XAF',
  showSymbol: boolean = true
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `0 FCFA` : `0`;
  }

  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('fr-CG', {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(rounded);

  if (!showSymbol) return formatted;

  if (currency === 'XAF' || currency === 'FCFA') {
    return `${formatted} FCFA`;
  }

  if (currency === 'EUR') {
    return `${formatted} €`;
  }

  if (currency === 'USD') {
    return `${formatted} $`;
  }

  return `${formatted} ${currency}`;
}

/**
 * Raccourci pour formater directement en Francs CFA
 */
export function formatXAF(amount: number | null | undefined): string {
  return formatCurrency(amount, 'XAF', true);
}

/**
 * Convertit un montant legacy exprimé en Euros vers les Francs CFA
 */
export function convertEurToXaf(eurAmount: number): number {
  return Math.round(eurAmount * EUR_TO_XAF_RATE);
}

/**
 * Grille des offres officielles SENTINEL GESTION en FCFA (XAF)
 * Adaptée au marché d'Afrique Centrale et Congo-Brazzaville
 */
export const SENTINEL_PLANS_XAF = {
  discovery: {
    code: 'discovery',
    name: 'Découverte',
    priceMonthlyXaf: 0,
    priceYearlyXaf: 0,
    description: 'Pour indépendants et démarrage rapide',
    maxProjects: 3,
    maxMembers: 3,
    storageMb: 500,
  },
  pro: {
    code: 'pro',
    name: 'Professionnel (PME)',
    priceMonthlyXaf: 15000, // ~23 EUR / mois
    priceYearlyXaf: 150000, // 2 mois offerts
    description: 'Pour PME, agences et équipes agiles',
    maxProjects: 15,
    maxMembers: 12,
    storageMb: 5000,
  },
  team: {
    code: 'team',
    name: 'Entreprise & Institution',
    priceMonthlyXaf: 45000, // ~68 EUR / mois
    priceYearlyXaf: 450000,
    description: 'Pour grandes organisations, ministères et projets complexes',
    maxProjects: 100,
    maxMembers: 50,
    storageMb: 25000,
  },
} as const;
