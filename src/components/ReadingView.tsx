import React, { useState, useEffect } from 'react';
import { NewsArticle, TextSize } from '../types/news';
import {
  ArrowLeft,
  Volume2,
  Bookmark,
  ExternalLink,
  Share2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  Type,
  Check,
  Info
} from 'lucide-react';

interface ReadingViewProps {
  article: NewsArticle;
  allArticles: NewsArticle[];
  textSize: TextSize;
  onSetTextSize: (size: TextSize) => void;
  isBookmarked: boolean;
  onToggleBookmark: (article: NewsArticle) => void;
  onBack: () => void;
  onSelectArticle: (article: NewsArticle) => void;
  // Audio helpers
  isPlayingAudio: boolean;
  isPausedAudio: boolean;
  onPlayAudio: (text: string) => void;
  onPauseAudio: () => void;
  onResumeAudio: () => void;
  onStopAudio: () => void;
  speechRate: number;
  onSetSpeechRate: (rate: number) => void;
  hasMalayalamVoice: boolean;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  article,
  allArticles,
  textSize,
  onSetTextSize,
  isBookmarked,
  onToggleBookmark,
  onBack,
  onSelectArticle,
  isPlayingAudio,
  isPausedAudio,
  onPlayAudio,
  onPauseAudio,
  onResumeAudio,
  onStopAudio,
  speechRate,
  onSetSpeechRate,
  hasMalayalamVoice,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSettingsBar, setShowSettingsBar] = useState(false);

  // AI simplified explanation state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSimplified, setAiSimplified] = useState<{ summaryMl: string; whyItMattersMl: string } | null>(null);

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = window.scrollY;
        setScrollProgress(Math.min(100, Math.max(0, (current / totalHeight) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top on article change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setAiSimplified(null);
  }, [article.id]);

  // Clean full text for audio reading
  const fullTextToRead = `${article.title}. ${article.summary}. ${article.content.replace(/\n\n/g, '. ')}`;

  // Find previous and next articles in collection
  const currentIndex = allArticles.findIndex((a) => a.id === article.id);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  // Find 2-3 related articles
  const relatedArticles = allArticles
    .filter((a) => a.id !== article.id && (a.category === article.category || a.district === article.district))
    .slice(0, 3);

  // Font size classes based on user setting
  const headlineClass =
    textSize === 'extra-large'
      ? 'text-2xl sm:text-4xl'
      : textSize === 'large'
      ? 'text-xl sm:text-3xl'
      : 'text-lg sm:text-2xl';

  const bodyTextClass =
    textSize === 'extra-large'
      ? 'text-xl sm:text-2xl leading-[2.1]'
      : textSize === 'large'
      ? 'text-lg sm:text-xl leading-[1.9]'
      : 'text-base sm:text-lg leading-[1.8]';

  // Request AI simplification
  const handleRequestAiSummary = async () => {
    if (aiSimplified) return;
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
        }),
      });
      const data = await res.json();
      setAiSimplified(data);
    } catch (err) {
      console.warn('Could not simplify:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: article.sourceUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(article.sourceUrl || window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const paragraphs = article.content.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-[#1f1d1a] pb-24">
      {/* Subtle E-Book Reading Progress Bar at top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#eae5d8] z-50">
        <div
          className="h-full bg-[#1e4732] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Reading Navigation Bar */}
      <nav
        aria-label="വായന മെനു"
        className="sticky top-0 bg-[#fcfbf7]/95 backdrop-blur-xs border-b border-[#ece6d8] z-40 px-3 sm:px-6 py-2.5"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={onBack}
            aria-label="വാർത്തകളുടെ പട്ടികയിലേക്ക് മടങ്ങുക"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#1e4732] bg-[#f2eee3] hover:bg-[#e7e1d3] active:bg-[#dbd4c4] rounded-lg transition-colors min-h-[48px] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>തിരികെ</span>
          </button>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                if (isPlayingAudio) {
                  onStopAudio();
                } else {
                  onPlayAudio(fullTextToRead);
                }
              }}
              aria-label={isPlayingAudio ? 'ശബ്ദവായന നിർത്തുക' : 'മുഴുവൻ വാർത്തയും ശബ്ദത്തിൽ കേൾക്കാം'}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors min-h-[48px] cursor-pointer ${
                isPlayingAudio
                  ? 'bg-[#1e4732] text-white'
                  : 'bg-[#edf4ef] text-[#1e4732] hover:bg-[#dfeee3]'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingAudio ? 'നിർത്തുക' : 'കേൾക്കാം'}</span>
            </button>

            {/* Font settings toggle */}
            <button
              onClick={() => setShowSettingsBar(!showSettingsBar)}
              aria-label="അക്ഷരത്തിന്റെ വലുപ്പം മാറ്റുക"
              title="അക്ഷരത്തിന്റെ വലുപ്പം"
              className={`p-2.5 rounded-lg text-sm font-medium min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors cursor-pointer ${
                showSettingsBar
                  ? 'bg-[#1e4732] text-white'
                  : 'bg-[#f4efe4] text-[#423c34] hover:bg-[#eae4d5]'
              }`}
            >
              <Type className="w-5 h-5" />
            </button>

            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark(article)}
              aria-label={isBookmarked ? 'വായനാശേഖരത്തിൽ നിന്ന് ഒഴിവാക്കുക' : 'വായനാശേഖരത്തിൽ സൂക്ഷിക്കുക'}
              title={isBookmarked ? 'സൂക്ഷിച്ചിരിക്കുന്നു' : 'സൂക്ഷിക്കുക'}
              className={`p-2.5 rounded-lg text-sm font-medium min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-[#edf4ef] text-[#1e4732]'
                  : 'bg-[#f4efe4] text-[#423c34] hover:bg-[#eae4d5]'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current text-[#1e4732]' : ''}`} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              aria-label="വാർത്ത പങ്കുവെക്കുക"
              title="പങ്കുവെക്കുക"
              className="p-2.5 rounded-lg text-sm font-medium min-h-[48px] min-w-[48px] flex items-center justify-center bg-[#f4efe4] text-[#423c34] hover:bg-[#eae4d5] transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-5 h-5 text-[#1e4732]" /> : <Share2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* E-Book Reading Settings Drawer (Quick font & speed switcher) */}
        {showSettingsBar && (
          <div className="max-w-2xl mx-auto mt-2 pt-2 border-t border-[#e8e2d4] bg-[#f7f5ed] p-3 rounded-xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Text Size options */}
              <div>
                <div className="text-xs font-semibold text-[#655e53] mb-1.5">
                  അക്ഷരത്തിന്റെ വലുപ്പം:
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSetTextSize('normal')}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium min-h-[40px] cursor-pointer ${
                      textSize === 'normal'
                        ? 'bg-[#1e4732] text-white font-bold'
                        : 'bg-[#ede8db] text-[#4a443a] hover:bg-[#e2dcce]'
                    }`}
                  >
                    സാധാരണം
                  </button>
                  <button
                    onClick={() => onSetTextSize('large')}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium min-h-[40px] cursor-pointer ${
                      textSize === 'large'
                        ? 'bg-[#1e4732] text-white font-bold'
                        : 'bg-[#ede8db] text-[#4a443a] hover:bg-[#e2dcce]'
                    }`}
                  >
                    വലുത്
                  </button>
                  <button
                    onClick={() => onSetTextSize('extra-large')}
                    className={`px-3 py-1.5 text-base rounded-md font-medium min-h-[40px] cursor-pointer ${
                      textSize === 'extra-large'
                        ? 'bg-[#1e4732] text-white font-bold'
                        : 'bg-[#ede8db] text-[#4a443a] hover:bg-[#e2dcce]'
                    }`}
                  >
                    ഏറ്റവും വലുത്
                  </button>
                </div>
              </div>

              {/* Speech Speed options */}
              <div>
                <div className="text-xs font-semibold text-[#655e53] mb-1.5">
                  ശബ്ദവായനയുടെ വേഗത:
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSetSpeechRate(0.8)}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium min-h-[40px] cursor-pointer ${
                      speechRate < 0.9
                        ? 'bg-[#1e4732] text-white font-bold'
                        : 'bg-[#ede8db] text-[#4a443a] hover:bg-[#e2dcce]'
                    }`}
                  >
                    പതുക്കെ (0.8x)
                  </button>
                  <button
                    onClick={() => onSetSpeechRate(1.0)}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium min-h-[40px] cursor-pointer ${
                      speechRate >= 0.9
                        ? 'bg-[#1e4732] text-white font-bold'
                        : 'bg-[#ede8db] text-[#4a443a] hover:bg-[#e2dcce]'
                    }`}
                  >
                    സാധാരണ (1.0x)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main E-Book Article Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Anti-Slop Zero-Pill: Clean unboxed metadata with dot separators */}
        <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-[#6c655b] mb-3 font-medium">
          <span className="text-[#1e4732] font-semibold">{article.categoryNameMl}</span>
          <span aria-hidden="true" className="text-[#bfb8a9]">·</span>
          <span>{article.source}</span>
          <span aria-hidden="true" className="text-[#bfb8a9]">·</span>
          <span>{article.publishedAtMalayalam}</span>
        </div>

        {/* Headline */}
        <h1 className={`font-bold font-serif text-[#171513] tracking-tight leading-snug sm:leading-tight mb-4 ${headlineClass}`}>
          {article.title}
        </h1>

        {/* Audio Player Bar (when active or listening) */}
        {isPlayingAudio && (
          <div className="my-5 p-4 bg-[#edf4ef] border border-[#cbe0d3] rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1e4732] text-white flex items-center justify-center">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1e4732]">
                  വാർത്ത വായിക്കുന്നു...
                </div>
                <div className="text-xs text-[#527763]">
                  വേഗത: {speechRate < 0.9 ? 'പതുക്കെ (0.8x)' : 'സാധാരണ (1.0x)'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPausedAudio ? (
                <button
                  onClick={onResumeAudio}
                  aria-label="തുടരുക"
                  className="p-2.5 bg-[#1e4732] text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={onPauseAudio}
                  aria-label="താൽക്കാലികമായി നിർത്തുക"
                  className="p-2.5 bg-[#1e4732] text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onStopAudio}
                aria-label="വായന പൂർണ്ണമായി നിർത്തുക"
                className="p-2.5 bg-[#ded7c5] hover:bg-[#d0c8b3] text-[#332f28] rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* Notice if Malayalam voice is not installed on system */}
        {!hasMalayalamVoice && isPlayingAudio && (
          <div className="mb-4 p-3 bg-[#f6f2e8] border border-[#e4dcce] rounded-lg text-xs text-[#61594e] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#1e4732] shrink-0 mt-0.5" />
            <p>
              നിങ്ങളുടെ ഫോണിലെ ശബ്ദ സംവിധാനം ഉപയോഗിച്ചാണ് ഇത് വായിക്കുന്നത്. കൂടുതൽ വ്യക്തമായ മലയാളം ശബ്ദത്തിനായി ഫോൺ സെറ്റിംഗ്സിൽ മലയാളം വോയ്സ് ഡൗൺലോഡ് ചെയ്യാവുന്നതാണ്.
            </p>
          </div>
        )}

        {/* Summary Lead Paragraph */}
        <div className="p-4 sm:p-5 bg-[#f6f3e8] border-l-4 border-[#1e4732] rounded-r-xl my-5 text-[#2b2721] font-medium leading-relaxed text-base sm:text-lg">
          {article.summary}
        </div>

        {/* Why this matters callout (എന്തുകൊണ്ട് ഈ വാർത്ത പ്രധാനം?) */}
        {article.whyItMatters && (
          <div className="p-4 bg-[#f1f6f2] border border-[#d6e7db] rounded-xl my-5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e4732] uppercase tracking-wide mb-1">
              <Info className="w-4 h-4 text-[#1e4732]" />
              <span>എന്തുകൊണ്ട് ഇത് പ്രധാനം?</span>
            </div>
            <p className="text-sm sm:text-base text-[#223d2e] leading-relaxed">
              {article.whyItMatters}
            </p>
          </div>
        )}

        {/* Dedicated Article Body Paragraphs - Book-like typography */}
        <div className={`mt-6 space-y-6 text-[#24211d] font-serif ${bodyTextClass}`}>
          {paragraphs.map((p, idx) => (
            <p key={idx} className="tracking-normal text-justify sm:text-left">
              {p}
            </p>
          ))}
        </div>

        {/* AI Simplification Section for Grandfather */}
        <div className="mt-8 pt-6 border-t border-[#ece6d8]">
          {aiSimplified ? (
            <div className="p-5 bg-[#eef5f0] border border-[#cfe2d5] rounded-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1e4732] mb-2">
                <Sparkles className="w-5 h-5 text-[#1e4732]" />
                <span>ലളിതമായ വിവരണം (മുതിർന്നവർക്കായി):</span>
              </div>
              <p className="text-base sm:text-lg text-[#1e3b2b] leading-relaxed mb-3">
                {aiSimplified.summaryMl}
              </p>
              {aiSimplified.whyItMattersMl && (
                <div className="text-sm text-[#2d553f] pt-2 border-t border-[#cfe2d5]">
                  <span className="font-semibold">ശ്രദ്ധിക്കേണ്ട കാര്യം: </span>
                  {aiSimplified.whyItMattersMl}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleRequestAiSummary}
              disabled={isSummarizing}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#f3efe4] hover:bg-[#eae4d5] active:bg-[#dfd7c5] text-[#1e4732] font-semibold text-sm sm:text-base rounded-xl transition-colors min-h-[52px] cursor-pointer"
            >
              <Sparkles className={`w-5 h-5 ${isSummarizing ? 'animate-spin' : ''}`} />
              <span>
                {isSummarizing
                  ? 'ലളിതമായി തയ്യാറാക്കുന്നു...'
                  : 'ഈ വാർത്ത കൂടുതൽ ലളിതമായി മനസ്സിലാക്കാം'}
              </span>
            </button>
          )}
        </div>

        {/* Source citation and original web link */}
        <div className="mt-6 pt-4 pb-4 border-t border-[#ede7d9] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#716a5e] gap-2">
          <div>
            വാർത്താ സ്രോതസ്സ്: <span className="font-medium text-[#443e34]">{article.source}</span>
          </div>
          {article.sourceUrl && article.sourceUrl !== '#' && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#1e4732] hover:underline font-medium min-h-[36px]"
            >
              <span>യഥാർത്ഥ വാർത്ത സന്ദർശിക്കാം</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Previous and Next Page Flipping Navigation (Book feel) */}
        <div className="grid grid-cols-2 gap-3 mt-8 pt-6 border-t border-[#e8e2d4]">
          {prevArticle ? (
            <button
              onClick={() => onSelectArticle(prevArticle)}
              className="flex flex-col text-left p-3.5 rounded-xl bg-[#f5f1e6] hover:bg-[#ece6d7] transition-colors min-h-[64px] cursor-pointer"
            >
              <span className="flex items-center gap-1 text-xs font-semibold text-[#1e4732] mb-1">
                <ChevronLeft className="w-4 h-4" /> മുൻപത്തെ വാർത്ത
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#3b352d] line-clamp-2">
                {prevArticle.title}
              </span>
            </button>
          ) : (
            <div />
          )}

          {nextArticle ? (
            <button
              onClick={() => onSelectArticle(nextArticle)}
              className="flex flex-col text-right p-3.5 rounded-xl bg-[#f5f1e6] hover:bg-[#ece6d7] transition-colors min-h-[64px] cursor-pointer"
            >
              <span className="flex items-center justify-end gap-1 text-xs font-semibold text-[#1e4732] mb-1">
                അടുത്ത വാർത്ത <ChevronRight className="w-4 h-4" />
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#3b352d] line-clamp-2">
                {nextArticle.title}
              </span>
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* കൂടുതൽ വായിക്കാം (Related Articles) */}
        {relatedArticles.length > 0 && (
          <section className="mt-10 pt-6 border-t border-[#e5dfd0]">
            <h2 className="text-lg font-bold font-serif text-[#1e4732] mb-4">
              കൂടുതൽ വായിക്കാം
            </h2>
            <div className="space-y-3">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectArticle(rel)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectArticle(rel);
                  }}
                  className="p-3.5 rounded-xl bg-[#fbf9f4] border border-[#e8e3d6] hover:border-[#1e4732]/40 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs text-[#716a5e] mb-1">
                      {rel.categoryNameMl} · {rel.publishedAtMalayalam}
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-[#27231e] line-clamp-2 font-serif">
                      {rel.title}
                    </h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#1e4732] shrink-0" />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
