const { truncateText } = require("../util");

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const t = Number.isFinite(timeoutMs) ? timeoutMs : 45000;
  const timeout = setTimeout(() => controller.abort(new Error("timeout")), t);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function callAnthropicMessages(params) {
  const apiKey = params.apiKey;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required");

  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens ?? 2000,
      temperature: params.temperature ?? 0.2,
      system: params.system,
      messages: [{ role: "user", content: params.user }]
    })
  }, params.timeoutMs);

  if (!res.ok) {
    const text = await res.text();
    let msg = `Anthropic error ${res.status}: ${truncateText(text)}`;
    if (res.status === 404) {
      msg = `Model "${params.model}" not found. Your API key may not have access to this model, or the model ID is incorrect.`;
    } else if (res.status === 401) {
      msg = `Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY.`;
    } else if (res.status === 403) {
      msg = `Access denied for model "${params.model}". Your Anthropic plan or API key does not have permission to use this model.`;
    } else if (res.status === 429) {
      msg = `Anthropic rate limit exceeded. Please wait a moment and try again, or switch to a different model.`;
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const blocks = Array.isArray(data && data.content) ? data.content : [];
  const text = blocks
    .filter((b) => b && b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return { text: String(text || "") };
}

module.exports = {
  callAnthropicMessages
};
