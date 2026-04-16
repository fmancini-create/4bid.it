-- Stato degli account social configurati
SELECT 
  platform,
  account_name,
  status,
  CASE WHEN access_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_token,
  token_expires_at,
  last_validated_at,
  CASE 
    WHEN token_expires_at IS NOT NULL AND token_expires_at < NOW() THEN 'EXPIRED'
    WHEN token_expires_at IS NOT NULL THEN 'VALID'
    ELSE 'NO_EXPIRY'
  END as token_status
FROM social_accounts
ORDER BY platform, account_name;

-- Statistiche per piattaforma degli ultimi 30 giorni
SELECT 
  sa.platform,
  spt.status,
  COUNT(*) as count,
  MAX(spt.created_at) as last_attempt
FROM social_post_targets spt
JOIN social_accounts sa ON sa.id = spt.account_id
WHERE spt.created_at > NOW() - INTERVAL '30 days'
GROUP BY sa.platform, spt.status
ORDER BY sa.platform, spt.status;

-- Ultimi 10 errori per piattaforma
SELECT 
  sa.platform,
  sa.account_name,
  spt.status,
  LEFT(spt.error_message, 200) as error_preview,
  spt.created_at
FROM social_post_targets spt
JOIN social_accounts sa ON sa.id = spt.account_id
WHERE spt.status = 'failed'
  AND spt.created_at > NOW() - INTERVAL '30 days'
ORDER BY spt.created_at DESC
LIMIT 20;
