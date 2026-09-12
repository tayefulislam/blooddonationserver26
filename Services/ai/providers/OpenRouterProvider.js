const BaseProvider = require("./BaseProvider");

class OpenRouterProvider extends BaseProvider {
  constructor() {
    super("openrouter");
    this.apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.defaultModel = "openai/gpt-4o-mini";
  }

  isConfigured() {
    return !!process.env.OPENROUTER_API_KEY;
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 1000, model }) {
    if (!this.isConfigured()) {
      throw new Error("OpenRouter API key not configured");
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: userPrompt });

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://blood-donation-app.local",
        "X-Title": "Blood Donation AI",
      },
      body: JSON.stringify({
        model: model || this.defaultModel,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`OpenRouter API error ${response.status}: ${text}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenRouter");

    return {
      content,
      usage: {
        promptTokens: result.usage?.prompt_tokens || 0,
        completionTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
      },
    };
  }
}

module.exports = OpenRouterProvider;
