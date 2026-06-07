"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Bot,
  Send,
  Lock,
  AlertCircle,
  Maximize2,
  Minimize2,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cleanText, sanitizeText, validateMessage } from "@/lib/formValidation";
import { chatbotApi, getCurrentUser, unwrapData } from "@/services/skinnerApi";
import { useTranslation } from "@/context/LanguageContext";

function getUserStorageKeys() {
  const user = getCurrentUser();
  const uid = user?.id || user?.email || user?.medical_syndicate_id_card || "default";
  return {
    msgs: `skinner_chatbot_msgs_${uid}`,
    conv: `skinner_chatbot_conv_${uid}`,
  };
}

export default function AIHealthAssistant({ userName = "there" }) {
  const { t } = useTranslation();
  const keys = useMemo(() => getUserStorageKeys(), []);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(() => sessionStorage.getItem(keys.conv) || "");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const raw = sessionStorage.getItem(keys.msgs);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch { /* ignore */ }
    return [{
      id: 1,
      from: "ai",
      text: t("ai_welcome").replace("{name}", userName),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
    }];
  });

  const messagesEndRef = useRef(null);

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    try { sessionStorage.setItem(keys.msgs, JSON.stringify(messages)); } catch { /* ignore */ }
  }, [messages, keys.msgs]);

  // Persist conversationId
  useEffect(() => {
    try {
      if (conversationId) sessionStorage.setItem(keys.conv, conversationId);
    } catch { /* ignore */ }
  }, [conversationId, keys.conv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const inputError = validateMessage(input);
    if (inputError || isSending) return;

    const question = cleanText(input, 500);
    const now = () => new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    const userMessage = { id: Date.now(), from: "user", text: question, time: now() };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await chatbotApi.send({ query: question, conversation_id: conversationId || undefined });
      const data = unwrapData(response);
      if (data?.conversation_id) setConversationId(data.conversation_id);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        from: "ai",
        text: data?.answer || t("ai_no_answer"),
        time: now(),
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        from: "ai",
        text: error.message || t("ai_assistant_unavailable"),
        time: now(),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card
      className={`bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden flex flex-col p-0 gap-0 ${
        isExpanded ? "fixed inset-4 z-50" : "h-[500px]"
      }`}
    >
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/20">
            <Bot className="size-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t("ai_health_assistant")}</h3>
            <div className="flex items-center gap-1 text-[11px] text-white/90">
              <Lock className="size-3" />
              <span>{t("hipaa_compliant_encrypted")}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/90 hover:text-white transition cursor-pointer"
        >
          {isExpanded ? (
            <Minimize2 className="size-5" />
          ) : (
            <Maximize2 className="size-5" />
          )}
        </button>
      </div>

      {/* Warning Bar */}
      <div className="bg-yellow-50 border-b border-yellow-100 px-4 py-2.5 flex items-start gap-2 shrink-0">
        <AlertCircle className="size-4 text-yellow-600 mt-0.5 shrink-0" />
        <p className="text-[12px] text-yellow-800 leading-relaxed">
          {t("chatbot_warning")}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${
              msg.from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.from === "ai" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-500">
                <Bot className="size-4 text-white" />
              </div>
            )}

            <div className={`max-w-[80%] ${msg.from === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div
                className={`rounded-lg px-3 py-2.5 ${
                  msg.from === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-slate-900"
                }`}
              >
                <p className="text-[13px] leading-relaxed">{msg.text}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1 px-1">
                <Clock className="size-3" />
                <span>{msg.time}</span>
                <span>•</span>
                <Lock className="size-3" />
                <span>{t("encrypted")}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-100 bg-white px-3 py-3 shrink-0"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(sanitizeText(e.target.value, 500))}
            placeholder={t("type_message")}
            className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-[13px] outline-none border border-gray-200 focus:border-blue-300 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={Boolean(validateMessage(input)) || isSending}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {isSending ? <span className="text-[10px]">...</span> : <Send className="size-4" />}
          </button>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          {t("powered_by_ai")}
        </p>
      </form>
    </Card>
  );
}
