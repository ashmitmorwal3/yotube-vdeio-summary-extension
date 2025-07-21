// src/utils.js
export async function summarizeText(text) {
  const apiUrl =
    "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
  const HF_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_TOKEN;
  // Add instruction for bullet points
  const prompt = `Summarize the following text in detailed bullet points:\n${text.slice(
    0,
    4000
  )}`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HF_TOKEN}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        min_length: 150, // minimum summary length
        max_length: 400, // maximum summary length
        do_sample: false,
      },
    }),
  });
  if (!response.ok) {
    throw new Error("API error");
  }
  const data = await response.json();
  if (
    !data ||
    data.error ||
    !Array.isArray(data) ||
    !data[0] ||
    typeof data[0].summary_text !== "string"
  ) {
    throw new Error("Summarization failed");
  }
  // Try to format as bullet points if not already
  let summary = data[0].summary_text;
  if (typeof summary !== "string") summary = "";
  if (!/^\s*[-•]/m.test(summary)) {
    summary = summary
      .split(/(?<=[.!?])\s+/)
      .filter((line) => typeof line === "string" && line.trim().length > 0)
      .map((line) => `• ${line.trim()}`)
      .join("\n");
  }
  return summary;
}
