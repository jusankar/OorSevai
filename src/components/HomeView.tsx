import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Search, Sprout, HardHat, Wrench, Tent, Users, 
  MapPin, Bell, Shield, BadgePercent, ThumbsUp, Sparkles, ArrowRight,
  Cloud, Sun, CloudRain, CloudLightning, CloudSun, Droplets, Thermometer, Loader2, Locate,
  Mic, MicOff
} from "lucide-react";
import { Equipment } from "../types";
import { getTranslation, Language } from "../translate";

// Helper function to interpret WMO weather codes and provide agricultural guidance
const getWeatherDetails = (code: number, rainSum: number = 0) => {
  if (code === 0) {
    return {
      label: "Sunny & Clear",
      icon: Sun,
      advice: "Perfect for seed sowing, pesticide spraying, and harvesting. Keep crops well-irrigated to prevent heat stress.",
      bgColor: "bg-amber-50 border-amber-100",
      iconColor: "text-amber-500",
      accentBg: "bg-amber-500/10",
    };
  }
  if (code === 1 || code === 2 || code === 3) {
    return {
      label: "Partly Cloudy",
      icon: CloudSun,
      advice: "Favorable conditions for tilling, weeding, and transplanting young crops. Low evapotranspiration rate helps root settling.",
      bgColor: "bg-slate-50 border-slate-200",
      iconColor: "text-sky-500",
      accentBg: "bg-sky-500/10",
    };
  }
  if (code === 45 || code === 48) {
    return {
      label: "Foggy / Misty",
      icon: Cloud,
      advice: "High air moisture. Check for early pest or fungal attacks. Hold off on early morning sensitive crop harvests.",
      bgColor: "bg-zinc-50 border-zinc-200",
      iconColor: "text-[#8A867E]",
      accentBg: "bg-zinc-500/10",
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      label: "Light Drizzle",
      icon: Droplets,
      advice: "Gentle drizzle. Excellent for soil moisture replenishment and fertilizer application. Ideal time for planting saplings.",
      bgColor: "bg-teal-50 border-teal-200",
      iconColor: "text-teal-500",
      accentBg: "bg-teal-500/10",
    };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    const isHeavy = rainSum > 10;
    return {
      label: isHeavy ? "Heavy Rainfall" : "Moderate Rain",
      icon: CloudRain,
      advice: isHeavy 
        ? "Heavy rain warning! Clear farm drainage pathways to prevent waterlogging. Postpone sowing or pesticide spray."
        : "Moderate rain. Great for natural rainfed crops. Postpone spraying chemicals and dry-harvest operations.",
      bgColor: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-500",
      accentBg: "bg-blue-500/10",
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      label: "Thunderstorms",
      icon: CloudLightning,
      advice: "Severe storm warning! Secure lightweight farm machinery. Seek safe indoor shelter for workers and livestock.",
      bgColor: "bg-red-50 border-red-200",
      iconColor: "text-red-500",
      accentBg: "bg-red-500/10",
    };
  }
  return {
    label: "Mild Weather",
    icon: CloudSun,
    advice: "Stable weather conditions. Continue general agricultural activities, weeding, and routine crop irrigation.",
    bgColor: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-500",
    accentBg: "bg-[#3E5C31]/10",
  };
};

interface HomeViewProps {
  popularEquipment: Equipment[];
  onSelectCategory: (cat: string) => void;
  onSelectEquipment: (eq: Equipment) => void;
  onStartSearch: (query: string) => void;
  onChangeRole: (role: "customer" | "owner" | "labor" | "admin") => void;
  onNavigate: (tab: "home" | "bookings" | "add" | "messages" | "profile") => void;
  adminLocation?: string;
  adminDistance?: number;
  language?: Language;
  userName?: string;
}

export default function HomeView({
  popularEquipment,
  onSelectCategory,
  onSelectEquipment,
  onStartSearch,
  onChangeRole,
  onNavigate,
  adminLocation = "Coimbatore, Tamil Nadu",
  adminDistance = 15,
  language = "en",
  userName
}: HomeViewProps) {
  const t = (key: Parameters<typeof getTranslation>[1]): string => getTranslation(language, key);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any | null>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    setSpeechError(null);
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === "ta" ? "ta-IN" : "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError(language === "ta" ? "மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது." : "Microphone access denied.");
        } else if (event.error === "no-speech") {
          setSpeechError(language === "ta" ? "பேச்சு எதுவும் கண்டறியப்படவில்லை." : "No speech detected.");
        } else {
          setSpeechError(language === "ta" ? `பிழை: ${event.error}` : `Error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          let cleanText = transcript.trim();
          if (cleanText.endsWith(".")) {
            cleanText = cleanText.slice(0, -1).trim();
          }
          setSearchQuery(cleanText);
          onStartSearch(cleanText);
        }
      };

      recognition.start();
      setRecognitionInstance(recognition);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  React.useEffect(() => {
    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [recognitionInstance]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any[] | null>(null);
  const [selectedWeatherDayIndex, setSelectedWeatherDayIndex] = useState(0);
  const [weatherLocation, setWeatherLocation] = useState({
    name: adminLocation || "Coimbatore, Tamil Nadu",
    latitude: 11.0168,
    longitude: 76.9558,
  });

  const fetchWeather = async (lat: number, lon: number, customName?: string) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,rain_sum&timezone=auto`
      );
      if (!response.ok) {
        throw new Error("Unable to retrieve weather forecast");
      }
      const data = await response.json();
      
      if (data.daily) {
        const days = [];
        const limit = 3; // 3-day forecast
        for (let i = 0; i < limit; i++) {
          const dateStr = data.daily.time[i];
          const parsedDate = new Date(dateStr);
          const formattedDate = parsedDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          
          const code = data.daily.weathercode[i];
          const maxTemp = data.daily.temperature_2m_max[i];
          const minTemp = data.daily.temperature_2m_min[i];
          const rain = data.daily.rain_sum[i];
          
          days.push({
            date: formattedDate,
            tempMax: Math.round(maxTemp),
            tempMin: Math.round(minTemp),
            rain: rain,
            code: code,
          });
        }
        setWeatherData(days);
        if (customName) {
          setWeatherLocation({ name: customName, latitude: lat, longitude: lon });
        }
      } else {
        throw new Error("Daily forecast data is currently unavailable");
      }
    } catch (err: any) {
      console.error(err);
      setWeatherError(err.message || "Failed to retrieve farming weather forecast");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation is not supported by your browser");
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detectedName = `Near ${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${language}`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const parts: string[] = [];
            
            const localArea = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet;
            const mainPlace = addr.city || addr.town || addr.county || "Your Location";
            
            if (localArea) parts.push(localArea);
            if (mainPlace && mainPlace !== localArea) {
              const cleanedMain = mainPlace.replace(/\s+District/gi, "").replace(/\s+மாவட்டம்/g, "");
              parts.push(cleanedMain);
            }
            if (addr.state) {
              const stateClean = addr.state.replace(/\s+State/gi, "").replace(/\s+மாநிலம்/g, "");
              if (!parts.includes(stateClean)) {
                parts.push(stateClean);
              }
            }
            
            detectedName = parts.length > 0 ? parts.join(", ") : geoData.display_name || detectedName;
          }
        } catch (e) {
          console.error("Reverse geocoding failed, using coordinates:", e);
        }
        fetchWeather(latitude, longitude, detectedName);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setWeatherError("Location access denied or unavailable. Using default Coimbatore forecast.");
        fetchWeather(11.0168, 76.9558, "Coimbatore, TN (Default)");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  React.useEffect(() => {
    const detectAndFetch = async () => {
      setWeatherLoading(true);
      
      // Let's first ensure the UI displays the registered location name immediately
      setWeatherLocation(prev => ({ ...prev, name: adminLocation }));

      // If we have an active registered location, let's geocode it to show exact crop weather!
      if (adminLocation && adminLocation !== "Coimbatore, Tamil Nadu") {
        try {
          const searchRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(adminLocation)}&format=json&limit=1`
          );
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData && searchData.length > 0) {
              const lat = parseFloat(searchData[0].lat);
              const lon = parseFloat(searchData[0].lon);
              await fetchWeather(lat, lon, adminLocation);
              return;
            }
          }
        } catch (e) {
          console.error("Failed to geocode registered location, falling back:", e);
        }
      } else if (adminLocation === "Coimbatore, Tamil Nadu") {
        await fetchWeather(11.0168, 76.9558, adminLocation);
        return;
      }

      try {
        // Try IP Geolocation first for a silent and instant city-level load
        const ipRes = await fetch("https://ipapi.co/json/");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            const cityName = ipData.city 
              ? `${ipData.city}${ipData.region_code ? `, ${ipData.region_code}` : ""}`
              : `${ipData.latitude.toFixed(2)}°N, ${ipData.longitude.toFixed(2)}°E`;
            await fetchWeather(ipData.latitude, ipData.longitude, adminLocation || cityName);
            return;
          }
        }
      } catch (e) {
        console.error("IP Geolocation failed:", e);
      }

      // Fallback 1: Browser Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            let detectedName = adminLocation || `Near ${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
            if (!adminLocation) {
              try {
                const geoRes = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${language}`
                );
                if (geoRes.ok) {
                  const geoData = await geoRes.json();
                  const addr = geoData.address || {};
                  const parts: string[] = [];
                  
                  const localArea = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet;
                  const mainPlace = addr.city || addr.town || addr.county || "Your Location";
                  
                  if (localArea) parts.push(localArea);
                  if (mainPlace && mainPlace !== localArea) {
                    const cleanedMain = mainPlace.replace(/\s+District/gi, "").replace(/\s+மாவட்டம்/g, "");
                    parts.push(cleanedMain);
                  }
                  if (addr.state) {
                    const stateClean = addr.state.replace(/\s+State/gi, "").replace(/\s+மாநிலம்/g, "");
                    if (!parts.includes(stateClean)) {
                      parts.push(stateClean);
                    }
                  }
                  
                  detectedName = parts.length > 0 ? parts.join(", ") : geoData.display_name || detectedName;
                }
              } catch (e) {
                console.error("Nominatim reverse geocoding failed on init:", e);
              }
            }
            fetchWeather(latitude, longitude, detectedName);
          },
          (error) => {
            console.error("Browser Geolocation failed on init:", error);
            fetchWeather(11.0168, 76.9558, adminLocation || "Coimbatore, Tamil Nadu");
          },
          { enableHighAccuracy: true, timeout: 3000 }
        );
      } else {
        fetchWeather(11.0168, 76.9558, adminLocation || "Coimbatore, Tamil Nadu");
      }
    };

    detectAndFetch();
  }, [adminLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onStartSearch(searchQuery);
    }
  };

  const FALLBACK_IMAGES: Record<string, string> = {
    agriculture: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=350&q=80",
    construction: "https://images.unsplash.com/photo-1578319439584-104c94d37305?auto=format&fit=crop&w=350&q=80",
    tools: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=350&q=80",
    function: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=350&q=80",
    labor: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=350&q=80",
  };

  const categories = [
    { 
      id: "agriculture", 
      title: language === "ta" ? "வேளாண் உபகரணங்கள்" : "AGRICULTURE EQUIPMENT", 
      sub: language === "ta" ? "விவசாய இயந்திரங்கள்" : "Farming Machines", 
      icon: Sprout, 
      image: "/assets/categories/agriculture.webp" 
    },
    { 
      id: "labor", 
      title: language === "ta" ? "தொழிலாளர் சேவைகள்" : "LABOR SERVICES", 
      sub: language === "ta" ? "உள்ளூர் தொழிலாளர்கள்" : "Skilled Labors", 
      icon: Users, 
      image: "/assets/categories/labor.webp" 
    },
    { 
      id: "construction", 
      title: language === "ta" ? "கட்டுமான உபகரணங்கள்" : "CONSTRUCTION EQUIPMENT", 
      sub: language === "ta" ? "கனரக இயந்திரங்கள்" : "Heavy Machinery", 
      icon: HardHat, 
      image: "/assets/categories/construction.webp" 
    },
    { 
      id: "tools", 
      title: language === "ta" ? "கருவிகள் & இயந்திரங்கள்" : "TOOLS & MACHINERY", 
      sub: language === "ta" ? "மின்சாரக் கருவிகள்" : "Power Tools", 
      icon: Wrench, 
      image: "/assets/categories/tools.webp" 
    },
    { 
      id: "function", 
      title: language === "ta" ? "நிகழ்ச்சி & விழா பொருட்கள்" : "EVENT & FUNCTION ITEMS", 
      sub: language === "ta" ? "விழா பந்தல் & நாற்காலிகள்" : "Canopies & Chairs", 
      icon: Tent, 
      image: "/assets/categories/function.webp" 
    },
  ];

  return (
    <div id="home-view-container" className="space-y-6 max-w-lg mx-auto bg-[#FDFCF9] dark:bg-[#111613] min-h-screen pb-20 text-[#2D2D2A] dark:text-slate-100">
      
      {/* Header Section */}
      <div id="home-header" className="bg-white dark:bg-[#1C2420] px-4 pt-6 pb-5 rounded-b-3xl shadow-xs border-b border-[#E8E6E1] dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-white h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center shadow-sm p-0.5 border border-[#E8E6E1] dark:border-slate-800 shrink-0">
              <img src="/icon.svg" alt="Oor Sevai Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="flex items-center text-[#8A867E] dark:text-slate-300 text-xs">
                <MapPin className="h-3.5 w-3.5 text-[#3E5C31] dark:text-emerald-400 mr-1 shrink-0" />
                <span className="font-semibold text-[#2D2D2A] dark:text-slate-100 max-w-[130px] truncate" title={adminLocation}>
                  {adminLocation.split(",")[0]}
                </span>
                <span className="ml-1 text-[8px] bg-emerald-50 dark:bg-[#3E5C31]/20 text-[#3E5C31] dark:text-emerald-400 px-1.5 py-0.5 rounded font-black border border-emerald-100/60 dark:border-[#3E5C31]/30 shrink-0">
                  {adminDistance} KM {t("radius")}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-[#2D2D2A] dark:text-slate-100">
                {userName 
                  ? (language === "ta" ? `வணக்கம், ${userName} 👋` : `Hello, ${userName} 👋`)
                  : t("hello_user")}
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="relative bg-[#F3F1ED] dark:bg-[#25302A] p-2 rounded-full text-[#2D2D2A] dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-[#2E3C34]">
               <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#D97706] rounded-full border border-white dark:border-slate-800"></span>
              <Bell className="h-4 w-4" />
            </button>
            <div 
              className="bg-[#3E5C31]/10 dark:bg-emerald-500/10 text-[#3E5C31] dark:text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#3E5C31]/20 dark:hover:bg-emerald-500/20"
              onClick={() => onNavigate("profile")}
            >
              {t("demo_profile")}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] font-black tracking-widest text-[#3E5C31] dark:text-emerald-400 uppercase bg-[#3E5C31]/10 dark:bg-[#3E5C31]/20 px-2 py-0.5 rounded-md">{t("app_title")}</span>
            <span className="text-[10px] font-bold text-[#8A867E] dark:text-slate-400">{t("app_subtitle")}</span>
          </div>
          <h1 className="text-2xl font-black text-[#2D2D2A] dark:text-white tracking-tight leading-tight">
            {t("rent_anything")}<br />
            <span className="text-[#3E5C31] dark:text-emerald-400 font-extrabold">{t("get_work_done")}</span>
          </h1>
          <p className="text-xs text-[#8A867E] dark:text-slate-300">{t("tagline")}</p>
        </div>

        {/* Search Input */}
        <div className="space-y-2">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F3F1ED] dark:bg-[#252F2A] text-[#2D2D2A] dark:text-slate-100 pl-11 pr-[96px] py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3E5C31] dark:focus:ring-emerald-500 border border-[#E8E6E1] dark:border-slate-800 focus:bg-white dark:focus:bg-[#1C2420] transition-all shadow-inner"
            />
            <Search className="absolute left-4 h-4 w-4 text-[#8A867E]" />
            
            {/* Listening HUD overlay replaces input interaction elegantly during listening */}
            {isListening && (
              <div className="absolute inset-0 bg-[#3E5C31]/10 dark:bg-emerald-950/20 backdrop-blur-xs rounded-2xl flex items-center justify-between px-11 pr-[96px] text-xs font-semibold text-[#3E5C31] dark:text-emerald-400 animate-pulse">
                <span className="flex items-center space-x-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 animate-pulse"></span>
                  </span>
                  <span className="font-extrabold tracking-tight">
                    {language === "ta" ? "கேட்கிறது... பேசவும்" : "Listening... Speak category"}
                  </span>
                </span>
                
                {/* Audio Soundwave animation */}
                <div className="flex space-x-1 items-center">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1 bg-[#3E5C31] dark:bg-emerald-400 rounded-full"
                      style={{ height: 8 }}
                      animate={{
                        height: [8, 18, 8],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.12,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Speech Recognition Mic Button */}
            <button 
              type="button"
              onClick={toggleListening}
              className={`absolute right-[52px] p-2.5 rounded-xl transition-all ${
                isListening 
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20" 
                  : "bg-[#FAF7F2] dark:bg-[#25302A] hover:bg-[#F3F1ED] dark:hover:bg-[#2E3C34] text-[#3E5C31] dark:text-emerald-400 border border-[#E8E6E1] dark:border-slate-800"
              }`}
              title={language === "ta" ? "குரல் தேடல்" : "Voice Search"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 animate-bounce" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>

            {/* Standard Submit Button */}
            <button 
              type="submit"
              className="absolute right-2 bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white p-2.5 rounded-xl transition-all"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Speech Recognition Error Banner */}
          {speechError && (
            <div className="text-[10px] text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-2.5 rounded-xl flex justify-between items-center animate-fade-in">
              <span className="font-semibold flex items-center">
                <span className="mr-1.5">⚠️</span> {speechError}
              </span>
              <button 
                onClick={() => setSpeechError(null)} 
                className="text-amber-900 dark:text-amber-300 font-extrabold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Categories Panel */}
      <div id="home-categories" className="px-4 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{t("browse_categories")}</h3>
            <p className="text-[10px] text-[#8A867E] dark:text-slate-400">
              {language === "ta" ? "வகை வாரியாக ஆராய வலப்புறம் நகர்த்தவும்" : "Swipe to explore categories"}
            </p>
          </div>
          <span className="text-[10px] bg-[#3E5C31]/10 text-[#3E5C31] dark:text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
            5 {t("categories_count")}
          </span>
        </div>

        {/* Categories Carousel */}
        <div 
          className="flex overflow-x-auto gap-4 pb-2 scroll-smooth snap-x snap-mandatory scrollbar-none"
          id="categories-carousel"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="flex-shrink-0 w-[175px] snap-start bg-white dark:bg-[#1C2420] rounded-2xl border border-[#E8E6E1] dark:border-slate-800 overflow-hidden shadow-xs hover:scale-[1.03] active:scale-98 transition-all duration-300 text-left flex flex-col group cursor-pointer"
              >
                {/* Image Section */}
                <div className="relative h-[115px] w-full overflow-hidden bg-[#FAF7F2] dark:bg-slate-900">
                  <img 
                    src={cat.image} 
                    alt={cat.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== FALLBACK_IMAGES[cat.id]) {
                        target.src = FALLBACK_IMAGES[cat.id];
                      }
                    }}
                  />
                  {/* Floating Icon Badging */}
                  <div className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-white/95 dark:bg-slate-900/95 shadow-sm backdrop-blur-xs text-[#2D2D2A] dark:text-slate-200">
                    <Icon className="h-4 w-4 text-[#3E5C31] dark:text-emerald-400" />
                  </div>
                  
                  {/* Category Accent Stripe */}
                  <div className={`absolute bottom-0 inset-x-0 h-1 ${
                    cat.id === 'agriculture' ? 'bg-[#3E5C31]' : 
                    cat.id === 'construction' ? 'bg-[#D97706]' : 
                    cat.id === 'tools' ? 'bg-[#2D2D2A] dark:bg-slate-400' : 
                    cat.id === 'function' ? 'bg-purple-600' : 
                    'bg-amber-600'
                  }`} />
                </div>

                {/* Content Section */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="text-[12px] font-black text-[#2D2D2A] dark:text-white leading-tight group-hover:text-[#3E5C31] dark:group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                      {cat.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {cat.sub}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F3F1ED] dark:border-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-[#3E5C31] dark:text-emerald-400 group-hover:translate-x-1 transition-transform duration-300 flex items-center gap-1">
                      {language === "ta" ? "ஆராய்" : "Explore"} <ArrowRight className="h-3 w-3 inline" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trust & Verification badging */}
      <div id="trust-banner" className="mx-4 bg-white dark:bg-[#1C2420] border border-[#E8E6E1] dark:border-slate-800 rounded-2xl p-3 grid grid-cols-4 gap-1 text-center shadow-xs">
        <div className="flex flex-col items-center">
          <div className="bg-[#3E5C31]/10 dark:bg-emerald-500/10 text-[#3E5C31] dark:text-emerald-400 p-1.5 rounded-lg mb-1">
            <Shield className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9px] font-bold text-[#2D2D2A] dark:text-slate-200">{t("verified_owners")}</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-[#D97706]/10 dark:bg-amber-500/10 text-[#D97706] dark:text-amber-400 p-1.5 rounded-lg mb-1">
            <ThumbsUp className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9px] font-bold text-[#2D2D2A] dark:text-slate-200">{t("quality_assured")}</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-amber-50 dark:bg-amber-500/10 text-[#D97706] dark:text-amber-400 p-1.5 rounded-lg mb-1">
            <BadgePercent className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9px] font-bold text-[#2D2D2A] dark:text-slate-200">{t("best_prices")}</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 p-1.5 rounded-lg mb-1">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9px] font-bold text-[#2D2D2A] dark:text-slate-200">{t("secure_escrow")}</span>
        </div>
      </div>

      {/* Local Farming Weather Widget */}
      <div id="farming-weather-widget" className="mx-4 bg-white dark:bg-[#1C2420] border border-[#E8E6E1] dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-3.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-[#3E5C31]/10 dark:bg-[#3E5C31]/20 text-[#3E5C31] dark:text-emerald-400 p-1.5 rounded-xl">
              <Sun className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#2D2D2A] dark:text-slate-100 text-xs uppercase tracking-wider">{t("local_farming_weather")}</h3>
              <p className="text-[10px] text-[#8A867E] dark:text-slate-300 flex items-center mt-0.5">
                <MapPin className="h-3 w-3 mr-0.5 text-[#3E5C31] dark:text-emerald-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{weatherLocation.name}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={handleDetectLocation}
            disabled={weatherLoading}
            className="flex items-center space-x-1 bg-[#FAF7F2] dark:bg-[#25302A] hover:bg-[#F3F1ED] dark:hover:bg-[#2E3C34] border border-[#E8E6E1] dark:border-slate-800 text-[#3E5C31] dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {weatherLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Locate className="h-3 w-3" />
            )}
            <span>{weatherLoading ? t("locating") : t("use_my_location")}</span>
          </button>
        </div>

        {weatherError && (
          <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium">
            ⚠️ {weatherError}
          </div>
        )}

        {weatherLoading && !weatherData && (
          <div className="flex flex-col items-center justify-center py-6 space-y-2 text-[#8A867E]">
            <Loader2 className="h-6 w-6 animate-spin text-[#3E5C31]" />
            <span className="text-xs font-semibold">{t("retrieving_forecast")}</span>
          </div>
        )}

        {weatherData && (
          <div className="space-y-3">
            {/* 3-Day Horizontal Grid */}
            <div className="grid grid-cols-3 gap-2">
              {weatherData.map((day, idx) => {
                const details = getWeatherDetails(day.code, day.rain);
                const DayIcon = details.icon;
                const isSelected = selectedWeatherDayIndex === idx;
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedWeatherDayIndex(idx)}
                    className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-between space-y-1 cursor-pointer relative ${
                      isSelected 
                        ? "bg-[#3E5C31]/5 border-[#3E5C31] ring-1 ring-[#3E5C31]/30 shadow-xs" 
                        : "bg-[#FAF7F2] border-[#E8E6E1] hover:bg-[#F3F1ED]"
                    }`}
                  >
                    {idx === 0 && (
                      <span className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 text-[7px] font-black tracking-wider uppercase bg-[#3E5C31] text-white px-1.5 py-0.5 rounded-full shadow-xs">
                        {t("today")}
                      </span>
                    )}
                    
                    <span className="text-[9px] font-bold text-[#8A867E] mt-1">{day.date}</span>
                    
                    <div className={`p-1.5 rounded-xl ${details.accentBg} ${details.iconColor} flex items-center justify-center`}>
                      <DayIcon className="h-4 w-4" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-black text-[#2D2D2A] flex items-center justify-center">
                        <Thermometer className="h-2.5 w-2.5 text-red-500 mr-0.5" />
                        <span>{day.tempMax}°C</span>
                      </div>
                      <div className="text-[8px] font-bold text-sky-600">
                        {day.rain > 0 ? `💧 ${day.rain.toFixed(1)}mm` : t("no_rain")}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Crop & Planting Guidance details */}
            {weatherData[selectedWeatherDayIndex] && (() => {
              const selectedDay = weatherData[selectedWeatherDayIndex];
              const details = getWeatherDetails(selectedDay.code, selectedDay.rain);
              const DayIcon = details.icon;
              
              return (
                <div className={`p-3 rounded-2xl border ${details.bgColor} transition-all space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black tracking-wider uppercase text-slate-500">
                      {t("farming_guidance")} ({selectedDay.date})
                    </span>
                    <div className="flex items-center space-x-1 bg-white/75 dark:bg-[#25302A]/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#E8E6E1] dark:border-slate-700 text-[9px] font-extrabold text-[#2D2D2A] dark:text-slate-100">
                      <DayIcon className={`h-3 w-3 ${details.iconColor}`} />
                      <span>{details.label}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="bg-[#3E5C31]/10 text-[#3E5C31] p-1.5 rounded-lg shrink-0 text-[10px] font-bold mt-0.5">
                      🌾 {t("advice")}
                    </div>
                    <p className="text-[11px] text-[#2D2D2A] dark:text-slate-100 leading-relaxed font-semibold">
                      {details.advice}
                    </p>
                  </div>

                  {/* Highlighting specific weather conditions */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800 text-[9px] text-slate-600 dark:text-slate-300 font-medium">
                    <div>🌡️ Temp range: <span className="font-extrabold text-[#2D2D2A] dark:text-white">{selectedDay.tempMin}°C - {selectedDay.tempMax}°C</span></div>
                    <div>🌧️ Rainfall: <span className="font-extrabold text-[#2D2D2A] dark:text-white">{selectedDay.rain.toFixed(1)} mm</span></div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        
        <div className="flex items-center justify-between text-[9px] text-[#8A867E] dark:text-slate-400 pt-1.5 border-t border-[#E8E6E1]/60 dark:border-slate-800/60">
          <span>⚡ {t("live_open_meteo")}</span>
          <span className="font-semibold text-[#3E5C31] dark:text-emerald-400">{t("smart_sowing_advice")}</span>
        </div>
      </div>

      {/* Popular listings near you */}
      <div id="popular-listings" className="px-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-[#2D2D2A] dark:text-white text-base">{t("popular_near_you")}</h3>
          <button 
            onClick={() => onSelectCategory("all")}
            className="text-[#3E5C31] dark:text-emerald-400 hover:text-[#3E5C31]/90 dark:hover:text-emerald-300 text-xs font-bold flex items-center space-x-0.5 cursor-pointer"
          >
            <span>{t("see_all")}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {popularEquipment.map((eq) => (
            <motion.div
              key={eq.id}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-[#1C2420] rounded-2xl overflow-hidden border border-[#E8E6E1] dark:border-slate-800 shadow-xs cursor-pointer flex flex-col h-full"
              onClick={() => onSelectEquipment(eq)}
            >
              <div className="relative h-28 bg-[#F3F1ED] dark:bg-slate-900 overflow-hidden">
                <img 
                  src={eq.image} 
                  alt={eq.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs text-[9px] font-extrabold px-1.5 py-0.5 rounded-md text-slate-800 dark:text-slate-200 flex items-center space-x-0.5 shadow-sm">
                  <span className="text-[#D97706]">★</span>
                  <span>{eq.rating}</span>
                </div>
                <div className="absolute bottom-2 left-2 bg-[#3E5C31] dark:bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">
                  ₹{eq.pricePerDay}/day
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-1 text-[#2D2D2A] dark:text-slate-200">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A867E] dark:text-slate-400">
                      {eq.subCategory}
                    </span>
                    <span className="text-[9px] text-[#8A867E] dark:text-slate-400 font-medium">
                      📍 {eq.distance} km
                    </span>
                  </div>
                  <h4 className="font-bold text-[#2D2D2A] dark:text-white text-xs line-clamp-1 leading-tight mt-0.5">
                    {eq.name}
                  </h4>
                </div>

                <div className="pt-1.5 border-t border-[#E8E6E1] dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-[#8A867E] dark:text-slate-400 truncate">
                    👤 {eq.ownerName}
                  </span>
                  {eq.specs.operatorIncluded && (
                    <span className="text-[8px] bg-[#3E5C31]/10 dark:bg-emerald-500/15 text-[#3E5C31] dark:text-emerald-400 font-bold px-1 rounded">
                      Driver Incl.
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Become an Owner Banner */}
      <div id="become-owner-banner" className="px-4">
        <div className="relative bg-[#3E5C31] rounded-3xl p-5 overflow-hidden text-white flex items-center justify-between shadow-lg">
          {/* Decorative gradients */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-600 rounded-full blur-2xl opacity-20"></div>
          <div className="absolute left-1/3 -top-10 w-24 h-24 bg-teal-500 rounded-full blur-xl opacity-10"></div>

          <div className="space-y-2 z-10 max-w-[65%]">
            <span className="bg-[#E9C46A] text-[#2D2D2A] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              Earn Daily Passive Income
            </span>
            <h3 className="font-black text-sm text-white leading-snug">
              Have Spare Machinery or Looking for Labor Jobs?
            </h3>
            <p className="text-[10px] text-white/80">
              List your tools/equipment, set your own prices, or register for local jobs.
            </p>
            <button 
              onClick={() => onChangeRole("owner")}
              className="mt-1 bg-[#E9C46A] hover:bg-[#E9C46A]/90 text-[#2D2D2A] text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="z-10 w-[30%] flex justify-end">
            <img 
              src="https://images.unsplash.com/photo-1594142404563-64ccc954aa79?auto=format&fit=crop&w=200&q=80" 
              alt="Farmer Owner" 
              className="w-16 h-16 rounded-2xl object-cover border border-[#E8E6E1]/20 shadow-md rotate-3"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
