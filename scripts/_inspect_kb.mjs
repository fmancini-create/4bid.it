import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const { data: all } = await supabase
  .from("knowledge_base")
  .select("id, title, category, source, source_url, priority, is_active, content")
  .order("category")
  .order("priority", { ascending: false })

const byCat = all.reduce((acc, r) => {
  const k = r.category || "(null)"
  acc[k] = (acc[k] || 0) + 1
  return acc
}, {})
console.log("=== All records by category ===")
console.table(byCat)

console.log("\n=== Sample records (first per category) ===")
const seen = new Set()
for (const r of all) {
  if (seen.has(r.category)) continue
  seen.add(r.category)
  console.log(`\n[${r.category}] ${r.title}`)
  console.log(`  source=${r.source} url=${r.source_url} priority=${r.priority} active=${r.is_active}`)
  console.log(`  content_preview="${(r.content || "").slice(0, 200).replace(/\s+/g, " ")}..."`)
}

console.log("\n=== Records mentioning Santaddeo / Manubot / Hotelprofit ===")
const products = all.filter((r) =>
  /santaddeo|manubot|hotelprofit|hotel.accelerator|ecomobility|autoexel|petsense|risparmio/i.test(
    (r.title || "") + " " + (r.content || ""),
  ),
)
console.table(
  products.map((r) => ({
    id: r.id,
    title: (r.title || "").slice(0, 60),
    cat: r.category,
    src: r.source,
    url: (r.source_url || "").slice(0, 50),
    pri: r.priority,
    active: r.is_active,
  })),
)

console.log(`\nTotal: ${all.length} records, ${products.length} product-related`)
