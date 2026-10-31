# Five-video batches from each new blog

The user approved five sequential videos per article on October 31, 2026. Each video is shared to Facebook, Instagram, TikTok and YouTube: twenty platform publications per blog. The enabled `quiz-batch-policy.json` replaces the old four-campaign monthly cadence. The daily blog writer and schedule are unchanged.

## Implemented and testable

`scripts/create-quiz-batch.py` accepts an article package from an exact successful Vercel Production deployment. It renders five parts, aiming for three consecutive MCQs per part. Whole questions are reduced to fit the existing 89-second limit. The next part starts at the next **actually included** source question, without repeats, skipped long questions, or invented replacements. Original question numbers appear on screen and in narration; each video is labelled Part 1/5 through Part 5/5.

The approved Kokoro af_heart voice, normalized sound, navy/gold/turquoise styling, prominent real source title, no intro, three full thinking seconds after narration and subsequent spoken/highlighted correct answer remain. Captions include the part and source question range, the full source URL and relevant hashtags.

All five MP4s must pass source/answer checks, timeline checks and complete decoding before `batch.json` is released as ready for scheduling. Each completed part can be reused on retry without rerendering. A changed source revision or mismatched question range is held. The encoder explicitly emits constant-rate frames through the final still image so the decoded video stream covers the complete planned timeline.

`same_day_slots` proposes five future slots on the same Asia/Karachi date, starting at least fifteen minutes after the batch is ready and normally thirty minutes apart. It reduces spacing late in the day, down to five minutes. If all five cannot fit that day, it holds instead of silently moving posts to the next day. The publication worker must freeze these slots in the durable ledger before writes, then resume only missing network receipts after reconciliation.

Example, from the repository root:

```powershell
python scripts/create-quiz-batch.py --article-json <verified-package.json> --output <batch-folder>
python scripts/test-quiz-batch.py
```

This renderer has no social publishing or scheduling side effects. Its `batch.json` is an artifact manifest, not a second production queue. Preserve the authoritative state branch and all historical campaign/post receipts.

## Free cloud handoff

The user has connected all four MCQsBase channels in Studio and stored `MCQS_STUDIO_API_KEY` as a GitHub Actions secret. A hosted, read-only connection check succeeded on October 31. `config/quiz-batch-policy.json` pins the four Studio channel IDs and profiles; the worker rechecks them, TikTok public direct-post capability, the Free workspace and absence of automatic payments before publishing. Credentials never enter source, assets or logs.

`Blog Quiz Batches` follows a successful `Daily Blog Autopilot` master run. It verifies an exact successful Vercel Production deployment, stores one durable batch ledger per article under `batches/<slug>.json` on the existing `codex/blog-video-state` branch, uploads each completed part as immutable GitHub release media and resumes those exact bytes after a failed render. `state.json` retains the historical baseline/campaigns and only small batch summaries. The manual `validation` option is restricted to the explicitly approved October 31 Accounting Fundamentals rollout article.

After all five pass, the cloud handoff imports each MP4 once and verifies the imported bytes by SHA-256. It freezes all five same-day times before scheduling. Each part creates one post on each of the four channels. Facebook receives its full-source first comment one minute after the main post, allowing time for Reel processing; the other channels retain full source links in their captions. Each write has a durable uncertain intent before the request, individual returned IDs saved immediately, and an exact account/caption/calendar reconciliation before recovery. A lost response does not cause another copy. Unexpected account/schema/time/cost/receipt changes hold the affected batch. No payment or automatic top-up is enabled.

Use `verify_only` to reconcile scheduled public results without rendering or creating posts. Automatic publication events also reconcile existing queued batches. A queued post is reported as scheduled; only a provider `PUBLISHED` status with a public URL counts as published. No cron polling or local background worker is added. The original daily writer is unchanged.

Studio's legacy TikTok integration can report `PUBLISHED` with only an account profile URL. That is stored as provider-reported publication, not verified public video visibility. A complete batch with such receipts is `provider-published`; no posts are recreated. `publicUrlVerified` requires a post-specific URL. The first launch video's actual TikTok URL and Everyone visibility were independently checked in TikTok Studio; the immutable file hash/account/source-bound evidence is in `config/quiz-batch-public-proof.json`. Platform moderation may temporarily keep a new TikTok post under review even though the scheduler reports it published.

The Free Studio library is finite (2 GB). The worker holds if storage is full rather than buying capacity or deleting historical assets. Immutable source MP4s and ledgers remain in GitHub for recovery.

An existing scheduled post/comment that later fails is saved as `publication-needs-attention`, preserving every successful receipt. The same run still schedules other ready daily batches, then reports the held record once as a workflow failure. Routine later runs skip that held record, while explicit `verify_only` can reconcile it after repair. A stale failure from yesterday must not suppress today's newly prepared five videos.

## Cutover requirements

Metricool Free cannot support this volume: five videos across four networks consume its twenty-post monthly allowance in one batch. Do not remove the existing quota checks, split accounts to bypass a plan, spend reserved allowance, buy a plan, or imply that a laptop running a scheduler bypasses the service's limit.

The active free provider is [Voholabs Studio](https://voholabs.com/docs/billing), with unlimited channels/posts, public API scheduling and 2 GB storage. All four intended accounts, TikTok direct public publishing, free per-post estimates and disabled automatic payments were checked against the live account before cutover.

The user connected Studio separately and saved its protected cloud credential as a GitHub Actions secret. No Metricool OAuth token or browser/Git credential was extracted or transferred. Do not enable payment or auto top-up.

At cutover, reconcile existing scheduled posts and the shared state, then use only the Studio batch publisher for new articles. The two old workflows retain manual recovery/CI entry points, but their automatic publication triggers are removed and both old routine gates skip while the new policy is enabled. No legacy posts or source assets are deleted. A fully local alternative cannot receive events while the laptop is powered off.

Scheduling and publication remain separate states. A generated artifact or accepted request is never reported as a published post; consult the per-network provider receipts in the article's batch ledger.

The October 31 practical launch used the five Accounting Fundamentals parts. Facebook Part 3's Reel was already public, but its immediate follow-up comment failed, leaving a composite `ERROR` flag. The missing full-source comment was added once as McqsBase and directly verified (1472595814813209); the original Reel 2269299303907745 was never uploaded or published again. Only this source/account/file-bound repair proof can resolve its stale ledger flag, while `providerStatus` retains the actual scheduler status. Studio's metadata-only release-link endpoint returned HTTP 500 during reconciliation; it was not retried, and the unsupported repair action was removed. The directly verified public Reel/comment remain authoritative even if the historical Studio error badge persists. Never recreate a video to clear a stale badge.
