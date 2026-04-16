-- Check LinkedIn account configuration
SELECT 
  id, 
  platform, 
  account_name, 
  account_id, 
  page_id,
  is_active,
  token_expires_at,
  CASE 
    WHEN token_expires_at IS NULL THEN 'No expiry set'
    WHEN token_expires_at < NOW() THEN 'EXPIRED'
    ELSE 'Valid until ' || token_expires_at::text
  END AS token_status,
  created_at,
  updated_at
FROM social_accounts
WHERE platform = 'linkedin'
ORDER BY created_at DESC;

-- Check last 10 LinkedIn posts
SELECT 
  id,
  LEFT(content, 80) AS content_preview,
  status,
  platforms,
  platform_post_ids,
  error_message,
  published_at,
  created_at
FROM social_posts
WHERE 'linkedin' = ANY(platforms)
ORDER BY created_at DESC
LIMIT 10;

-- Summary by status
SELECT 
  status,
  COUNT(*) AS count
FROM social_posts
WHERE 'linkedin' = ANY(platforms)
GROUP BY status
ORDER BY count DESC;
