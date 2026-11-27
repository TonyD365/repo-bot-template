# The Actions version of the bot

The same bot as the Supabase version, run by GitHub Actions instead. Choose it if you don't
want a Supabase account.

| | Supabase (recommended) | Actions |
|---|---|---|
| Setup | Supabase project, secrets, webhook, schedules | One workflow file, one secret, three variables |
| Cost | Free plan, no Actions runs | One short Actions run per event, plus a sweep every 10 minutes |
| Speed | Seconds | Usually under a minute, longer when runners are busy |
| Busy repositories | Fine | Many runs at once can queue, which is why lanpair moved off it |
| Reviews on forks' pull requests | At once (webhook) | At the next sweep (fork events get no secrets) |

Comments that don't start by mentioning the bot start no job, so ordinary discussion is free
either way.

## Set up

1. Do steps 1 to 3 of the main README (repository, placeholders, bot account and token).
2. Copy `actions-bot/repo-bot.yml` to `.github/workflows/repo-bot.yml`, and delete
   `.github/workflows/supabase-keepalive.yml` (only the Supabase version needs it).
3. In **Settings → Secrets and variables → Actions**, add the secret `BOT_TOKEN` (the bot's
   token) and the variables `BOT_LOGIN` (the bot's login), `PROJECT_NAME` and `MAINTAINERS`
   (your login; several separated by commas).
4. Optional, to try it first without writing anything: set the variable `BOTS_LIVE` to `0`
   and `BOT_LIVE_PRS` to a pull request number that doesn't exist; the job log then shows what
   it would do. Remove both to go live.
5. Do step 11 of the main README (the ruleset).

If the workflow names in your repository differ from `CI`, `Security` and `zizmor`, update
the `workflow_run` list, so the status updates when they finish.
