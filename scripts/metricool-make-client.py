"""Authenticated Make MCP bridge. Never uses Metricool's paid HTTP API."""
import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import build_opener, HTTPRedirectHandler, Request


class BridgeError(RuntimeError):
    """A sanitized failure; no endpoint, key, request or remote error text is logged."""


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        return None


class MakeClient:
    ALLOWED = {'getBrandSettings', 'getScheduledPosts', 'createScheduledPost', 'updateScheduledPost'}

    def __init__(self, endpoint=None, key=None, opener=None):
        self.endpoint = endpoint or os.environ.get('MCQS_MAKE_WEBHOOK_URL', '')
        self.key = key or os.environ.get('MCQS_MAKE_API_KEY', '')
        parsed = urlsplit(self.endpoint)
        if (parsed.scheme != 'https' or parsed.netloc != 'hook.eu1.make.com'
                or parsed.query or parsed.fragment or not parsed.path.strip('/') or not self.key):
            raise BridgeError('The protected Make endpoint and authentication key must be configured.')
        self.opener = opener or build_opener(NoRedirects())

    def call(self, operation, arguments=None):
        if operation not in self.ALLOWED:
            raise BridgeError('This Metricool operation is not allowed by the campaign handoff.')
        request = Request(self.endpoint, method='POST',
                          data=json.dumps({'operation': operation, 'arguments': arguments or {}}).encode(),
                          headers={'Content-Type': 'application/json', 'Accept': 'application/json',
                                   'x-make-apikey': self.key})
        # Do not retry here: a timeout or lost response may follow a successful write.
        try:
            with self.opener.open(request, timeout=45) as response:
                raw = response.read(2_000_001)
                if response.status != 200 or len(raw) > 2_000_000:
                    raise BridgeError('Make returned an unexpected response; reconcile before any write retry.')
        except HTTPError as error:
            raise BridgeError(f'Make returned HTTP {error.code}; reconcile before any write retry.') from None
        except (URLError, TimeoutError, OSError):
            raise BridgeError('Make did not return a verified result; reconcile before any write retry.') from None
        try:
            result = json.loads(raw)
        except (ValueError, UnicodeError):
            raise BridgeError('Make accepted the request without a verified Metricool result; reconcile it first.') from None
        if not isinstance(result, (dict, list)) or (isinstance(result, dict) and result.get('error')):
            raise BridgeError('Metricool did not return a successful result; inspect the Make execution.')
        return result
