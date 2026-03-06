const { callOpenAIChatCompletions } = require("./openai");
const { callAnthropicMessages } = require("./anthropic");
const { callGeminiGenerateContent } = require("./gemini");

async function generateText(opts) {
  const provider = String(opts.provider || "openai").toLowerCase();

  if (provider === "openai") {
    return callOpenAIChatCompletions({
      apiKey: opts.apiKey,
      model: opts.model,
      system: opts.system,
      user: opts.user,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
      timeoutMs: opts.timeoutMs,
      jsonSchema: opts.jsonSchema
    });
  }

  if (provider === "anthropic") {
    return callAnthropicMessages({
      apiKey: opts.apiKey,
      model: opts.model,
      system: opts.system,
      user: opts.user,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
      timeoutMs: opts.timeoutMs
    });
  }

  if (provider === "gemini") {
    return callGeminiGenerateContent({
      apiKey: opts.apiKey,
      model: opts.model,
      system: opts.system,
      user: opts.user,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
      timeoutMs: opts.timeoutMs,
      jsonSchema: opts.jsonSchema
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

module.exports = {
  generateText
};
