import { CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react"
import type { ContentBlock } from "@/lib/blog/posts"

// Parser inline minimale per **grassetto** e *corsivo*.
function renderInline(text: string, keyPrefix: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      )
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return (
        <em key={`${keyPrefix}-${i}`} className="italic">
          {token.slice(1, -1)}
        </em>
      )
    }
    return <span key={`${keyPrefix}-${i}`}>{token}</span>
  })
}

export function BlogContent({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        const key = `block-${index}`
        switch (block.type) {
          case "heading":
            return (
              <h2 key={key} className="text-2xl md:text-3xl font-bold text-foreground pt-4 text-balance">
                {block.text}
              </h2>
            )
          case "subheading":
            return (
              <h3 key={key} className="text-xl font-semibold text-foreground pt-2">
                {block.text}
              </h3>
            )
          case "paragraph":
            return (
              <p key={key} className="text-muted-foreground leading-relaxed text-pretty">
                {renderInline(block.text, key)}
              </p>
            )
          case "list":
            return block.ordered ? (
              <ol key={key} className="list-decimal pl-6 space-y-2 text-muted-foreground marker:text-primary-blue marker:font-semibold">
                {block.items.map((item, i) => (
                  <li key={`${key}-${i}`} className="leading-relaxed pl-1">
                    {renderInline(item, `${key}-${i}`)}
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={key} className="space-y-2">
                {block.items.map((item, i) => (
                  <li key={`${key}-${i}`} className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="h-5 w-5 text-primary-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{renderInline(item, `${key}-${i}`)}</span>
                  </li>
                ))}
              </ul>
            )
          case "callout": {
            const isTip = block.variant === "tip"
            const Icon = isTip ? Lightbulb : AlertTriangle
            return (
              <div
                key={key}
                className={`rounded-xl p-5 border ${
                  isTip ? "bg-primary-blue/5 border-primary-blue/20" : "bg-destructive/5 border-destructive/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isTip ? "text-primary-blue" : "text-destructive"}`}
                    aria-hidden="true"
                  />
                  <div>
                    {block.title && <h4 className="font-semibold text-foreground mb-1">{block.title}</h4>}
                    <p className="text-sm text-muted-foreground leading-relaxed">{renderInline(block.text, key)}</p>
                  </div>
                </div>
              </div>
            )
          }
          case "formula":
            return (
              <div key={key} className="rounded-lg bg-muted/50 border border-border p-4">
                {block.label && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-blue">{block.label}</span>
                )}
                <p className="font-mono text-sm md:text-base text-foreground mt-1">{block.text}</p>
              </div>
            )
          case "table":
            return (
              <div key={key} className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {block.headers.map((header, i) => (
                        <th key={`${key}-h-${i}`} className="text-left font-semibold text-foreground px-4 py-3">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={`${key}-r-${ri}`} className="border-t border-border">
                        {row.map((cell, ci) => (
                          <td
                            key={`${key}-r-${ri}-c-${ci}`}
                            className={ci === 0 ? "px-4 py-3 font-medium text-foreground" : "px-4 py-3 text-muted-foreground"}
                          >
                            {renderInline(cell, `${key}-r-${ri}-c-${ci}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
