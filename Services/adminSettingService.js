const AdminSetting = require("../models/AdminSetting");

const DEFAULTS = {
  deepseek_enabled: {
    value: true,
    description: "Enable DeepSeek AI insights for predictions and analytics",
  },
  ai_enabled: {
    value: true,
    description: "Enable AI service for insights and explanations",
  },
  ai_provider: {
    value: "deepseek",
    description: "Active AI provider (deepseek | openrouter | gemini)",
  },
  ai_model: {
    value: "deepseek-chat",
    description: "AI model to use for text generation",
  },
  ai_fallback_enabled: {
    value: false,
    description: "Enable fallback to a secondary AI provider on failure",
  },
  ai_fallback_provider: {
    value: null,
    description: "Fallback AI provider (deepseek | openrouter | gemini)",
  },
  ai_daily_limit: {
    value: 0,
    description: "Daily AI request limit (0 = unlimited)",
  },
  ai_feature_insights: {
    value: true,
    description: "Enable AI-powered analytics insights",
  },
  ai_feature_explanations: {
    value: true,
    description: "Enable AI-powered prediction explanations",
  },
};

exports.getSetting = async (key) => {
  const doc = await AdminSetting.findOne({ key }).lean();
  if (doc) return doc.value;
  if (DEFAULTS[key]) return DEFAULTS[key].value;
  return null;
};

exports.setSetting = async (key, value, description) => {
  const update = { value };
  if (description) update.description = description;

  const doc = await AdminSetting.findOneAndUpdate(
    { key },
    { $set: update },
    { upsert: true, new: true }
  );
  return { key: doc.key, value: doc.value, description: doc.description };
};

exports.getAllSettings = async () => {
  const docs = await AdminSetting.find().lean();
  const result = {};
  for (const [key, def] of Object.entries(DEFAULTS)) {
    const doc = docs.find((d) => d.key === key);
    result[key] = {
      value: doc ? doc.value : def.value,
      description: def.description,
    };
  }
  for (const doc of docs) {
    if (!result[doc.key]) {
      result[doc.key] = {
        value: doc.value,
        description: doc.description || "",
      };
    }
  }
  return result;
};
