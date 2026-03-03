"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, SendHorizonal, Volume2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  voiceMode?: boolean;
  onVoiceModeToggle?: () => void;
  showVoiceToggle?: boolean;
}

export function ChatInput({
  onSend,
  disabled,
  voiceMode,
  onVoiceModeToggle,
  showVoiceToggle,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setValue(transcript);

      if (event.results[0]?.isFinal) {
        setIsListening(false);
        if (transcript.trim()) {
          onSend(transcript.trim());
          setValue("");
        }
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onSend]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    (!!(window as any).SpeechRecognition ||
      !!(window as any).webkitSpeechRecognition);

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-card/60 p-2 backdrop-blur-sm transition-colors focus-within:border-primary/30">
      {showVoiceToggle && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 shrink-0 rounded-xl ${voiceMode ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
          onClick={onVoiceModeToggle}
          title={voiceMode ? "텍스트 모드로 전환" : "음성 모드로 전환"}
        >
          <Volume2 className="h-4 w-4" />
        </Button>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "듣고 있습니다..." : "메시지를 입력하세요..."}
        disabled={disabled || isListening}
        rows={1}
        className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />

      {hasSpeechRecognition && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 shrink-0 rounded-xl ${isListening ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}
          disabled={disabled}
          onClick={isListening ? stopListening : startListening}
          title={isListening ? "음성 인식 중지" : "음성으로 입력"}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      )}

      <Button
        size="icon"
        className="h-8 w-8 shrink-0 rounded-xl"
        disabled={disabled || !value.trim() || isListening}
        onClick={handleSubmit}
      >
        <SendHorizonal className="h-4 w-4" />
      </Button>
    </div>
  );
}
