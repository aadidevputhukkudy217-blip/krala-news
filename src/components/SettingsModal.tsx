import React from 'react';
import { TextSize } from '../types/news';
import { KERALA_DISTRICTS } from '../utils/malayalamDate';
import { X, Check, Type, MapPin, Volume2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  textSize: TextSize;
  onSelectTextSize: (size: TextSize) => void;
  selectedDistrict: string;
  onSelectDistrict: (districtId: string) => void;
  speechRate: number;
  onSelectSpeechRate: (rate: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  textSize,
  onSelectTextSize,
  selectedDistrict,
  onSelectDistrict,
  speechRate,
  onSelectSpeechRate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className="bg-[#fcfbf7] border border-[#e5dfd0] rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl text-[#1f1d1a]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e8e2d4]">
          <h2 id="settings-heading" className="text-xl font-bold font-serif text-[#1e4732]">
            വായനാ ക്രമീകരണങ്ങൾ
          </h2>
          <button
            onClick={onClose}
            aria-label="അടയ്ക്കുക"
            className="p-2 text-[#5a5449] hover:bg-[#eae4d5] rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section 1: Text Size */}
        <div className="py-5 border-b border-[#ece6d8]">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-5 h-5 text-[#1e4732]" />
            <h3 className="text-base font-bold text-[#1f1d1a]">
              അക്ഷരത്തിന്റെ വലുപ്പം (Font Size)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#665f54] mb-3">
            വായിക്കാൻ ഏറ്റവും സൗകര്യപ്രദമായ അക്ഷരവലുപ്പം തിരഞ്ഞെടുക്കുക.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onSelectTextSize('normal')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center min-h-[64px] transition-all cursor-pointer ${
                textSize === 'normal'
                  ? 'border-[#1e4732] bg-[#edf4ef] text-[#1e4732] font-bold shadow-xs'
                  : 'border-[#dfd8c7] bg-[#f5f1e5] text-[#413b33] hover:bg-[#ece6d7]'
              }`}
            >
              <span className="text-sm">സാധാരണം</span>
              <span className="text-xs text-[#736c61]">Standard</span>
            </button>

            <button
              onClick={() => onSelectTextSize('large')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center min-h-[64px] transition-all cursor-pointer ${
                textSize === 'large'
                  ? 'border-[#1e4732] bg-[#edf4ef] text-[#1e4732] font-bold shadow-xs'
                  : 'border-[#dfd8c7] bg-[#f5f1e5] text-[#413b33] hover:bg-[#ece6d7]'
              }`}
            >
              <span className="text-base font-medium">വലുത്</span>
              <span className="text-xs text-[#736c61]">Large</span>
            </button>

            <button
              onClick={() => onSelectTextSize('extra-large')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center min-h-[64px] transition-all cursor-pointer ${
                textSize === 'extra-large'
                  ? 'border-[#1e4732] bg-[#edf4ef] text-[#1e4732] font-bold shadow-xs'
                  : 'border-[#dfd8c7] bg-[#f5f1e5] text-[#413b33] hover:bg-[#ece6d7]'
              }`}
            >
              <span className="text-lg font-bold">ഏറ്റവും വലുത്</span>
              <span className="text-xs text-[#736c61]">Extra Large</span>
            </button>
          </div>
        </div>

        {/* Section 2: Preferred District */}
        <div className="py-5 border-b border-[#ece6d8]">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-[#1e4732]" />
            <h3 className="text-base font-bold text-[#1f1d1a]">
              നിങ്ങളുടെ ജില്ല (Default District)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#665f54] mb-3">
            പ്രാദേശിക വാർത്തകളും കാലാവസ്ഥയും ഈ ജില്ലയുടേതായി കാണിക്കും. (കോഴിക്കോട് സ്വതവേ തിരഞ്ഞെടുത്തു).
          </p>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {KERALA_DISTRICTS.map((dist) => {
              const isSelected = selectedDistrict.toLowerCase() === dist.id.toLowerCase();
              return (
                <button
                  key={dist.id}
                  onClick={() => onSelectDistrict(dist.id)}
                  className={`px-3 py-2.5 rounded-lg border text-left text-sm flex items-center justify-between min-h-[48px] transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#1e4732] bg-[#edf4ef] text-[#1e4732] font-bold'
                      : 'border-[#e0d9ca] bg-[#f8f5eb] text-[#3e3830] hover:bg-[#ece5d5]'
                  }`}
                >
                  <span>{dist.nameMl}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#1e4732]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Speech Audio Speed */}
        <div className="py-5">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-5 h-5 text-[#1e4732]" />
            <h3 className="text-base font-bold text-[#1f1d1a]">
              വാർത്ത കേൾക്കുന്ന വേഗത
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#665f54] mb-3">
            മുതിർന്നവർക്ക് വ്യക്തമായി കേൾക്കാനായി ശാന്തവും സാവധാനത്തിലുള്ളതുമായ വായന തിരഞ്ഞെടുക്കാം.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectSpeechRate(0.8)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center min-h-[56px] transition-all cursor-pointer ${
                speechRate < 0.9
                  ? 'border-[#1e4732] bg-[#edf4ef] text-[#1e4732] font-bold'
                  : 'border-[#dfd8c7] bg-[#f5f1e5] text-[#413b33] hover:bg-[#ece6d7]'
              }`}
            >
              <span className="text-sm font-semibold">പതുക്കെ (മുതിർന്നവർക്കായി)</span>
              <span className="text-xs text-[#736c61]">0.8x Speed</span>
            </button>

            <button
              onClick={() => onSelectSpeechRate(1.0)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center min-h-[56px] transition-all cursor-pointer ${
                speechRate >= 0.9
                  ? 'border-[#1e4732] bg-[#edf4ef] text-[#1e4732] font-bold'
                  : 'border-[#dfd8c7] bg-[#f5f1e5] text-[#413b33] hover:bg-[#ece6d7]'
              }`}
            >
              <span className="text-sm font-semibold">സാധാരണ വേഗത</span>
              <span className="text-xs text-[#736c61]">1.0x Speed</span>
            </button>
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#1e4732] hover:bg-[#183928] text-white font-bold rounded-xl text-base min-h-[52px] transition-colors cursor-pointer shadow-xs"
          >
            ക്രമീകരണങ്ങൾ പൂർത്തിയായി (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
