-- Insert 20 recipients into campaign "Campagna Santaddeo Launch"
-- Campaign ID: 63a04e4a-5c68-47e7-a559-a1de363751f9

INSERT INTO dem_recipients (campaign_id, email, nome, cognome, nome_azienda, tipo_contatto, send_status)
VALUES
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'allegra.mancini.06@gmail.com', 'Allegra', 'Mancini', 'Villa I Barronci Resort & Spa', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'teomanc2007@gmail.com', 'Matteo', 'Mancini', 'Villa I Barronci Resort & Spa', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'm.fratini@ibarronci.com', 'Marianna', 'Fratini', 'Villa I Barronci Resort & Spa', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'm.devito@ibarronci.com', 'Marta', 'De Vito', 'Villa I Barronci Resort & Spa', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'i.fancelli@ibarronci.com', 'Ilaria', 'Fancelli', 'Villa I Barronci Resort & Spa', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'ginannifilippo@gmail.com', 'Filippo', 'Ginanni', 'Villa d''Arte Agriresort', 'Ex Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'villadarteagriresort@gmail.com', 'Deborah', NULL, NULL, NULL, 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'leonardoguidi416@gmail.com', 'Leonardo', 'Guidi', 'Rondini Blu', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'guidiandco@gmail.com', 'Stefano', 'Giudi', 'Rondini Blu', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'info@tenutamoriano.it', 'Riccardo', 'Panconesi', 'Tenuta Moriano', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'info@lemandrie.it', 'Carlo', 'Cubattoli', 'Fattoria Le Mandrie di Ripalta', 'Ex Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'info@podere-casanova.it', 'Lisa', 'Lorenzo', 'Podere Casanova', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'info@hotelmassimo.it', 'Maria Grazia', 'Ranieri', 'Hotel Massimo', 'Ex Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'filippo.bucci@hotmail.it', 'Filippo', 'Bucci', 'Tenuta Massabo''', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'info@cavallinohotel.it', 'Valentina', NULL, 'Hotel IL Cavallino', 'Potenziale', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'slpoggetti@gmail.com', 'Stefano', 'Poggetti', 'SL Consulting', 'Rappresentante', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'f.mancini@ibarronci.com', 'Filippo', 'Mancini', 'Villa I Barronci Resort & Spa', 'Cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'Massimo.Marghi@pregis.i', 'Massimo', 'Marghi', 'Pregis Spa', 'Rappresentante', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'lettieri.massimo@gmail.com', 'Massimo', 'Lettieri', 'Detercom professional srl', 'Rappresentante', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'l.tinozzi@sogesispa.it', 'Lorenzo', 'Tinozzi', 'So.Ge.Si. Spa', 'Rappresentante', 'pending')
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT email, nome, cognome, nome_azienda, tipo_contatto, send_status
FROM dem_recipients
WHERE campaign_id = '63a04e4a-5c68-47e7-a559-a1de363751f9'
ORDER BY created_at;
