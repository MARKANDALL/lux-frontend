# Agents Archive

Local autonomous Claude agent systems built before Anthropic shipped Routines (April 14, 2026).

## simoishi/
OpenClaw + Telegram bot. GPT model via OpenAI API. First scan flagged 28 .GOLD files, 8 raw localStorage violations, 19 silent catches, 1 oversized file. Deprecated for cost reasons.

## kodama/
Claude Code CLI supervisor. claude-sonnet-4-6 worker, Opus reserved for chat. Week 1 calibration complete: 4 findings (repo-rooted paths, queue archive, em-dash artifact, 18-31s timing). Week 2 supervisor patch never shipped — superseded by Routines.

## routines/
Production nightly/weekly/monthly jobs (see lux-nightly-prompt.md, lux-weekly-prompt.md, lux-monthly-prompt.md). Configured at claude.ai/code/routines.
