# Five-video batches from each new blog

The user approved five videos per article, with randomized non-repeating question selection for future batches, on October 31, 2026. Each video is shared to Facebook, Instagram, TikTok and YouTube: twenty platform publications per blog. The enabled `quiz-batch-policy.json` replaces the old four-campaign monthly cadence. The daily blog writer and schedule are unchanged.

## Implemented and testable

`scripts/create-quiz-batch.py` accepts an article package from an exact successful Vercel Production deployment. It renders five parts, aiming for up to three MCQs per part. New batches save a random seed and the complete question-number order in their authoritative per-article ledger **before** rendering. Questions are shuffled within five source-position bands and interleaved in a random band order to cover early, middle and late parts of the test; these are source positions, not inferred topic labels. The saved order is a permutation without replacement. Each new part consumes only its actually included questions, so duration trimming never causes repeats or loses the next unused question. At least one distinct source question is left for each remaining part. Duplicate source numbers or repeated question text fail validation. Retries reuse the same plan and completed MP4s. Existing sequential batches retain their saved source order and assets.

Whole questions are reduced to fit the 89-second limit without cutting or speeding speech/countdowns. Original source numbers appear on screen and in narration; each video is labelled Part 1/5 through Part 5/5. Captions list the actual selected source numbers rather than claiming a continuous range.

The approved Kokoro af_heart voice, normalized sound, navy/gold/turquoise styling, prominent real source title, no intro, three full thinking seconds after narration and subsequent spoken/highlighted correct answer remain. The top-left gold tile uses the exact eagle artwork from `public/eagle.svg`, with a transparent PNG derivative in `public/eagle-video.png`; source and image hashes are recorded in new manifests. Captions include the part and actual source question numbers, the full source URL and relevant hashtags.

All five MP4s must pass source/answer checks, timeline checks and complete decoding before `batch.json` is released as ready for scheduling. Each completed part can be reused on retry without rerendering. A changed source revision or mismatched saved question order is held. The encoder explicitly emits constant-rate frames through the final still image so the decoded video stream covers the complete planned timeline.

`same_day_slots` spreads the five posts across the remaining Asia/Karachi day. It starts no earlier than 10:00 and at least fifteen minutes after readiness, and normally ends by 22:00. For a batch ready at 09:05, the slots are 10:00, 13:00, 16:00, 19:00 and 22:00. Later readiness spreads the slots over the remaining window. If the usual window is too short, it uses the remaining evening up to 23:55 with at least five minutes between videos; otherwise it holds for a decision. All five videos are staged in the cloud first, but their public posts are scheduled separately. The publication worker freezes these slots before writes; retries and future code changes never alter an existing frozen schedule. An explicit CLI compact spacing override remains available only for intentional recovery.

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

## Retired Metricool code

Studio is the only runtime publisher. The unused Metricool workflows, monthly-campaign planners, webhook client, probes, publisher and their obsolete tests have been removed. Provider-independent state, Production source checks, captions and video validation now live in `quiz-cloud-state.py`, `quiz-social-copy.py` and `quiz-video-quality.py`. Historical configuration and the original setup documentation are preserved under `docs/archive/metricool/`; they are not runtime inputs. The existing orphan state branch, all historical baseline/article/campaign/post/comment records, public videos and immutable assets are preserved. No historical accounts, credentials or Make scenario were deleted.

Scheduling and publication remain separate states. A generated artifact or accepted request is never reported as a published post; consult the per-network provider receipts in the article's batch ledger.

The October 31 practical launch used the five Accounting Fundamentals parts. Facebook Part 3's Reel was already public, but its immediate follow-up comment failed, leaving a composite `ERROR` flag. The missing full-source comment was added once as McqsBase and directly verified (1472595814813209); the original Reel 2269299303907745 was never uploaded or published again. Only this source/account/file-bound repair proof can resolve its stale ledger flag, while `providerStatus` retains the actual scheduler status. Studio's metadata-only release-link endpoint returned HTTP 500 during reconciliation; it was not retried, and the unsupported repair action was removed. The directly verified public Reel/comment remain authoritative even if the historical Studio error badge persists. Never recreate a video to clear a stale badge.

## Laptop power

Generation, immutable storage, media transfer, scheduling and publication run on hosted GitHub runners and Studio. The laptop may be shut down throughout. A successful daily blog publication triggers the batch workflow; there is no local worker or polling requirement. The optional local Codex status monitor does not power this pipeline. The daily blog writing workflow and scripts are unchanged.
