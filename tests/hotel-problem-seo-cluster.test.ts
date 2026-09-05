import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), "utf8")

function getObjectBlock(source: string, exportName: string) {
  const start = source.indexOf(`export const ${exportName}`)
  expect(start).toBeGreaterThanOrEqual(0)
  const bodyStart = source.indexOf("{", start)
  expect(bodyStart).toBeGreaterThanOrEqual(0)
  const end = source.indexOf("\n}", bodyStart)
  expect(end).toBeGreaterThan(bodyStart)
  return source.slice(bodyStart + 1, end)
}

function parseStringMap(source: string, exportName: string) {
  const block = getObjectBlock(source, exportName)
  const result = new Map<string, string>()
  const re = /^  (?:(?:"([^"]+)")|([A-Za-z0-9_-]+)): "([^"]+)",$/gm
  for (const match of block.matchAll(re)) result.set(match[1] ?? match[2], match[3])
  return result
}

function parseTopLevelObjectKeys(source: string, exportName: string) {
  const block = getObjectBlock(source, exportName)
  return [...block.matchAll(/^  (?:(?:"([^"]+)")|([A-Za-z0-9_-]+)): \{$/gm)].map(
    (match) => match[1] ?? match[2],
  )
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  const slice = value.slice(0, maxLength - 1)
  const lastSpace = slice.lastIndexOf(" ")
  return `${slice.slice(0, Math.max(lastSpace, maxLength - 18)).trimEnd()}…`
}

describe("hotel problem SEO cluster", () => {
  const problemsSource = read("lib/problem-solutions.ts")
  const seoSource = read("lib/problem-seo.ts")
  const contentSource = read("lib/problem-seo-content.ts")
  const pageSource = read("app/problemi-hotel/[slug]/page.tsx")
  const sitemapSource = read("app/sitemap.ts")
  const redirectsSource = read("next.config.mjs")

  const problemsBlock = problemsSource.slice(problemsSource.indexOf("export const PROBLEMS"))
  const problemIds = [...problemsBlock.matchAll(/^    id: "([^"]+)",$/gm)].map((match) => match[1])
  const slugs = parseStringMap(seoSource, "PROBLEM_SLUGS")
  const titles = parseStringMap(seoSource, "PROBLEM_SEO_TITLES")
  const contentIds = parseTopLevelObjectKeys(contentSource, "PROBLEM_SEO_CONTENT")

  it("has one unique slug, title and editorial block for every problem", () => {
    expect(problemIds).toHaveLength(54)
    expect(new Set(problemIds).size).toBe(problemIds.length)
    expect([...slugs.keys()].sort()).toEqual([...problemIds].sort())
    expect([...titles.keys()].sort()).toEqual([...problemIds].sort())
    expect([...contentIds].sort()).toEqual([...problemIds].sort())
    expect(new Set(slugs.values()).size).toBe(problemIds.length)
    expect(new Set(titles.values()).size).toBe(problemIds.length)
  })

  it("keeps SEO titles within a practical SERP length", () => {
    for (const [id, title] of titles) {
      expect(`${title} | 4BID.IT`.length, id).toBeLessThanOrEqual(65)
    }
  })

  it("uses genuinely distinct main editorial copy and meta descriptions", () => {
    const intros = [...contentSource.matchAll(/^    intro: "([^"]+)",$/gm)].map((match) => match[1])
    const impacts = [...contentSource.matchAll(/^    impact: "([^"]+)",$/gm)].map((match) => match[1])
    const descriptions = intros.map((intro) => truncateAtWord(intro, 158))

    expect(intros).toHaveLength(54)
    expect(impacts).toHaveLength(54)
    expect(new Set(intros).size).toBe(54)
    expect(new Set(impacts).size).toBe(54)
    expect(new Set(descriptions).size).toBe(54)
    expect(descriptions.every((value) => value.length <= 158)).toBe(true)
    expect(intros.every((value) => value.length >= 100)).toBe(true)
    expect(impacts.every((value) => value.length >= 100)).toBe(true)
    expect((contentSource.match(/^    checks: \[$/gm) ?? [])).toHaveLength(54)
    expect((contentSource.match(/^    approach: \[$/gm) ?? [])).toHaveLength(54)
  })

  it("renders per-problem content and no longer repeats the old generic FAQ", () => {
    expect(pageSource).toContain("getProblemSeoContent")
    expect(pageSource).toContain("content.intro")
    expect(pageSource).toContain("content.impact")
    expect(pageSource).toContain("content.checks")
    expect(pageSource).toContain("content.approach")
    expect(pageSource).not.toContain("CATEGORY_PLAYBOOKS")
    expect(pageSource).not.toContain("Devo cambiare tutti i software che uso gia")
  })

  it("keeps sitemap URLs generated from the same canonical slug source", () => {
    expect(sitemapSource).toContain("getProblemSlug")
    expect(sitemapSource).toContain("PROBLEMS.map")
  })

  it("separates diagnostic problem URLs from established transactional landings", () => {
    const expectedRedirects: Array<[string, string]> = [
      ["/problemi-hotel/kpi-hotel-revpar-adr-occupazione", "/problemi-hotel/non-capisco-kpi-hotel-revpar-adr"],
      ["/problemi-hotel/forecast-occupazione-domanda-hotel", "/problemi-hotel/prevedere-occupazione-domanda-hotel"],
      ["/problemi-hotel/ridurre-commissioni-booking-expedia-ota", "/problemi-hotel/dipendenza-booking-expedia-commissioni-hotel"],
      ["/problemi-hotel/aumentare-prenotazioni-dirette-hotel", "/problemi-hotel/perche-poche-prenotazioni-dirette-hotel"],
      ["/problemi-hotel/mix-canali-distribuzione-hotel", "/problemi-hotel/quali-canali-vendita-rendono-hotel"],
      ["/problemi-hotel/budget-hotel-forecast-economico", "/problemi-hotel/budget-hotel-poco-affidabile-scostamenti"],
      ["/problemi-hotel/gestione-multi-struttura-hotel", "/problemi-hotel/dati-processi-piu-strutture-hotel"],
      ["/problemi-hotel/software-su-misura-hotel", "/problemi-hotel/software-hotel-non-adatto-al-processo"],
    ]

    for (const [oldPath, newPath] of expectedRedirects) {
      expect(redirectsSource).toContain(`source: '${oldPath}'`)
      expect(redirectsSource).toContain(`destination: '${newPath}'`)
      expect([...slugs.values()]).toContain(newPath.replace("/problemi-hotel/", ""))
    }
  })
})
