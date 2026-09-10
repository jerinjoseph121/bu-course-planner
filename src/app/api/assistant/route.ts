import { NextRequest, NextResponse } from "next/server";
import { buildAssistantContext } from "@/lib/assistantContext";
import { askGemini, ChatMessage, GeminiConfigError, GeminiApiError } from "@/lib/gemini";
import { ASSISTANT_TOOLS, executeAssistantTool } from "@/lib/assistantTools";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];

  if (messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  try {
    const context = await buildAssistantContext();
    const { reply, actionsTaken } = await askGemini(context, messages, {
      tools: ASSISTANT_TOOLS,
      executeTool: executeAssistantTool,
    });
    return NextResponse.json({ reply, actionsTaken });
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    if (err instanceof GeminiApiError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Something went wrong talking to the assistant." },
      { status: 500 }
    );
  }
}
