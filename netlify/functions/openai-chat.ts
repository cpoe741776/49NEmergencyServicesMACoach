// netlify/functions/openai-chat.ts
import type { Handler } from "@netlify/functions";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // server-only env var

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!OPENAI_API_KEY) {
    return { statusCode: 500, body: "Missing OPENAI_API_KEY" };
  }

  try {
    const { messages, model = "gpt-4o-mini", temperature = 0.3, max_tokens = 300 } =
      JSON.parse(event.body || "{}");

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        response_format: { type: "text" },
        messages,
      }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return { statusCode: r.status, body: t || r.statusText };
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };
  } catch (err: any) {
    return { statusCode: 500, body: `Function error: ${err?.message || err}` };
  }
};
