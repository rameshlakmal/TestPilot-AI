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

function parseRetryAfter(text) {
  try {
    const data = JSON.parse(text);
    const msg = data && data.error && data.error.message ? data.error.message : "";
    const match = msg.match(/retry in ([\d.]+)s/i);
    if (match) return Math.ceil(parseFloat(match[1]) * 1000);
  } catch {
    // ignore
  }
  return null;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiGenerateContent(params) {
  const apiKey = params.apiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required");

  const model = params.model;
  if (!model) throw new Error("Gemini model is required");

  // Accept either "gemini-..." or "models/gemini-..."
  const modelPath = String(model).startsWith("models/") ? String(model) : `models/${String(model)}`;
  if (!/^[A-Za-z0-9._\-/]+$/.test(modelPath)) {
    throw new Error("Gemini model contains invalid characters");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const reqBody = {
    systemInstruction: {
      role: "system",
      parts: [{ text: params.system }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: params.user }]
      }
    ],
    generationConfig: {
      temperature: params.temperature ?? 0.2,
      maxOutputTokens: params.maxTokens,
      // Best-effort: ask Gemini to return application/json.
      responseMimeType: "application/json",
      ...(params.jsonSchema && typeof params.jsonSchema === "object"
        ? { responseSchema: params.jsonSchema }
        : {})
    }
  };

  if (params.jsonSchema && typeof params.jsonSchema === "object") {
    // Stronger enforcement than responseMimeType: use function calling if supported.
    reqBody.tools = [
      {
        functionDeclarations: [
          {
            name: "return_json",
            description: "Return the response as JSON matching the provided schema.",
            parameters: params.jsonSchema
          }
        ]
      }
    ];
    reqBody.toolConfig = {
      functionCallingConfig: {
        mode: "ANY",
        allowedFunctionNames: ["return_json"]
      }
    };
  }

  async function fetchWithRateRetry(body, retries) {
    const maxRetries = retries || 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const r = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        },
        params.timeoutMs
      );

      if (r.status === 429 && attempt < maxRetries) {
        const errText = await r.text();
        const waitMs = parseRetryAfter(errText) || (15000 + attempt * 10000);
        await sleep(waitMs);
        continue;
      }

      return r;
    }
    throw new Error("Gemini rate limit: max retries exceeded");
  }

  const res = await fetchWithRateRetry(reqBody);

  if (!res.ok) {
    const text = await res.text();
    // Some models/versions don't support responseSchema; retry without it.
    if ((res.status === 400 || res.status === 422) && reqBody.generationConfig && reqBody.generationConfig.responseSchema) {
      const retryBody1 = {
        ...reqBody,
        generationConfig: { ...reqBody.generationConfig }
      };
      delete retryBody1.generationConfig.responseSchema;

      const retry1 = await fetchWithRateRetry(retryBody1);

      if (retry1.ok) {
        const data2 = await retry1.json();
        return extractTextOrThrow(data2);
      }

      // Second retry: also remove tools if function calling isn't supported.
      const retryBody2 = { ...retryBody1 };
      delete retryBody2.tools;
      delete retryBody2.toolConfig;

      const retry2 = await fetchWithRateRetry(retryBody2);

      if (!retry2.ok) {
        const text2 = await retry2.text();
        let msg2 = `Gemini error ${retry2.status}: ${truncateText(text2)}`;
        if (retry2.status === 404) {
          msg2 = `Model "${model}" not found. Your API key may not have access to this model, or the model ID is incorrect.`;
        } else if (retry2.status === 401 || retry2.status === 403) {
          msg2 = `Access denied for model "${model}". Please check your GEMINI_API_KEY and ensure your plan supports this model.`;
        }
        throw new Error(msg2);
      }
      const data3 = await retry2.json();
      return extractTextOrThrow(data3);
    }

    let msg = `Gemini error ${res.status}: ${truncateText(text)}`;
    if (res.status === 404) {
      msg = `Model "${model}" not found. Your API key may not have access to this model, or the model ID is incorrect.`;
    } else if (res.status === 401 || res.status === 403) {
      msg = `Access denied for model "${model}". Please check your GEMINI_API_KEY and ensure your plan supports this model.`;
    }
    throw new Error(msg);
  }

  const data = await res.json();
  return extractTextOrThrow(data);
}

function extractTextOrThrow(data) {
  const finishReason =
    data &&
    data.candidates &&
    data.candidates[0] &&
    (data.candidates[0].finishReason || data.candidates[0].finish_reason);
  const promptBlockReason =
    data &&
    data.promptFeedback &&
    data.promptFeedback.blockReason;

  const text =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    Array.isArray(data.candidates[0].content.parts)
      ? data.candidates[0].content.parts
          .map((p) => {
            if (!p) return "";
            if (typeof p.text === "string") return p.text;
            if (p.functionCall && typeof p.functionCall === "object") {
              const args = p.functionCall.args;
              if (args && typeof args === "object") return JSON.stringify(args);
              return JSON.stringify(p.functionCall);
            }
            // Some structured outputs may come back as non-text parts.
            if (typeof p === "object") return JSON.stringify(p);
            return String(p);
          })
          .join("\n")
      : "";

  if (!String(text || "").trim()) {
    const details = {
      finishReason: finishReason || null,
      promptBlockReason: promptBlockReason || null
    };
    throw new Error(
      `Gemini returned empty response. Details: ${truncateText(JSON.stringify(details), 600)}`
    );
  }

  return { text: String(text || "") };
}

module.exports = {
  callGeminiGenerateContent
};
