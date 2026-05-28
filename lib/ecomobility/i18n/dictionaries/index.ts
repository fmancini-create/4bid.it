import type { Locale } from "../config"
import { it, type Dictionary } from "./it"
import { en } from "./en"
import { de } from "./de"
import { fr } from "./fr"
import { es } from "./es"

export const dictionaries: Record<Locale, Dictionary> = { it, en, de, fr, es }

export type { Dictionary }
