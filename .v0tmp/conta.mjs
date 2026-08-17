import { createClient } from "@supabase/supabase-js"
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: c, error: e0 } = await db.from("dem_campaigns").select("id,name,status").ilike("name","%Ecosistema 4 BID%").single()
if (e0) throw e0
console.log("campagna:", c.name, "|", c.status, "|", c.id)
const { count, error } = await db.from("dem_recipients").select("id",{count:"exact",head:true}).eq("campaign_id", c.id)
if (error) throw error
console.log("righe dem_recipients per questa campagna:", count)
// Confronto con la campagna Air Market (54 inviati осservati in dashboard)
const { data: am } = await db.from("dem_campaigns").select("id,name").ilike("name","%Air Market Intelligence%").single()
const { count: cam } = await db.from("dem_recipients").select("id",{count:"exact",head:true}).eq("campaign_id", am.id)
console.log("Air Market:", cam, "righe")
// Chi c'è in Air Market ma NON nella nuova
const leggi = async (id) => { const out=[]; for(let d=0;;d+=1000){ const {data,error}=await db.from("dem_recipients").select("email,send_status").eq("campaign_id",id).range(d,d+999); if(error) throw error; if(!data?.length) break; out.push(...data); if(data.length<1000) break } return out }
const A = await leggi(am.id), B = await leggi(c.id)
const setB = new Set(B.map(r=>r.email.toLowerCase()))
const fuori = A.filter(r=>!setB.has(r.email.toLowerCase()))
console.log("presenti in Air Market e assenti nella nuova:", fuori.length)
for (const r of fuori) console.log("   ", r.email, "| stato in Air Market:", r.send_status)
