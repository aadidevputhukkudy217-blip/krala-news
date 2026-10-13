import { DistrictInfo } from '../types/news';

export const KERALA_DISTRICTS: DistrictInfo[] = [
  { id: 'kozhikode', nameMl: 'കോഴിക്കോട്', nameEn: 'Kozhikode', lat: 11.2588, lon: 75.7804 },
  { id: 'malappuram', nameMl: 'മലപ്പുറം', nameEn: 'Malappuram', lat: 11.0732, lon: 76.0740 },
  { id: 'wayanad', nameMl: 'വയനാട് (കൽപ്പറ്റ)', nameEn: 'Wayanad', lat: 11.6050, lon: 76.0829 },
  { id: 'kannur', nameMl: 'കണ്ണൂർ', nameEn: 'Kannur', lat: 11.8745, lon: 75.3704 },
  { id: 'kasaragod', nameMl: 'കാസർഗോഡ്', nameEn: 'Kasaragod', lat: 12.5102, lon: 74.9852 },
  { id: 'palakkad', nameMl: 'പാലക്കാട്', nameEn: 'Palakkad', lat: 10.7867, lon: 76.6548 },
  { id: 'thrissur', nameMl: 'തൃശ്ശൂർ', nameEn: 'Thrissur', lat: 10.5276, lon: 76.2144 },
  { id: 'ernakulam', nameMl: 'എറണാകുളം (കൊച്ചി)', nameEn: 'Ernakulam', lat: 9.9816, lon: 76.2999 },
  { id: 'idukki', nameMl: 'ഇടുക്കി (പൈനാവ്)', nameEn: 'Idukki', lat: 9.8494, lon: 76.9804 },
  { id: 'kottayam', nameMl: 'കോട്ടയം', nameEn: 'Kottayam', lat: 9.5916, lon: 76.5222 },
  { id: 'alappuzha', nameMl: 'ആലപ്പുഴ', nameEn: 'Alappuzha', lat: 9.4981, lon: 76.3388 },
  { id: 'pathanamthitta', nameMl: 'പത്തനംതിട്ട', nameEn: 'Pathanamthitta', lat: 9.2648, lon: 76.7870 },
  { id: 'kollam', nameMl: 'കൊല്ലം', nameEn: 'Kollam', lat: 8.8932, lon: 76.6141 },
  { id: 'thiruvananthapuram', nameMl: 'തിരുവനന്തപുരം', nameEn: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366 }
];

const MALAYALAM_MONTHS = [
  'ജനുവരി',
  'ഫെബ്രുവരി',
  'മാർച്ച്',
  'ഏപ്രിൽ',
  'മെയ്',
  'ജൂൺ',
  'ജൂലൈ',
  'ആഗസ്റ്റ്',
  'സെപ്റ്റംബർ',
  'ഒക്ടോബർ',
  'നവംബർ',
  'ഡിസംബർ',
];

const MALAYALAM_WEEKDAYS = [
  'ഞായറാഴ്ച',
  'തിങ്കളാഴ്ച',
  'ചൊവ്വാഴ്ച',
  'ബുധനാഴ്ച',
  'വ്യാഴാഴ്ച',
  'വെള്ളിയാഴ്ച',
  'ശനിയാഴ്ച',
];

/**
 * Returns today's full Malayalam date:
 * e.g., "2026 ഒക്ടോബർ 13, ചൊവ്വാഴ്ച"
 */
export function getMalayalamTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = MALAYALAM_MONTHS[now.getMonth()];
  const day = now.getDate();
  const weekday = MALAYALAM_WEEKDAYS[now.getDay()];
  return `${year} ${month} ${day}, ${weekday}`;
}

/**
 * Formats an ISO string or Date into friendly Malayalam relative/absolute time.
 * e.g., "ഇന്ന് രാവിലെ 10:15 ന്" or "2026 ഒക്ടോബർ 12, വൈകുന്നേരം 4:30"
 */
export function formatMalayalamDateTime(dateInput: string | Date | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return 'സമീപകാലത്ത്';
  }

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  let timeOfDay = 'രാവിലെ';
  if (hours >= 12 && hours < 16) {
    timeOfDay = 'ഉച്ചയ്ക്ക്';
  } else if (hours >= 16 && hours < 19) {
    timeOfDay = 'വൈകുന്നേരം';
  } else if (hours >= 19 || hours < 4) {
    timeOfDay = 'രാത്രി';
  }

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const timeStr = `${timeOfDay} ${hours}:${minutes}`;

  if (isToday) {
    return `ഇന്ന് ${timeStr}`;
  } else if (isYesterday) {
    return `ഇന്നലെ ${timeStr}`;
  } else {
    const month = MALAYALAM_MONTHS[date.getMonth()];
    return `${date.getDate()} ${month}, ${timeStr}`;
  }
}

/**
 * Converts English digits to Malayalam digits or clean digits
 */
export function formatMalayalamNumber(num: number | string): string {
  return String(num);
}
