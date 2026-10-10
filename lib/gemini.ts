// SERVER-SIDE ONLY. Import this from API routes (app/api/*/route.ts),
// never from a "use client" component, so the API key stays private.

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export const hasGemini = Boolean(process.env.GEMINI_API_KEY);

type InlineImage = { mimeType: string; base64: string };

/** Sends a prompt (and optional image) to Gemini and parses the JSON reply. */
export async function geminiJSON<T>(
  prompt: string,
  image?: InlineImage
): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const parts: Record<string, unknown>[] = [{ text: prompt }];
  if (image) {
    parts.push({
      inline_data: { mime_type: image.mimeType, data: image.base64 },
    });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini request failed (${res.status})`);

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  return JSON.parse(text) as T;
}
