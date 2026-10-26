# MCQsBase quiz Shorts automation

The approved strategy is daily cloud generation after successful blog publication, with at most four selected article campaigns per calendar month. Each campaign publishes one Short/Reel on each of Facebook, Instagram, TikTok and YouTube through Metricool: 4 × 4 = 16 publications, leaving four of the Free plan's twenty publications for other use. Existing or manually scheduled posts also consume Metricool's allowance.

## Video format

Use the approved Kokoro `af_heart` neural voice, normalized sound, and navy/gold/turquoise design. Start at Question 1 with no introductory speech or opening card. Keep the actual source-test title prominent. Read the question and choices; give a complete five-second countdown after narration; then tick/highlight and speak the correct answer.

Try up to five source questions. The shared vertical 1080×1920 MP4 is capped at **89 seconds**, below Metricool's documented 90-second Facebook Reel limit and YouTube's three-minute Shorts limit. Select fewer complete questions when necessary; never accelerate/cut speech, shorten the thinking interval or omit the answer reveal to fit. The question counter and captions use the actual number included.

The video points viewers to mcqsbase.com/blog. Each platform has its own caption with five relevant hashtags, source title and full original article URL. Facebook's full-source first comment remains available. YouTube Shorts comments/descriptions do not have clickable external URLs; the caption must not promise a clickable comment link there. Hashtags are descriptive, not a promise of reach.

`config/quiz-social-policy.json` is the shared policy. `scripts/quiz-social-policy.py` builds captions and reserves campaign slots. `scripts/create-quiz-video.py` renders the video; `--max-duration 0` deliberately permits an uncapped local preview, but production always uses the policy cap. `--include-intro` is legacy opt-in only.

## Publication-driven generation

`.github/workflows/blog-quiz-videos.yml` uses `workflow_run` after **Daily Blog Autopilot** completes successfully on master. There is no cron poll. Failed/cancelled daily blog runs do not generate videos. CI renders are previews only and have no publication side effects. Manual recovery is available, but also checks that the latest daily publisher succeeded.

The cloud worker waits for Vercel to confirm a successful **Production deployment of the exact checked-out master commit**. Preview deployments and commit checks alone do not qualify. It then reads the exact registered Markdown/inline article bodies used by that deployed blog. This avoids crawling the live /blog page, which returned HTTP 429 from GitHub runners. It does not bypass challenges or weaken website protection. A manifest labels this evidence `production-deployment`, rather than falsely claiming a live HTML fetch. Deployment ID, SHA, publisher run ID and content hash are retained.

The original HTML watcher remains available for explicit local use, but is not run as a second independent production queue. The existing daily blog publisher is unchanged.

## State, selection and recovery

Preserve `state.json` on the dedicated orphan branch `codex/blog-video-state`. The seed is used only if that branch does not exist. An existing branch with a missing queue is an error. The state branch's Vercel configuration disables Git deployments. Production jobs are serialized.

The October 26 baseline is preserved. Older COMSATS, ISSB and other baseline articles must not be backfilled. The original NAT-ICS Facebook post is already scheduled and must not be recreated or expanded into a campaign using the old four-minute video. Unseen registry articles dated before the baseline are excluded.

Daily eligible articles become Shorts, including those not chosen for social publication. A campaign reserves four network slots atomically, one for each network. Publication windows start on days **1, 8, 15 and 22**. The first newly completed eligible article whose proposed next-day 20:00 Asia/Karachi publication falls in an unfilled window is selected. Other videos are archive-only. Starting mid-month does not backfill earlier campaign windows. No month-end reservation may spill into another month's quota. This is a four-campaign maximum, not a requirement to fill missed windows.

Reservations and per-network receipts are stored under `campaigns[YYYY-MM][window]` and the article's `campaign`. Partial campaigns retain all four reserved slots. Resume missing networks only. Reconcile the centralized campaign record and actual Metricool monthly published/scheduled usage before every write. Never use the four spare publications automatically. If unrelated posts have used the allowance, hold the campaign rather than exceed the free plan.

Finished packages contain MP4, preview/reveal frames, timing manifest, caption, `platform-captions.json`, full-source comment and (for selected articles) `campaign.json`. Production artifacts are retained for **35 days**, through a monthly campaign cycle; CI previews expire after three days. The worker can recover up to three queued videos after a temporary failure. Failed renders and invalid answer tables remain retryable; guides with no valid MCQs are skipped with their actual reason.

## Metricool destinations and handoff

Verified October 26 under brand **7661098**, McqsBase, timezone Asia/Karachi:

| Network | Connected identity |
| --- | --- |
| Facebook | Page asset 851782721355178, public profile ID 61582964920997 |
| Instagram | mcqsbase |
| TikTok | McqsBase |
| YouTube | UCLLKmoVGvg_Bf2YEFukUjQQ |

Use Metricool only. No direct Facebook/Meta publisher or Page-token alternative is included. Do not buy or upgrade a plan. Metricool MCP works on Free but remains subject to the twenty-publication cap; its separate HTTP API requires an API-enabled paid plan.

The GitHub worker creates packages and campaign reservations. **It does not yet authenticate to Metricool or upload/schedule autonomously while the PC is off.** The connected Metricool client/normal browser can complete that handoff when available. Do not confuse enabled cloud generation with fully unattended social publishing. Before scheduling, inspect the manifest and representative question/reveal frames, verify the identities and monthly capacity, reconcile recent posts and IDs, and save each returned ID/UUID to the campaign's network receipt. Scheduling is not publication. An uncertain write requires reconciliation, not blind repetition.

The original NAT-ICS video remains scheduled for **October 26, 2026 at 20:00 Asia/Karachi**, Facebook only, post ID **406453185**, UUID **6501464804590961517**, with its full source URL as first comment. Its old voice/intro remain unchanged because the newer format applies to future videos. [Review in Metricool](https://app.metricool.com/planner/calendar?blogId=7661098&openWithPostUuid=6501464804590961517).

No Facebook groups are configured. Never expose credentials in source, logs, generated assets or chat.

## Validation

Run `python scripts/test-quiz-video.py`, `python scripts/test-blog-video-watcher.py`, `python scripts/test-cloud-blog-videos.py` and `python scripts/test-quiz-social-policy.py`. A real Linux render checks the approved voice and complete video format. Tests cover answer verification, duration reduction without cutting narration, publication gates, baseline preservation, four-window selection, sixteen-slot accounting and partial-campaign duplicate protection.
