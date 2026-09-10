export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ToolDeclaration = {
  name: string;
  description: string;
  parameters: object;
};

export type ToolExecutor = (
  name: string,
  args: Record<string, unknown>
) => Promise<{ mutated: boolean; [key: string]: unknown }>;

const DEFAULT_MODEL = "gemini-3.6-flash";
const MAX_TOOL_ROUNDS = 6;

export class GeminiConfigError extends Error {}
export class GeminiApiError extends Error {}

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

async function callGemini(
  systemInstruction: string,
  contents: GeminiContent[],
  tools?: ToolDeclaration[]
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiConfigError(
      "GEMINI_API_KEY is not set. Get a free key at https://ai.google.dev and add it to .env as GEMINI_API_KEY=..., then restart the dev server."
    );
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        ...(tools ? { tools: [{ functionDeclarations: tools }] } : {}),
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new GeminiApiError(`Gemini API request failed (${res.status}): ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const parts: GeminiPart[] | undefined = data?.candidates?.[0]?.content?.parts;
  if (!parts) {
    const finishReason = data?.candidates?.[0]?.finishReason;
    throw new GeminiApiError(
      `Gemini returned no content${finishReason ? ` (finishReason: ${finishReason})` : ""}.`
    );
  }
  return parts;
}

export async function askGemini(
  systemInstruction: string,
  messages: ChatMessage[],
  options?: { tools?: ToolDeclaration[]; executeTool?: ToolExecutor }
): Promise<{ reply: string; actionsTaken: boolean }> {
  const contents: GeminiContent[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let actionsTaken = false;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const parts = await callGemini(systemInstruction, contents, options?.tools);

    const functionCalls = parts.filter(
      (p): p is { functionCall: { name: string; args: Record<string, unknown> } } =>
        "functionCall" in p
    );

    if (functionCalls.length === 0 || !options?.executeTool) {
      const text = parts
        .map((p) => ("text" in p ? p.text : ""))
        .join("")
        .trim();
      if (!text) {
        throw new GeminiApiError("Gemini returned an empty reply.");
      }
      return { reply: text, actionsTaken };
    }

    contents.push({ role: "model", parts });

    const responseParts: GeminiPart[] = [];
    for (const fc of functionCalls) {
      const result = await options.executeTool(fc.functionCall.name, fc.functionCall.args ?? {});
      if (result.mutated) actionsTaken = true;
      responseParts.push({
        functionResponse: { name: fc.functionCall.name, response: { result } },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  throw new GeminiApiError("The assistant took too many steps without finishing. Try rephrasing your request.");
}
