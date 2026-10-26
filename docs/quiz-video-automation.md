# MCQsBase quiz videos without paid video services

The local renderer creates a vertical MP4 from existing article questions. It uses Pillow for typography, FFmpeg for encoding, and installed Windows speech voices for free offline narration. It does not call an AI or paid video API and adds no watermark. The source test title appears on the opening card and every question.

The default sequence is question-and-choices narration, five seconds to think, then a green correct-option highlight and tick with a spoken answer. The answer remains hidden until the countdown finishes. Only answer keys whose letter and option text agree are accepted; explanation text is never narrated. A short original chime accompanies the reveal.

## Generate a preview

Install Python, Pillow, and FFmpeg. Alternatively, install `imageio-ffmpeg` with Pillow to provide a portable FFmpeg binary. The script also recognizes packages installed under `.social-automation/python`.

```powershell
python -m pip install Pillow imageio-ffmpeg==0.6.0
python scripts/create-quiz-video.py --slug university-of-sindh-entry-test-mcqs --count 10
python scripts/test-quiz-video.py
```

Use `--count 20` for twenty questions, `--seconds 8` for a longer countdown after narration, and a different `--seed` to change the selection. `--reveal-seconds` sets the minimum reveal duration; a long spoken answer automatically gets enough time to finish. The seed makes a selection reproducible; it does not prevent repeats across different runs. A production scheduler must track question hashes across videos.

The title defaults to the actual title in `src/data/importedBlogArticles.js`, with the trailing 'with Answers...' SEO suffix removed for readability. The full source title is preserved in the manifest. For example, a ten-question video selected from a hundred-question article still shows the source title '100 University of Sindh Entry Test MCQs' and separately identifies the video as a ten-question selection. `--title` can override the display wording, but must accurately describe the source.

Local Windows narration uses the built-in speech engine through `synthesize-quiz-voice.ps1`, defaulting to `Microsoft Zira Desktop`. Select another installed voice with `--voice-name`, or adjust speed with `--voice-rate` (-10 to 10; default 1). Cloud narration uses Piper with the LJ Speech medium female English voice; the design, countdown and answer reveal stay the same. Its [upstream model card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/medium/MODEL_CARD) identifies the training dataset as public domain. There is no paid-service fallback.

For the Linux/cloud voice, install `scripts/video-requirements.txt`, run `python scripts/download-quiz-voice.py`, then add `--voice-engine piper --piper-model .social-automation/voices/en_US-ljspeech-medium.onnx` to a render command. Speech is resampled to the same 48 kHz mono format before mixing with the original countdown/chime.

For the original answer-hidden format, pass `--no-reveal`. For a silent quiz with just countdown tones, pass `--no-voice`. Use both flags together to keep both narration and answer reveals disabled.

Video duration now adapts to the actual voice clips, so narration is never cut off and does not consume the thinking interval. Keep longer quizzes as ordinary Page video uploads or split them into parts if the current Facebook Reels upload endpoint rejects their duration. Native Facebook uploads and developer upload endpoints can have different limits. Verify current endpoint requirements rather than assuming all support the same length.

The output directory contains `mcqsbase-quiz.mp4`, `preview.png`, `reveal-preview.png` (when enabled), `manifest.json`, `caption.txt`, `first-comment.txt`, voice clips, and a narration job file. The manifest includes the timing of every stage so reveals can be checked against countdowns. Everything generated stays in `.social-automation/`, which is ignored by Git. The manifest deliberately says `local-preview-only` and `sourceVerifiedLive: false`: publication must first verify the actual live article and selected question.

## Watch the live latest-post list

Run `python scripts/watch-blog-videos.py` to check the actual published list at `https://www.mcqsbase.com/blog`, fetch the live article, and create a narrated ten-question video. This works for articles that are newer than the local Git checkout; it does not rewrite or synchronize the website's content files.

On the first run, the newest listed article is queued and all older entries become a baseline. Later runs queue every newly listed article. Existing articles do not receive a video again merely because they remain in Featured Articles or All Articles. Articles with fewer than ten valid MCQs are skipped with a recorded reason; parsing errors are retried rather than silently skipped. Each answer's letter and option text must agree.

The watcher stores its queue, completion records and baseline at `.social-automation/blog-videos/state.json`. Each article's source package is stored in `sources/{slug}.json`; the video, caption, source comment and timing manifest are stored in `videos/{slug}/`. Preserve this state file to avoid duplicates. A crash during rendering leaves the article retryable; a completed render can be recovered from its verified manifest. An operating-system lock prevents two instances rendering concurrently.

The default is at most one video per check. Use `--max-videos 2` to process a larger pending queue or `--count 20` to select twenty questions. Do not change the count just to rerender completed articles: completed entries remain completed unless explicitly requeued. HTTP rate limits, source failures and render failures are retried by a future scheduled run. The watcher never publishes, buys services or configures accounts.

The local Codex automation initially ran this watcher hourly. The hosted replacement is `.github/workflows/blog-quiz-videos.yml`. Once that workflow is on `master`, GitHub checks the live list hourly at thirty minutes past the hour even when the user's PC and Codex are off. Scheduled starts may be delayed by GitHub. The existing daily blog workflow is unchanged. Retire the local rendering schedule after the hosted workflow is verified, so there are not two independent render queues.

## Hosted operation and durable state

The repository `aftab23822/McqsBase` is public. Standard GitHub-hosted runner time is [free in public repositories](https://docs.github.com/en/actions/concepts/billing-and-usage); artifact storage is still subject to account limits. Only MP4s, small previews, manifests, captions and comments are retained as Actions artifacts for seven days. Large intermediate frames and WAVs are not uploaded. No larger runner or paid service is configured.

`cloud-blog-videos.py` restores a portable queue from the dedicated orphan branch `codex/blog-video-state`, creating that branch from the checked-in seed only on its first run. State commits do not change `master` or the website's source, and the state branch includes `vercel.json` with Git deployments disabled. An existing branch with a missing state file is treated as a state-loss error, never as permission to reset the baseline. A single workflow concurrency group serializes production runs.

The seed excludes older articles and records the initial NAT-ICS video as already scheduled through Metricool for October 26, 2026 at 20:00 Asia/Karachi, post ID `406453185`, UUID `6501464804590961517`. Cloud publishing must not duplicate it. A generated video is reproducible from its article slug and can be restored on an ephemeral runner when publishing is later enabled. New videos remain available from each Actions run's artifacts. No local drive path is written to the public durable queue.

## One-time setup for fully automatic Facebook publishing

Cloud rendering works without Facebook credentials. To enable direct cloud publishing without a paid scheduler:

1. Create/configure the owner's Meta app and obtain the appropriate **Page** access token for the confirmed McqsBase asset, ID `851782721355178`. The public Page URL uses profile ID `61582964920997`; these identify the same Page in the verified Facebook management UI. Request only the Page publishing, read-engagement and comment-management permissions needed by the current supported Graph API. Meta may require app configuration, review, or renewed authorization depending on the app/account setup.
2. Add the token to this repository's Actions secrets as `FACEBOOK_PAGE_ACCESS_TOKEN`. Do not paste it into chat or commit it.
3. Add the repository variable `FACEBOOK_GRAPH_VERSION` with the supported version selected in that Meta app, such as the exact `vNN.0` shown there. The publisher deliberately has no guessed version default.
4. Set the repository variable `FACEBOOK_AUTO_PUBLISH` to `true`, then manually run **Blog Quiz Videos** once and inspect the result. Leaving this unset keeps all Facebook writes disabled.

The publisher verifies the token's `/me` Page ID before writes, reconciles recent videos before an upload, checkpoints its upload intent and returned ID durably, and checks processing/publication. It then adds and verifies the full-source-link comment. A timed-out upload/comment with an uncertain result is held for reconciliation, never automatically duplicated. Processing is checked again on a later hosted run. This direct API route is implemented and covered by mocked regression tests; actual publishing must still be verified with the owner's real token before describing it as operational.

Metricool's existing connection to ChatGPT is separate from a GitHub job's authorization. Its [Free plan permits 20 posts per month, and its HTTP API requires Advanced or Custom](https://help.metricool.com/plans-add-ons-and-api-access-explained-xux1u). No Metricool subscription upgrade is purchased or assumed here. The first uploaded video remains scheduled by Metricool and needs no running PC to publish.

## Connect publishing

Never treat an upload response alone as proof of publication. Tokens belong only in the repository's protected secret store, never in source code, generated assets, logs or chat messages. The cloud workflow's automatic publishing switch is off until explicitly configured as above.

Instagram requires the intended MCQsBase professional account to be created and connected first. Its publishing setup also needs authorized access and a supported publicly accessible media URL. Do not guess that @MCQsBase is available. A renderer alone does not authorize publishing to either platform.

Run rendering and publishing on an existing computer or server to avoid a video-tool subscription. A local scheduled job needs that computer on. Cloud runners and storage have quotas and may incur charges; do not describe them as unconditionally free. If replacing the Windows voice with a downloaded voice model, check that model's license before publishing.

No Instagram account or Facebook groups are configured. The initial Metricool post has been scheduled and verified; future direct Facebook publishing remains disabled until the one-time repository secret and variables are configured.
