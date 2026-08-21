-- Hardening del censimento gestionali.
--
-- Tutti gli accessi applicativi passano da route server protette e dal client
-- service_role. Nessuna tabella, vista o RPC del censimento deve essere
-- interrogabile direttamente dalla Data API con una chiave anon/authenticated.

ALTER TABLE public.hospitality_consumer_domains ENABLE ROW LEVEL SECURITY;

-- Le viste PostgreSQL sono security-definer per impostazione storica. Impostare
-- security_invoker evita che possano aggirare le RLS delle tabelle sorgenti.
ALTER VIEW public.hospitality_seed_candidates SET (security_invoker = true);
ALTER VIEW public.hospitality_censimento_avanzamento SET (security_invoker = true);
ALTER VIEW public.hospitality_provider_summary SET (security_invoker = true);

REVOKE ALL ON TABLE
  public.hospitality_census_state,
  public.hospitality_consumer_domains,
  public.hospitality_crawl_queue,
  public.hospitality_properties,
  public.hospitality_provider_signatures,
  public.hospitality_technology_detections,
  public.hospitality_unknown_booking_hosts,
  public.hospitality_seed_candidates,
  public.hospitality_censimento_avanzamento,
  public.hospitality_provider_summary
FROM anon, authenticated;

-- Le funzioni nuove ricevono EXECUTE da PUBLIC per impostazione predefinita.
-- Lo si revoca esplicitamente e si mantiene l'accesso del solo backend.
REVOKE EXECUTE ON FUNCTION public.censimento_aggiorna_contatori() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.censimento_per_gestionale() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.censimento_prendi_lotto(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.censimento_recupera_appese(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.censimento_registra_host_sconosciuto(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.censimento_riepilogo() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.censimento_ripulisci_host_coperti() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.censimento_semina_lotto(integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.censimento_aggiorna_contatori() TO service_role;
GRANT EXECUTE ON FUNCTION public.censimento_per_gestionale() TO service_role;
GRANT EXECUTE ON FUNCTION public.censimento_prendi_lotto(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.censimento_recupera_appese(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.censimento_registra_host_sconosciuto(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.censimento_riepilogo() TO service_role;
GRANT EXECUTE ON FUNCTION public.censimento_ripulisci_host_coperti() TO service_role;
GRANT EXECUTE ON FUNCTION public.censimento_semina_lotto(integer) TO service_role;

-- Search path fisso: impedisce che un oggetto omonimo in uno schema diverso
-- venga risolto durante l'esecuzione.
ALTER FUNCTION public.censimento_aggiorna_contatori() SET search_path = public, pg_temp;
ALTER FUNCTION public.censimento_per_gestionale() SET search_path = public, pg_temp;
ALTER FUNCTION public.censimento_prendi_lotto(integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.censimento_recupera_appese(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.censimento_registra_host_sconosciuto(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.censimento_riepilogo() SET search_path = public, pg_temp;
ALTER FUNCTION public.censimento_ripulisci_host_coperti() SET search_path = public, pg_temp;
ALTER FUNCTION public.censimento_semina_lotto(integer) SET search_path = public, pg_temp;
