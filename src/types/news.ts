export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string; // full reading text with paragraphs
  whyItMatters?: string; // പ്രാധാന്യം: why this matters to ordinary people
  category: NewsCategory;
  categoryNameMl: string;
  district?: string; // e.g., 'Kozhikode', 'Malappuram', etc.
  source: string; // e.g., 'Mathrubhumi', 'Manorama', 'The Hindu', 'PRD Kerala'
  sourceUrl: string;
  publishedAt: string; // ISO string
  publishedAtMalayalam: string; // e.g. "ഇന്ന് രാവിലെ 9:30"
  imageUrl?: string;
  isImportant?: boolean; // top story
  isBreaking?: boolean;
  audioText?: string; // clean text for TTS
}

export type NewsCategory =
  | 'kerala'
  | 'kozhikode'
  | 'national'
  | 'international'
  | 'weather'
  | 'sports'
  | 'health'
  | 'economy'
  | 'good_news';

export interface CategoryInfo {
  id: NewsCategory;
  nameMl: string;
  descriptionMl: string;
  iconName: string;
}

export interface WeatherData {
  district: string;
  districtMl: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionMl: string;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  highTemp: number;
  lowTemp: number;
  updatedAt: string;
  updatedAtMl: string;
  advisoryMl?: string;
}

export interface DistrictInfo {
  id: string;
  nameMl: string;
  nameEn: string;
  lat: number;
  lon: number;
}

export type TextSize = 'normal' | 'large' | 'extra-large';

export interface AppPreferences {
  textSize: TextSize;
  preferredDistrict: string;
  speechRate: number; // 0.85, 1.0, 1.15
}
