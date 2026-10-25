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

  // Rotate placeholder examples so people see what kinds of queries work
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
      <div className="flex items-center gap-1.5 text-xs font-medium text-[#00AFEF] uppercase tracking-wider">
        <Sparkles size={12} />
        AI Search
      </div>

      <div className="flex items-center gap-2 w-full rounded-2xl border border-white/10 bg-[#121215] px-5 py-2 transition-colors focus-within:border-white/10">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={EXAMPLES[placeholderIndex]}
          className="flex-1 bg-transparent py-3 text-base text-white  placeholder:text-white/30 outline-none"
        />

        <button
          onClick={handleVoiceSearch}
          title="Voice search"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            isListening
              ? "bg-[#00AFEF] text-purple-400 animate-pulse"
              : "text-white/40 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Mic size={16} />
        </button>

        <button
          onClick={onSearch}
          disabled={isSearching}
          title="Search"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00AFEF] text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-60"
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