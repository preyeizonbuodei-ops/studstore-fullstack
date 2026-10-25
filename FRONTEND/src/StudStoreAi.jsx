
import { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import useAiStore from "./Store/StudStoreAiStore";

const markdownStyles =
  "[&_p]:mb-2 [&_p:last-child]:mb-0 " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 " +
  "[&_li]:mb-1 " +
  "[&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre]:my-3 " +
  "[&_code]:font-mono [&_code]:text-[0.92em] " +
  "[&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-2";

const SUGGESTIONS = [
  {
    icon: "∑",
    title: "Solve a math problem",
    question: "Solve 2x + 6 = 14 step by step",
  },
  {
    icon: "✦",
    title: "Explain a concept",
    question: "Explain photosynthesis simply",
  },
  {
    icon: "⚡",
    title: "Explore physics",
    question: "Help me understand Newton's second law",
  },
];

export default function StudStoreAi() {
  const {
    conversations,
    conversationId,
    messages,
    loading,
    error,
    askQuestion,
    fetchConversations,
    loadConversation,
    newChat,
  } = useAiStore();

  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [question, setQuestion] = useState("");
  const [copiedMessage, setCopiedMessage] = useState(null);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    if (open) fetchConversations();
  }, [open, fetchConversations]);

  useEffect(() => {
    if (open && !showHistory) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, open, showHistory]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [question, open, showHistory]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const send = async (text) => {
    const q = (text ?? question).trim();

    if (!q || loading) return;

    setQuestion("");
    await askQuestion(q);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const openChat = async (id) => {
    await loadConversation(id);
    setShowHistory(false);
  };

  const startNewChat = () => {
    newChat();
    setQuestion("");
    setShowHistory(false);
  };

  const copyMessage = async (content, id) => {
    try {
      await navigator.clipboard.writeText(content);

      setCopiedMessage(id);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopiedMessage(null);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy response:", err);
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className="fixed inset-x-2 bottom-2 top-2 z-50 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_25px_80px_-20px_rgba(15,23,42,0.4)] sm:inset-x-auto sm:right-6 sm:top-auto sm:bottom-24 sm:h-[620px] sm:max-h-[calc(100dvh-8rem)] sm:w-[420px]">
          {/* Compact Header */}
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 px-3 py-2 text-white sm:px-4 sm:py-4">
            <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-xl shadow-inner backdrop-blur-sm sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
                  ✦
                </div>

                <div className="min-w-0">
                  <h2 className="text-sm font-bold tracking-tight sm:text-base">
                    StudStore AI
                  </h2>

                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-blue-100 sm:mt-1 sm:text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] sm:h-2 sm:w-2" />
                    Your personal study companion
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  aria-label={showHistory ? "Back to chat" : "Chat history"}
                  title={showHistory ? "Back to chat" : "Chat history"}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs ${
                    showHistory
                      ? "bg-white text-indigo-700"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {showHistory ? "Back" : "History"}
                </button>

                <button
                  type="button"
                  onClick={startNewChat}
                  aria-label="Start a new chat"
                  title="New chat"
                  className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-semibold transition hover:bg-white/20 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs"
                >
                  + New
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close StudStore AI"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-white/80 transition hover:bg-white/15 hover:text-white sm:h-9 sm:w-9 sm:rounded-xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="relative mt-2 h-px bg-white/15 sm:mt-4" />

            <p className="relative mt-1.5 text-[10px] leading-snug text-blue-100 sm:mt-3 sm:text-xs sm:leading-relaxed">
              Learn at your pace. Ask questions, solve problems, and understand
              more.
            </p>
          </div>

          {/* Chat History */}
          {showHistory ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-4">
              <div className="mb-4">
                <h3 className="font-bold text-slate-800">
                  Your conversations
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Pick up where you left off.
                </p>
              </div>

              {conversations.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                  <span className="mb-3 text-3xl">💬</span>

                  <p className="text-sm font-semibold text-slate-700">
                    No saved chats yet
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Your conversations will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((c) => (
                    <button
                      type="button"
                      key={c._id}
                      onClick={() => openChat(c._id)}
                      className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        c._id === conversationId
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/60"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-lg text-indigo-700">
                        ◷
                      </span>

                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${
                          c._id === conversationId
                            ? "font-semibold text-blue-800"
                            : "text-slate-700"
                        }`}
                      >
                        {c.title}
                      </span>

                      <span className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-3 sm:gap-4 sm:p-4">
                {messages.length === 0 && !loading ? (
                  <div className="m-auto w-full max-w-sm py-3 sm:py-5">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100 text-2xl text-indigo-700 shadow-sm sm:mb-4 sm:h-16 sm:w-16 sm:rounded-3xl sm:text-3xl">
                      ✦
                    </div>

                    <div className="mb-4 text-center sm:mb-6">
                      <h3 className="text-base font-bold tracking-tight text-slate-800 sm:text-lg">
                        What are we learning today?
                      </h3>

                      <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
                        Ask a question or share a problem. I'll help you work
                        through it step by step.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          type="button"
                          key={s.title}
                          onClick={() => send(s.question)}
                          disabled={loading}
                          className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:opacity-50 sm:rounded-2xl sm:p-3.5"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700 transition group-hover:bg-blue-100 sm:h-10 sm:w-10">
                            {s.icon}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-slate-800 sm:text-sm">
                              {s.title}
                            </span>

                            <span className="mt-1 block text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                              {s.question}
                            </span>
                          </span>

                          <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600">
                            →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={m._id || i}
                      className={`flex items-end gap-2 ${
                        m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {m.role !== "user" && (
                        <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-sm text-white shadow-sm">
                          ✦
                        </div>
                      )}

                      {m.role === "user" ? (
                        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-indigo-700 px-4 py-3 text-sm leading-relaxed text-white shadow-md shadow-blue-900/10">
                          {m.content}
                        </div>
                      ) : (
                        <div className="min-w-0 max-w-[90%] break-words rounded-2xl rounded-bl-md border border-slate-200/80 bg-white px-4 py-3 text-sm leading-7 text-slate-700 shadow-sm">
                          <div className={markdownStyles}>
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>

                          {/* Copy AI Response */}
                          <div className="mt-3 flex justify-end border-t border-slate-100 pt-2">
                            <button
                              type="button"
                              onClick={() =>
                                copyMessage(m.content, m._id || i)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                              aria-label="Copy AI response"
                              title="Copy response"
                            >
                              {copiedMessage === (m._id || i) ? (
                                <>
                                  <Check size={14} />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {loading && (
                  <div className="flex items-end gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-sm text-white">
                      ✦
                    </div>

                    <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="mb-2 text-xs font-medium text-slate-500">
                        StudStore AI is thinking
                      </p>

                      <div className="flex gap-1.5">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="self-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700"
                  >
                    <span className="font-bold">Something went wrong. </span>
                    {error}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div className="shrink-0 border-t border-slate-200 bg-white p-2 sm:p-3">
                <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask your study question..."
                    rows={1}
                    aria-label="Your question"
                    className="max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => send()}
                    disabled={loading || !question.trim()}
                    aria-label="Send question"
                    title="Send message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-bold text-white shadow-md shadow-blue-600/20 transition hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  >
                    ↑
                  </button>
                </div>

                <p className="mt-1.5 text-center text-[10px] text-slate-400 sm:mt-2">
                  AI can make mistakes. Check important answers.
                  <span className="hidden sm:inline"> · </span>
                  <span className="hidden sm:inline">
                    Enter to send · Shift + Enter for a new line
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating AI Button: hidden while chat is open */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask StudStore AI"
          className="group fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 px-3 py-2.5 text-white shadow-[0_8px_30px_-6px_rgba(79,70,229,0.65)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_-6px_rgba(79,70,229,0.75)] sm:bottom-6 sm:right-6 sm:gap-2.5 sm:px-5 sm:py-3"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xl transition group-hover:rotate-12 sm:h-9 sm:w-9">
            ✦
          </span>

          <span className="text-left">
            <span className="block text-xs font-bold leading-tight sm:text-sm">
              Ask StudStore AI
            </span>

            <span className="mt-0.5 hidden text-[10px] text-blue-100 sm:block">
              Your study companion
            </span>
          </span>
        </button>
      )}
    </>
  );
}
