// functions/index.js
// Server-side proxy for the Claude API. Keeps the Anthropic API key on the
// server (never shipped to the browser), requires the caller to be a signed-in
// Firebase user, and constrains which model + token budget they can request.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const Anthropic = require('@anthropic-ai/sdk');

// The secret is stored in Firebase (not in this file or .env). Set it once with:
//   firebase functions:secrets:set ANTHROPIC_API_KEY
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// Only these models may be requested from the client. Add new ones here as the
// app adopts them — keeps a malicious caller from selecting an arbitrary
// (e.g. far more expensive) model.
const ALLOWED_MODELS = new Set([
  'claude-opus-4-6',
  'claude-haiku-4-5-20251001',
]);

// Hard ceiling on output tokens regardless of what the client asks for.
// Generous enough for a full multi-plant layout returned as JSON.
const MAX_TOKENS_CAP = 8192;

exports.claudeProxy = onCall(
  { secrets: [ANTHROPIC_API_KEY], region: 'us-central1' },
  async (request) => {
    // 1. Require an authenticated Firebase user.
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to use the assistant.');
    }

    // 2. Validate input.
    const { model, max_tokens, system, messages } = request.data || {};

    if (!ALLOWED_MODELS.has(model)) {
      throw new HttpsError('invalid-argument', `Model "${model}" is not allowed.`);
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpsError('invalid-argument', 'messages must be a non-empty array.');
    }

    const cappedMaxTokens = Math.min(
      Math.max(1, Number(max_tokens) || 1024),
      MAX_TOKENS_CAP
    );

    // 3. Call Claude with the server-held key.
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });

    try {
      const result = await client.messages.create({
        model,
        max_tokens: cappedMaxTokens,
        ...(system ? { system } : {}),
        messages,
      });

      // Flatten the response to plain text (the client only ever used the text).
      const text = result.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return { text };
    } catch (err) {
      console.error('Anthropic API error:', err);
      throw new HttpsError('internal', 'The assistant request failed. Please try again.');
    }
  }
);
