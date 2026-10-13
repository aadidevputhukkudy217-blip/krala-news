import React from 'react';
import { Newspaper, Grid, Bookmark } from 'lucide-react';

export type NavTab = 'home' | 'categories' | 'bookmarks';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  bookmarksCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  bookmarksCount,
}) => {
  return (
    <nav
      aria-label="പ്രധാന നാവിഗേഷൻ"
      className="fixed bottom-0 left-0 right-0 bg-[#fbf9f4] border-t border-[#e2ddd0] shadow-[0_-2px_10px_rgba(0,0,0,0.03)] z-40 px-2 py-1"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
        {/* Home Tab */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center py-2 px-1 min-h-[56px] rounded-lg transition-colors ${
            currentTab === 'home'
              ? 'text-[#1e4732] bg-[#edf4ef] font-semibold'
              : 'text-[#5f594e] hover:bg-[#f3efe4] active:bg-[#e9e3d5]'
          }`}
        >
          <Newspaper className="w-5 h-5 mb-1" />
          <span className="text-xs sm:text-sm">ഹോം</span>
        </button>

        {/* Categories Tab */}
        <button
          onClick={() => onTabChange('categories')}
          className={`flex flex-col items-center justify-center py-2 px-1 min-h-[56px] rounded-lg transition-colors ${
            currentTab === 'categories'
              ? 'text-[#1e4732] bg-[#edf4ef] font-semibold'
              : 'text-[#5f594e] hover:bg-[#f3efe4] active:bg-[#e9e3d5]'
          }`}
        >
          <Grid className="w-5 h-5 mb-1" />
          <span className="text-xs sm:text-sm">വിഭാഗങ്ങൾ</span>
        </button>

        {/* Bookmarks Tab */}
        <button
          onClick={() => onTabChange('bookmarks')}
          className={`relative flex flex-col items-center justify-center py-2 px-1 min-h-[56px] rounded-lg transition-colors ${
            currentTab === 'bookmarks'
              ? 'text-[#1e4732] bg-[#edf4ef] font-semibold'
              : 'text-[#5f594e] hover:bg-[#f3efe4] active:bg-[#e9e3d5]'
          }`}
        >
          <div className="relative">
            <Bookmark className="w-5 h-5 mb-1" />
            {bookmarksCount > 0 && (
              <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] flex items-center justify-center bg-[#1e4732] text-white text-[10px] font-bold rounded-full px-1">
                {bookmarksCount}
              </span>
            )}
          </div>
          <span className="text-xs sm:text-sm">വായനാശേഖരം</span>
        </button>
      </div>
    </nav>
  );
};
