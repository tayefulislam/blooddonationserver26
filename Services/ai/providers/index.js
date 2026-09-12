const DeepSeekProvider = require("./DeepSeekProvider");
const OpenRouterProvider = require("./OpenRouterProvider");
const GeminiProvider = require("./GeminiProvider");

const PROVIDERS = {
  deepseek: new DeepSeekProvider(),
  openrouter: new OpenRouterProvider(),
  gemini: new GeminiProvider(),
};

const PROVIDER_MODELS = {
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  openrouter: [
    "openrouter/free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3.5-lightning:free",
  ],
  gemini: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
};

const PROVIDER_LABELS = {
  deepseek: "DeepSeek",
  openrouter: "OpenRouter",
  gemini: "Google Gemini",
};

module.exports = { PROVIDERS, PROVIDER_MODELS, PROVIDER_LABELS };
