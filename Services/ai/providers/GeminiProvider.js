const BaseProvider = require("./BaseProvider");

class GeminiProvider extends BaseProvider {
  constructor() {
    super("gemini");
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    this.defaultModel = "gemini-2.0-flash";
  }

  isConfigured() {
    return !!process.env.GEMINI_API_KEY;
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 1000, model }) {
    if (!this.isConfigured()) {
      throw new Error("Gemini API key not configured");
    }

    const modelName = model || this.defaultModel;
    const url = `${this.baseUrl}/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const body = {
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Gemini API error ${response.status}: ${text}`);
    }

    const result = await response.json();

    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Empty response from Gemini");

    return {
      content,
      usage: {
        promptTokens: result.usageMetadata?.promptTokenCount || 0,
        completionTokens: result.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.usageMetadata?.totalTokenCount || 0,
      },
    };
  }
}

module.exports = GeminiProvider;
