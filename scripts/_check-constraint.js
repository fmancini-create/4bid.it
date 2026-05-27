const { createClient } = require("@supabase/supabase-js")
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
;(async () => {
  const { data, error } = await sb.rpc("exec_sql", { query: "select pg_get_constraintdef(oid) from pg_constraint where conname='ecomobility_devices_device_type_check'" }).catch(e => ({ error: e }))
  console.log("rpc result:", data, error?.message)
  // fallback: try select existing values
  const { data: existing } = await sb.from("ecomobility_devices").select("device_type").limit(20)
  console.log("existing device_type values:", existing)
})()
