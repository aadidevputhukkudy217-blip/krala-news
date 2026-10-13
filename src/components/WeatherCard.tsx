import React from 'react';
import { WeatherData } from '../types/news';
import { CloudSun, Thermometer, Droplets, Wind, ShieldAlert, ChevronRight } from 'lucide-react';

interface WeatherCardProps {
  weather: WeatherData | null;
  onOpenWeatherSection: () => void;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather, onOpenWeatherSection }) => {
  if (!weather) return null;

  return (
    <div
      onClick={onOpenWeatherSection}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenWeatherSection();
      }}
      className="bg-[#f7f4ea] border border-[#e5dfce] rounded-xl p-4 sm:p-5 my-3 hover:border-[#1e4732]/40 transition-all cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-[#1e4732]"
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#eae4d5]">
        <div className="flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-[#1e4732]" />
          <h2 className="text-base sm:text-lg font-bold text-[#1f1d1a]">
            {weather.districtMl} ഇന്നത്തെ കാലാവസ്ഥ
          </h2>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-[#1e4732]">
          <span>വിശദാംശങ്ങൾ</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 items-center">
        {/* Main Temperature & Condition */}
        <div className="col-span-2 flex items-center gap-3">
          <div className="text-3xl sm:text-4xl font-bold font-serif text-[#1e4732]">
            {weather.temperature}°C
          </div>
          <div>
            <div className="text-sm font-semibold text-[#27231e]">
              {weather.conditionMl}
            </div>
            <div className="text-xs text-[#6e685f]">
              കൂടിയത്: {weather.highTemp}°C · കുറഞ്ഞത്: {weather.lowTemp}°C
            </div>
          </div>
        </div>

        {/* Rain Probability */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#484239]">
          <Droplets className="w-4 h-4 text-[#2d6a4f]" />
          <div>
            <div className="text-[11px] text-[#716a5f]">മഴ സാധ്യത</div>
            <div className="font-semibold">{weather.rainProbability}%</div>
          </div>
        </div>

        {/* Humidity & Wind */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#484239]">
          <Wind className="w-4 h-4 text-[#2d6a4f]" />
          <div>
            <div className="text-[11px] text-[#716a5f]">കാറ്റിന്റെ വേഗത</div>
            <div className="font-semibold">{weather.windSpeed} കി.മീ/മണിക്കൂർ</div>
          </div>
        </div>
      </div>

      {/* Official Advisory / Warning */}
      {weather.advisoryMl && (
        <div className="mt-3 pt-2.5 border-t border-[#eae4d5] flex items-start gap-2 text-xs sm:text-sm text-[#433e36]">
          <ShieldAlert className="w-4 h-4 text-[#1e4732] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-[#1e4732]">അറിയിപ്പ്: </span>
            {weather.advisoryMl}
          </p>
        </div>
      )}
    </div>
  );
};
