import React from 'react';
import {
  Landmark,
  MapPin,
  Flag,
  Globe,
  CloudSun,
  Trophy,
  HeartPulse,
  Wallet,
  Sparkles,
  Newspaper,
  BookOpen,
  Volume2,
  Bookmark,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  Share2,
  Check,
  Play,
  Pause,
  Square,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  ExternalLink,
  Info
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-6 h-6', size = 24 }) => {
  switch (name) {
    case 'landmark':
      return <Landmark className={className} size={size} />;
    case 'map-pin':
      return <MapPin className={className} size={size} />;
    case 'flag':
      return <Flag className={className} size={size} />;
    case 'globe':
      return <Globe className={className} size={size} />;
    case 'cloud-sun':
      return <CloudSun className={className} size={size} />;
    case 'trophy':
      return <Trophy className={className} size={size} />;
    case 'heart-pulse':
      return <HeartPulse className={className} size={size} />;
    case 'wallet':
      return <Wallet className={className} size={size} />;
    case 'sparkles':
      return <Sparkles className={className} size={size} />;
    case 'newspaper':
      return <Newspaper className={className} size={size} />;
    case 'book-open':
      return <BookOpen className={className} size={size} />;
    case 'volume-2':
      return <Volume2 className={className} size={size} />;
    case 'bookmark':
      return <Bookmark className={className} size={size} />;
    case 'refresh':
      return <RefreshCw className={className} size={size} />;
    case 'settings':
      return <SlidersHorizontal className={className} size={size} />;
    case 'chevron-right':
      return <ChevronRight className={className} size={size} />;
    case 'arrow-left':
      return <ArrowLeft className={className} size={size} />;
    case 'share':
      return <Share2 className={className} size={size} />;
    case 'check':
      return <Check className={className} size={size} />;
    case 'play':
      return <Play className={className} size={size} />;
    case 'pause':
      return <Pause className={className} size={size} />;
    case 'stop':
      return <Square className={className} size={size} />;
    case 'thermometer':
      return <Thermometer className={className} size={size} />;
    case 'droplets':
      return <Droplets className={className} size={size} />;
    case 'wind':
      return <Wind className={className} size={size} />;
    case 'sun':
      return <Sun className={className} size={size} />;
    case 'rain':
      return <CloudRain className={className} size={size} />;
    case 'external':
      return <ExternalLink className={className} size={size} />;
    case 'info':
      return <Info className={className} size={size} />;
    default:
      return <Newspaper className={className} size={size} />;
  }
};
