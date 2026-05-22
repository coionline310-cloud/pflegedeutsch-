import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { words } = await req.json();
    if (!Array.isArray(words) || !words.length) {
      return new Response(JSON.stringify({ error: "words required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const wordList = words.slice(0, 10).map((w: { de: string; vi: string }) => `${w.de} = ${w.vi}`).join("\n");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: "You are a German medical vocabulary exercise generator. Return ONLY valid JSON array, no markdown, no explanation.",
          },
          {
            role: "user",
            content: `Tạo 5 câu bài tập tiếng Đức từ danh sách:\n${wordList}\n\nTrả về JSON array, mỗi phần tử:\n{"type":"mcq"|"fill","q":"câu hỏi","ans":"đáp án tiếng Đức","opts":["A","B","C","D"],"hint":"gợi ý"}\nOpts chỉ cần cho mcq. Không thêm text ngoài JSON.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    const m = text.match(/\[[\s\S]*\]/);
    const exercises = m ? JSON.parse(m[0]) : [];

    return new Response(JSON.stringify({ exercises }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
