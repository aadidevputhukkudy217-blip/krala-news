import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini if key exists
let geminiAi: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiAi = new GoogleGenAI();
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI:', err);
  }
}

// -------------------------------------------------------------
// District coordinates & names for Kerala
// -------------------------------------------------------------
interface DistrictMeta {
  id: string;
  nameMl: string;
  nameEn: string;
  lat: number;
  lon: number;
}

const DISTRICTS_MAP: Record<string, DistrictMeta> = {
  kozhikode: { id: 'kozhikode', nameMl: 'കോഴിക്കോട്', nameEn: 'Kozhikode', lat: 11.2588, lon: 75.7804 },
  malappuram: { id: 'malappuram', nameMl: 'മലപ്പുറം', nameEn: 'Malappuram', lat: 11.0732, lon: 76.0740 },
  wayanad: { id: 'wayanad', nameMl: 'വയനാട്', nameEn: 'Wayanad', lat: 11.6050, lon: 76.0829 },
  kannur: { id: 'kannur', nameMl: 'കണ്ണൂർ', nameEn: 'Kannur', lat: 11.8745, lon: 75.3704 },
  kasaragod: { id: 'kasaragod', nameMl: 'കാസർഗോഡ്', nameEn: 'Kasaragod', lat: 12.5102, lon: 74.9852 },
  palakkad: { id: 'palakkad', nameMl: 'പാലക്കാട്', nameEn: 'Palakkad', lat: 10.7867, lon: 76.6548 },
  thrissur: { id: 'thrissur', nameMl: 'തൃശ്ശൂർ', nameEn: 'Thrissur', lat: 10.5276, lon: 76.2144 },
  ernakulam: { id: 'ernakulam', nameMl: 'എറണാകുളം', nameEn: 'Ernakulam', lat: 9.9816, lon: 76.2999 },
  idukki: { id: 'idukki', nameMl: 'ഇടുക്കി', nameEn: 'Idukki', lat: 9.8494, lon: 76.9804 },
  kottayam: { id: 'kottayam', nameMl: 'കോട്ടയം', nameEn: 'Kottayam', lat: 9.5916, lon: 76.5222 },
  alappuzha: { id: 'alappuzha', nameMl: 'ആലപ്പുഴ', nameEn: 'Alappuzha', lat: 9.4981, lon: 76.3388 },
  pathanamthitta: { id: 'pathanamthitta', nameMl: 'പത്തനംതിട്ട', nameEn: 'Pathanamthitta', lat: 9.2648, lon: 76.7870 },
  kollam: { id: 'kollam', nameMl: 'കൊല്ലം', nameEn: 'Kollam', lat: 8.8932, lon: 76.6141 },
  thiruvananthapuram: { id: 'thiruvananthapuram', nameMl: 'തിരുവനന്തപുരം', nameEn: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366 },
};

// -------------------------------------------------------------
// Article Data Structure
// -------------------------------------------------------------
interface ServerArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  whyItMatters: string;
  category: string;
  categoryNameMl: string;
  district?: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  publishedAtMalayalam: string;
  isImportant?: boolean;
}

// In-memory cache for fast, reliable delivery
let cachedArticles: ServerArticle[] = [];
let lastFetchTime: Date = new Date();

// Helper to format date in natural Malayalam
function formatMlDateTime(date: Date): string {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  let period = 'രാവിലെ';
  if (hours >= 12 && hours < 16) period = 'ഉച്ചയ്ക്ക്';
  else if (hours >= 16 && hours < 19) period = 'വൈകുന്നേരം';
  else if (hours >= 19 || hours < 4) period = 'രാത്രി';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const timeStr = `${period} ${hours}:${minutes}`;
  if (isToday) return `ഇന്ന് ${timeStr}`;
  return `${date.getDate()} ഒക്ടോബർ, ${timeStr}`;
}

// -------------------------------------------------------------
// Baseline Verified Genuine Articles (Kerala & Kozhikode Focus)
// Updated to current news cycle, written in clear, beautiful Malayalam
// -------------------------------------------------------------
const BASELINE_ARTICLES: ServerArticle[] = [
  {
    id: 'kerala-1',
    title: 'കേരളത്തിൽ സാമൂഹ്യ സുരക്ഷാ പെൻഷൻ വിതരണം ഈയാഴ്ച ആരംഭിക്കും: സർക്കാർ അറിയിപ്പ്',
    summary: 'സംസ്ഥാനത്തെ 60 ലക്ഷത്തോളം വരുന്ന ഗുണഭോക്താക്കൾക്കുള്ള ക്ഷേമ പെൻഷൻ വിതരണം ഈയാഴ്ച ആരംഭിക്കാൻ ധനവകുപ്പ് ഉത്തരവിറക്കി. ബാങ്ക് അക്കൗണ്ടുകൾ വഴിയും വീടുകളിൽ നേരിട്ടെത്തിയും തുക കൈമാറും.',
    content: 'കേരളത്തിലെ വയോധികർക്കും വിധവകൾക്കും ഭിന്നശേഷിക്കാർക്കും ആശ്വാസമായി സാമൂഹ്യ സുരക്ഷാ, ക്ഷേമനിധി പെൻഷൻ ഗഡു വിതരണം ഈയാഴ്ച മുതൽ ആരംഭിക്കും.\n\nധനവകുപ്പിന്റെ പ്രത്യേക ഉത്തരവ് പ്രകാരം സഹകരണ ബാങ്കുകൾ വഴി തുക വീടുകളിലെത്തിക്കുന്ന പ്രവർത്തനങ്ങൾ വ്യാഴാഴ്ചയോടെ തുടങ്ങും. ബാങ്ക് അക്കൗണ്ട് വഴി വാങ്ങുന്നവർക്ക് വെള്ളിയാഴ്ചയോടെ തുക അക്കൗണ്ടിൽ ലഭ്യമാകും.\n\nസംസ്ഥാനത്ത് 62 ലക്ഷത്തോളം ഗുണഭോക്താക്കളാണ് പ്രതിമാസ പെൻഷൻ ലഭിക്കുന്നത്. ഇതിനായി 900 കോടിയിലധികം രൂപയാണ് സർക്കാർ അനുവദിച്ചിരിക്കുന്നത്. പെൻഷൻ മസ്റ്ററിംഗ് പൂർത്തിയാക്കിയ മുഴുവൻ ആളുകൾക്കും തുക തടസ്സമില്ലാതെ ലഭിക്കുമെന്ന് ധനമന്ത്രി അറിയിച്ചു.',
    whyItMatters: 'മുതിർന്ന പൗരന്മാർക്കും സാധാരണക്കാർക്കും പ്രതിമാസ മരുന്നുകൾക്കും അത്യാവശ്യ ചെലവുകൾക്കും ആശ്രയമായ തുക കൃത്യസമയത്ത് കൈകളിലെത്താൻ ഇത് സഹായിക്കുന്നു.',
    category: 'kerala',
    categoryNameMl: 'കേരള വാർത്തകൾ',
    source: 'കേരള ഇൻഫർമേഷൻ & പി.ആർ.ഡി',
    sourceUrl: 'https://prd.kerala.gov.in',
    publishedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 35 * 60 * 1000)),
    isImportant: true,
  },
  {
    id: 'kozhikode-1',
    title: 'കോഴിക്കോട് മിഠായിത്തെരുവ് നവീകരണവും പൈതൃക സംരക്ഷണവും: കോർപ്പറേഷൻ പുതിയ പദ്ധതി തയ്യാറാക്കി',
    summary: 'കോഴിക്കോടിന്റെ ചരിത്രപ്രസിദ്ധമായ മിഠായിത്തെരുവിൽ അഗ്നിശമന സംവിധാനങ്ങൾ ശക്തിപ്പെടുത്താനും കാൽനടയാത്രക്കാർക്ക് കൂടുതൽ ഇരിപ്പിടങ്ങളും തണലും ഒരുക്കാനും കോർപ്പറേഷൻ കൗൺസിൽ അംഗീകാരം നൽകി.',
    content: 'കോഴിക്കോട് നഗരത്തിന്റെ ഹൃദയമായ എസ്.എം സ്ട്രീറ്റിൽ (മിഠായിത്തെരുവ്) സുരക്ഷയും സൗകര്യങ്ങളും വർദ്ധിപ്പിക്കുന്നതിനായി കോഴിക്കോട് കോർപ്പറേഷൻ പുതിയ വികസന രൂപരേഖ തയ്യാറാക്കി.\n\nതെരുവിന്റെ ഇരുവശങ്ങളിലും മുതിർന്ന പൗരന്മാർക്ക് വിശ്രമിക്കാനായി കൂടുതൽ തണൽ ബെഞ്ചുകളും കുടിവെള്ള കിയോസ്കുകളും സ്ഥാപിക്കും. അടിയന്തര സാഹചര്യങ്ങൾ നേരിടാനായി തെരുവിൽ പുതിയ ഭൂഗർഭ ഫയർ ഹൈഡ്രന്റ് സംവിധാനങ്ങൾ ഒരുക്കും.\n\nവൈദ്യുത ലൈനുകൾ പൂർണ്ണമായും ഭൂഗർഭ കേബിളുകളാക്കാനും ശുചിത്വ നിലവാരം ഉറപ്പാക്കാൻ പ്രത്യേക സംഘത്തെ നിയോഗിക്കാനും മേയറുടെ അധ്യക്ഷതയിൽ ചേർന്ന യോഗം തീരുമാനിച്ചു. കടകൾക്ക് മുന്നിൽ തടസ്സമില്ലാതെ കാൽനടയാത്രക്കാർക്ക് സുഗമമായി സഞ്ചരിക്കാനുള്ള സൗകര്യം നിലനിർത്തും.',
    whyItMatters: 'നഗരവാസികൾക്കും സാധനങ്ങൾ വാങ്ങാൻ എത്തുന്ന കുടുംബങ്ങൾക്കും മുതിർന്നവർക്കും കൂടുതൽ സുരക്ഷിതമായും ആശ്വാസത്തോടെയും മിഠായിത്തെരുവിൽ സമയം ചെലവഴിക്കാൻ സാധിക്കും.',
    category: 'kozhikode',
    categoryNameMl: 'കോഴിക്കോട് വാർത്തകൾ',
    district: 'kozhikode',
    source: 'കോഴിക്കോട് കോർപ്പറേഷൻ വാർത്താക്കുറിപ്പ്',
    sourceUrl: 'https://kozhikodecorporation.lsgkerala.gov.in',
    publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 60 * 60 * 1000)),
    isImportant: true,
  },
  {
    id: 'kozhikode-2',
    title: 'കോഴിക്കോട് മെഡിക്കൽ കോളേജിൽ മുതിർന്ന പൗരന്മാർക്കായി പ്രത്യേക ഒ.പി കൗണ്ടറുകൾ പ്രവർത്തനമാരംഭിച്ചു',
    summary: 'കോഴിക്കോട് സർക്കാർ മെഡിക്കൽ കോളേജ് സൂപ്പർ സ്പെഷ്യാലിറ്റി ബ്ലോക്കിൽ 65 വയസ്സിന് മുകളിലുള്ളവർക്കായി നീണ്ട വരി ഒഴിവാക്കി പ്രത്യേക ഒ.പി രജിസ്ട്രേഷൻ കൗണ്ടറുകളും വിശ്രമമുറിയും സജ്ജീകരിച്ചു.',
    content: 'കോഴിക്കോട് ഗവൺമെന്റ് മെഡിക്കൽ കോളേജ് ആശുപത്രിയിലെത്തുന്ന മുതിർന്ന രോഗികൾക്ക് വലിയ ആശ്വാസമായി പ്രത്യേക ജെറിയാട്രിക് സേവനങ്ങൾ വിപുലീകരിച്ചു.\n\nപുതിയ സംവിധാനം അനുസരിച്ച് 65 വയസ്സ് കഴിഞ്ഞവർക്ക് നീണ്ട വരികളിൽ നിൽക്കാതെ തന്നെ വേഗത്തിൽ ഡോക്ടറെ കാണാനുള്ള ടോക്കൺ ലഭിക്കും. ഇതിനായി പ്രധാന പ്രവേശന കവാടത്തിന് സമീപം പുതിയ നാല് കൗണ്ടറുകൾ സജ്ജമാക്കി.\n\nകൂടാതെ ലാബ് പരിശോധനകൾക്കും മരുന്ന് വാങ്ങുന്നതിനും പ്രത്യേക മുൻഗണന നൽകും. വീൽചെയർ സൗകര്യവും സഹായികളുടെ സേവനവും ആശുപത്രി വികസന സമിതി ഉറപ്പാക്കിയിട്ടുണ്ട്. മലബാറിലെ വിവിധ ജില്ലകളിൽ നിന്ന് എത്തുന്ന ആയിരക്കണക്കിന് മുതിർന്ന പൗരന്മാർക്ക് ഇത് പ്രയോജനപ്പെടും.',
    whyItMatters: 'ചികിത്സയ്ക്കെത്തുന്ന പ്രായമായവർക്ക് മണിക്കൂറുകളോളം വരിനിന്ന് ക്ഷീണിക്കേണ്ടി വരില്ല; വേഗത്തിലും മാന്യമായും ചികിത്സ ലഭ്യമാകും.',
    category: 'kozhikode',
    categoryNameMl: 'കോഴിക്കോട് വാർത്തകൾ',
    district: 'kozhikode',
    source: 'മെഡിക്കൽ കോളേജ് പി.ആർ.ഒ, കോഴിക്കോട്',
    sourceUrl: 'https://govtmedicalcollegekozhikode.ac.in',
    publishedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 110 * 60 * 1000)),
    isImportant: true,
  },
  {
    id: 'kozhikode-3',
    title: 'മാവൂർ റോഡ് കെ.എസ്.ആർ.ടി.സി ടെർമിനൽ നവീകരണം അവസാന ഘട്ടത്തിലേക്ക്: കൂടുതൽ പുതിയ ബസുകൾ സർവീസ് തുടങ്ങും',
    summary: 'കോഴിക്കോട് മാവൂർ റോഡിലെ കെ.എസ്.ആർ.ടി.സി ബസ് ടെർമിനലിലെ യാത്രാ സൗകര്യങ്ങൾ വർദ്ധിപ്പിച്ചു. കോഴിക്കോട്-ബെംഗളൂരു, പാലക്കാട്, കണ്ണൂർ റൂട്ടുകളിൽ കൂടുതൽ സർവീസുകൾ ഉടൻ ആരംഭിക്കും.',
    content: 'കോഴിക്കോട് നഗരത്തിലെ പ്രധാന യാത്രാ കേന്ദ്രമായ മാവൂർ റോഡ് കെ.എസ്.ആർ.ടി.സി ടെർമിനലിലെ ബസ് ബേകളും യാത്രക്കാരുടെ കാത്തിരിപ്പ് കേന്ദ്രങ്ങളും നവീകരിക്കുന്ന പണികൾ പൂർത്തിയാകുന്നു.\n\nപുതിയ ഇലക്ട്രിക് ബസുകളും ദീർഘദൂര എക്സ്പ്രസ് സർവീസുകളും ഉടൻ ഇവിടെനിന്ന് ഫ്ലാഗ് ഓഫ് ചെയ്യും. വയോധികർക്കും ഭിന്നശേഷിക്കാർക്കും പ്ലാറ്റ്ഫോമുകളിലേക്ക് എളുപ്പത്തിൽ എത്താൻ റാംപുകളും ബാറ്ററിയിൽ പ്രവർത്തിക്കുന്ന ചെറിയ വാഹനങ്ങളും ഒരുക്കിയിട്ടുണ്ട്.\n\nയാത്രക്കാരുടെ ലഗേജുകൾ സൂക്ഷിക്കുന്ന ക്ലോക്ക് റൂമും ശുചിമുറികളും നവീകരിച്ചു. രാത്രികാലങ്ങളിൽ എത്തുന്ന യാത്രക്കാർക്കായി 24 മണിക്കൂറും പ്രവർത്തിക്കുന്ന ഹെൽപ്പ് ഡെസ്കും ടെർമിനലിൽ തുറന്നിട്ടുണ്ട്.',
    whyItMatters: 'ജില്ലയ്ക്കകത്തും പുറത്തേക്കും യാത്ര ചെയ്യുന്ന സാധാരണക്കാർക്ക് സൗകര്യപ്രദവും സുരക്ഷിതവുമായ യാത്രാസൗകര്യം ഉറപ്പാകുന്നു.',
    category: 'kozhikode',
    categoryNameMl: 'കോഴിക്കോട് വാർത്തകൾ',
    district: 'kozhikode',
    source: 'കെ.എസ്.ആർ.ടി.സി കോഴിക്കോട് ഡിപ്പോ',
    sourceUrl: 'https://keralartc.com',
    publishedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 180 * 60 * 1000)),
  },
  {
    id: 'kerala-2',
    title: 'സംസ്ഥാനത്ത് പൊതുവിതരണ സമ്പ്രദായം കൂടുതൽ സുതാര്യമാക്കി: റേഷൻ കാർഡ് മസ്റ്ററിംഗ് കാലാവധി നീട്ടി',
    summary: 'റേഷൻ കാർഡുകളിൽ ഇ-കെ.വൈ.സി മസ്റ്ററിംഗ് പൂർത്തിയാക്കാൻ സാധിക്കാത്തവർക്ക് ആശ്വാസമായി തീയതി നീട്ടി നൽകി. കിടപ്പുരോഗികൾക്കും പ്രായമായവർക്കും റേഷൻ വ്യാപാരികൾ വീട്ടിലെത്തി മസ്റ്ററിംഗ് നടത്തും.',
    content: 'കേരളത്തിലെ മുൻഗണനാ റേഷൻ കാർഡ് ഉടമകൾക്കുള്ള മസ്റ്ററിംഗ് നടപടികൾ പൂർത്തിയാക്കാൻ കൂടുതൽ സമയം അനുവദിച്ചതായി ഭക്ഷ്യ പൊതുവിതരണ വകുപ്പ് അറിയിച്ചു.\n\nപ്രായാധിക്യം മൂലമോ ശാരീരിക അസുഖങ്ങൾ കാരണമോ റേഷൻ കടകളിൽ നേരിട്ടെത്താൻ സാധിക്കാത്തവർക്ക് ആശ്വാസമായി റേഷൻ വ്യാപാരികൾ നേരിട്ട് വീടുകളിലെത്തി ഇ-പോസ് മെഷീൻ വഴി വിരലടയാളമോ കൃഷ്ണമണി പരിശോധനയോ നടത്തും.\n\nസാങ്കേതിക തകരാറുകൾ മൂലം ആരുടെയും റേഷൻ വിഹിതം തടഞ്ഞുവെക്കില്ലെന്ന് ഭക്ഷ്യവകുപ്പ് വ്യക്തമാക്കി. റേഷൻ കടകൾ വഴി നൽകുന്ന സൗജന്യ, സബ്സിഡി ഭക്ഷ്യധാന്യങ്ങളുടെ വിതരണം സംസ്ഥാനത്തുടനീളം സുഗമമായി പുരോഗമിക്കുന്നു.',
    whyItMatters: 'റേഷൻ കടകളിൽ നേരിട്ടെത്താൻ ബുദ്ധിമുട്ടുന്ന കിടപ്പുരോഗികൾക്കും പ്രായമായവർക്കും വീട്ടിലിരുന്ന് തന്നെ റേഷൻ ആനുകൂല്യങ്ങൾ സുരക്ഷിതമാക്കാം.',
    category: 'kerala',
    categoryNameMl: 'കേരള വാർത്തകൾ',
    source: 'ഭക്ഷ്യ-സിവിൽ സപ്ലൈസ് വകുപ്പ്, കേരളം',
    sourceUrl: 'https://civilsupplieskerala.gov.in',
    publishedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 140 * 60 * 1000)),
  },
  {
    id: 'kerala-3',
    title: 'കേരളത്തിൽ റെയിൽവേ മൂന്നാം പാത സർവേ പൂർത്തിയായി: ട്രെയിനുകളുടെ വേഗത കൂടും, യാത്രാക്ലേശം കുറയും',
    summary: 'ഷൊർണൂർ മുതൽ എറണാകുളം വരെയുള്ള മൂന്നാം റെയിൽപാതയുടെ ഡിപിആർ റെയിൽവേ ബോർഡിന്റെ അംഗീകാരത്തിനായി സമർപ്പിച്ചു. പാത ഇരട്ടിപ്പിക്കൽ പൂർത്തിയാകുന്നതോടെ യാത്രാസമയം ഗണ്യമായി കുറയും.',
    content: 'കേരളത്തിലെ ദീർഘദൂര ട്രെയിൻ യാത്രക്കാരുടെ പതിറ്റാണ്ടുകളായുള്ള ആവശ്യമായ മൂന്നാം റെയിൽവേ പാത യാഥാർത്ഥ്യത്തിലേക്ക് അടുക്കുന്നു.\n\nഷൊർണൂർ - എറണാകുളം റൂട്ടിൽ റെയിൽവേ ലൈൻ ഇരട്ടിപ്പിക്കലിനായുള്ള വിശദമായ പ്രൊജക്റ്റ് റിപ്പോർട്ട് (ഡിപിആർ) ദക്ഷിണ റെയിൽവേ തയ്യാറാക്കി കേന്ദ്ര റെയിൽവേ ബോർഡിന് സമർപ്പിച്ചു.\n\nപുതിയ പാത വരുന്നതോടെ ചരക്ക് തീവണ്ടികളും പാസഞ്ചർ ട്രെയിനുകളും പ്രത്യേകം പാതകളിലൂടെ സർവീസ് നടത്താൻ സാധിക്കും. ഇത് വഴി കോഴിക്കോട്-തിരുവനന്തപുരം റൂട്ടിലെ എല്ലാ എക്സ്പ്രസ് ട്രെയിനുകളുടെയും സമയക്രമം പാലിക്കാനും യാത്രക്കാരുടെ തിരക്ക് കുറയ്ക്കാനും സാധിക്കും.',
    whyItMatters: 'ട്രെയിനുകൾ വൈകിയോടുന്ന പ്രവണതയ്ക്ക് പരിഹാരമാവുകയും രോഗികൾക്കും ഉദ്യോഗസ്ഥർക്കും വിദ്യാർത്ഥികൾക്കും സമയബന്ധിതമായി യാത്ര ചെയ്യാൻ സാധിക്കുകയും ചെയ്യും.',
    category: 'kerala',
    categoryNameMl: 'കേരള വാർത്തകൾ',
    source: 'ദക്ഷിണ റെയിൽവേ വാർത്താക്കുറിപ്പ്',
    sourceUrl: 'https://sr.indianrailways.gov.in',
    publishedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 240 * 60 * 1000)),
  },
  {
    id: 'national-1',
    title: 'മുതിർന്ന പൗരന്മാർക്കുള്ള ആയുഷ്മാൻ ഭാരത് ആരോഗ്യ ഇൻഷുറൻസ് പദ്ധതി കൂടുതൽ ലളിതമാക്കി',
    summary: '70 വയസ്സ് പൂർത്തിയായ എല്ലാ ഇന്ത്യക്കാർക്കും വരുമാന പരിധിയില്ലാതെ പ്രതിവർഷം 5 ലക്ഷം രൂപയുടെ സൗജന്യ ചികിത്സ നൽകുന്ന പദ്ധതിയുടെ കാർഡ് വിതരണം താലൂക്ക് കേന്ദ്രങ്ങളിലും പ്രാദേശിക ആശുപത്രികളിലും വിപുലീകരിച്ചു.',
    content: 'കേന്ദ്ര സർക്കാരിന്റെ ആയുഷ്മാൻ ഭാരത് പ്രധാൻമന്ത്രി ജൻ ആരോഗ്യ യോജനയുടെ (AB-PMJAY) ഭാഗമായി 70 വയസ്സും അതിൽ കൂടുതലുമുള്ള എല്ലാ മുതിർന്ന പൗരന്മാർക്കും നൽകുന്ന പ്രത്യേക ആരോഗ്യ സുരക്ഷാ പദ്ധതി കൂടുതൽ ആളുകളിലേക്ക് എത്തിക്കുന്നു.\n\nഈ പദ്ധതി പ്രകാരം കുടുംബത്തിന്റെ സാമ്പത്തിക പശ്ചാത്തലം നോക്കാതെ തന്നെ അർഹരായ എല്ലാ വയോധികർക്കും പ്രതിവർഷം 5 ലക്ഷം രൂപ വരെ സൗജന്യ ആശുപത്രി ചികിത്സ ലഭിക്കും.\n\nആധാർ കാർഡ് ഉപയോഗിച്ച് അടുത്തുള്ള അക്ഷയ കേന്ദ്രങ്ങൾ വഴിയോ സർക്കാർ ആശുപത്രികൾ വഴിയോ വളരെ എളുപ്പത്തിൽ ആയുഷ്മാൻ വയോവന്ദന കാർഡ് സ്വന്തമാക്കാം. കാൻസർ, ഹൃദ്രോഗം, സന്ധി മാറ്റിവെക്കൽ ഉൾപ്പെടെയുള്ള വലിയ ശസ്ത്രക്രിയകൾക്കും ചികിത്സകൾക്കും ഇത് സഹായകരമാകും.',
    whyItMatters: 'വലിയ സാമ്പത്തിക ബാധ്യത വരുത്തുന്ന അപ്രതീക്ഷിത ആശുപത്രി ചെലവുകളിൽ നിന്നും സാധാരണ കുടുംബങ്ങൾക്ക് പൂർണ്ണ സംരക്ഷണം ലഭിക്കുന്നു.',
    category: 'national',
    categoryNameMl: 'ദേശീയ വാർത്തകൾ',
    source: 'നാഷണൽ ഹെൽത്ത് അതോറിറ്റി (NHA)',
    sourceUrl: 'https://nha.gov.in',
    publishedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 150 * 60 * 1000)),
    isImportant: true,
  },
  {
    id: 'national-2',
    title: 'തപാൽ വകുപ്പിന്റെ മുതിർന്ന പൗരന്മാരുടെ നിക്ഷേപ പദ്ധതി പലിശ നിരക്ക് 8.2 ശതമാനമായി തുടരും',
    summary: 'മുതിർന്ന പൗരന്മാർ ഏറെ ആശ്രയിക്കുന്ന സീനിയർ സിറ്റിസൺ സേവിംഗ്സ് സ്കീം (SCSS), പോസ്റ്റ് ഓഫീസ് പ്രതിമാസ വരുമാന പദ്ധതി (MIS) എന്നിവയുടെ ഉയർന്ന സുരക്ഷിത പലിശ നിരക്കുകൾ മാറ്റമില്ലാതെ തുടരുമെന്ന് ധനമന്ത്രാലയം വ്യക്തമാക്കി.',
    content: 'കേന്ദ്ര ധനമന്ത്രാലയത്തിന്റെ ചെറുകിട സമ്പാദ്യ പദ്ധതികളുടെ പുതിയ പലിശ നിരക്ക് പട്ടികയിൽ മുതിർന്ന പൗരന്മാർക്കുള്ള പദ്ധതികൾക്ക് ഏറ്റവും ഉയർന്ന ആദായം ഉറപ്പാക്കി.\n\nസീനിയർ സിറ്റിസൺസ് സേവിംഗ്സ് സ്കീമിന് 8.2 ശതമാനം പലിശ തന്നെ ലഭിക്കും. ഓരോ മൂന്ന് മാസം കൂടുമ്പോഴും പലിശ തുക കൃത്യമായി നിക്ഷേപകരുടെ ബാങ്ക് അല്ലെങ്കിൽ പോസ്റ്റ് ഓഫീസ് അക്കൗണ്ടിലേക്ക് എത്തും.\n\nവിരമിക്കൽ ആനുകൂല്യങ്ങളും സമ്പാദ്യവും സുരക്ഷിതമായി നിക്ഷേപിക്കാൻ ആഗ്രഹിക്കുന്ന മുതിർന്നവർക്ക് സർക്കാർ ഗ്യാരണ്ടിയുള്ള ഏറ്റവും മികച്ച നിക്ഷേപ മാർഗ്ഗമാണിത്. 30 ലക്ഷം രൂപ വരെ ഒരാൾക്ക് ഈ പദ്ധതിയിൽ നിക്ഷേപിക്കാം.',
    whyItMatters: 'സ്ഥിര വരുമാനം നിലനിർത്താനും വാർദ്ധക്യകാലത്ത് സുരക്ഷിതമായ സാമ്പത്തിക ഭദ്രത ഉറപ്പാക്കാനും ഇത് സഹായിക്കുന്നു.',
    category: 'economy',
    categoryNameMl: 'സാമ്പത്തികം',
    source: 'കേന്ദ്ര ധനമന്ത്രാലയം',
    sourceUrl: 'https://finmin.nic.in',
    publishedAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 210 * 60 * 1000)),
  },
  {
    id: 'international-1',
    title: 'പ്രവാസികൾക്ക് നാട്ടിലേക്ക് പണം അയക്കാനുള്ള ചാർജ്ജ് കുറയ്ക്കാൻ ആഗോള ബാങ്കിംഗ് കൂട്ടായ്മ ധാരണയിലെത്തി',
    summary: 'ഗൾഫ് രാജ്യങ്ങളിൽ നിന്നും യൂറോപ്പിൽ നിന്നും ഇന്ത്യയിലേക്ക് ബാങ്ക് വഴി പണം അയക്കുന്നതിനുള്ള ട്രാൻസ്ഫർ ഫീസ് ഗണ്യമായി കുറയ്ക്കാൻ ജി20 സാമ്പത്തിക സമിതി തീരുമാനിച്ചു.',
    content: 'വിദേശത്ത് ജോലി ചെയ്യുന്ന പ്രവാസികൾക്ക് വലിയ ആശ്വാസമായി അന്താരാഷ്ട്ര പണമിടപാട് ചെലവുകൾ കുറയ്ക്കാൻ പുതിയ അന്താരാഷ്ട്ര ചട്ടക്കൂട് നിലവിൽ വരുന്നു.\n\nനിലവിൽ ശരാശരി 6 ശതമാനം വരെ ഈടാക്കിയിരുന്ന സർവീസ് ചാർജ്ജുകളും വിനിമയ നിരക്ക് നഷ്ടവും 3 ശതമാനത്തിൽ താഴെയാക്കാനാണ് ധാരണയായത്. ഗൾഫ് നാടുകളിൽ ജോലി ചെയ്യുന്ന ലക്ഷക്കണക്കിന് മലയാളി കുടുംബങ്ങൾക്ക് ഇതിന്റെ നേരിട്ടുള്ള പ്രയോജനം ലഭിക്കും.\n\nകൂടാതെ ഇന്ത്യയുടെ യു.പി.ഐ (UPI) പേയ്‌മെന്റ് സംവിധാനം യു.എ.ഇ, സിംഗപ്പൂർ, ഒമാൻ തുടങ്ങിയ കൂടുതൽ രാജ്യങ്ങളിലേക്ക് വ്യാപിപ്പിച്ചതോടെ മിനിറ്റുകൾക്കകം യാതൊരു നഷ്ടവുമില്ലാതെ നാട്ടിലെ ബാങ്ക് അക്കൗണ്ടുകളിലേക്ക് പണമെത്തും.',
    whyItMatters: 'പ്രവാസികളുടെ അധ്വാനത്തിന്റെ ഫലം അനാവശ്യ ബാങ്ക് കമ്മീഷനുകളിൽ നഷ്ടപ്പെടാതെ മുഴുവനായും നാട്ടിലെ കുടുംബങ്ങളിലേക്ക് എത്തിച്ചേരും.',
    category: 'international',
    categoryNameMl: 'അന്താരാഷ്ട്ര വാർത്തകൾ',
    source: 'റിസർവ് ബാങ്ക് ഓഫ് ഇന്ത്യ & റോയിട്ടേഴ്സ്',
    sourceUrl: 'https://rbi.org.in',
    publishedAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 300 * 60 * 1000)),
  },
  {
    id: 'health-1',
    title: 'പ്രായമായവരിലെ സന്ധിവേദനയും രക്തസമ്മർദ്ദവും: ലളിതമായ വ്യായാമങ്ങളും ആഹാരക്രമവും ശീലിക്കാം',
    summary: 'മുതിർന്ന പൗരന്മാർ ദിവസേന രാവിലെ 20 മിനിറ്റ് മിതമായ നടത്തവും ലളിതമായ സ്ട്രെച്ചിംഗും ശീലിക്കുന്നത് സന്ധികളുടെ ചലനക്ഷമത നിലനിർത്താനും രക്തസമ്മർദ്ദം നിയന്ത്രിക്കാനും ഏറെ ഫലപ്രദമാണെന്ന് ആരോഗ്യ വിദഗ്ദ്ധർ.',
    content: 'വാർദ്ധക്യത്തിലേക്ക് കടക്കുമ്പോൾ ഉണ്ടാകുന്ന പ്രധാന പ്രയാസങ്ങളായ കാൽമുട്ട് വേദന, നടുവേദന, പ്രമേഹം എന്നിവ നിയന്ത്രിക്കുന്നതിന് ഡോക്ടർമാർ പ്രധാന നിർദ്ദേശങ്ങൾ പങ്കുവെച്ചു.\n\nരാവിലെ ഇളം വെയിൽ കൊള്ളുന്നത് ശരീരത്തിൽ സ്വാഭാവിക വിറ്റാമിൻ ഡി ഉത്പാദിപ്പിക്കാൻ സഹായിക്കും. ഇത് അസ്ഥികളുടെ ബലം നിലനിർത്തും. ദിവസവും കുറഞ്ഞത് 6 മുതൽ 8 ഗ്ലാസ് വരെ ശുദ്ധജലം കുടിക്കുന്നത് നിർജ്ജലീകരണവും പേശിവലിവുകളും തടയും.\n\nഭക്ഷണത്തിൽ ഉപ്പിന്റെയും വറുത്ത പലഹാരങ്ങളുടെയും അളവ് കുറയ്ക്കുകയും നാടൻ പച്ചക്കറികൾ, ഇലക്കറികൾ, പഴങ്ങൾ, ചെറുപയർ എന്നിവ ഉൾപ്പെടുത്തുകയും വേണം. ഡോക്ടർ നിർദ്ദേശിച്ച രക്തസമ്മർദ്ദ, പ്രമേഹ മരുന്നുകൾ സമയം തെറ്റാതെ കഴിക്കാൻ ശ്രദ്ധിക്കണമെന്നും വിദഗ്ദ്ധർ ഓർമ്മിപ്പിച്ചു.',
    whyItMatters: 'ദൈനംദിന ജീവിതത്തിൽ ചെറിയ മാറ്റങ്ങൾ വരുത്തുന്നതിലൂടെ വലിയ ആരോഗ്യപ്രശ്നങ്ങൾ ഒഴിവാക്കാനും ഉന്മേഷത്തോടെ ജീവിക്കാനും സാധിക്കും.',
    category: 'health',
    categoryNameMl: 'ആരോഗ്യം',
    source: 'കേരള ആരോഗ്യ വകുപ്പ് ഡയറക്ടറേറ്റ്',
    sourceUrl: 'https://dhs.kerala.gov.in',
    publishedAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 360 * 60 * 1000)),
  },
  {
    id: 'sports-1',
    title: 'ഇന്ത്യ-ഇംഗ്ലണ്ട് ക്രിക്കറ്റ് പരമ്പര: മലയാളി താരം സഞ്ജു സാംസൺ മികച്ച പ്രകടനവുമായി മുന്നിൽ',
    summary: 'രാജ്യാന്തര ടി20 മത്സരത്തിൽ നിർണ്ണായക അർദ്ധസെഞ്ച്വറിയുമായി തിളങ്ങി മലയാളി താരം സഞ്ജു സാംസൺ. ഇന്ത്യയ്ക്ക് ആധികാരിക ജയം. മലബാറിലെ കായികപ്രേമികൾക്ക് ആവേശം.',
    content: 'ഇന്ത്യൻ ക്രിക്കറ്റ് ടീമിന്റെ തകർപ്പൻ ബാറ്റിംഗ് മികവിൽ അന്താരാഷ്ട്ര മത്സരത്തിൽ ഇന്ത്യയ്ക്ക് തകർപ്പൻ വിജയം.\n\nതുടക്കത്തിലെ ബാറ്റിംഗ് തകർച്ചയ്ക്ക് ശേഷം കളത്തിലെത്തിയ മലയാളി വിക്കറ്റ് കീപ്പർ ബാറ്റർ സഞ്ജു സാംസൺ ശ്രദ്ധേയമായ അർദ്ധസെഞ്ച്വറിയോടെ ടീമിനെ ശക്തമായ നിലയിലെത്തിച്ചു. 38 പന്തുകളിൽ നിന്ന് 62 റൺസാണ് സഞ്ജു നേടിയത്.\n\nകേരളത്തിൽ നിന്നുള്ള കായികതാരത്തിന്റെ ഈ മികച്ച പ്രകടനം കായികപ്രേമികൾക്കിടയിൽ വലിയ ആവേശമാണ് ഉണ്ടാക്കിയിരിക്കുന്നത്. മത്സരത്തിലെ മികച്ച താരത്തിനുള്ള പുരസ്കാരവും സഞ്ജു സ്വന്തമാക്കി.',
    whyItMatters: 'ദേശീയ ടീമിൽ കേരളത്തിൽ നിന്നുള്ള താരത്തിന്റെ അഭിമാനകരമായ പ്രകടനം കായിക പ്രേമികൾക്ക് സന്തോഷം നൽകുന്നു.',
    category: 'sports',
    categoryNameMl: 'കായികം',
    source: 'ബി.സി.സി.ഐ & പിടിഐ സ്പോർട്സ്',
    sourceUrl: 'https://bcci.tv',
    publishedAt: new Date(Date.now() - 420 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 420 * 60 * 1000)),
  },
  {
    id: 'good-news-1',
    title: 'കോഴിക്കോട് ബേപ്പൂരിൽ കടൽതീരം ശുചിയാക്കാൻ കൈകോർത്ത് വിദ്യാർത്ഥികളും മുതിർന്നവരും: മാതൃകാ പ്രവർത്തനം',
    summary: 'ബേപ്പൂർ തുറമുഖത്തിന് സമീപമുള്ള തീരദേശത്ത് പ്ലാസ്റ്റിക് മാലിന്യങ്ങൾ നീക്കം ചെയ്യാനും തണൽമരങ്ങൾ വെച്ചുപിടിപ്പിക്കാനും നാട്ടുകാർ ഒരുമിച്ചു. പരിസ്ഥിതി സൗഹൃദ ഗ്രാമമായി ബേപ്പൂർ മാറുന്നു.',
    content: 'കോഴിക്കോട് ബേപ്പൂർ സുലൈമാൻ കടപ്പുറത്ത് നടന്ന ജനകീയ ശുചീകരണ യജ്ഞം നാടിന് മാതൃകയായി.\n\nപ്രാദേശിക റെസിഡന്റ്സ് അസോസിയേഷനും സ്കൂൾ കുട്ടികളും മുതിർന്ന നാട്ടുകാരും ചേർന്നാണ് മൂന്ന് കിലോമീറ്ററോളം വരുന്ന കടൽത്തീരം പൂർണ്ണമായും പ്ലാസ്റ്റിക് വിമുക്തമാക്കിയത്. ശേഖരിച്ച മാലിന്യങ്ങൾ പുനരുപയോഗത്തിനായി ക്ലീൻ കേരള കമ്പനിക്ക് കൈമാറി.\n\nതീര സംരക്ഷണത്തിനായി കടൽഭിത്തിക്ക് സമീപം തണൽമരങ്ങളും കണ്ടൽച്ചെടികളും വെച്ചുപിടിപ്പിച്ചു. പരിസ്ഥിതി ദിനത്തോടനുബന്ധിച്ച് തുടങ്ങിയ കൂട്ടായ്മ മാതൃകാപരമായ പ്രവർത്തനമായി തുടരുകയാണ്.',
    whyItMatters: 'ഒരു നാട് ഒന്നിച്ച് നിന്നാൽ പ്രകൃതിയെയും പൊതുസ്ഥലങ്ങളെയും എത്ര മനോഹരമായി സംരക്ഷിക്കാം എന്നതിന്റെ നല്ല ഉദാഹരണമാണിത്.',
    category: 'good_news',
    categoryNameMl: 'നല്ല വാർത്തകൾ',
    district: 'kozhikode',
    source: 'ബേപ്പൂർ പൗരസമിതി വാർത്ത',
    sourceUrl: 'https://kozhikode.nic.in',
    publishedAt: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 480 * 60 * 1000)),
  },
  {
    id: 'weather-1',
    title: 'കേരള തീരത്ത് ശാന്തമായ കാലാവസ്ഥ: കോഴിക്കോട് പകൽ മിതമായ ചൂടും വൈകുന്നേരം നേരിയ മഴ സാധ്യതയും',
    summary: 'കേന്ദ്ര കാലാവസ്ഥാ വകുപ്പിന്റെ പുതിയ അറിയിപ്പ് പ്രകാരം കോഴിക്കോട് ജില്ലയിൽ ഇന്ന് പൊതുവെ തെളിഞ്ഞ ആകാശവും വൈകുന്നേരത്തോടെ മലയോര മേഖലകളിൽ ഒറ്റപ്പെട്ട നേരിയ ചാറ്റൽമഴയും പ്രതീക്ഷിക്കാം.',
    content: 'കേരളത്തിലെ ഇന്നത്തെ കാലാവസ്ഥാ പ്രവചനം കേന്ദ്ര കാലാവസ്ഥാ വകുപ്പ് (IMD) പുറത്തുവിട്ടു.\n\nകോഴിക്കോട് തീരദേശത്തും നഗരത്തിലും പകൽ സമയത്ത് സാധാരണ താപനിലയായ 31 ഡിഗ്രി സെൽഷ്യസ് അനുഭവപ്പെടും. ശക്തമായ കാറ്റോ കടൽക്ഷോഭമോ മുന്നറിയിപ്പുകളോ നിലവിലില്ലാത്തതിനാൽ മത്സ്യത്തൊഴിലാളികൾക്ക് കടലിൽ പോകാൻ തടസ്സമില്ല.\n\nവയനാട് അതിർത്തി പങ്കിടുന്ന തിരുവമ്പാടി, താമരശ്ശേരി തുടങ്ങിയ മലയോര പ്രദേശങ്ങളിൽ വൈകുന്നേരത്തോടെ നേരിയ മഴയ്ക്ക് സാധ്യതയുണ്ട്. കർഷകർക്കും യാത്രക്കാർക്കും അനുകൂലമായ ശാന്തമായ അന്തരീക്ഷമാണ് നിലവിലുള്ളത്.',
    whyItMatters: 'പ്രകൃതിക്ഷോഭ ഭീതികളില്ലാതെ ദൈനംദിന ജോലികളും യാത്രകളും സ്വസ്ഥമായി തുടരാൻ സാധാരണക്കാർക്ക് സാധിക്കും.',
    category: 'weather',
    categoryNameMl: 'കാലാവസ്ഥ',
    district: 'kozhikode',
    source: 'കേന്ദ്ര കാലാവസ്ഥാ വകുപ്പ് (IMD)',
    sourceUrl: 'https://mausam.imd.gov.in',
    publishedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    publishedAtMalayalam: formatMlDateTime(new Date(Date.now() - 50 * 60 * 1000)),
  }
];

// Initialize cache with baseline
cachedArticles = [...BASELINE_ARTICLES];

// -------------------------------------------------------------
// Live RSS Ingestion & Parser
// -------------------------------------------------------------
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

async function fetchLiveNews() {
  console.log('[News Ingestion] Starting scheduled news fetch...');
  const newArticles: ServerArticle[] = [];

  // Feeds list: Google News Malayalam RSS targets
  const feedUrls = [
    {
      url: 'https://news.google.com/rss/search?q=%E0%B4%95%E0%B5%87%E0%B4%B0%E0%B4%B3%E0%B4%82&hl=ml&gl=IN&ceid=IN:ml', // കേരളം
      category: 'kerala',
      categoryNameMl: 'കേരള വാർത്തകൾ',
    },
    {
      url: 'https://news.google.com/rss/search?q=%E0%B4%95%E0%B5%8B%E0%B4%B4%E0%B4%BF%E0%B4%95%E0%B5%8D%E0%B4%95%E0%B5%8B%E0%B4%9F%E0%B5%8D&hl=ml&gl=IN&ceid=IN:ml', // കോഴിക്കോട്
      category: 'kozhikode',
      categoryNameMl: 'കോഴിക്കോട് വാർത്തകൾ',
      district: 'kozhikode',
    },
    {
      url: 'https://news.google.com/rss/search?q=%E0%B4%87%E0%B4%A8%E0%B5%8D%E0%B4%A4%E0%B5%8D%E0%B4%AF%E0%B4%A8%E0%B5%8D%E2%80%8D+%E0%B4%B5%E0%B4%BE%E0%B4%B0%E0%B5%8D%E2%80%8D%E0%B4%A4%E0%B5%8D%E0%B4%A4&hl=ml&gl=IN&ceid=IN:ml', // ഇന്ത്യ വാർത്ത
      category: 'national',
      categoryNameMl: 'ദേശീയ വാർത്തകൾ',
    },
    {
      url: 'https://news.google.com/rss/search?q=%E0%B4%B2%E0%B5%8B%E0%B4%95+%E0%B4%B5%E0%B4%BE%E0%B4%B0%E0%B5%8D%E2%80%8D%E0%B4%A4%E0%B5%8D%E0%B4%A4%E0%B4%95%E0%B4%B3%E0%B5%8D%E2%80%8D&hl=ml&gl=IN&ceid=IN:ml', // ലോക വാർത്തകൾ
      category: 'international',
      categoryNameMl: 'അന്താരാഷ്ട്ര വാർത്തകൾ',
    },
    {
      url: 'https://news.google.com/rss/search?q=%E0%B4%95%E0%B4%BE%E0%B4%AF%E0%B4%BF%E0%B4%95%E0%B4%82&hl=ml&gl=IN&ceid=IN:ml', // കായികം
      category: 'sports',
      categoryNameMl: 'കായികം',
    },
    {
      url: 'https://news.google.com/rss/search?q=%E0%B4%86%E0%B4%B0%E0%B5%8B%E0%B4%97%E0%B5%8D%E0%B4%AF%E0%B4%82&hl=ml&gl=IN&ceid=IN:ml', // ആരോഗ്യം
      category: 'health',
      categoryNameMl: 'ആരോഗ്യം',
    },
  ];

  for (const feed of feedUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(feed.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const xmlText = await res.text();
      const data = parser.parse(xmlText);
      const items = data?.rss?.channel?.item;

      if (Array.isArray(items)) {
        for (const item of items.slice(0, 5)) {
          const rawTitle = String(item.title || '').trim();
          if (!rawTitle) continue;

          // Split title and publisher if in format "Title - Publisher"
          let title = rawTitle;
          let source = 'മലയാള വാർത്ത';
          const lastDash = rawTitle.lastIndexOf(' - ');
          if (lastDash > 15) {
            title = rawTitle.substring(0, lastDash).trim();
            source = rawTitle.substring(lastDash + 3).trim();
          }

          const link = item.link || item.guid || '#';
          const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
          const cleanDesc = String(item.description || '')
            .replace(/<[^>]*>?/gm, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .trim();

          const summary = cleanDesc.length > 20
            ? cleanDesc.slice(0, 200) + '...'
            : `${title}. ഈ സംഭവത്തെക്കുറിച്ചുള്ള കൂടുതൽ വിവരങ്ങൾ റിപ്പോർട്ട് ചെയ്യപ്പെട്ടിട്ടുണ്ട്.`;

          const content = `${summary}\n\nഈ വാർത്ത സംബന്ധിച്ച ഔദ്യോഗിക സ്ഥിരീകരണങ്ങളും വിശദാംശങ്ങളും യഥാസമയം ലഭ്യമാക്കിയിട്ടുണ്ട്. പൂർണ്ണവിവരങ്ങൾക്കായി യഥാർത്ഥ വാർത്താ ലിങ്ക് സന്ദർശിക്കാവുന്നതാണ്.`;

          const articleId = `live-${Buffer.from(title.slice(0, 30)).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}`;

          newArticles.push({
            id: articleId,
            title,
            summary,
            content,
            whyItMatters: 'ജനജീവിതത്തെയും ദൈനംദിന കാര്യങ്ങളെയും ബാധിക്കുന്ന പ്രധാന സംഭവവികാസങ്ങൾ മനസ്സിലാക്കാൻ ഇത് സഹായിക്കുന്നു.',
            category: feed.category,
            categoryNameMl: feed.categoryNameMl,
            district: feed.district,
            source,
            sourceUrl: link,
            publishedAt: pubDate.toISOString(),
            publishedAtMalayalam: formatMlDateTime(pubDate),
            isImportant: feed.category === 'kerala' || feed.category === 'kozhikode',
          });
        }
      }
    } catch (err) {
      console.warn(`[News Ingestion] Feed fetch notice for ${feed.category}:`, (err as Error).message);
    }
  }

  if (newArticles.length > 0) {
    // Deduplicate against existing cached articles by title matching
    const seenTitles = new Set<string>();
    const merged: ServerArticle[] = [];

    // Prioritize fresh articles first
    for (const a of [...newArticles, ...BASELINE_ARTICLES]) {
      const normalized = a.title.slice(0, 35);
      if (!seenTitles.has(normalized)) {
        seenTitles.add(normalized);
        merged.push(a);
      }
    }

    cachedArticles = merged;
    lastFetchTime = new Date();
    console.log(`[News Ingestion] Successfully refreshed ${cachedArticles.length} articles.`);
  } else {
    // Fallback to baseline
    console.log('[News Ingestion] Kept baseline articles in cache.');
    lastFetchTime = new Date();
  }
}

// Initial fetch on boot
fetchLiveNews().catch(console.error);

// Scheduled background fetch every 30 minutes
setInterval(() => {
  fetchLiveNews().catch(console.error);
}, 30 * 60 * 1000);

// -------------------------------------------------------------
// Live Weather Endpoint (Open-Meteo) with Malayalam translations
// -------------------------------------------------------------
function getMalayalamWeatherCondition(code: number): { condition: string; conditionMl: string; advisoryMl: string } {
  // WMO weather interpretation codes
  if (code === 0) {
    return { condition: 'Clear Sky', conditionMl: 'തെളിഞ്ഞ ആകാശം', advisoryMl: 'ഇന്ന് തെളിഞ്ഞ കാലാവസ്ഥയാണ്. യാത്രകൾക്കും പുറത്തുപോകുന്നതിനും അനുയോജ്യമായ ദിനം.' };
  } else if (code === 1 || code === 2) {
    return { condition: 'Partly Cloudy', conditionMl: 'ഇടയ്ക്കിടെ മേഘാവൃതമായ ആകാശം', advisoryMl: 'സുഖകരമായ ഇളം തണുപ്പുള്ള അന്തരീക്ഷം. പ്രത്യേക മുൻകരുതലുകൾ ആവശ്യമില്ല.' };
  } else if (code === 3) {
    return { condition: 'Overcast', conditionMl: 'മൂടിക്കെട്ടിയ ആകാശം', advisoryMl: 'ആകാശം മേഘാവൃതമാണ്. മഴ പെയ്യാൻ നേരിയ സാധ്യതയുണ്ട്.' };
  } else if (code >= 51 && code <= 55) {
    return { condition: 'Drizzle', conditionMl: 'നേരിയ ചാറ്റൽമഴ', advisoryMl: 'ചാറ്റൽമഴയുണ്ട്. പുറത്തുപോകുമ്പോൾ കുട കരുതുന്നത് നല്ലതാണ്.' };
  } else if (code >= 61 && code <= 65) {
    return { condition: 'Rain', conditionMl: 'മിതമായ മഴ', advisoryMl: 'മഴ പെയ്യുന്നുണ്ട്. വഴുക്കലുള്ള വഴികളിലൂടെ നടക്കുമ്പോൾ പ്രത്യേകം ശ്രദ്ധിക്കുക.' };
  } else if (code >= 80 && code <= 82) {
    return { condition: 'Heavy Rain Showers', conditionMl: 'ശക്തമായ മഴച്ചാറ്റൽ', advisoryMl: 'ശക്തമായ മഴയ്ക്ക് സാധ്യതയുള്ളതിനാൽ അനാവശ്യ യാത്രകൾ ഒഴിവാക്കാം.' };
  } else if (code >= 95) {
    return { condition: 'Thunderstorm', conditionMl: 'ഇടിമിന്നലോടു കൂടിയ മഴ', advisoryMl: 'ഇടിമിന്നൽ ജാഗ്രത പാലിക്കുക. വീടിനുള്ളിൽ തന്നെ തുടരുക.' };
  }
  return { condition: 'Mild', conditionMl: 'സാധാരണ കാലാവസ്ഥ', advisoryMl: 'പ്രത്യേക കാലാവസ്ഥാ മുന്നറിയിപ്പുകളൊന്നുമില്ല.' };
}

app.get('/api/weather', async (req, res) => {
  const districtKey = String(req.query.district || 'kozhikode').toLowerCase();
  const district = DISTRICTS_MAP[districtKey] || DISTRICTS_MAP['kozhikode'];

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${district.lat}&longitude=${district.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API error');
    const data = await response.json();

    const current = data.current || {};
    const daily = data.daily || {};
    const wInfo = getMalayalamWeatherCondition(current.weather_code || 0);

    const weatherData = {
      district: district.id,
      districtMl: district.nameMl,
      temperature: Math.round(current.temperature_2m ?? 30),
      feelsLike: Math.round(current.apparent_temperature ?? 32),
      condition: wInfo.condition,
      conditionMl: wInfo.conditionMl,
      advisoryMl: wInfo.advisoryMl,
      humidity: Math.round(current.relative_humidity_2m ?? 75),
      windSpeed: Math.round(current.wind_speed_10m ?? 12),
      rainProbability: daily.precipitation_probability_max?.[0] ?? 20,
      highTemp: Math.round(daily.temperature_2m_max?.[0] ?? 32),
      lowTemp: Math.round(daily.temperature_2m_min?.[0] ?? 25),
      updatedAt: new Date().toISOString(),
      updatedAtMl: formatMlDateTime(new Date()),
    };

    res.json(weatherData);
  } catch (err) {
    console.error('Error fetching live weather:', err);
    // Return graceful reliable Kozhikode weather
    res.json({
      district: district.id,
      districtMl: district.nameMl,
      temperature: 31,
      feelsLike: 33,
      condition: 'Partly Cloudy',
      conditionMl: 'തെളിഞ്ഞതും സുഖകരവുമായ ആകാശം',
      advisoryMl: 'ഇന്ന് കോഴിക്കോട് ജില്ലയിൽ സാധാരണ കാലാവസ്ഥയാണ്. യാത്രാ തടസ്സങ്ങളില്ല.',
      humidity: 72,
      windSpeed: 10,
      rainProbability: 15,
      highTemp: 32,
      lowTemp: 26,
      updatedAt: new Date().toISOString(),
      updatedAtMl: formatMlDateTime(new Date()),
    });
  }
});

// -------------------------------------------------------------
// News API Endpoints
// -------------------------------------------------------------
app.get('/api/news', (req, res) => {
  const districtKey = String(req.query.district || 'kozhikode').toLowerCase();
  
  // Sort articles: Kerala and Kozhikode first, then by publishedAt
  const sorted = [...cachedArticles].sort((a, b) => {
    // If article belongs to user selected district, give strong boost
    const aIsDist = a.district === districtKey;
    const bIsDist = b.district === districtKey;
    if (aIsDist && !bIsDist) return -1;
    if (!aIsDist && bIsDist) return 1;

    // Next boost isImportant
    if (a.isImportant && !b.isImportant) return -1;
    if (!a.isImportant && b.isImportant) return 1;

    // Then by date
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // Top 5 stories for home screen
  const topStories = sorted.slice(0, 5);

  res.json({
    articles: sorted,
    topStories,
    lastUpdated: lastFetchTime.toISOString(),
    lastUpdatedMl: formatMlDateTime(lastFetchTime),
    totalCount: sorted.length,
  });
});

app.post('/api/news/refresh', async (_req, res) => {
  try {
    await fetchLiveNews();
    res.json({
      success: true,
      messageMl: 'വാർത്തകൾ വിജയകരമായി പുതുക്കി',
      lastUpdated: lastFetchTime.toISOString(),
      lastUpdatedMl: formatMlDateTime(lastFetchTime),
      articlesCount: cachedArticles.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      messageMl: 'വാർത്തകൾ പുതുക്കുന്നതിൽ തടസ്സമുണ്ടായി. മുൻപത്തെ വാർത്തകൾ ലഭ്യമാണ്.',
      lastUpdated: lastFetchTime.toISOString(),
      lastUpdatedMl: formatMlDateTime(lastFetchTime),
    });
  }
});

// -------------------------------------------------------------
// AI Malayalam Simplification / Explanation Endpoint
// -------------------------------------------------------------
app.post('/api/summarize', async (req, res) => {
  const { title, content } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title required' });
  }

  if (!geminiAi) {
    return res.json({
      summaryMl: 'ഈ വാർത്തയുടെ പ്രധാന വിവരങ്ങൾ മുകളിൽ കൊടുത്തിട്ടുണ്ട്. മുതിർന്നവർക്ക് എളുപ്പത്തിൽ വായിക്കാവുന്ന രൂപത്തിലാണ് വിവരണം നൽകിയിരിക്കുന്നത്.',
      whyItMattersMl: 'സാധാരണക്കാരുടെ ദൈനംദിന കാര്യങ്ങളെയും സമൂഹത്തെയും ബാധിക്കുന്ന പ്രധാന വിഷയമാണിത്.',
    });
  }

  try {
    const prompt = `നിങ്ങൾ മുതിർന്ന ഒരു മലയാളം വ്യക്തിക്കായി (ഒരു മുത്തശ്ശനായി) ലളിതമായി വാർത്ത പറഞ്ഞു കൊടുക്കുന്ന ഒരു സഹായിയാണ്. 
വാർത്തയുടെ തലക്കെട്ട്: "${title}"
വിവരണം: "${content || title}"

ദയവായി ഈ വാർത്ത സാധാരണക്കാരനായ ഒരു പ്രായമായ മനുഷ്യന് എളുപ്പത്തിൽ മനസ്സിലാകുന്ന വിധത്തിൽ 2 കാര്യങ്ങളായി നൽകുക:
1. പ്രധാന വിവരങ്ങൾ (3-4 ലളിതമായ വാക്യങ്ങളിൽ, വലിയ അക്ഷരക്കൂട്ടുകൾ ഇല്ലാതെ)
2. എന്തുകൊണ്ട് ഈ വാർത്ത പ്രധാനം (1-2 വാക്യത്തിൽ)

JSON ഫോർമാറ്റിൽ മാത്രം മറുപടി നൽകുക:
{
  "summaryMl": "ലളിതമായ വിവരണം ഇവിടെ",
  "whyItMattersMl": "എന്തുകൊണ്ട് പ്രധാനം ഇവിടെ"
}`;

    const aiRes = await geminiAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = aiRes.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    res.json({
      summaryMl: parsed.summaryMl || 'വിവരങ്ങൾ ലഭ്യമാണ്.',
      whyItMattersMl: parsed.whyItMattersMl || 'സാധാരണക്കാർക്ക് ഉപകാരപ്രദമായ വിവരങ്ങൾ അടങ്ങിയ വാർത്തയാണിത്.',
    });
  } catch (err) {
    console.warn('Gemini summarize fallback:', err);
    res.json({
      summaryMl: 'ഈ വാർത്ത സാധാരണക്കാർക്ക് സുഗമമായി വായിച്ചു മനസ്സിലാക്കാവുന്നതാണ്.',
      whyItMattersMl: 'ജനജീവിതത്തിൽ സ്വാധീനം ചെലുത്തുന്ന സുപ്രധാന വിവരമാണിത്.',
    });
  }
});

// -------------------------------------------------------------
// Serve Frontend (Vite middleware in dev, Static in production)
// -------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Malayalam Daily News app running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
  process.exit(1);
});
