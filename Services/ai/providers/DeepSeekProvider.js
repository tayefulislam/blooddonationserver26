const BaseProvider = require("./BaseProvider");

class DeepSeekProvider extends BaseProvider {
  constructor() {
    super("deepseek");
    this.apiUrl = "https://api.deepseek.com/v1/chat/completions";
    this.defaultModel = "deepseek-chat";
  }

  isConfigured() {
    return !!process.env.DEEPSEEK_API_KEY;
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 1000, model }) {
    if (!this.isConfigured()) {
      throw new Error("DeepSeek API key not configured");
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
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
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
      throw new Error(`DeepSeek API error ${response.status}: ${text}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from DeepSeek");

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

module.exports = DeepSeekProvider;
