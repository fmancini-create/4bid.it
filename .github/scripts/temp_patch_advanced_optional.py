from pathlib import Path

path = Path("app/admin/quotes/edit/[id]/quote-catalog-editor.tsx")
text = path.read_text()

anchor = '      const accent = quoteBrandAccent(item.project)\n'
addition = '''      const earlierPlatformExists = lines.slice(0, index).some(candidate =>\n        candidate.project !== item.project && ["hotelaccelerator", "santaddeo", "hotelprofitai", "manubot"].includes(String(candidate.project || "")),\n      )\n      const canBeOptional = item.kind !== "plan" || earlierPlatformExists\n'''
if addition not in text:
    if anchor not in text:
        raise SystemExit("map anchor not found")
    text = text.replace(anchor, anchor + addition, 1)

old = '''        <div className="flex items-center gap-2"><Switch checked={!!item.optional} disabled={item.kind === "plan"} onCheckedChange={v => patchLine(index, { optional: v, default_selected: v ? item.default_selected !== false : true })} /><Label>Opzionale per il cliente</Label></div>'''
new = '''        <div className="flex items-center gap-2"><Switch checked={!!item.optional} disabled={!canBeOptional} onCheckedChange={v => patchLine(index, { optional: v, default_selected: v ? item.default_selected !== false : true })} /><Label>{item.kind === "plan" ? "Piattaforma opzionale" : "Opzionale per il cliente"}</Label></div>'''
if new not in text:
    if old not in text:
        raise SystemExit("optional switch block not found")
    text = text.replace(old, new, 1)

path.write_text(text)
