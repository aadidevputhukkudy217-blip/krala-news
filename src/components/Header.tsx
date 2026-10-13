import React from 'react';
import { RefreshCw, SlidersHorizontal, Volume2 } from 'lucide-react';
import { getMalayalamTodayDate } from '../utils/malayalamDate';

interface HeaderProps {
  lastUpdatedMl: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenBulletinAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdatedMl,
  isRefreshing,
  onRefresh,
  onOpenSettings,
  onOpenBulletinAudio,
}) => {
  const todayDateMl = getMalayalamTodayDate();

  return (
    <header className="bg-[#fbf9f4] border-b border-[#e7e2d4] pt-4 pb-3 px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
      <div className="max-w-3xl mx-auto">
        {/* Top bar: Grandfather greeting & quick accessibility controls */}
        <div className="flex items-center justify-between pb-2 border-b border-[#ece7d9]">
          <div>
            <span className="text-sm font-semibold text-[#1e4732] tracking-wide">
              നമസ്കാരം!
            </span>
            <span className="text-xs text-[#6e685f] ml-2">
              {todayDateMl}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Listen button in header */}
            <button
              onClick={onOpenBulletinAudio}
              aria-label="ഇന്നത്തെ വാർത്തകൾ കേൾക്കാം"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1e4732] bg-[#eef5f0] hover:bg-[#dfeee3] active:bg-[#d1e5d7] rounded-md transition-colors min-h-[44px]"
            >
              <Volume2 className="w-4 h-4 text-[#1e4732]" />
              <span>വാർത്തകൾ കേൾക്കാം</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              aria-label="അക്ഷരവലുപ്പവും ജില്ലയും മാറ്റുക"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4a453e] bg-[#f2eee3] hover:bg-[#e8e2d4] active:bg-[#ded6c5] rounded-md transition-colors min-h-[44px]"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#575045]" />
              <span className="hidden sm:inline">അക്ഷരം / ജില്ല</span>
            </button>
          </div>
        </div>

        {/* Newspaper Masthead */}
        <div className="flex items-end justify-between pt-3 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1b1917] tracking-tight">
              നന്മ വാർത്ത
            </h1>
            <p className="text-xs text-[#655e54] mt-0.5">
              കോഴിക്കോടും കേരളവും · സ്വതന്ത്രവും വിശ്വസനീയവുമായ ദിനപത്രം
            </p>
          </div>

          {/* Refresh button with status */}
          <div className="flex flex-col items-end">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#2d6244] bg-[#f4efe4] hover:bg-[#ebe4d5] active:bg-[#dfd7c5] rounded-md transition-colors min-h-[44px] cursor-pointer"
              title="പുതിയ വാർത്തകൾ ലഭ്യമാക്കുക"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1e4732]' : ''}`} />
              <span>{isRefreshing ? 'പുതുക്കുന്നു...' : 'പുതുക്കുക'}</span>
            </button>
            <span className="text-[11px] text-[#7a7469] mt-1 text-right">
              {lastUpdatedMl}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
