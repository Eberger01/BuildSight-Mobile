/**
 * Country configuration for regional estimation
 * Contains metadata for accurate cost estimates in different markets
 */

export type CountryCode = 'DE' | 'FR' | 'ES' | 'IT' | 'NL' | 'BE' | 'AT' | 'UK' | 'US' | 'BR';

export type CurrencyCode = 'EUR' | 'GBP' | 'USD' | 'BRL';

export type UnitSystem = 'metric' | 'imperial';

export interface CountryConfig {
  name: string;
  flag: string;
  currency: CurrencyCode;
  units: UnitSystem;
  laborRateRange: string;
  vatRate: string;
  permitInfo: string;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  DE: {
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '45-85 EUR/hr',
    vatRate: '19%',
    permitInfo: 'Building permits required for structural work (Baugenehmigung)',
  },
  FR: {
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '40-75 EUR/hr',
    vatRate: '20% (10% for renovation)',
    permitInfo: 'Permis de construire required for major works',
  },
  ES: {
    name: 'Spain',
    flag: '🇪🇸',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '25-50 EUR/hr',
    vatRate: '21% (10% for renovation)',
    permitInfo: 'Licencia de obras required',
  },
  IT: {
    name: 'Italy',
    flag: '🇮🇹',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '30-60 EUR/hr',
    vatRate: '22% (10% for renovation)',
    permitInfo: 'Permesso di costruire or SCIA depending on work type',
  },
  NL: {
    name: 'Netherlands',
    flag: '🇳🇱',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '50-90 EUR/hr',
    vatRate: '21%',
    permitInfo: 'Omgevingsvergunning required for major construction',
  },
  BE: {
    name: 'Belgium',
    flag: '🇧🇪',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '45-80 EUR/hr',
    vatRate: '21% (6% for renovation >10yr)',
    permitInfo: 'Stedenbouwkundige vergunning required',
  },
  AT: {
    name: 'Austria',
    flag: '🇦🇹',
    currency: 'EUR',
    units: 'metric',
    laborRateRange: '50-90 EUR/hr',
    vatRate: '20%',
    permitInfo: 'Baubewilligung required for structural changes',
  },
  UK: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    units: 'metric',
    laborRateRange: '40-80 GBP/hr',
    vatRate: '20%',
    permitInfo: 'Planning permission and Building Regulations approval may apply',
  },
  US: {
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    units: 'imperial',
    laborRateRange: '$50-120/hr',
    vatRate: 'Sales tax varies by state (0-10%)',
    permitInfo: 'Building permits required, varies by municipality',
  },
  BR: {
    name: 'Brazil',
    flag: '🇧🇷',
    currency: 'BRL',
    units: 'metric',
    laborRateRange: 'R$30-80/hr',
    vatRate: 'ICMS/ISS varies (5-18%)',
    permitInfo: 'Alvará de construção required',
  },
};

/**
 * Get list of countries for picker UI
 */
export function getCountryList(): Array<{ code: CountryCode; name: string; flag: string }> {
  return Object.entries(COUNTRIES).map(([code, config]) => ({
    code: code as CountryCode,
    name: config.name,
    flag: config.flag,
  }));
}

/**
 * Get country config by code
 */
export function getCountryConfig(code: CountryCode): CountryConfig {
  return COUNTRIES[code];
}

/**
 * Get unit label based on unit system
 */
export function getAreaUnit(units: UnitSystem): string {
  return units === 'metric' ? 'm²' : 'sq ft';
}

/**
 * Get length unit based on unit system
 */
export function getLengthUnit(units: UnitSystem): string {
  return units === 'metric' ? 'm' : 'ft';
}
