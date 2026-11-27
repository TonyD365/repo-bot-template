# repo-bot-template

A GitHub repository template with CI, security scanning, and a pull request and issue bot that
runs on a free [Supabase](https://supabase.com) Edge Function instead of GitHub Actions.

It comes from [lanpair](https://github.com/TonyD365/lanpair), where the bot used to be a set
of Actions workflows. Every event started a run, so busy pull requests queued dozens of them.
As a webhook-driven function, it answers in seconds and costs no Actions minutes.

## What you get

| | |
|---|---|
| **CI** | Lint, type-check and tests on Linux, macOS and Windows (a Python example in `src/` and `tests/`) |
| **Security** | CodeQL (Python, Actions, TypeScript), dependency audit, zizmor for workflows, OpenSSF Scorecard, Dependabot, hash-pinned CI requirements |
| **Pull request bot** | One status comment kept up to date, status labels, a single required status `<project> checks`, merge once approved and green, contribution terms (a CLA-like agreement), merge-conflict notes, welcome and thank-you comments, deleting merged branches |
| **Commands** | `@your-bot /retest`, `/ready`, `/close`, `/reopen`, `/update`, `/remind 3d`, `/label`, `/unlabel`, `/keep-branch`, `/delete-branch`, `/help` |
| **Issues** | Labels from keywords, asking bug reports for a missing version or system, "fixed in the next release" and "released" notes |
| **Housekeeping** | Reminders, stale pull requests, a sweep every 10 minutes that catches missed webhooks |

The bot only answers comments that start by mentioning it, so ordinary discussion costs
nothing.

## How it works

```
GitHub ── signed webhook ──▶ Supabase Edge Function ── GitHub API (as the bot account) ──▶ GitHub
                                  ▲
       pg_cron (every 10 min, hourly, daily) ── signed call
```

- The function verifies GitHub's HMAC signature, answers at once, and works in the background.
- It keeps no state of its own: every run reads the pull request from GitHub again, so
  repeated or out-of-order webhooks are harmless. Agreements to the contribution terms are
  kept in a locked issue in your repository.
- Shadow mode: until you switch it on, it only logs what it would write.

## Choose where the bot runs

- **Supabase (recommended):** a free Edge Function that GitHub calls by webhook. Fast, and it
  uses no Actions runs. Set up below.
- **GitHub Actions:** the same code, run as an Actions job for each event. No other account
  needed, but every event uses a short Actions run, which can queue in busy repositories. See
  [actions-bot/README.md](actions-bot/README.md).

Both run the same code in `supabase/functions/repo-bot`, so they behave the same.

## Set up the Supabase version (about 30 minutes)

You need a GitHub account for the bot, and a Supabase account (the free plan needed no credit
card when this was written; check before you sign up).

1. **Create your repository** with **Use this template**.
2. **Replace the placeholders.** In `CONTRIBUTING.md` and `.github/PULL_REQUEST_TEMPLATE.md`,
   replace `@your-bot` with your bot account and `<project>` with your project name. In
   `.github/ISSUE_TEMPLATE/config.yml`, use your repository's links. Rename the example package
   in `pyproject.toml`, `src/` and `tests/`, and edit `supabase/functions/repo-bot/config.ts`
   (local check commands, failure hints, issue and file labels).
3. **The bot account.** Add it to the repository as a collaborator with write access. Signed in
   as the bot, create a **classic** token at
   [github.com/settings/tokens/new](https://github.com/settings/tokens/new) with only
   `public_repo` (or `repo` for a private repository) and an expiry date. Fine-grained tokens
   cannot be used for repositories where the account is only a collaborator. Note the expiry:
   when the token expires, the required status stops updating and nothing can be merged.
4. **Supabase project.** Create a free project (turn the Data API off; the bot does not need
   it), then in a terminal:

   ```bash
   npx supabase login
   ```

5. **Secrets.** Generate two random secrets and keep them in a file only you can read:

   ```bash
   (umask 077; printf 'WEBHOOK_SECRET=%s\nSWEEP_SECRET=%s\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 32)" > bot.env)
   ```

   Add these lines to `bot.env`, with your values: `REPO=owner/name`,
   `BOT_LOGIN=your-bot`, `PROJECT_NAME=yourproject`, `MAINTAINERS=you`, `LIVE_PRS=` and
   `BOTS_LIVE=` (both empty: shadow mode). Then store them, and the bot's token without
   showing it:

   ```bash
   npx supabase secrets set --project-ref <ref> --env-file bot.env
   ```

   ```bash
   read -rs "T?Bot token: "; echo; npx supabase secrets set --project-ref <ref> --env-file =(printf 'GITHUB_TOKEN=%s\n' "$T"); unset T
   ```

   (That line is for zsh; in bash use `read -rsp "Bot token: " T` and `<(...)`.)
6. **Deploy** the function:

   ```bash
   npx supabase functions deploy repo-bot --project-ref <ref> --no-verify-jwt
   ```

7. **Schedules.** In the Supabase SQL editor, create two Vault secrets, `sweep_secret` (the
   SWEEP_SECRET value) and `function_url` (`https://<ref>.supabase.co/functions/v1/repo-bot`):

   ```sql
   select vault.create_secret('<SWEEP_SECRET>', 'sweep_secret');
   select vault.create_secret('https://<ref>.supabase.co/functions/v1/repo-bot', 'function_url');
   ```

   Then run `supabase/cron.sql` there.
8. **Webhook.** In the repository's **Settings → Webhooks → Add webhook**: payload URL
   `https://<ref>.supabase.co/functions/v1/repo-bot`, content type `application/json`, the
   WEBHOOK_SECRET as secret, and these events: *Pull requests*, *Pull request reviews*,
   *Issue comments*, *Issues*, *Workflow runs*, *Pushes* and *Releases*.
9. **Keepalive.** Free Supabase projects pause after a week without activity. Add the Actions
   secret `SUPABASE_SWEEP_SECRET` (the SWEEP_SECRET value) and the Actions variable
   `SUPABASE_FUNCTION_URL` (the function URL). The keepalive workflow then pings it every 2 to
   5 days.
10. **Try it in shadow mode.** Open a test pull request and check the function's logs in
    Supabase: lines starting with `shadow` show what it would do. Then set `LIVE_PRS=<number>`
    for that pull request only, and finally `LIVE_PRS=*` and `BOTS_LIVE=1`.
11. **Ruleset.** In **Settings → Rules**, protect `main`: require a pull request with one
    approval and the status check `<PROJECT_NAME> checks`. Leave GitHub's own *Automatically
    delete head branches* off: the bot deletes merged branches itself and honours
    `/keep-branch`.

## Develop the bot

```bash
cd supabase/functions/repo-bot
deno fmt --check && deno check index.ts && deno test --allow-env --no-prompt .
```

The tests run the real code against an in-memory GitHub. Change `config.ts` for your project;
the rest is shared logic.

## Limits

- Supabase's free plan is not guaranteed to stay up or to stay free. While the function is
  down, the required status stops updating and nothing can be merged; removing that check from
  the ruleset unblocks merging until it is back.
- The bot token can write to the repository. Keep its scope small and its expiry short, and
  never paste it into chats or issues.
- GitHub does not retry failed webhooks; the 10-minute sweep catches up.

## License

[MIT](LICENSE)
