"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useChromeSize, useSheetViewport } from "@/components/ui/design-layout";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Halo! Saya Concierge AI Sultan Arloji. Ada yang bisa saya bantu terkait koleksi jam tangan mewah kami? Anda dapat menanyakan produk terlaris, rekomendasi jam, atau detail spesifikasi.",
};

const QUICK_PROMPTS = [
  "Apa jam terlaris saat ini?",
  "Rekomendasi jam formal?",
  "Apakah barang 100% original?",
];

export function AIChatFloating({ hidden }: { hidden: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const launcher = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const conversation = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const messageId = useRef(0);
  useChromeSize(launcher, "bottom", 16);
  useSheetViewport(isOpen);

  useEffect(() => {
    const panel = conversation.current;
    if (isOpen && panel) panel.scrollTop = panel.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => () => request.current?.abort(), []);

  async function handleSendMessage(textToSend: string) {
    const text = textToSend.trim();
    if (!text || request.current) return;

    const controller = new AbortController();
    request.current = controller;
    const id = ++messageId.current;
    const assistantId = `assistant-${id}`;
    const newMessages: Message[] = [...messages, { id: `user-${id}`, role: "user", content: text }];
    setMessages([...newMessages, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setAnnouncement("");
    setIsLoading(true);

    function updateAssistant(content: string) {
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content } : message));
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ messages: newMessages.map(({ role, content }) => ({ role, content })) }),
      });
      if (!response.ok || !response.body) throw new Error("Gagal menerima respons dari asisten AI.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        accumulatedText += done ? decoder.decode() : decoder.decode(value, { stream: true });
        if (controller.signal.aborted) return;
        if (accumulatedText) updateAssistant(accumulatedText);
        if (done) break;
      }
      if (controller.signal.aborted) return;
      if (!accumulatedText.trim()) throw new Error("Respons asisten kosong.");
      setAnnouncement(`Asisten: ${accumulatedText}`);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Chat streaming error:", error);
      const message = "Asisten AI sedang mengalami kendala. Silakan kirim pertanyaan lagi.";
      updateAssistant(message);
      setAnnouncement(message);
    } finally {
      if (request.current === controller) {
        request.current = null;
        setIsLoading(false);
      }
    }
  }

  function resetChat() {
    request.current?.abort();
    request.current = null;
    setMessages([INITIAL_MESSAGE]);
    setIsLoading(false);
    setAnnouncement("Percakapan dimulai ulang.");
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        ref={launcher}
        hidden={hidden}
        className="action ai-launcher on-brand fixed z-40 rounded-full border-brand px-4 shadow-lg"
      >
        <Sparkles aria-hidden="true" /> Asisten AI
      </DialogTrigger>

      <DialogContent sheet showCloseButton={false} initialFocus={closeButton} finalFocus={launcher} className="h-[min(640px,82dvh)]">
        <div className="on-brand gutter flex shrink-0 items-center justify-between gap-2 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Bot size={20} aria-hidden="true" className="shrink-0 text-yellow-action" />
            <DialogTitle className="text-lg leading-6 font-bold">Asisten AI</DialogTitle>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="action action-on-brand action-icon" onClick={resetChat} aria-label="Mulai ulang percakapan"><RefreshCw aria-hidden="true" /></button>
            <DialogClose ref={closeButton} className="action action-on-brand action-icon" aria-label="Tutup"><X aria-hidden="true" /></DialogClose>
          </div>
        </div>

        <div ref={conversation} tabIndex={0} role="region" aria-label="Percakapan" className="sheet-scroll gutter min-h-0 flex-1 py-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-sm leading-5 wrap-anywhere whitespace-pre-wrap ${message.role === "user" ? "bg-yellow-action" : "bg-brand-tint"}`}>
                  <p className="mb-1 text-xs font-bold text-brand">{message.role === "user" ? "Anda" : "Asisten"}</p>
                  <p>{message.content || "Asisten sedang menjawab…"}</p>
                </div>
              </div>
            ))}
          </div>
          {messages.length <= 2 && (
            <div aria-label="Saran pertanyaan" role="group" className="mt-4 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button type="button" key={prompt} className="chip max-w-full whitespace-normal" onClick={(event) => {
                  if (event.detail === 0) inputRef.current?.focus();
                  void handleSendMessage(prompt);
                }} disabled={isLoading}>{prompt}</button>
              ))}
            </div>
          )}
        </div>

        <div className="sheet-footer gutter shrink-0 border-t border-border bg-surface pt-3">
          <p role="status" className={isLoading ? "mb-2 text-sm text-muted-foreground" : "sr-only"}>
            {isLoading ? "Asisten sedang menjawab…" : announcement}
          </p>
          <form className="flex items-center gap-2" onSubmit={(event) => {
            event.preventDefault();
            void handleSendMessage(input);
          }}>
            <label className="sr-only" htmlFor="ai-message">Pertanyaan untuk Asisten AI</label>
            <input ref={inputRef} id="ai-message" className="field" placeholder="Tanya tentang koleksi jam tangan…" value={input} onChange={(event) => setInput(event.target.value)} />
            <button type="submit" className="action action-primary action-icon" disabled={!input.trim() || isLoading} aria-label="Kirim">
              {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
