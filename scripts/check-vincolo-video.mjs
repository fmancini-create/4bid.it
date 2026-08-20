const u = process.env.SUPABASE_URL
const k = process.env.SUPABASE_SERVICE_ROLE_KEY
const H = { apikey: k, Authorization: "Bearer " + k, "Content-Type": "application/json", Prefer: "return=representation" }

let male = 0

async function prova(nome, riga, atteso) {
  const r = await fetch(u + "/rest/v1/social_posts", { method: "POST", headers: H, body: JSON.stringify(riga) })
  const ok = atteso === "rifiuto" ? r.status >= 400 : r.status < 400
  if (!ok) male++
  console.log(`  ${ok ? "OK  " : "MALE"} ${nome} -> HTTP ${r.status} (atteso ${atteso})`)
  if (r.status < 400) {
    const b = await r.json()
    await fetch(u + "/rest/v1/social_posts?id=eq." + b[0].id, { method: "DELETE", headers: H })
    console.log("        riga di prova CANCELLATA")
  } else {
    const b = await r.json()
    console.log("        vincolo che ha morso:", (JSON.stringify(b).match(/social_posts_\w+/) || ["(non nominato)"])[0])
  }
}

const base = { content: "PROVA VINCOLO - da cancellare", status: "draft", platforms: ["facebook"] }

// Il caso che prima passava: e' la trappola NULL (media_kind nullo).
await prova("post_type=video, nessun file, media_kind NULLO", { ...base, post_type: "video" }, "rifiuto")
// Stesso caso con media_kind valorizzato ma diverso da youtube.
await prova("post_type=video, nessun file, media_kind=video", { ...base, post_type: "video", media_kind: "video" }, "rifiuto")
// Casi legittimi: il vincolo non deve essere troppo severo.
await prova("video CON file", { ...base, post_type: "video", media_kind: "video", video_url: "https://esempio/v.mp4" }, "accettata")
await prova("YouTube senza file (legittimo)", { ...base, post_type: "video", media_kind: "youtube" }, "accettata")
await prova("post con immagine", { ...base, post_type: "image", media_kind: "image" }, "accettata")

console.log(male === 0 ? "\n  TUTTE E 5 COME ATTESO: il vincolo morde e non e' troppo severo" : `\n  ${male} PROVE FALLITE`)
process.exit(male === 0 ? 0 : 1)
