"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Loader2,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Halo! Saya Concierge AI Sultan Arloji. Ada yang bisa saya bantu terkait koleksi jam tangan mewah kami? Anda dapat menanyakan produk terlaris, rekomendasi jam, atau detail spesifikasi.",
};

const QUICK_PROMPTS = [
  "Apa jam terlaris saat ini?",
  "Rekomendasi jam formal?",
  "Apakah barang 100% original?",
];

export function AIChatFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
    };

    setMessages([...newMessages, assistantPlaceholder]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Gagal menerima respons dari asisten AI.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: accumulatedText }
              : msg
          )
        );
      }
    } catch (err) {
      console.error("Chat streaming error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  "Mohon maaf, saat ini asisten AI sedang mengalami kendala jaringan. Silakan langsung hubungi admin butik kami via tombol WhatsApp.",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <>
      {/* Floating Action Button (Always inside mobile container) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Tanya Asisten AI"
          className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#997929] via-[#D4AF37] to-[#F3E5AB] p-3 text-black shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 group border border-white/20"
        >
          <div className="relative">
            <Sparkles className="size-6 text-black fill-black" />
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-emerald-500 border-2 border-black animate-pulse" />
          </div>
          <span className="text-xs font-bold pr-1 tracking-tight">
            Tanya AI
          </span>
        </button>
      )}

      {/* Expandable Chat Modal */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-0 sm:p-4">
          <div className="w-full max-w-md h-[82vh] max-h-[640px] rounded-t-3xl sm:rounded-3xl bg-[#141414] border border-neutral-800 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 bg-gradient-to-r from-neutral-900 to-[#181818] px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-gradient-to-tr from-[#997929] via-[#D4AF37] to-[#F3E5AB] p-0.5 shadow-sm">
                  <div className="size-full rounded-full bg-black flex items-center justify-center">
                    <Bot className="size-5 text-[#D4AF37]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Concierge AI Sultan Arloji
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    Katalog & Rekomendasi Terpercaya
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  title="Mulai Ulang Percakapan"
                  className="size-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <RefreshCw className="size-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Tutup Obrolan"
                  className="size-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="size-7 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 shrink-0 flex items-center justify-center mt-0.5">
                      <Sparkles className="size-3.5 text-[#D4AF37]" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-gradient-to-tr from-[#997929] to-[#D4AF37] text-black font-medium rounded-br-xs shadow-md"
                        : "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-xs shadow-inner"
                    }`}
                  >
                    {msg.content || (
                      <span className="flex items-center gap-1 text-neutral-500 text-[11px]">
                        <Loader2 className="size-3 animate-spin text-[#D4AF37]" />
                        Mengetik rekomendasi...
                      </span>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="size-7 rounded-full bg-neutral-800 shrink-0 flex items-center justify-center mt-0.5 text-neutral-300">
                      <User className="size-3.5" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Prompts */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-neutral-800/60 bg-neutral-950/40">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading}
                    className="shrink-0 rounded-full border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-[11px] text-neutral-300 hover:border-[#D4AF37]/60 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form Bar */}
            <div className="p-3 bg-neutral-950 border-t border-neutral-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pertanyaan seputar jam tangan..."
                  disabled={isLoading}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-[#D4AF37]"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="size-9 rounded-full bg-[#D4AF37] hover:bg-[#C5A059] text-black shrink-0 p-0 flex items-center justify-center shadow-md disabled:opacity-40"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin text-black" />
                  ) : (
                    <Send className="size-4 text-black" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
