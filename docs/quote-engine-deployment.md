# Quote Engine deployment

La preview del Quote Engine deve essere validata su Vercel prima del merge della PR dedicata.

Checklist minima:
- build Next.js verde in CI;
- preview Vercel attiva;
- Stripe in test mode;
- webhook ricevuto correttamente;
- provisioning verificato sui progetti inclusi nel preventivo;
- nessun merge finché il collaudo end-to-end non è concluso.
