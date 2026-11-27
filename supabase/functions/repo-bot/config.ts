// Everything specific to one repository. The names come from Supabase secrets (see the
// README); the rules below are yours to edit.

const env = (name: string, fallback: string) => Deno.env.get(name) || fallback;

/** "owner/name" of the repository the bot works for. */
export const REPO = env("REPO", "owner/project");
/** The bot's GitHub login: it writes as this account, and comments must mention it. */
export const BOT = env("BOT_LOGIN", "example-bot");
/** Shown in comments and in the summary status "<project> checks". */
export const PROJECT = env("PROJECT_NAME", REPO.split("/")[1]);
/** Logins that never need to agree to the contribution terms (comma-separated). */
export const MAINTAINERS = env("MAINTAINERS", REPO.split("/")[0])
  .split(",").map((s) => s.trim()).filter(Boolean);
/** The one status a ruleset should require. */
export const CHECK_CONTEXT = `${PROJECT} checks`;

/** What a contributor runs before pushing (shown in the welcome comment). */
export const LOCAL_CHECKS = [
  'pip install -e ".[dev]"',
  "ruff check . && ruff format --check .",
  "mypy src",
  "pytest",
];

/** What a failed check usually means, by check name. The first match wins. */
export const HINTS: [RegExp, string][] = [
  [
    /Lint and type-check/,
    "Run `ruff check .`, `ruff format .` and `mypy src`, then push the fixes.",
  ],
  [/^Tests/, "A test failed: open the log, then run `pytest` locally."],
  [
    /Dependency audit/,
    "A dependency has a known vulnerability: raise it to the fixed version (the log names it).",
  ],
  [/zizmor/, "A workflow file has a security problem: see the annotation on the Files tab."],
  [
    /^CodeQL/,
    "Code scanning found a possible security problem in the changed code: see the annotation on the PR's Files tab.",
  ],
];

/** Issue labels by keywords in the title or body (lowercase). */
export const ISSUE_LABELS: [RegExp, string][] = [
  [/install|pip|wheel/, "installing"],
  [/windows|win(10|11)/, "platform: Windows"],
  [/macos|mac os|apple silicon|macbook|imac/, "platform: macOS"],
  [/linux|ubuntu|debian|fedora|arch|raspberry/, "platform: Linux"],
];

/** How a bug report names the version (asked for when missing). */
export const VERSION_ASK = `the **${PROJECT} version** (\`pip show ${PROJECT}\`)`;

/** Pull request labels by changed file. */
export const FILE_LABELS: [string, RegExp][] = [
  ["ci", /^\.github\//],
  ["documentation", /^[^/]+\.md$|^docs\//],
  ["dependencies", /^pyproject\.toml$/],
  ["tests", /^tests\//],
];
