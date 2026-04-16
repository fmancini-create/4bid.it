SELECT id, platform, account_id, account_name, is_active, token_expires_at
FROM social_accounts
WHERE platform = 'facebook'
ORDER BY account_name;
