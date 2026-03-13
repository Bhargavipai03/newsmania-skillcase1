"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Article } from "@/services/newsService";
import { speakWithGCloud, stopSpeaking } from "@/utils/tts";
import { translate } from "@/utils/translate";
import { useLanguage } from "@/contexts/language-context";
import type { TTSLanguage } from "@/utils/tts";
import {
  X,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Globe,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

interface InshortReaderProps {
  articles: Article[];
  startIndex?: number;
  onClose: () => void;
}

export default function InshortReader({
  articles,
  startIndex = 0,
  onClose,
}: InshortReaderProps) {
  const { language, setLanguage } = useLanguage();
  const [current, setCurrent] = useState(startIndex);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(articles[startIndex]?.title || '');
  const [displaySummary, setDisplaySummary] = useState(articles[startIndex]?.summary || '');
  const [isTranslating, setIsTranslating] = useState(true);
  const [imageError, setImageError] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slideDir, setSlideDir] = useState<"up" | "down" | null>(null);

  const article = articles[current];

  // ── Handle translation on language change or current article change ────
  useEffect(() => {
    let cancelled = false;
    setIsTranslating(true);
    
    if (article) {
      Promise.all([
        translate(article.title, language),
        translate(article.summary, language),
      ]).then(([t, s]) => {
        if (!cancelled) {
          setDisplayTitle(t);
          setDisplaySummary(s);
          setIsTranslating(false);
        }
      }).catch(() => {
        if (!cancelled) {
          setDisplayTitle(article.title);
          setDisplaySummary(article.summary);
          setIsTranslating(false);
        }
      });
    }

    return () => { cancelled = true; };
  }, [article, language]);

  // ── Stop TTS when article changes ────────────────────────────────────────
  useEffect(() => {
    stopSpeaking();
    setIsSpeaking(false);
    setImageError(false);
  }, [current]);

  // Navigation ────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (dir: "up" | "down") => {
      const next =
        dir === "down"
          ? Math.min(current + 1, articles.length - 1)
          : Math.max(current - 1, 0);
      if (next === current) return;
      setSlideDir(dir);
      setTimeout(() => {
        setCurrent(next);
        setSlideDir(null);
      }, 180);
    },
    [current, articles.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") goTo("down");
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") goTo("up");
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, onClose]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? "down" : "up");
    }
    touchStartY.current = null;
  };

  // ── TTS ───────────────────────────────────────────────────────────────────
  const handleTTS = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    const text = displaySummary;
    const lang: TTSLanguage = language === 'de' ? 'de' : 'en';
    speakWithGCloud(
      text,
      lang,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        goTo('down'); // auto-advance to next article after reading
      },
    );
  };

  if (!article) return null;

  const progress = ((current + 1) / articles.length) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#111] text-white"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      ref={containerRef}
    >
      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-10">
        <div
          className="h-full bg-newsmania-yellow transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2 relative z-20">
        <span className="text-xs font-bold text-white/50 tracking-widest uppercase">
          {current + 1} / {articles.length}
        </span>
        <div className="flex gap-2 items-center">
          {/* Language toggle buttons */}
          <button
            onClick={() => setLanguage('de')}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
              language === 'de' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
            title="Deutsch"
          >
            🇩🇪 DE
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
              language === 'en' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
            title="English"
          >
            🇺🇸 EN
          </button>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="text-white/60 hover:text-white transition-colors p-1 pointer-events-auto"
        >
          <X size={22} />
        </button>
      </div>

      {/* ── Main card ────────────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col justify-between px-5 py-4 transition-all duration-180 overflow-y-auto ${
          slideDir === "down"
            ? "-translate-y-4 opacity-0"
            : slideDir === "up"
            ? "translate-y-4 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        {/* Image Container */}
        <div className="relative w-full h-40 bg-gray-800 rounded-lg overflow-hidden mb-4 flex-shrink-0">
          {!imageError && article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={displayTitle}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-newsmania-purple/30 to-newsmania-blue/30">
              <ImageIcon size={48} className="text-gray-500" />
            </div>
          )}
        </div>

        {/* Source + category badges */}
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="text-[11px] font-semibold bg-newsmania-blue/90 text-black px-2 py-0.5 rounded">
            {article.source}
          </span>
          <span className="text-[11px] font-semibold bg-newsmania-purple/90 text-black px-2 py-0.5 rounded">
            {article.category}
          </span>
          <span className="text-[11px] text-white/40 ml-auto self-center">
            {article.country}
          </span>
        </div>

        {/* Title & Summary */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          {/* Tap zones — perfectly constrained to the text area */}
          <div className="absolute inset-0 z-10 flex">
            <div className="flex-1 cursor-pointer" onClick={() => goTo("up")} />
            <div className="flex-1 cursor-pointer" onClick={() => goTo("down")} />
          </div>

          <div className="relative z-0 pointer-events-none">
            <div className="flex items-start gap-2">
              {isTranslating && <Loader2 size={24} className="animate-spin mt-1 shrink-0" />}
              <h2 className="text-2xl sm:text-3xl font-black leading-snug mb-5 text-white">
                {displayTitle}
              </h2>
            </div>

            {/* Divider */}
            <div className="w-12 h-1 bg-newsmania-yellow mb-5 rounded" />

            {/* Summary */}
            <p className="text-base sm:text-lg text-white/75 leading-relaxed">
              {displaySummary}
            </p>
          </div>
        </div>

        {/* ── Action bar ───────────────────────────────────────────────── */}
        <div className="relative z-50 mt-6 flex items-center justify-end gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); handleTTS(); }}
            className={`p-2 rounded-full transition-all pointer-events-auto ${
              isSpeaking
                ? "bg-newsmania-red animate-pulse"
                : "bg-newsmania-purple/80 hover:bg-newsmania-purple"
            }`}
            title={isSpeaking ? "Stop" : "Read aloud"}
          >
            {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* ── Up / Down navigation arrows ──────────────────────────────────── */}
      <div className="flex justify-center gap-8 pb-6 pt-2 relative z-20">
        <button
          onClick={() => goTo("up")}
          disabled={current === 0}
          className="flex flex-col items-center gap-0.5 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
        >
          <ChevronUp size={28} />
          <span className="text-[10px] tracking-widest uppercase">Prev</span>
        </button>

        {/* Dot indicator */}
        <div className="flex items-center gap-1.5">
          {articles.slice(Math.max(0, current - 2), current + 3).map((_, i) => {
            const dotIdx = Math.max(0, current - 2) + i;
            return (
              <div
                key={dotIdx}
                className={`rounded-full transition-all duration-200 ${
                  dotIdx === current
                    ? "w-3 h-3 bg-newsmania-yellow"
                    : "w-1.5 h-1.5 bg-white/25"
                }`}
              />
            );
          })}
        </div>

        <button
          onClick={() => goTo("down")}
          disabled={current === articles.length - 1}
          className="flex flex-col items-center gap-0.5 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
        >
          <ChevronDown size={28} />
          <span className="text-[10px] tracking-widest uppercase">Next</span>
        </button>
      </div>

    </div>
  );
}
