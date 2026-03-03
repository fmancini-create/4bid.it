-- Insert 20 recipients into campaign "Campagna Santaddeo Launch"
-- Campaign ID: 63a04e4a-5c68-47e7-a559-a1de363751f9

INSERT INTO dem_recipients (campaign_id, email, nome, cognome, nome_azienda, tipo_contatto, send_status)
VALUES
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'allegra.mancini.06@gmail.com', 'Allegra', 'Mancini', 'Villa I Barronci Resort & Spa', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'teomanc2007@gmail.com', 'Matteo', 'Mancini', 'Villa I Barronci Resort & Spa', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'm.fratini@ibarronci.com', 'Marianna', 'Fratini', 'Villa I Barronci Resort & Spa', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'm.devito@ibarronci.com', 'Marta', 'De Vito', 'Villa I Barronci Resort & Spa', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'i.fancelli@ibarronci.com', 'Ilaria', 'Fancelli', 'Villa I Barronci Resort & Spa', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'ginannifilippo@gmail.com', 'Filippo', 'Ginanni', 'Villa d''Arte Agriresort', 'ex_cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'villadarteagriresort@gmail.com', 'Deborah', NULL, NULL, 'potenziale', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'leonardoguidi416@gmail.com', 'Leonardo', 'Guidi', 'Rondini Blu', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'guidiandco@gmail.com', 'Stefano', 'Giudi', 'Rondini Blu', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'info@tenutamoriano.it', 'Riccardo', 'Panconesi', 'Tenuta Moriano', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'info@lemandrie.it', 'Carlo', 'Cubattoli', 'Fattoria Le Mandrie di Ripalta', 'ex_cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'info@podere-casanova.it', 'Lisa', 'Lorenzo', 'Podere Casanova', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'info@hotelmassimo.it', 'Maria Grazia', 'Ranieri', 'Hotel Massimo', 'ex_cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'filippo.bucci@hotmail.it', 'Filippo', 'Bucci', 'Tenuta Massabo''', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'info@cavallinohotel.it', 'Valentina', NULL, 'Hotel IL Cavallino', 'potenziale', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'slpoggetti@gmail.com', 'Stefano', 'Poggetti', 'SL Consulting', 'rappresentante', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'f.mancini@ibarronci.com', 'Filippo', 'Mancini', 'Villa I Barronci Resort & Spa', 'cliente', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'Massimo.Marghi@pregis.i', 'Massimo', 'Marghi', 'Pregis Spa', 'rappresentante', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'lettieri.massimo@gmail.com', 'Massimo', 'Lettieri', 'Detercom professional srl', 'rappresentante', 'pending'),
  ('63a04e4a-5c68-47e7-a559-a1de363751f9', 'l.tinozzi@sogesispa.it', 'Lorenzo', 'Tinozzi', 'So.Ge.Si. Spa', 'rappresentante', 'pending')
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT email, nome, cognome, nome_azienda, tipo_contatto, send_status
FROM dem_recipients
WHERE campaign_id = '63a04e4a-5c68-47e7-a559-a1de363751f9'
ORDER BY created_at;
