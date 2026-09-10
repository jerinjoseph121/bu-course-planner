"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export const SCHEDULE_CHANGED_EVENT = "schedule:changed";

type Message = { role: "user" | "assistant"; content: string };

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm your course planner assistant. Ask me about courses in the catalog, your current schedule, or anything else.",
};

export function AssistantWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        if (data.actionsTaken) {
          window.dispatchEvent(new Event(SCHEDULE_CHANGED_EVENT));
          router.refresh();
        }
      }
    } catch {
      setError("Couldn't reach the assistant. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between bg-red-700 px-4 py-3">
            <span className="text-sm font-semibold text-white">
              Course Planner Assistant
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white"
              aria-label="Close assistant"
            >
              ✕
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-red-700 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
                  Thinking...
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 p-2">
            <input
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ask about courses, your schedule..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={sending}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-700 text-2xl text-white shadow-lg hover:bg-red-800"
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
