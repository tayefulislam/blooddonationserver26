const adminSettingService = require("./adminSettingService");

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const isAvailable = async () => {
  if (!DEEPSEEK_API_KEY) return false;
  const enabled = await adminSettingService.getSetting("deepseek_enabled");
  return enabled !== false;
};

exports.generateInsights = async (analyticsData) => {
  if (!(await isAvailable())) return null;

  try {
    const prompt = `You are a blood donation analytics assistant. Analyze the following data and provide 3-5 key insights and recommendations for blood donation management. Be concise and actionable.

Data:
${JSON.stringify(analyticsData, null, 2)}

Provide insights in this JSON format:
{
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);

    return { insights: [content], recommendations: [] };
  } catch (err) {
    console.error(`[DEEPSEEK] Insight generation failed: ${err.message}`);
    return null;
  }
};

exports.explainPrediction = async (predictionData) => {
  if (!(await isAvailable())) return null;

  try {
    const prompt = `You are a blood donation demand prediction assistant. Explain the following prediction in plain language. Be specific about which blood groups and areas are affected.

Prediction:
${JSON.stringify(predictionData, null, 2)}

Provide a clear, concise explanation (2-3 sentences) of what the prediction means and any notable patterns.`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error(`[DEEPSEEK] Prediction explanation failed: ${err.message}`);
    return null;
  }
};
