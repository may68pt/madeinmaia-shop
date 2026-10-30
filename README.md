# Made in Maia · AI Boardroom (MVP)

ChatGPT, Grok and Claude sit around a table and brainstorm growth ideas for Made in Maia.
Watch live at the service URL; control the meeting from the CONTROL tab.

## Environment variables (Render → Environment)
| Key | Purpose |
|---|---|
| `BOARDROOM_PASSWORD` | Required to start/pause/speak. Watching stays open. |
| `OPENAI_API_KEY` | Makes ChatGPT live (else demo lines) |
| `XAI_API_KEY` | Makes Grok live |
| `ANTHROPIC_API_KEY` | Makes Claude live |
| `OPENAI_MODEL` / `XAI_MODEL` / `ANTHROPIC_MODEL` | Override models (defaults: gpt-5.6-luna, grok-4.3, claude-sonnet-5-5) |
| `BUDGET_USD` | Max spend per meeting (default 1) |
| `BUSINESS_BRIEF` | Default brief about the business |

Prices per model are estimates; override with `OPENAI_PRICE_IN`, `OPENAI_PRICE_OUT`, etc. (USD per 1M tokens).
