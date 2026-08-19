/**
 * PAGINA TEMPORANEA DI VERIFICA — da eliminare a fine controllo.
 *
 * Serve solo a montare il componente VERO della dashboard social senza passare
 * dall'accesso amministratore (di cui non ho le credenziali), per guardare con
 * gli occhi il modulo video. Monta il componente reale, non una copia: una
 * verifica su un duplicato non proverebbe nulla del codice che verra' spedito.
 */
import SocialMediaDashboard from "../admin/social-media/social-media-dashboard"

export default function SondaVideoTemp() {
  return (
    <SocialMediaDashboard
      initialAccounts={[
        {
          id: "sonda-ig",
          platform: "instagram",
          account_name: "4bid.it (sonda)",
          account_id: "1",
          is_active: true,
          followers_count: 0,
          created_at: new Date().toISOString(),
        } as never,
        {
          id: "sonda-fb",
          platform: "facebook",
          account_name: "4BID (sonda)",
          account_id: "2",
          is_active: true,
          followers_count: 0,
          created_at: new Date().toISOString(),
        } as never,
      ]}
      initialPosts={[]}
      initialSettings={null}
      userEmail="sonda@4bid.it"
    />
  )
}
