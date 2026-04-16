SELECT
  id,
  status,
  platforms,
  created_at,
  scheduled_for,
  published_at,
  platform_post_ids,
  error_message,
  LEFT(content, 100) as content_preview
FROM social_posts
WHERE 'linkedin' = ANY(platforms)
ORDER BY created_at DESC
LIMIT 5;
