import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/types";
import { en } from "@/lib/i18n/dictionaries/en";
import { es } from "@/lib/i18n/dictionaries/es";
import { de } from "@/lib/i18n/dictionaries/de";
import { fr } from "@/lib/i18n/dictionaries/fr";

export const DICTIONARIES: Record<Locale, Dictionary> = { en, es, de, fr };
