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

async function callOpenAIChatCompletions(params) {
  const apiKey = params.apiKey;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required");

  const url = "https://api.openai.com/v1/chat/completions";
  const baseBody = {
    model: params.model,
    temperature: params.temperature ?? 0.2,
    max_tokens: params.maxTokens,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user }
    ]
  };

  async function callOnce(responseFormat) {
    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...baseBody,
          response_format: responseFormat
        })
      },
      params.timeoutMs
    );

    if (!res.ok) {
      const text = await res.text();
      let msg = `OpenAI error ${res.status}: ${truncateText(text)}`;
      if (res.status === 404) {
        msg = `Model "${baseBody.model}" not found. Your API key may not have access to this model, or the model ID is incorrect.`;
      } else if (res.status === 401) {
        msg = `Invalid OpenAI API key. Please check your OPENAI_API_KEY.`;
      } else if (res.status === 403) {
        msg = `Access denied for model "${baseBody.model}". Your OpenAI plan or API key does not have permission to use this model.`;
      } else if (res.status === 429) {
        msg = `OpenAI rate limit exceeded. Please wait a moment and try again, or switch to a different model.`;
      }
      const err = new Error(msg);
      err.status = res.status;
      err.raw = text;
      throw err;
    }

    const data = await res.json();
    const content =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;
    return { text: String(content || "") };
  }

  if (params.jsonSchema && typeof params.jsonSchema === "object") {
    try {
      return await callOnce({
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: params.jsonSchema,
          strict: true
        }
      });
    } catch (err) {
      // Back-compat fallback for models/accounts that don't support json_schema.
      if (err && (err.status === 400 || err.status === 422)) {
        return callOnce({ type: "json_object" });
      }
      throw err;
    }
  }

  const res = await callOnce({ type: "json_object" });
  return res;
}

module.exports = {
  callOpenAIChatCompletions
};
