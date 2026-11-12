const WEAK_SECRETS = new Set([
  'default-secret-change-in-production',
  'super_long_random_string_change_in_production_min_32_chars',
  'change_this_password_in_production',
  'blueberry123',
  'admin',
  'password',
]);

export interface AppEnv {
  NODE_ENV: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_SYNCHRONIZE: boolean;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGINS: string[];
  TAX_ROOM_BASIS_POINTS: number;
  MAX_DISCOUNT_BASIS_POINTS: number;
  ALLOW_PUBLIC_REGISTER: boolean;
  COOKIE_SECURE: boolean;
  PROPERTY_TIMEZONE: string;
  PROPERTY_LEGAL_NAME: string | null;
  PROPERTY_GSTIN: string | null;
  JWT_EXPIRES_MS: number;
}

function required(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable ${key}`);
  }
  if (WEAK_SECRETS.has(value.trim())) {
    throw new Error(`${key} is a known placeholder and cannot be used`);
  }
  return value.trim();
}

function requiredInt(config: Record<string, unknown>, key: string, min: number, max: number): number {
  const raw = required(config, key);
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${key} must be an integer`);
  }
  const value = Number(raw);
  if (value < min || value > max) {
    throw new Error(`${key} must be between ${min} and ${max}`);
  }
  return value;
}

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const nodeEnv = required(config, 'NODE_ENV');
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const jwt = required(config, 'JWT_SECRET');
  if (jwt.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  const dbPassword = required(config, 'DB_PASSWORD');
  if (dbPassword.length < 12) {
    throw new Error('DB_PASSWORD must be at least 12 characters');
  }

  const origins = required(config, 'CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0 || origins.includes('*')) {
    throw new Error('CORS_ORIGINS must be an explicit comma-separated list and cannot be *');
  }

  const allowPublic = required(config, 'ALLOW_PUBLIC_REGISTER');
  if (!['true', 'false'].includes(allowPublic)) {
    throw new Error('ALLOW_PUBLIC_REGISTER must be true or false');
  }
  if (nodeEnv === 'production' && allowPublic === 'true') {
    throw new Error('ALLOW_PUBLIC_REGISTER cannot be true in production');
  }

  const synchronize = required(config, 'DB_SYNCHRONIZE');
  if (!['true', 'false'].includes(synchronize)) {
    throw new Error('DB_SYNCHRONIZE must be true or false');
  }
  if (nodeEnv === 'production' && synchronize === 'true') {
    throw new Error('DB_SYNCHRONIZE cannot be true in production');
  }

  const jwtExpiresIn = required(config, 'JWT_EXPIRES_IN');
  const jwtExpiresMs = parseDurationMs(jwtExpiresIn);
  if (nodeEnv === 'production' && jwtExpiresMs > 16 * 60 * 60 * 1000) {
    throw new Error('JWT_EXPIRES_IN cannot exceed 16h in production');
  }

  const timeZone = required(config, 'PROPERTY_TIMEZONE');
  try {
    Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  } catch {
    throw new Error('PROPERTY_TIMEZONE must be a valid IANA time zone');
  }

  const legalName = optionalText(config, 'PROPERTY_LEGAL_NAME', 200);
  const gstin = optionalGstin(config);

  return {
    NODE_ENV: nodeEnv,
    DB_HOST: required(config, 'DB_HOST'),
    DB_PORT: requiredInt(config, 'DB_PORT', 1, 65535),
    DB_USER: required(config, 'DB_USER'),
    DB_PASSWORD: dbPassword,
    DB_NAME: required(config, 'DB_NAME'),
    DB_SYNCHRONIZE: synchronize === 'true',
    JWT_SECRET: jwt,
    JWT_EXPIRES_IN: jwtExpiresIn,
    CORS_ORIGINS: origins,
    TAX_ROOM_BASIS_POINTS: requiredInt(config, 'TAX_ROOM_BASIS_POINTS', 0, 10_000),
    MAX_DISCOUNT_BASIS_POINTS: requiredInt(config, 'MAX_DISCOUNT_BASIS_POINTS', 0, 10_000),
    ALLOW_PUBLIC_REGISTER: allowPublic === 'true',
    COOKIE_SECURE: nodeEnv === 'production',
    PROPERTY_TIMEZONE: timeZone,
    PROPERTY_LEGAL_NAME: legalName,
    PROPERTY_GSTIN: gstin,
    JWT_EXPIRES_MS: jwtExpiresMs,
  };
}

function optionalText(config: Record<string, unknown>, key: string, max: number): string | null {
  const value = config[key];
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) {
    throw new Error(`${key} must be at most ${max} characters`);
  }
  return trimmed;
}

function optionalGstin(config: Record<string, unknown>): string | null {
  const value = optionalText(config, 'PROPERTY_GSTIN', 15);
  if (!value) return null;
  const gstin = value.toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    throw new Error('PROPERTY_GSTIN must be a 15 character GSTIN');
  }
  return gstin;
}

export function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    throw new Error('Duration must look like 30s, 15m, 8h, or 1d');
  }
  const amount = Number(match[1]);
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * unitMs[match[2]];
}
