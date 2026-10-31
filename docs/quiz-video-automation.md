# MCQsBase quiz Shorts automation

**Historical Metricool campaign route.** The October 31 replacement is documented in [quiz-video-batches.md](quiz-video-batches.md): five sequential videos per newly published blog, twenty same-day platform posts through Studio Free. When `quiz-batch-policy.json` is enabled, the legacy routine generation and handoff gates skip. Preserve the records and controls below for historical verification; they no longer define the active publication cadence.

Generate videos only for selected campaigns, at most four per calendar month. Each campaign reuses one Short/Reel on Facebook, Instagram, TikTok and YouTube through Metricool: 4 × 4 = 16 publications, leaving four of the Free plan's twenty publications for other use. Existing or manually scheduled posts also consume Metricool's allowance. Do not create or save unused daily videos.

## Video format

Use the approved Kokoro `af_heart` neural voice, normalized sound, and navy/gold/turquoise design. Start at Question 1 with no introductory speech or opening card. Keep the actual source-test title prominent. Read the question and choices; give a complete **three-second** countdown after narration; then tick/highlight and speak the correct answer. `thinkingSeconds` in the shared policy controls future renders and is saved in each new campaign. Existing published five-second videos retain their original timings and remain verifiable.

Try up to five source questions. The shared vertical 1080×1920 MP4 is capped at **89 seconds**, below Metricool's documented 90-second Facebook Reel limit and YouTube's three-minute Shorts limit. Select fewer complete questions when necessary; never accelerate/cut speech, shorten the thinking interval or omit the answer reveal to fit. The question counter and captions use the actual number included.

The video points viewers to mcqsbase.com/blog. Each platform has its own caption with five relevant hashtags, source title and full original article URL. Facebook's full-source first comment remains available. YouTube Shorts comments/descriptions do not have clickable external URLs; the caption must not promise a clickable comment link there. Hashtags are descriptive, not a promise of reach.

`config/quiz-social-policy.json` is the shared policy. `scripts/quiz-social-policy.py` builds captions and reserves campaign slots. `scripts/create-quiz-video.py` renders the video; `--max-duration 0` deliberately permits an uncapped local preview, but production always uses the policy cap. `--include-intro` is legacy opt-in only.

## Publication-driven generation

`.github/workflows/blog-quiz-videos.yml` uses `workflow_run` after **Daily Blog Autopilot** completes successfully on master. There is no cron poll. Failed/cancelled daily blog runs do not generate videos. CI renders are previews only and have no publication side effects. Manual recovery is available, but also checks that the latest daily publisher succeeded.

The first production job runs `plan-blog-video-campaign.py` using only the Python standard library. If the publication window is filled or there is no eligible new article, it exits before installing video dependencies or downloading voices. The expensive renderer job is skipped entirely. An open slot selects the newest eligible article; reserve its four-platform campaign before rendering, then render only that article. Routine production runs do not run the full CI suite or create smoke-test videos. CI validation remains on code pushes and pull requests.

The cloud worker waits for Vercel to confirm a successful **Production deployment of the exact checked-out master commit**. Preview deployments and commit checks alone do not qualify. It then reads the exact registered Markdown/inline article bodies used by that deployed blog. This avoids crawling the live /blog page, which returned HTTP 429 from GitHub runners. It does not bypass challenges or weaken website protection. A manifest labels this evidence `production-deployment`, rather than falsely claiming a live HTML fetch. Deployment ID, SHA, publisher run ID and content hash are retained.

The original HTML watcher remains available for explicit local use, but is not run as a second independent production queue. The existing daily blog publisher is unchanged.

## State, selection and recovery

Preserve `state.json` on the dedicated orphan branch `codex/blog-video-state`. The seed is used only if that branch does not exist. An existing branch with a missing queue is an error. The state branch's Vercel configuration disables Git deployments. Production jobs are serialized.

The October 26 baseline is preserved. Older COMSATS, ISSB and other baseline articles must not be backfilled. The original NAT-ICS Facebook post is already published and must not be recreated or expanded into a campaign using the old four-minute video. Unseen registry articles dated before the baseline are excluded. The user explicitly approved publishing the tested three-question University of Sindh Short on October 27; `config/quiz-approved-launch.json` names this single exception. Its questions must match the exact Production article before the existing drafts can become one campaign. This permission does not select other baseline articles.

Only campaign-selected articles become Shorts. A campaign reserves four network slots atomically, one for each network, before rendering. Publication windows start on days **1, 8, 15 and 22**. Select the newest eligible article when its proposed next-day 20:00 Asia/Karachi publication falls in an unfilled window. Other articles receive no video. Starting mid-month does not backfill earlier campaign windows. No month-end reservation may spill into another month's quota. This is a four-campaign maximum, not a requirement to fill missed windows. A failed selected render retries the same reservation without creating another campaign.

Reservations and per-network receipts are stored under `campaigns[YYYY-MM][window]` and the article's `campaign`. Partial campaigns retain all four reserved slots. Resume missing networks only. Reconcile the centralized campaign record and actual Metricool monthly published/scheduled usage before every write. Never use the four spare publications automatically. If unrelated posts have used the allowance, hold the campaign rather than exceed the free plan.

Finished campaign packages contain MP4, preview/reveal frames, timing manifest, caption, `platform-captions.json`, full-source comment and `campaign.json`. Only these selected campaign assets are retained for **35 days** for handoff/recovery; CI previews expire after three days. Failed selected renders remain retryable using the same campaign slot. Guides or tables without validated MCQs are not selected. Preserve any older records/assets from the earlier daily-generation strategy without creating more.

## Metricool destinations and handoff

Verified October 26 under brand **7661098**, McqsBase, timezone Asia/Karachi:

| Network | Connected identity |
| --- | --- |
| Facebook | Page asset 851782721355178, public profile ID 61582964920997 |
| Instagram | mcqsbase |
| TikTok | McqsBase |
| YouTube | UCLLKmoVGvg_Bf2YEFukUjQQ |

Use Metricool only. No direct Facebook/Meta publisher or Page-token alternative is included. Do not buy or upgrade a plan. Metricool MCP works on Free but remains subject to the twenty-publication cap; its separate HTTP API requires an API-enabled paid plan.

The Make Free scenario [MCQsBase cloud handoff](https://eu1.make.com/3369980/scenarios/8201776/edit) connects a custom authenticated webhook to **MCP Client → Call a tool** and returns the Metricool result. It uses no AI model, paid API token or PC browser session at runtime. Metricool OAuth is saved in Make; `MCQS_MAKE_WEBHOOK_URL` and `MCQS_MAKE_API_KEY` are GitHub Actions secrets. Never put their values in files, documentation, logs or chat. The read-only cloud account/calendar test and four-network video draft test passed before production enablement. MCP calls use ordinary Make scenario credits; four campaigns remain well within the current Free credit allowance without polling.

`.github/workflows/metricool-cloud-handoff.yml` follows a successful **Blog Quiz Videos** workflow on master. A standard-library queue check skips media dependencies and social calls when no selected campaign needs work. `metricool-cloud-publish.py` recovers the selected package, checks provenance, all question/reveal timings, approved voice, source title, actual count, the complete video decode and duration, and uploads an immutable MP4 to the public `mcqsbase-quiz-media` prerelease. Public URLs allow Metricool ingestion without passing GitHub credentials to Make. The MP4 itself contains only approved public quiz content. Completed package manifests and media hashes are retained in the state record so scheduling retries never require another render. Historical assets are preserved.

Before any write, the handoff verifies all four identities, reconciles monthly published/pending posts and the central sixteen-slot ledger, and leaves room for existing/manual usage. It saves an uncertain intent **before** the only create request, then immediately stores the returned post ID/UUID in the authoritative campaign and article record. It rechecks the platform calendar and byte-for-byte media hash. A missing response triggers reconciliation; it never blindly creates the post again. Failed validation, insufficient allowance, expired windows or revoked access hold the campaign and fail the workflow for attention. Receipt verification continues for already scheduled campaigns even across a month boundary. Facebook first-comment configuration is verified separately from actual public comment publication.

The existing daily blog writer workflow is unchanged. The cloud handoff does not generate articles, edit their registry, invoke the daily writer, install voices or render daily archives. The PC may be off during generation, handoff and Metricool publication. Manual recovery uses the handoff workflow's **Run workflow** action; preserve the state branch and receipts. Scheduling is not publication. The October launch reuses the four existing draft UUIDs with normal captions and hashtags; it never creates four replacement posts.

The original NAT-ICS video was published on **October 26, 2026 at 20:00 Asia/Karachi**, Facebook only, Metricool post ID **406453185**, UUID **6501464804590961517**. The [public Reel](https://www.facebook.com/reel/2192648288267024/) and full-source first comment (ID **1831381055261044**) were verified. Its old voice/intro remain unchanged because the newer format applies to future videos.

No Facebook groups are configured. Never expose credentials in source, logs, generated assets or chat.

## Validation

Run `python scripts/test-quiz-video.py`, `python scripts/test-blog-video-watcher.py`, `python scripts/test-cloud-blog-videos.py`, `python scripts/test-quiz-social-policy.py` and `python scripts/test-blog-video-campaign.py`. A real Linux CI render checks the approved voice and complete video format. Tests cover answer verification, duration reduction without cutting narration, publication gates, baseline preservation, four-window selection, sixteen-slot accounting, skipping a filled window before source/voice setup, and partial-campaign duplicate protection.

The handoff CI additionally runs `python scripts/test-metricool-campaign-payload.py` and `python scripts/test-metricool-cloud-publish.py`. These simulate failures without writing to social accounts: rejected previews, early reveals, wrong source/identity/window, incomplete receipts, duplicate matches, uncertain writes/updates, lost responses, actual monthly usage, and secret-safe transport errors. Draft integration fixtures are not selected by the regular campaign planner. Only the explicit October approval can promote the named launch sample.
