import { z } from "zod";

/**
 * Typed runtime configuration. The ONLY module that reads `process.env`
 * directly (Constitution § Configuration). All other code consumes `config`.
 *
 * Required secrets are exposed as lazy getters so they only throw on first
 * use — keeping `next build` runnable without `.env.local` populated.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_URL_TEST: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  AUTH_TRUST_HOST: z
    .union([z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")])
    .transform((v) => v === "true" || v === "1")
    .optional(),
});

const parsed = schema.parse(process.env);

function required(key: keyof typeof parsed): string {
  const value = parsed[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `[config] Missing required environment variable: ${key}. ` +
        "Populate .env.local from .env.example before running the dev/prod server.",
    );
  }
  return value;
}

export const config = {
  NODE_ENV: parsed.NODE_ENV,
  AUTH_TRUST_HOST: parsed.AUTH_TRUST_HOST ?? false,
  DATABASE_URL_TEST: parsed.DATABASE_URL_TEST,
  /** Lazy — throws on access if `.env.local` is missing the value. */
  get DATABASE_URL(): string {
    return required("DATABASE_URL");
  },
  get AUTH_SECRET(): string {
    return required("AUTH_SECRET");
  },
  get AUTH_GOOGLE_ID(): string {
    return required("AUTH_GOOGLE_ID");
  },
  get AUTH_GOOGLE_SECRET(): string {
    return required("AUTH_GOOGLE_SECRET");
  },
} as const;

export type Config = typeof config;
