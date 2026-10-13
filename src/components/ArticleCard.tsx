import React from 'react';
import { NewsArticle, TextSize } from '../types/news';
import { Bookmark, Volume2, ArrowRight } from 'lucide-react';

interface ArticleCardProps {
  article: NewsArticle;
  textSize: TextSize;
  isBookmarked: boolean;
  onSelect: (article: NewsArticle) => void;
  onToggleBookmark: (e: React.MouseEvent, article: NewsArticle) => void;
  onQuickListen: (e: React.MouseEvent, article: NewsArticle) => void;
  isPlaying?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  textSize,
  isBookmarked,
  onSelect,
  onToggleBookmark,
  onQuickListen,
  isPlaying,
}) => {
  // Dynamic font sizing based on user preference
  const titleClass =
    textSize === 'extra-large'
      ? 'text-xl sm:text-2xl leading-snug'
      : textSize === 'large'
      ? 'text-lg sm:text-xl leading-snug'
      : 'text-base sm:text-lg leading-snug';

  const summaryClass =
    textSize === 'extra-large'
      ? 'text-base sm:text-lg leading-relaxed'
      : textSize === 'large'
      ? 'text-sm sm:text-base leading-relaxed'
      : 'text-xs sm:text-sm leading-relaxed';

  return (
    <article
      onClick={() => onSelect(article)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(article);
      }}
      className="bg-[#fcfbf7] border border-[#e8e3d5] hover:border-[#1e4732]/50 focus-visible:ring-2 focus-visible:ring-[#1e4732] rounded-xl p-4 sm:p-5 transition-all cursor-pointer shadow-xs my-3 flex flex-col justify-between"
    >
      <div>
        {/* Anti-Slop Zero-Pill: Clean unboxed metadata with dot separators */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-[#6e685f] mb-2 font-medium">
          <span className="text-[#1e4732] font-semibold">{article.categoryNameMl}</span>
          <span aria-hidden="true" className="text-[#b5ae9f]">·</span>
          <span>{article.source}</span>
          <span aria-hidden="true" className="text-[#b5ae9f]">·</span>
          <span>{article.publishedAtMalayalam}</span>
        </div>

        {/* Headline */}
        <h3 className={`font-bold font-serif text-[#1b1917] tracking-tight ${titleClass} hover:text-[#1e4732] transition-colors`}>
          {article.title}
        </h3>

        {/* Short Summary */}
        <p className={`text-[#4f4940] mt-2 line-clamp-3 font-normal ${summaryClass}`}>
          {article.summary}
        </p>
      </div>

      {/* Card Footer: Large elderly-friendly action buttons */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#f0ebd9]">
        {/* Read More button */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1e4732]">
          <span>വായിക്കാം</span>
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* Actions: Listen and Bookmark */}
        <div className="flex items-center gap-1">
          {/* Quick Listen Button */}
          <button
            onClick={(e) => onQuickListen(e, article)}
            aria-label={`ശബ്ദത്തിൽ കേൾക്കാം: ${article.title}`}
            title="വാർത്ത കേൾക്കാം"
            className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-[#1e4732] text-white'
                : 'text-[#38332c] hover:bg-[#eae4d5] active:bg-[#dfd7c5]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">കേൾക്കാം</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={(e) => onToggleBookmark(e, article)}
            aria-label={isBookmarked ? 'വായനാശേഖരത്തിൽ നിന്ന് ഒഴിവാക്കുക' : 'വായനാശേഖരത്തിൽ ചേർക്കുക'}
            title={isBookmarked ? 'സൂക്ഷിച്ചിരിക്കുന്നു' : 'സൂക്ഷിക്കുക'}
            className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-[#edf4ef] text-[#1e4732]'
                : 'text-[#4e483e] hover:bg-[#eae4d5] active:bg-[#dfd7c5]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-[#1e4732]' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
};
