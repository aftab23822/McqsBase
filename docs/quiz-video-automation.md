# MCQsBase quiz video automation

Future videos start immediately at Question 1. The source test title stays visible on each question; there is no opening card or introductory narration. Each question has spoken choices, a five-second thinking countdown, and a highlighted/ticked correct answer with a spoken reveal. The approved navy, gold and turquoise design is preserved.

## Voice and previews

The improved voice test uses the free Kokoro neural voice `af_heart`, with natural pacing and volume normalization. [Kokoro's upstream model](https://huggingface.co/hexgrad/Kokoro-82M) has Apache-licensed weights. No paid voice API is called.

Install `scripts/video-requirements.txt`, run `python scripts/download-kokoro-voice.py`, then render with:

```powershell
python scripts/create-quiz-video.py --slug university-of-sindh-entry-test-mcqs --voice-engine kokoro --kokoro-model .social-automation/voices/kokoro/kokoro-v1.0.fp16.onnx --kokoro-voices .social-automation/voices/kokoro/voices-v1.0.bin
```

Use `--count 20` for twenty questions. `--count 1 --no-outro` produces a short voice test. `--include-intro` explicitly restores the old opening, which is disabled by default. `--no-reveal` hides answers, and `--no-voice` disables speech. Local Windows speech remains available as a legacy engine, but the improved sample/cloud setup uses Kokoro. Video duration follows the real speech clips; speech never consumes the thinking interval or gets cut off.

## Latest articles and duplicate protection

`watch-blog-videos.py` reads the live list at https://www.mcqsbase.com/blog and the actual article HTML, so it does not depend on an up-to-date local checkout. The first run queues the newest article and baselines older articles; later runs discover each new listed article once. Featured/list duplicates are collapsed. Guides without enough validated MCQs are skipped; parsing/network failures remain retryable. Each answer's letter must match its option text.

The queue is stored in `.social-automation/blog-videos/state.json`; each video package includes MP4, preview, answer-reveal preview, timing manifest, caption and first-comment text. Preserve this state. Returned social post IDs are tracked separately from video generation. A failed render remains retryable; an OS lock prevents overlapping local workers. Generated files and dependencies are ignored by Git.

## Hosted video creation

`.github/workflows/blog-quiz-videos.yml` runs on standard GitHub-hosted Linux runners. Once merged onto `master`, it checks the live list hourly at thirty minutes past the hour while the user's PC is off. GitHub can delay scheduled starts. It leaves the existing daily blog workflow unchanged.

The repository is public. [Standard GitHub-hosted runner time is free for public repositories](https://docs.github.com/en/actions/concepts/billing-and-usage); storage still has account limits. Only completed MP4s, small previews, manifests, captions and source comments are retained as Actions artifacts for seven days. Intermediate frames/WAVs are not uploaded. No paid runner or subscription is configured.

`cloud-blog-videos.py` preserves a portable queue on the dedicated orphan branch `codex/blog-video-state`. It creates that branch from `config/blog-video-state-seed.json` only on the first run. An existing branch with a missing queue is an error, never a reason to reset the baseline. Queue writes do not change the website branch. The state branch includes a Vercel configuration disabling Git deployments. Production workflow runs are serialized.

The seed excludes older articles and records the first NAT-ICS video as already scheduled through Metricool. It must not be recreated or scheduled twice. Generated cloud videos wait at `awaiting-metricool-scheduling`; this worker does not create social posts.

## Metricool is the publishing provider

The confirmed Metricool brand is `7661098` (McqsBase), connected to Facebook asset `851782721355178`. The public Page URL uses profile ID `61582964920997`; the verified management UI maps these to the same Page.

The first NAT-ICS video is uploaded and scheduled for **October 26, 2026 at 20:00 Asia/Karachi**, including its full article URL as the first comment. Metricool confirms `autoPublish: true`, `draft: false`, provider status `PENDING`, post ID `406453185`, UUID `6501464804590961517`. It can publish this queued post with the PC off.

[Review the scheduled post](https://app.metricool.com/planner/calendar?blogId=7661098&openWithPostUuid=6501464804590961517)

Hosted video creation and recurring Metricool scheduling are tracked separately. The Metricool connection authorized in ChatGPT is not automatically a credential available inside a GitHub job. Unattended Metricool scheduling must be configured and tested before calling the full publishing pipeline operational. Metricool Free permits 20 posts/month; its script/API access requires an API-enabled plan. No plan upgrade or credential is purchased or assumed.

Instagram has not been set up. No Facebook groups are configured. Never guess an Instagram account or post into arbitrary groups. Never expose credentials in source, generated files, logs or chat.
