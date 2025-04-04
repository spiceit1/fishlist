-- Update auth settings to disable email confirmation
UPDATE auth.config
SET confirm_email_change_email_template_id = NULL,
    enable_signup = true,
    mailer_autoconfirm = true;

-- Grant access to use the app without email confirmation
INSERT INTO auth.flow_state(id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method)
VALUES (gen_random_uuid(), gen_random_uuid()::text, 'plain', 'plain', 'email', NULL, NULL, NOW(), NOW(), 'email/password')
ON CONFLICT DO NOTHING; 