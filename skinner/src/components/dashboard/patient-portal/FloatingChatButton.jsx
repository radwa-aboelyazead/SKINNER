"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import AIHealthAssistant from "./tabs/AIHealthAssistant";

export default function FloatingChatButton({ userName = "there" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[min(380px,calc(100vw-2rem))] shadow-2xl">
          <AIHealthAssistant userName={userName} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
        aria-label="Toggle chat"
      >
        {isOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}
