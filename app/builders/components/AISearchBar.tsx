
"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Mic, ArrowRight, Loader2 } from "lucide-react";

const EXAMPLES = [
  "Show me frontend developers in Kenya",
  "Find React developers",
  "Show UI/UX designers in Africa",
  "Find Python developers with AI experience",
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
};

export default function AISearchBar({
  value,
  onChange,
  onSearch,
  isSearching = false,
}: Props) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Rotate placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % EXAMPLES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search isn't supported in this browser yet.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onChange(transcript);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognitionRef.current = recognition;
    }

    setIsListening(true);
    recognitionRef.current.start();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#00AFEF]">
        <Sparkles size={12} />
        AI Search
      </div>

      <div className="flex w-full items-center gap-2 rounded-2xl border border-border bg-surface px-5 py-2 transition-colors focus-within:border-[#00AFEF]">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={EXAMPLES[placeholderIndex]}
          className="flex-1 bg-transparent py-3 text-base text-foreground placeholder:text-muted outline-none"
        />

        <button
          type="button"
          onClick={handleVoiceSearch}
          title="Voice search"
          aria-label="Start voice search"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            isListening
              ? "animate-pulse bg-[#00AFEF] text-white"
              : "text-muted hover:bg-surface-secondary hover:text-foreground"
          }`}
        >
          <Mic size={16} />
        </button>

        <button
          type="button"
          onClick={onSearch}
          disabled={isSearching}
          title="Search"
          aria-label="Search"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00AFEF] text-white transition-all hover:bg-[#0098D1] active:scale-95 disabled:opacity-60"
        >
          {isSearching ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowRight size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
