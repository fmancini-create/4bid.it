-- Social accounts configured
SELECT platform, account_name, is_active, 
  CASE WHEN token_expires_at IS NOT NULL AND token_expires_at < NOW() THEN 'EXPIRED'
       WHEN token_expires_at IS NOT NULL THEN 'VALID until ' || token_expires_at::text
       ELSE 'no expiry' END as token_status
FROM social_accounts ORDER BY platform;

-- Post stats aggregate by status
SELECT status, COUNT(*) as count FROM social_posts GROUP BY status ORDER BY count DESC;

-- Recent posts with errors
SELECT id, status, platforms, error_message, created_at, published_at, platform_post_ids
FROM social_posts 
WHERE status IN ('failed', 'error') OR error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Recent published posts (check if actually published)
SELECT id, status, platforms, published_at, platform_post_ids
FROM social_posts 
WHERE status = 'published'
ORDER BY published_at DESC NULLS LAST
LIMIT 10;
