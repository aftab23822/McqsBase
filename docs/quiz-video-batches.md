# Five-video batches from each new blog

The user approved five sequential videos per article on October 31, 2026. Each video is intended for Facebook, Instagram, TikTok and YouTube: twenty platform publications per blog. This replaces the desired four-campaign monthly cadence once the replacement publisher has been connected and practically verified.

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

## Publishing connection still required

Metricool Free cannot support this volume: five videos across four networks consume its twenty-post monthly allowance in one batch. Do not remove the existing quota checks, split accounts to bypass a plan, spend reserved allowance, buy a plan, or imply that a laptop running a scheduler bypasses the service's limit.

The free cloud candidate is [Voholabs Studio](https://voholabs.com/docs/billing), whose published documentation advertises unlimited channels/posts, public API scheduling and 2 GB storage, with Facebook, Instagram, TikTok and YouTube free. Its [channel availability documentation](https://voholabs.com/docs/channels) also notes that unapproved networks may appear as Coming soon. Account-specific availability, intended MCQsBase identities, settings, practical twenty-publication handoff and actual public results must be verified before claiming an operational migration. The documentation is not proof of a successful account connection or publication.

Metricool OAuth cannot be transferred to another provider. The user must sign in/connect the intended accounts and store any new cloud credential as a GitHub Actions secret, never in chat, source, artifacts or logs. No new credentials have been extracted. A free provider's actual storage and API limits must be checked without enabling payment or auto top-up.

The existing production workflow/campaign policy remains active during preparation. Do not enable a second publisher alongside it. The final cutover must reconcile existing scheduled posts and the shared state, then switch the publication-driven cloud worker to one publisher. It should follow successful daily blog publication, render all five, verify all five, schedule all twenty deliveries, record stable provider IDs before retrying uncertain writes, and preserve every successful platform when another fails. No cron polling and no always-on laptop are needed for an authenticated hosted scheduler. A fully local alternative cannot receive events while the laptop is powered off.

Until those connections and practical tests pass, the batch generator is ready for review, but daily cloud publishing has **not** been activated. No sample or batch should be reported as scheduled/published from generation alone.
