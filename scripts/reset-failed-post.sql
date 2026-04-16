-- Reset the failed 18:00 post to scheduled so the cron can retry it after the fix is deployed
UPDATE social_posts
SET status = 'scheduled', error_message = NULL, published_at = NULL, platform_post_ids = '{}'::jsonb
WHERE id = '0ff2cbe3-dd0d-4c34-8835-9e4ec471bf80';

SELECT id, status, scheduled_for, error_message FROM social_posts WHERE id = '0ff2cbe3-dd0d-4c34-8835-9e4ec471bf80';
