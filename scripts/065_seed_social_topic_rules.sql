-- Seed social_topic_rules with default topics for 4BID.IT
INSERT INTO social_topic_rules (
  topic_name, batch_size, frequency_days, time_windows, exclude_weekdays,
  platforms, tone, include_hashtags, default_hashtags, link_url, image_style_prompt
) VALUES (
  'Santaddeo - Revenue Tips',
  15, 3,
  '[{"start":"09:30","end":"11:30"},{"start":"15:00","end":"18:00"}]'::jsonb,
  '{0}',
  '{facebook,linkedin}',
  'professional', true,
  '{#RevenueManagement,#Hospitality,#4BID,#Santaddeo}',
  'https://www.4bid.it/progetti/santaddeo',
  'professional hotel revenue management, modern dashboard, clean corporate style'
) ON CONFLICT (topic_name) DO NOTHING;
