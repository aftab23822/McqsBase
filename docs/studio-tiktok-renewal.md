# TikTok authorization renewal

Investigated November 7, 2026 against Studio's published source revision `30d9e62018f01ca8ba7d13acb85485305ad85cc7`. The hosted backend's deployed revision and private OAuth logs are not exposed, so source findings do not prove its exact runtime revision or the specific refresh-token rejection cause.

## Concrete gaps in the provider source

- [`creatorInfo`](https://github.com/voholabs/voholabs-studio/blob/30d9e62018f01ca8ba7d13acb85485305ad85cc7/libraries/nestjs-libraries/src/integrations/social/tiktok.provider.ts#L460) uses plain `fetch`. An access-token error becomes `canPost=false` instead of the `RefreshToken` exception handled by the public integration controller. Repeating that helper alone does not invoke renewal.
- Both `authenticate` and `refreshToken` hard-code a 23-hour access lifetime. [TikTok requires using the returned `expires_in`](https://developers.tiktok.com/docs/en/oauth-user-access-token-management), saving the newest rotated refresh token and keeping the app secret server-side. A hard-coded lifetime can outlast the real access token.
- Studio's [refresh service](https://github.com/voholabs/voholabs-studio/blob/30d9e62018f01ca8ba7d13acb85485305ad85cc7/libraries/nestjs-libraries/src/integrations/refresh.integration.service.ts) already serializes refreshes, loads the current channel row and persists rotated tokens. Its channel analytics path invokes that service when the stored expiration is due, before reading the analytics cache.

## MCQsBase's automatic recovery

When creator info explicitly reports `access_token_invalid`, `access_token_expired` or `invalid_token`, make one supported `GET /analytics/{channelId}?date=1&fresh=true` request, then re-query creator info. This invokes Studio's existing expiry check; credentials remain in Studio. Recovery is accepted only after the pinned creator, public visibility and duration checks pass. Save the attempted/verified recovery outcome in `state.socialService.authRecovery`.

This is a supported recovery path, not a force-refresh endpoint. If Studio's stored expiration is wrong and has not elapsed, its current backend can still decline to renew. A successful/empty analytics response alone is never counted as authorization success. Invalid grants, withdrawn permission or a permanently expired refresh token cannot be repaired by repeated requests or password automation.

## Provider repair

A separately prepared upstream patch makes creator info use the provider's refresh-aware HTTP wrapper, propagates OAuth errors even when contained in an HTTP-200 body, and calculates token expiry from `expires_in` with a bounded safety margin. Deterministic tests exercise those actual patched methods with expired and healthy responses, different token lifetimes and a rotated refresh token surviving a failed profile lookup. No live token is used by those tests.

That patch must be accepted and deployed by the Studio operator to repair its hosted OAuth implementation. Changing the MCQsBase repository cannot change Studio's server. Do not claim that the vendor patch is live before there is deployment evidence. Do not extract platform credentials, save social passwords, bypass OAuth consent, create keepalive polling or recreate already accepted posts.
