/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NewsArticle, NewsCategory, WeatherData, TextSize } from './types/news';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { WeatherCard } from './components/WeatherCard';
import { ArticleCard } from './components/ArticleCard';
import { ReadingView } from './components/ReadingView';
import { SettingsModal } from './components/SettingsModal';
import { BulletinAudioModal } from './components/BulletinAudioModal';
import { CategoryIcon } from './components/CategoryIcon';
import { CATEGORIES } from './utils/categories';
import { KERALA_DISTRICTS } from './utils/malayalamDate';
import { useMalayalamSpeech } from './utils/useMalayalamSpeech';
import {
  Volume2,
  Bookmark,
  Grid,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  CloudSun,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

const STORAGE_KEY_BOOKMARKS = 'nanma_news_bookmarks_v1';
const STORAGE_KEY_TEXT_SIZE = 'nanma_news_text_size_v1';
const STORAGE_KEY_DISTRICT = 'nanma_news_district_v1';
const STORAGE_KEY_SPEECH_RATE = 'nanma_news_speech_rate_v1';

export default function App() {
  // Navigation & Screen states
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | null>(null);
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  // User Preferences (saved in localStorage)
  const [textSize, setTextSize] = useState<TextSize>(() => {
    return (localStorage.getItem(STORAGE_KEY_TEXT_SIZE) as TextSize) || 'large';
  });

  const [selectedDistrict, setSelectedDistrict] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_DISTRICT) || 'kozhikode';
  });

  const [speechRate, setSpeechRateState] = useState<number>(() => {
    const val = localStorage.getItem(STORAGE_KEY_SPEECH_RATE);
    return val ? parseFloat(val) : 0.85; // elderly friendly default
  });

  // Bookmarks (saved in localStorage)
  const [bookmarkedArticles, setBookmarkedArticles] = useState<NewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // News & Weather API data
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [topStories, setTopStories] = useState<NewsArticle[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [lastUpdatedMl, setLastUpdatedMl] = useState<string>('പുതുക്കുന്നു...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessageMl, setErrorMessageMl] = useState<string | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBulletinAudioOpen, setIsBulletinAudioOpen] = useState(false);

  // Audio hook
  const {
    isPlaying,
    isPaused,
    hasMalayalamVoice,
    speak,
    pause,
    resume,
    stop,
    setSpeechRate,
  } = useMalayalamSpeech(speechRate);

  // Update speech rate
  const handleSetSpeechRate = (rate: number) => {
    setSpeechRateState(rate);
    setSpeechRate(rate);
    localStorage.setItem(STORAGE_KEY_SPEECH_RATE, String(rate));
  };

  const handleSetTextSize = (size: TextSize) => {
    setTextSize(size);
    localStorage.setItem(STORAGE_KEY_TEXT_SIZE, size);
  };

  const handleSetDistrict = (distId: string) => {
    setSelectedDistrict(distId);
    localStorage.setItem(STORAGE_KEY_DISTRICT, distId);
    fetchWeather(distId);
  };

  // Fetch News from Backend
  const fetchNews = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setErrorMessageMl(null);

    try {
      const url = `/api/news?district=${encodeURIComponent(selectedDistrict)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('News fetch error');
      const data = await res.json();

      setArticles(data.articles || []);
      setTopStories(data.topStories || []);
      setLastUpdatedMl(data.lastUpdatedMl ? `അവസാനം പുതുക്കിയത്: ${data.lastUpdatedMl}` : 'ഇന്ന് രാവിലെ');
    } catch (err) {
      console.warn('News fetch notice:', err);
      setErrorMessageMl('വാർത്തകൾ പുതുക്കാൻ സാധിച്ചില്ല. മുൻപത്തെ വാർത്തകൾ ലഭ്യമാണ്.');
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, [selectedDistrict]);

  // Fetch Weather from Backend
  const fetchWeather = useCallback(async (distId: string) => {
    try {
      const res = await fetch(`/api/weather?district=${encodeURIComponent(distId)}`);
      if (!res.ok) throw new Error('Weather fetch error');
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch (err) {
      console.warn('Weather fetch notice:', err);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchNews();
    fetchWeather(selectedDistrict);
  }, [fetchNews, fetchWeather, selectedDistrict]);

  // Bookmark Toggle
  const toggleBookmark = (articleToToggle: NewsArticle) => {
    setBookmarkedArticles((prev) => {
      const exists = prev.some((a) => a.id === articleToToggle.id);
      let updated: NewsArticle[];
      if (exists) {
        updated = prev.filter((a) => a.id !== articleToToggle.id);
      } else {
        updated = [articleToToggle, ...prev];
      }
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(updated));
      return updated;
    });
  };

  const isArticleBookmarked = (id: string) => {
    return bookmarkedArticles.some((a) => a.id === id);
  };

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/news/refresh', { method: 'POST' });
    } catch (err) {
      console.warn('Manual refresh request notice:', err);
    }
    await fetchNews(true);
    await fetchWeather(selectedDistrict);
  };

  // Quick audio listen for single article
  const handleQuickListen = (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation();
    if (isPlaying) {
      stop();
    } else {
      const text = `${article.title}. ${article.summary}`;
      speak(text);
    }
  };

  // Filter articles for category view
  const getCategoryArticles = (catId: NewsCategory) => {
    if (catId === 'kozhikode') {
      return articles.filter(
        (a) => a.category === 'kozhikode' || a.district === selectedDistrict || a.district === 'kozhikode'
      );
    }
    return articles.filter((a) => a.category === catId);
  };

  // If an article is currently being read, render the e-book reading mode
  if (activeArticle) {
    return (
      <ReadingView
        article={activeArticle}
        allArticles={articles}
        textSize={textSize}
        onSetTextSize={handleSetTextSize}
        isBookmarked={isArticleBookmarked(activeArticle.id)}
        onToggleBookmark={toggleBookmark}
        onBack={() => setActiveArticle(null)}
        onSelectArticle={(art) => setActiveArticle(art)}
        isPlayingAudio={isPlaying}
        isPausedAudio={isPaused}
        onPlayAudio={(text) => speak(text)}
        onPauseAudio={pause}
        onResumeAudio={resume}
        onStopAudio={stop}
        speechRate={speechRate}
        onSetSpeechRate={handleSetSpeechRate}
        hasMalayalamVoice={hasMalayalamVoice}
      />
    );
  }

  const currentDistrictName =
    KERALA_DISTRICTS.find((d) => d.id === selectedDistrict)?.nameMl || 'കോഴിക്കോട്';

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-[#1f1d1a] flex flex-col font-sans">
      {/* Newspaper Top Header */}
      <Header
        lastUpdatedMl={lastUpdatedMl}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBulletinAudio={() => setIsBulletinAudioOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-3 pb-24">
        {/* Error notice if offline or refresh issue */}
        {errorMessageMl && (
          <div className="mb-4 p-3.5 bg-[#fbf4e8] border border-[#ecd9be] rounded-xl text-xs sm:text-sm text-[#5d4628] flex items-center justify-between">
            <span>{errorMessageMl}</span>
            <button
              onClick={handleManualRefresh}
              className="text-[#1e4732] font-semibold underline text-xs cursor-pointer ml-2"
            >
              വീണ്ടും ശ്രമിക്കുക
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: HOME (ഹോം) */}
        {/* ------------------------------------------------------------- */}
        {currentTab === 'home' && (
          <div>
            {/* Prominent Listen to News Bulletin Card (Elderly highlight) */}
            <div className="my-3 p-4 sm:p-5 bg-[#edf4ef] border border-[#cbe1d3] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#1e4732] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1e4732]">
                    ഇന്നത്തെ വാർത്തകൾ കേൾക്കാം
                  </h2>
                  <p className="text-xs sm:text-sm text-[#436e55] mt-0.5">
                    വായിക്കാൻ പ്രയാസമാണോ? ഇന്നത്തെ പ്രധാന വാർത്തകൾ വ്യക്തമായ ശബ്ദത്തിൽ തുടർച്ചയായി കേൾക്കാം.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBulletinAudioOpen(true)}
                className="w-full sm:w-auto px-5 py-3 bg-[#1e4732] hover:bg-[#173827] text-white font-bold text-sm sm:text-base rounded-xl transition-colors min-h-[48px] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Volume2 className="w-4 h-4" />
                <span>കേൾക്കാൻ തുടങ്ങുക</span>
              </button>
            </div>

            {/* Kozhikode Weather Card */}
            <WeatherCard
              weather={weather}
              onOpenWeatherSection={() => {
                setSelectedCategory('weather');
                setCurrentTab('categories');
              }}
            />

            {/* Top Stories Section (ഇന്നത്തെ പ്രധാന വാർത്തകൾ) */}
            <section className="mt-6">
              <div className="flex items-center justify-between pb-2 border-b border-[#e7e1d2]">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1e4732]">
                  ഇന്നത്തെ പ്രധാന വാർത്തകൾ
                </h2>
                <span className="text-xs text-[#71695d]">
                  {topStories.length} വാർത്തകൾ
                </span>
              </div>

              <div className="mt-3 space-y-4">
                {topStories.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    textSize={textSize}
                    isBookmarked={isArticleBookmarked(article.id)}
                    onSelect={(art) => setActiveArticle(art)}
                    onToggleBookmark={(_e, art) => toggleBookmark(art)}
                    onQuickListen={handleQuickListen}
                    isPlaying={isPlaying}
                  />
                ))}
              </div>
            </section>

            {/* Full-Width Category Cards Section (പ്രധാന വാർത്താ വിഭാഗങ്ങൾ) */}
            <section className="mt-10">
              <div className="flex items-center justify-between pb-2 border-b border-[#e7e1d2] mb-4">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1e4732]">
                  വാർത്താ വിഭാഗങ്ങൾ
                </h2>
                <span className="text-xs text-[#71695d]">
                  മുഴുവൻ കാണുക
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentTab('categories');
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSelectedCategory(cat.id);
                        setCurrentTab('categories');
                      }
                    }}
                    className="p-4 bg-[#f8f6ee] border border-[#e5dfce] hover:border-[#1e4732]/50 hover:bg-[#f3f0e4] active:bg-[#eae6d8] rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 min-h-[72px] shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#edf4ef] text-[#1e4732] flex items-center justify-center shrink-0">
                        <CategoryIcon name={cat.iconName} size={22} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#1f1d1a]">
                          {cat.id === 'kozhikode' ? `${currentDistrictName} വാർത്തകൾ` : cat.nameMl}
                        </h3>
                        <p className="text-xs text-[#6e675b] line-clamp-1 mt-0.5">
                          {cat.descriptionMl}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#1e4732] shrink-0" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: CATEGORIES (വിഭാഗങ്ങൾ) */}
        {/* ------------------------------------------------------------- */}
        {currentTab === 'categories' && (
          <div>
            {selectedCategory ? (
              // Specific Category View
              <div>
                {/* Back to all categories */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e7e1d2]">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#1e4732] bg-[#f2eee3] hover:bg-[#e6e0d2] px-3 py-2 rounded-lg transition-colors min-h-[44px] cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>എല്ലാ വിഭാഗങ്ങളും</span>
                  </button>

                  <h2 className="text-lg sm:text-xl font-bold font-serif text-[#1b1917]">
                    {selectedCategory === 'kozhikode'
                      ? `${currentDistrictName} വാർത്തകൾ`
                      : CATEGORIES.find((c) => c.id === selectedCategory)?.nameMl}
                  </h2>
                </div>

                {/* If Weather category, show detailed weather outlook first */}
                {selectedCategory === 'weather' && weather && (
                  <div className="mb-6 p-5 bg-[#edf4ef] border border-[#cbe1d3] rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <CloudSun className="w-6 h-6 text-[#1e4732]" />
                      <h3 className="text-lg font-bold text-[#1e4732]">
                        {weather.districtMl} കാലാവസ്ഥാ മുന്നറിയിപ്പ് & പ്രവചനം
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                      <div className="p-3 bg-white/70 rounded-xl">
                        <div className="text-xs text-[#6e685f]">ഇന്നത്തെ താപനില</div>
                        <div className="text-2xl font-bold text-[#1e4732]">
                          {weather.temperature}°C
                        </div>
                        <div className="text-xs text-[#436e55]">
                          {weather.conditionMl}
                        </div>
                      </div>

                      <div className="p-3 bg-white/70 rounded-xl">
                        <div className="text-xs text-[#6e685f]">മഴ സാധ്യത</div>
                        <div className="text-2xl font-bold text-[#1e4732]">
                          {weather.rainProbability}%
                        </div>
                        <div className="text-xs text-[#436e55]">
                          കുറഞ്ഞത്: {weather.lowTemp}°C
                        </div>
                      </div>

                      <div className="p-3 bg-white/70 rounded-xl">
                        <div className="text-xs text-[#6e685f]">ആർദ്രത (Humidity)</div>
                        <div className="text-2xl font-bold text-[#1e4732]">
                          {weather.humidity}%
                        </div>
                        <div className="text-xs text-[#436e55]">ഈർപ്പമുള്ള അന്തരീക്ഷം</div>
                      </div>

                      <div className="p-3 bg-white/70 rounded-xl">
                        <div className="text-xs text-[#6e685f]">കാറ്റിന്റെ വേഗത</div>
                        <div className="text-2xl font-bold text-[#1e4732]">
                          {weather.windSpeed} km/h
                        </div>
                        <div className="text-xs text-[#436e55]">ശാന്തമായ കാറ്റ്</div>
                      </div>
                    </div>

                    {weather.advisoryMl && (
                      <div className="mt-3 pt-3 border-t border-[#c2dcce] text-sm text-[#1e4732] flex items-start gap-2">
                        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <span className="font-bold">ഔദ്യോഗിക ജാഗ്രതാ നിർദ്ദേശം: </span>
                          {weather.advisoryMl}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Category Articles */}
                {getCategoryArticles(selectedCategory).length > 0 ? (
                  <div className="space-y-4">
                    {getCategoryArticles(selectedCategory).map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        textSize={textSize}
                        isBookmarked={isArticleBookmarked(article.id)}
                        onSelect={(art) => setActiveArticle(art)}
                        onToggleBookmark={(_e, art) => toggleBookmark(art)}
                        onQuickListen={handleQuickListen}
                        isPlaying={isPlaying}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 bg-[#f8f5eb] rounded-2xl border border-[#e4dece] my-4">
                    <p className="text-base text-[#575044] mb-3">
                      ഈ വിഭാഗത്തിൽ ഇപ്പോൾ പുതിയ വാർത്തകളൊന്നും ലഭ്യമായിട്ടില്ല.
                    </p>
                    <button
                      onClick={handleManualRefresh}
                      className="px-4 py-2.5 bg-[#1e4732] text-white rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>വാർത്തകൾ പുതുക്കി നോക്കുക</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // All Categories Grid
              <div>
                <div className="pb-3 mb-4 border-b border-[#e7e1d2]">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1e4732]">
                    എല്ലാ വാർത്താ വിഭാഗങ്ങളും
                  </h2>
                  <p className="text-xs text-[#6e675b] mt-0.5">
                    താങ്കൾക്ക് താല്പര്യമുള്ള വിഷയം തിരഞ്ഞെടുത്തു വായിക്കാം
                  </p>
                </div>

                <div className="space-y-3">
                  {CATEGORIES.map((cat, index) => {
                    const count = getCategoryArticles(cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedCategory(cat.id);
                        }}
                        className="p-4 sm:p-5 bg-[#f8f6ee] border border-[#e5dfce] hover:border-[#1e4732]/60 hover:bg-[#f3f0e4] active:bg-[#eae6d8] rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 min-h-[80px] shadow-xs"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#edf4ef] text-[#1e4732] flex items-center justify-center shrink-0">
                            <CategoryIcon name={cat.iconName} size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#1e4732]">
                                {index + 1}.
                              </span>
                              <h3 className="text-base sm:text-lg font-bold text-[#1f1d1a]">
                                {cat.id === 'kozhikode' ? `${currentDistrictName} വാർത്തകൾ` : cat.nameMl}
                              </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-[#666054] mt-1 leading-relaxed">
                              {cat.descriptionMl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {count > 0 && (
                            <span className="text-xs font-medium text-[#7a7469] hidden sm:inline">
                              {count} വാർത്തകൾ
                            </span>
                          )}
                          <ChevronRight className="w-5 h-5 text-[#1e4732]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: BOOKMARKS / READING COLLECTION (വായനാശേഖരം) */}
        {/* ------------------------------------------------------------- */}
        {currentTab === 'bookmarks' && (
          <div>
            <div className="pb-3 mb-4 border-b border-[#e7e1d2] flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1e4732]">
                  വായനാശേഖരം (സൂക്ഷിച്ചവ)
                </h2>
                <p className="text-xs text-[#6e675b] mt-0.5">
                  പിന്നീട് വായിക്കാനായി താങ്കൾ സൂക്ഷിച്ചുവെച്ച വാർത്തകൾ
                </p>
              </div>
              <span className="text-xs font-semibold text-[#1e4732] bg-[#edf4ef] px-3 py-1 rounded-full">
                {bookmarkedArticles.length} എണ്ണം
              </span>
            </div>

            {bookmarkedArticles.length > 0 ? (
              <div className="space-y-4">
                {bookmarkedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    textSize={textSize}
                    isBookmarked={true}
                    onSelect={(art) => setActiveArticle(art)}
                    onToggleBookmark={(_e, art) => toggleBookmark(art)}
                    onQuickListen={handleQuickListen}
                    isPlaying={isPlaying}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-[#f8f5eb] rounded-2xl border border-[#e4dece] my-4">
                <div className="w-16 h-16 rounded-full bg-[#edf4ef] text-[#1e4732] flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold font-serif text-[#1e4732] mb-2">
                  സൂക്ഷിച്ച വാർത്തകളൊന്നും നിലവിലില്ല
                </h3>
                <p className="text-sm text-[#5d564b] max-w-sm mx-auto leading-relaxed mb-6">
                  വാർത്തകൾ വായിക്കുമ്പോൾ മുകളിലുള്ള ബുക്ക്മാർക്ക് അടയാളം അമർത്തിയാൽ അവ ഇവിടെ സൂക്ഷിച്ചു വെക്കാം. ഇന്റർനെറ്റ് ഇല്ലാത്തപ്പോഴും നിങ്ങൾക്ക് അവ വീണ്ടും വായിക്കാം.
                </p>
                <button
                  onClick={() => setCurrentTab('home')}
                  className="px-5 py-3 bg-[#1e4732] text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>പ്രധാന വാർത്തകളിലേക്ക് പോകാം</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Grandfather-friendly Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'categories') setSelectedCategory(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        bookmarksCount={bookmarkedArticles.length}
      />

      {/* Settings Modal (Text Size, District, Speech Rate) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        textSize={textSize}
        onSelectTextSize={handleSetTextSize}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleSetDistrict}
        speechRate={speechRate}
        onSelectSpeechRate={handleSetSpeechRate}
      />

      {/* Consecutive Bulletin Audio Modal */}
      <BulletinAudioModal
        isOpen={isBulletinAudioOpen}
        onClose={() => setIsBulletinAudioOpen(false)}
        articles={topStories.length > 0 ? topStories : articles.slice(0, 5)}
        speechRate={speechRate}
        hasMalayalamVoice={hasMalayalamVoice}
        onPlaySpeech={(text, onEnd) => speak(text, onEnd)}
        onStopSpeech={stop}
        onPauseSpeech={pause}
        onResumeSpeech={resume}
        isPlaying={isPlaying}
        isPaused={isPaused}
      />
    </div>
  );
}
