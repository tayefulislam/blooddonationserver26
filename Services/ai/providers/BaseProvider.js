class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 1000 }) {
    throw new Error(`${this.name}: generateText not implemented`);
  }

  isConfigured() {
    throw new Error(`${this.name}: isConfigured not implemented`);
  }

  async testConnection(model) {
    const start = Date.now();
    try {
      const result = await this.generateText({
        systemPrompt: "You are a test assistant.",
        userPrompt: "Say 'connection successful' in exactly 2 words.",
        temperature: 0,
        maxTokens: 20,
      });
      return {
        success: true,
        responseTime: Date.now() - start,
        model: model || this.defaultModel,
        content: result.content,
      };
    } catch (err) {
      return {
        success: false,
        responseTime: Date.now() - start,
        model: model || this.defaultModel,
        error: err.message,
      };
    }
  }
}

module.exports = BaseProvider;
