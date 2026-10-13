import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../types/news';
import { Play, Pause, Square, SkipForward, SkipBack, X, Volume2, Info } from 'lucide-react';

interface BulletinAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: NewsArticle[];
  speechRate: number;
  hasMalayalamVoice: boolean;
  onPlaySpeech: (text: string, onEnd?: () => void) => void;
  onStopSpeech: () => void;
  onPauseSpeech: () => void;
  onResumeSpeech: () => void;
  isPlaying: boolean;
  isPaused: boolean;
}

export const BulletinAudioModal: React.FC<BulletinAudioModalProps> = ({
  isOpen,
  onClose,
  articles,
  speechRate,
  hasMalayalamVoice,
  onPlaySpeech,
  onStopSpeech,
  onPauseSpeech,
  onResumeSpeech,
  isPlaying,
  isPaused,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // When modal opens, start reading from current index
  useEffect(() => {
    if (isOpen && articles.length > 0) {
      playCurrentStory(currentIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const playCurrentStory = (idx: number) => {
    if (idx < 0 || idx >= articles.length) return;
    const story = articles[idx];
    const text = `വാർത്ത ${idx + 1}. ${story.title}. ${story.summary}`;
    onPlaySpeech(text, () => {
      // Auto advance to next story if available
      if (idx + 1 < articles.length) {
        setCurrentIndex(idx + 1);
        playCurrentStory(idx + 1);
      } else {
        onStopSpeech();
      }
    });
  };

  const handleNext = () => {
    if (currentIndex + 1 < articles.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      playCurrentStory(nextIdx);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      playCurrentStory(prevIdx);
    }
  };

  const handleClose = () => {
    onStopSpeech();
    onClose();
  };

  if (!isOpen || articles.length === 0) return null;

  const currentArticle = articles[currentIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulletin-heading"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-[#fcfbf7] border border-[#e5ded0] rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl text-[#1f1d1a]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e9e3d4]">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[#1e4732]" />
            <h2 id="bulletin-heading" className="text-lg font-bold font-serif text-[#1e4732]">
              ഇന്നത്തെ വാർത്താ ബുള്ളറ്റിൻ
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="അടയ്ക്കുക"
            className="p-2 text-[#5c564b] hover:bg-[#eae4d5] rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Counter */}
        <div className="text-xs font-semibold text-[#1e4732] my-3">
          വാർത്ത {currentIndex + 1} / {articles.length}
        </div>

        {/* Currently playing headline */}
        <div className="p-4 bg-[#f4f0e4] border border-[#e2dcce] rounded-xl my-2">
          <div className="text-xs text-[#716a5e] mb-1 font-medium">
            {currentArticle.categoryNameMl} · {currentArticle.source}
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-serif text-[#1c1a17] leading-snug">
            {currentArticle.title}
          </h3>
          <p className="text-sm text-[#464036] mt-2 line-clamp-3">
            {currentArticle.summary}
          </p>
        </div>

        {/* Informative voice notice if device doesn't have Malayalam pack */}
        {!hasMalayalamVoice && (
          <div className="my-2 p-2.5 bg-[#f6f2e8] border border-[#e2dad0] rounded-lg text-xs text-[#5d564a] flex items-start gap-1.5">
            <Info className="w-4 h-4 text-[#1e4732] shrink-0 mt-0.5" />
            <span>
              ശബ്ദം വ്യക്തമായി കേൾക്കാൻ ഫോണിൽ 'Malayalam' വോയ്സ് ഇൻസ്റ്റാൾ ചെയ്യാം.
            </span>
          </div>
        )}

        {/* Audio Controls */}
        <div className="flex items-center justify-center gap-4 py-4">
          {/* Previous */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="മുൻപത്തെ വാർത്ത"
            className="p-3 bg-[#ede7d8] hover:bg-[#e0d9c7] disabled:opacity-40 text-[#2b2721] rounded-full min-h-[52px] min-w-[52px] flex items-center justify-center cursor-pointer"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play/Pause */}
          {isPlaying && !isPaused ? (
            <button
              onClick={onPauseSpeech}
              aria-label="താൽക്കാലികമായി നിർത്തുക"
              className="p-4 bg-[#1e4732] hover:bg-[#183928] text-white rounded-full min-h-[64px] min-w-[64px] flex items-center justify-center cursor-pointer shadow-md"
            >
              <Pause className="w-6 h-6 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (isPaused) {
                  onResumeSpeech();
                } else {
                  playCurrentStory(currentIndex);
                }
              }}
              aria-label="തുടരുക"
              className="p-4 bg-[#1e4732] hover:bg-[#183928] text-white rounded-full min-h-[64px] min-w-[64px] flex items-center justify-center cursor-pointer shadow-md"
            >
              <Play className="w-6 h-6 fill-current" />
            </button>
          )}

          {/* Next */}
          <button
            onClick={handleNext}
            disabled={currentIndex >= articles.length - 1}
            aria-label="അടുത്ത വാർത്ത"
            className="p-3 bg-[#ede7d8] hover:bg-[#e0d9c7] disabled:opacity-40 text-[#2b2721] rounded-full min-h-[52px] min-w-[52px] flex items-center justify-center cursor-pointer"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Stop */}
          <button
            onClick={onStopSpeech}
            aria-label="നിർത്തുക"
            className="p-3 bg-[#ded7c5] hover:bg-[#d0c8b3] text-[#2b2721] rounded-full min-h-[52px] min-w-[52px] flex items-center justify-center cursor-pointer"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-full py-3 bg-[#f2eee3] hover:bg-[#e6dfd1] text-[#342f27] font-semibold rounded-xl text-sm min-h-[48px] transition-colors cursor-pointer"
        >
          വായന അവസാനിപ്പിക്കുക
        </button>
      </div>
    </div>
  );
};
