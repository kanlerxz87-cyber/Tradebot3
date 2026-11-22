# COORDINATION.md — Shared Task Board & Verification Log

> **Repository:** `kanlerxz87-cyber/Tradebot3`
> **Live Site (GitHub Pages):** https://kanlerxz87-cyber.github.io/Tradebot3/
> **Active Session ID:** `arena-3716ae8d`
> **Working Branch:** `arena/3716ae8d-tradebot3` (Arena fixed session branch; branched from `main` at `62713af9e466cd393c61be0df37e5de0872919cc`)
> **Last Updated:** 2026-11-22 (UTC)

---

## Coordination Protocol Notes
- Per the shared session workflow, tasks are claimed below with owning session ID, branch, and non-overlapping file scope prior to editing.
- Because Arena binds this session to branch `arena/3716ae8d-tradebot3`, all commits, pushes, and the integration pull request are executed on `arena/3716ae8d-tradebot3` without creating or switching to another branch.
- Items marked `needs review` are published on `flagged-for-review.html` with official source links and do not block integration or deployment.
- Every data row in tables must link to an official verified source. Any value that cannot be confirmed from an official source is left blank and flagged as `Unverified`.

---

## Task Board

| Task ID | Task Description | Status | Owning Session | Branch | File Scope |
| --- | --- | --- | --- | --- | --- |
| T-01 | Repository audit & official Kalshi Demo API verification (REST, WebSocket, Auth, Orderbook, Candlesticks, Rate Limits) | `in progress` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `COORDINATION.md`, `EXECUTIVE_SUMMARY.md`, `README.md` |
| T-02 | Verified 5-topic Kalshi market dataset (Gas Prices, Elections, Culture, Crypto, Golf ONLY) & flagged irregularities catalog | `in progress` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `assets/js/data.js` |
| T-03 | Kalshi Demo API client (RSA-PSS signing + public REST + paper fallback), >=$0.10 swing alert engine, dual chat feeds, lifecycle resolution tracker, automated strategy simulator & portfolio engine | `in progress` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `assets/js/kalshi-client.js`, `assets/js/engine.js`, `assets/js/charts.js`, `assets/js/ui-common.js` |
| T-04 | GitHub Pages site: Landing Dashboard, 5 Separate Category Subpages, Portfolio/Strategy Lab, API Verification/Suggestions, and Flagged for Review page | `in progress` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `.nojekyll`, `index.html`, `portfolio.html`, `verification.html`, `flagged-for-review.html`, `categories/*.html`, `assets/css/styles.css`, `assets/js/dashboard.js`, `assets/js/category-page.js`, `assets/js/portfolio-page.js`, `assets/js/verification-page.js` |
| T-05 | Automated verification script, link integrity check, live server testing, PR creation, merge to `main`, and GitHub Pages deploy confirmation | `in progress` | `arena-3716ae8d` | `arena/3716ae8d-tradebot3` | `scripts/verify_site.py`, `COORDINATION.md` |

---

## Official Sources Log (In Progress)
- Kalshi Official Demo Environment Docs: https://docs.kalshi.com/getting_started/demo_env
- Kalshi Official API Environments & Endpoints: https://docs.kalshi.com/getting_started/api_environments
- Kalshi Official Orderbook Responses (`orderbook_fp`): https://docs.kalshi.com/getting_started/orderbook_responses
- Kalshi Official WebSockets Quick Start & Channels: https://docs.kalshi.com/getting_started/quick_start_websockets
- Kalshi Official Rate Limits & Tiers: https://docs.kalshi.com/getting_started/rate_limits
- Kalshi Official API Changelog: https://docs.kalshi.com/changelog
- Kalshi Official OpenAPI Spec & Reference: https://docs.kalshi.com/openapi.yaml
- Kalshi Official Markets (Gas Prices, Elections, Culture, Crypto, Golf): https://kalshi.com/markets

---

## Irregularities & Handoff Log
- Initial repository contained only `README.md` (`# Tradebot3`) on commit `62713af9e466cd393c61be0df37e5de0872919cc`; no prior sessions or conflicting claims exist.
- Detailed API, CORS, browser WebSocket header, and unverified-field irregularities will be logged upon task completion and published to `flagged-for-review.html`.

---

## Pull Request & Deployment Record
- **PR URL:** *(pending)*
- **Merge Commit:** *(pending)*
- **GitHub Pages Deploy Status:** *(pending)*
