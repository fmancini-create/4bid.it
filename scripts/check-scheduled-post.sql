-- Check most recent scheduled posts
SELECT 
  id,
  content,
  status,
  scheduled_at AT TIME ZONE 'Europe/Rome' as scheduled_local,
  published_at AT TIME ZONE 'Europe/Rome' as published_local,
  platforms,
  target_accounts,
  platform_post_ids,
  error_message,
  created_at AT TIME ZONE 'Europe/Rome' as created_local
FROM social_posts
ORDER BY created_at DESC
LIMIT 10;
