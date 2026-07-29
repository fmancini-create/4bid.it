-- Project Room: resend an invitation, correcting the address if needed.
--
-- `token` keeps the irreversible SHA-256 fingerprint and is NOT touched here.
-- `token_sealed` stores the same token encrypted with a key held in the
-- environment (PR_INVITE_TOKEN_KEY), which is what allows an identical link to
-- be sent again. Nullable on purpose: invitations created before this change
-- have no sealed copy and must keep working, so a resend simply rotates them.
--
-- Idempotent: safe to run more than once.

alter table public.pr_invitations
  add column if not exists token_sealed text;

comment on column public.pr_invitations.token_sealed is
  'Invitation token encrypted with PR_INVITE_TOKEN_KEY (aes-256-gcm), so the same link can be resent. Null = link will be rotated on resend. The authoritative check stays the token fingerprint in "token".';

-- Bookkeeping, so the admin UI can say "sent 3 times, last on ..." instead of
-- silently overwriting the history of what was mailed to a client.
alter table public.pr_invitations
  add column if not exists resent_at timestamptz;

alter table public.pr_invitations
  add column if not exists resend_count integer not null default 0;

comment on column public.pr_invitations.resent_at is 'When the invitation was last resent.';
comment on column public.pr_invitations.resend_count is 'How many times the invitation has been resent.';
