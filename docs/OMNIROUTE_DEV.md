# OmniRoute development standard

OmniRoute is the default AI gateway for 4BID coding-agent development in this repository. Development only; production AI traffic is unchanged.

## Local setup

```bash
npm install -g omniroute
omniroute
npm install -g @openai/codex
omniroute launch-codex
```

## Routing policy
- Routine tasks: `auto/cheap`.
- Hard coding/debugging: `auto/coding`.
- Premium/specific models only when cheaper routes fail or are clearly insufficient.

## Cost control
Use focused prompts, targeted file reads and short error slices; prefer tests/commands over repeated model reasoning; avoid unrelated refactors; summarize known context instead of retransmitting it.

## Safety
Never commit provider keys, OmniRoute credentials, tokens, customer data or local OmniRoute state. Preserve project rules and production behavior. Do not merge or deploy without explicit authorization.

## Rollback
Stop OmniRoute locally and use the coding CLI with its normal provider configuration. No production rollback is required.
