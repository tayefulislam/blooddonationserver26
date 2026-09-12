const adminSettingService = require("../adminSettingService");
const { PROVIDERS, PROVIDER_MODELS } = require("./providers");
const AiUsage = require("../../models/AiUsage");

const getToday = () => new Date().toISOString().slice(0, 10);

const isEnabled = async () => {
  const aiEnabled = await adminSettingService.getSetting("ai_enabled");
  if (aiEnabled !== null) return aiEnabled !== false;
  const deepseekEnabled = await adminSettingService.getSetting("deepseek_enabled");
  return deepseekEnabled !== false;
};

const getActiveProvider = async () => {
  const providerName = await adminSettingService.getSetting("ai_provider");
  const name = providerName || "deepseek";
  return PROVIDERS[name] || PROVIDERS.deepseek;
};

const getActiveModel = async () => {
  const model = await adminSettingService.getSetting("ai_model");
  return model || "deepseek-chat";
};

const getFallbackProvider = async () => {
  const fallbackEnabled = await adminSettingService.getSetting("ai_fallback_enabled");
  if (!fallbackEnabled) return null;
  const fallbackName = await adminSettingService.getSetting("ai_fallback_provider");
  if (!fallbackName || !PROVIDERS[fallbackName]) return null;
  return PROVIDERS[fallbackName];
};

const checkDailyLimit = async () => {
  const limit = await adminSettingService.getSetting("ai_daily_limit");
  if (!limit || limit <= 0) return true;
  const today = getToday();
  const count = await AiUsage.countDocuments({ date: today, success: true });
  return count < limit;
};

const logUsage = async ({ provider, model, feature, success, responseTimeMs, usage, error }) => {
  const today = getToday();
  AiUsage.create({
    date: today,
    provider,
    model,
    feature,
    promptTokens: usage?.promptTokens || 0,
    completionTokens: usage?.completionTokens || 0,
    totalTokens: usage?.totalTokens || 0,
    responseTimeMs,
    success,
    error: error || undefined,
  }).catch((err) => console.error("[AI] Usage logging failed:", err.message));
};

const callProvider = async (provider, model, prompt, feature) => {
  const start = Date.now();
  try {
    const result = await provider.generateText({
      userPrompt: prompt,
      temperature: feature === "explanations" ? 0.5 : 0.7,
      maxTokens: feature === "explanations" ? 500 : 1000,
      model,
    });
    logUsage({
      provider: provider.name,
      model,
      feature,
      success: true,
      responseTimeMs: Date.now() - start,
      usage: result.usage,
    });
    return result.content;
  } catch (err) {
    logUsage({
      provider: provider.name,
      model,
      feature,
      success: false,
      responseTimeMs: Date.now() - start,
      error: err.message,
    });
    throw err;
  }
};

const generateInsights = async (analyticsData) => {
  const enabled = await isEnabled();
  const provider = await getActiveProvider();
  const model = await getActiveModel();
  console.log(
    `[AI] generateInsights — enabled: ${enabled}, provider: ${provider.name}, model: ${model}, configured: ${provider.isConfigured()}`
  );

  if (!enabled) return null;
  if (!(await checkDailyLimit())) {
    console.log("[AI] Daily limit reached, skipping");
    return null;
  }

  const featureEnabled = await adminSettingService.getSetting("ai_feature_insights");
  if (featureEnabled === false) {
    console.log("[AI] ai_feature_insights is disabled, skipping");
    return null;
  }

  if (!provider.isConfigured()) {
    console.log(`[AI] Provider "${provider.name}" not configured (missing API key)`);
    const fallback = await getFallbackProvider();
    if (!fallback || !fallback.isConfigured()) return null;
    return runInsights(fallback, analyticsData);
  }

  return runInsights(provider, analyticsData);
};

const runInsights = async (provider, analyticsData) => {
  const model = await getActiveModel();
  console.log(`[AI] Calling ${provider.name} with model ${model} for insights...`);
  const prompt = `You are a blood donation analytics assistant. Analyze the following data and provide 3-5 key insights and recommendations for blood donation management. Be concise and actionable.

Data:
${JSON.stringify(analyticsData, null, 2)}

Provide insights in this JSON format:
{
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

  try {
    const content = await callProvider(provider, model, prompt, "insights");
    console.log(`[AI] Insights received from ${provider.name} (${content.length} chars)`);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { insights: [content], recommendations: [] };
  } catch (err) {
    console.error(`[AI] Insight generation failed (${provider.name}): ${err.message}`);
    const fallback = await getFallbackProvider();
    if (fallback && fallback.isConfigured() && fallback.name !== provider.name) {
      return runInsights(fallback, analyticsData);
    }
    return null;
  }
};

const explainPrediction = async (predictionData) => {
  const enabled = await isEnabled();
  const provider = await getActiveProvider();
  const model = await getActiveModel();
  console.log(
    `[AI] explainPrediction — enabled: ${enabled}, provider: ${provider.name}, model: ${model}, configured: ${provider.isConfigured()}`
  );

  if (!enabled) return null;
  if (!(await checkDailyLimit())) {
    console.log("[AI] Daily limit reached, skipping");
    return null;
  }

  const featureEnabled = await adminSettingService.getSetting("ai_feature_explanations");
  if (featureEnabled === false) {
    console.log("[AI] ai_feature_explanations is disabled, skipping");
    return null;
  }

  if (!provider.isConfigured()) {
    console.log(`[AI] Provider "${provider.name}" not configured (missing API key)`);
    const fallback = await getFallbackProvider();
    if (!fallback || !fallback.isConfigured()) return null;
    return runExplanation(fallback, predictionData);
  }

  return runExplanation(provider, predictionData);
};

const runExplanation = async (provider, predictionData) => {
  const model = await getActiveModel();
  console.log(`[AI] Calling ${provider.name} with model ${model} for explanation...`);
  const prompt = `You are a blood donation demand prediction assistant. Explain the following prediction in plain language. Be specific about which blood groups and areas are affected.

Prediction:
${JSON.stringify(predictionData, null, 2)}

Provide a clear, concise explanation (2-3 sentences) of what the prediction means and any notable patterns.`;

  try {
    const result = await callProvider(provider, model, prompt, "explanations");
    console.log(`[AI] Explanation received from ${provider.name} (${result.length} chars)`);
    return result;
  } catch (err) {
    console.error(`[AI] Prediction explanation failed (${provider.name}): ${err.message}`);
    const fallback = await getFallbackProvider();
    if (fallback && fallback.isConfigured() && fallback.name !== provider.name) {
      return runExplanation(fallback, predictionData);
    }
    return null;
  }
};

module.exports = {
  generateInsights,
  explainPrediction,
  getActiveProvider,
  getActiveModel,
  getFallbackProvider,
};
