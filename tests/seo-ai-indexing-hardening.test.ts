import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), "utf8")

describe("SEO and AI indexing hardening", () => {
  it("does not invent lastModified dates for static sitemap URLs", () => {
    const source = read("app/sitemap.ts")

    expect(source).not.toContain("const lastModified = new Date()")
    expect(source).toContain("lastModified: new Date(post.dateModified)")
  })

  it("explicitly allows the OpenAI search crawler", () => {
    const source = read("app/robots.ts")

    expect(source).toContain('"OAI-SearchBot"')
    expect(source).toContain('"GPTBot"')
    expect(source).toContain('allow: ["/", "/llms.txt"]')
  })

  it("does not publish a fake free offer for software without a real price", () => {
    const source = read("components/seo-structured-data.tsx")

    expect(source).not.toContain('price: price || "0"')
    expect(source).toContain("if (price) {")
  })

  it("keeps authoritative entity and knowledge hubs discoverable for AI systems", () => {
    const llms = read("public/llms.txt")

    expect(llms).toContain("https://www.4bid.it/chi-siamo")
    expect(llms).toContain("https://www.4bid.it/metodo-4bid")
    expect(llms).toContain("https://www.4bid.it/filippo-mancini")
    expect(llms).toContain("https://www.4bid.it/knowledge-base")
    expect(llms).toContain("https://www.4bid.it/glossario")
  })

  it("includes the public careers page in the XML sitemap source", () => {
    const source = read("app/sitemap.ts")

    expect(source).toContain("`${baseUrl}/lavora-con-noi`")
  })
})
