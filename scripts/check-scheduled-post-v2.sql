SELECT 
  id,
  status,
  platforms,
  target_accounts,
  LEFT(content, 100) as content_preview,
  image_url,
  scheduled_for,
  published_at,
  platform_post_ids,
  error_message,
  auto_publish,
  requires_approval,
  approved_at,
  created_at
FROM social_posts
ORDER BY created_at DESC
LIMIT 10;
