-- Verifica quali ID corrispondono ai target_accounts
SELECT id, platform, account_name, platform_user_id, active 
FROM social_accounts 
WHERE active = true AND platform = 'facebook'
ORDER BY account_name;
