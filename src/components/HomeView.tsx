import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Search, Sprout, HardHat, Wrench, Tent, Users, 
  MapPin, Bell, Shield, BadgePercent, ThumbsUp, Sparkles, ArrowRight,
  Cloud, Sun, CloudRain, CloudLightning, CloudSun, Droplets, Thermometer, Loader2, Locate
} from "lucide-react";
import { Equipment } from "../types";

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
}

export default function HomeView({
  popularEquipment,
  onSelectCategory,
  onSelectEquipment,
  onStartSearch,
  onChangeRole,
  onNavigate
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any[] | null>(null);
  const [selectedWeatherDayIndex, setSelectedWeatherDayIndex] = useState(0);
  const [weatherLocation, setWeatherLocation] = useState({
    name: "Coimbatore, TN (Default)",
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
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const city =
              geoData.address.city ||
              geoData.address.town ||
              geoData.address.village ||
              geoData.address.suburb ||
              geoData.address.county ||
              "Your Location";
            const state = geoData.address.state
              ? `, ${geoData.address.state.replace(" State", "")}`
              : "";
            detectedName = `${city}${state}`;
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
      try {
        // Try IP Geolocation first for a silent and instant city-level load
        const ipRes = await fetch("https://ipapi.co/json/");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            const cityName = ipData.city 
              ? `${ipData.city}${ipData.region_code ? `, ${ipData.region_code}` : ""}`
              : `${ipData.latitude.toFixed(2)}°N, ${ipData.longitude.toFixed(2)}°E`;
            await fetchWeather(ipData.latitude, ipData.longitude, cityName);
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
            let detectedName = `Near ${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                const city =
                  geoData.address.city ||
                  geoData.address.town ||
                  geoData.address.village ||
                  geoData.address.suburb ||
                  geoData.address.county ||
                  "Your Location";
                const state = geoData.address.state
                  ? `, ${geoData.address.state.replace(" State", "")}`
                  : "";
                detectedName = `${city}${state}`;
              }
            } catch (e) {
              console.error("Nominatim reverse geocoding failed on init:", e);
            }
            fetchWeather(latitude, longitude, detectedName);
          },
          (error) => {
            console.error("Browser Geolocation failed on init:", error);
            // Fallback 2: Default to Coimbatore
            fetchWeather(11.0168, 76.9558, "Coimbatore, TN (Default)");
          },
          { enableHighAccuracy: true, timeout: 3000 }
        );
      } else {
        // Fallback 2: Default to Coimbatore
        fetchWeather(11.0168, 76.9558, "Coimbatore, TN (Default)");
      }
    };

    detectAndFetch();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onStartSearch(searchQuery);
    }
  };

  const categories = [
    { id: "agriculture", name: "Agriculture", sub: "Equipment", icon: Sprout, color: "bg-[#3E5C31]/10 text-[#3E5C31] border-[#E8E6E1] hover:bg-[#3E5C31]/20" },
    { id: "construction", name: "Construction", sub: "Equipment", icon: HardHat, color: "bg-[#D97706]/10 text-[#D97706] border-[#E8E6E1] hover:bg-[#D97706]/20" },
    { id: "tools", name: "Tools &", sub: "Machines", icon: Wrench, color: "bg-[#2D2D2A]/10 text-[#2D2D2A] border-[#E8E6E1] hover:bg-[#2D2D2A]/20" },
    { id: "function", name: "Function", sub: "Materials", icon: Tent, color: "bg-[#E9C46A]/15 text-[#8A867E] border-[#E8E6E1] hover:bg-[#E9C46A]/30" },
    { id: "labor", name: "Labor", sub: "Services", icon: Users, color: "bg-[#3E5C31]/5 text-[#3E5C31] border-[#E8E6E1] hover:bg-[#3E5C31]/15" },
  ];

  return (
    <div id="home-view-container" className="space-y-6 max-w-lg mx-auto bg-[#FDFCF9] min-h-screen pb-20 text-[#2D2D2A]">
      
      {/* Header Section */}
      <div id="home-header" className="bg-white px-4 pt-6 pb-5 rounded-b-3xl shadow-xs border-b border-[#E8E6E1] space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-[#3E5C31] h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
              O
            </div>
            <div>
              <div className="flex items-center text-[#8A867E] text-xs">
                <MapPin className="h-3.5 w-3.5 text-[#3E5C31] mr-1" />
                <span className="font-semibold text-[#2D2D2A]">Coimbatore, TN</span>
              </div>
              <h2 className="text-sm font-semibold text-[#2D2D2A]">Hello, Udaya 👋</h2>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="relative bg-[#F3F1ED] p-2 rounded-full text-[#2D2D2A] hover:bg-slate-200">
               <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#D97706] rounded-full border border-white"></span>
              <Bell className="h-4 w-4" />
            </button>
            <div 
              className="bg-[#3E5C31]/10 text-[#3E5C31] px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#3E5C31]/20"
              onClick={() => onNavigate("profile")}
            >
              Demo Profile
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] font-black tracking-widest text-[#3E5C31] uppercase bg-[#3E5C31]/10 px-2 py-0.5 rounded-md">OorSevai</span>
            <span className="text-[10px] font-bold text-[#8A867E]">All Village Services in One App.</span>
          </div>
          <h1 className="text-2xl font-black text-[#2D2D2A] tracking-tight leading-tight">
            Rent Anything.<br />
            <span className="text-[#3E5C31] font-extrabold">Get Work Done.</span>
          </h1>
          <p className="text-xs text-[#8A867E]">Connecting owners, local workers, and renters hyperlocally.</p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            placeholder="Search tractors, generators, masons, drills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F3F1ED] text-[#2D2D2A] pl-11 pr-12 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3E5C31] border border-[#E8E6E1] focus:bg-white transition-all shadow-inner"
          />
          <Search className="absolute left-4 h-4 w-4 text-[#8A867E]" />
          <button 
            type="submit"
            className="absolute right-2 bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white p-2.5 rounded-xl transition-all"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Main Categories Panel */}
      <div id="home-categories" className="px-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-slate-900 text-base">Browse Categories</h3>
          <span className="text-xs font-semibold text-slate-400">5 Categories</span>
        </div>
        <div className="grid grid-cols-5 gap-2.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex flex-col items-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${cat.color} hover:scale-105 active:scale-95`}
              >
                <div className="p-2.5 rounded-xl bg-white shadow-sm mb-1.5 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold tracking-tight leading-none text-slate-800 break-words w-full">
                  {cat.name}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5 leading-none font-medium">
                  {cat.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trust & Verification badging */}
      <div id="trust-banner" className="mx-4 bg-white border border-[#E8E6E1] rounded-2xl p-3 grid grid-cols-4 gap-1 text-center shadow-xs">
        <div className="flex flex-col items-center">
          <div className="bg-[#3E5C31]/10 text-[#3E5C31] p-1.5 rounded-lg mb-1">
            <Shield className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9px] font-bold text-[#2D2D2A]">Verified Owners</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-[#D97706]/10 text-[#D97706] p-1.5 rounded-lg mb-1">
            <ThumbsUp className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9px] font-bold text-[#2D2D2A]">Quality Assured</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-amber-50 text-[#D97706] p-1.5 rounded-lg mb-1">
            <BadgePercent className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9px] font-bold text-[#2D2D2A]">Best Prices</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-purple-50 text-purple-600 p-1.5 rounded-lg mb-1">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-[9px] font-bold text-[#2D2D2A]">Secure Escrow</span>
        </div>
      </div>

      {/* Local Farming Weather Widget */}
      <div id="farming-weather-widget" className="mx-4 bg-white border border-[#E8E6E1] rounded-3xl p-4 shadow-xs space-y-3.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-[#3E5C31]/10 text-[#3E5C31] p-1.5 rounded-xl">
              <Sun className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#2D2D2A] text-xs uppercase tracking-wider">Local Farming Weather</h3>
              <p className="text-[10px] text-[#8A867E] flex items-center mt-0.5">
                <MapPin className="h-3 w-3 mr-0.5 text-[#3E5C31]" />
                <span className="font-semibold text-slate-700">{weatherLocation.name}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={handleDetectLocation}
            disabled={weatherLoading}
            className="flex items-center space-x-1 bg-[#FAF7F2] hover:bg-[#F3F1ED] border border-[#E8E6E1] text-[#3E5C31] text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {weatherLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Locate className="h-3 w-3" />
            )}
            <span>{weatherLoading ? "Locating..." : "Use My Location"}</span>
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
            <span className="text-xs font-semibold">Retrieving farming forecast...</span>
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
                        Today
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
                        {day.rain > 0 ? `💧 ${day.rain.toFixed(1)}mm` : "No Rain"}
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
                      Farming Guidance ({selectedDay.date})
                    </span>
                    <div className="flex items-center space-x-1 bg-white/75 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#E8E6E1] text-[9px] font-extrabold text-[#2D2D2A]">
                      <DayIcon className={`h-3 w-3 ${details.iconColor}`} />
                      <span>{details.label}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="bg-[#3E5C31]/10 text-[#3E5C31] p-1.5 rounded-lg shrink-0 text-[10px] font-bold mt-0.5">
                      🌾 Advice
                    </div>
                    <p className="text-[11px] text-[#2D2D2A] leading-relaxed font-semibold">
                      {details.advice}
                    </p>
                  </div>

                  {/* Highlighting specific weather conditions */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 text-[9px] text-slate-600 font-medium">
                    <div>🌡️ Temp range: <span className="font-extrabold text-[#2D2D2A]">{selectedDay.tempMin}°C - {selectedDay.tempMax}°C</span></div>
                    <div>🌧️ Rainfall: <span className="font-extrabold text-[#2D2D2A]">{selectedDay.rain.toFixed(1)} mm</span></div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        
        <div className="flex items-center justify-between text-[9px] text-[#8A867E] pt-1.5 border-t border-[#E8E6E1]/60">
          <span>⚡ Live Open-Meteo API</span>
          <span className="font-semibold text-[#3E5C31]">Smart Sowing & Protection Advice</span>
        </div>
      </div>

      {/* Popular listings near you */}
      <div id="popular-listings" className="px-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-[#2D2D2A] text-base">Popular Near You</h3>
          <button 
            onClick={() => onSelectCategory("all")}
            className="text-[#3E5C31] hover:text-[#3E5C31]/90 text-xs font-bold flex items-center space-x-0.5"
          >
            <span>See All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {popularEquipment.map((eq) => (
            <motion.div
              key={eq.id}
              whileHover={{ y: -3 }}
              className="bg-white rounded-2xl overflow-hidden border border-[#E8E6E1] shadow-xs cursor-pointer flex flex-col h-full"
              onClick={() => onSelectEquipment(eq)}
            >
              <div className="relative h-28 bg-[#F3F1ED] overflow-hidden">
                <img 
                  src={eq.image} 
                  alt={eq.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs text-[9px] font-extrabold px-1.5 py-0.5 rounded-md text-slate-800 flex items-center space-x-0.5 shadow-sm">
                  <span className="text-[#D97706]">★</span>
                  <span>{eq.rating}</span>
                </div>
                <div className="absolute bottom-2 left-2 bg-[#3E5C31] text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">
                  ₹{eq.pricePerDay}/day
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-1 text-[#2D2D2A]">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A867E]">
                      {eq.subCategory}
                    </span>
                    <span className="text-[9px] text-[#8A867E] font-medium">
                      📍 {eq.distance} km
                    </span>
                  </div>
                  <h4 className="font-bold text-[#2D2D2A] text-xs line-clamp-1 leading-tight mt-0.5">
                    {eq.name}
                  </h4>
                </div>

                <div className="pt-1.5 border-t border-[#E8E6E1] flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-[#8A867E] truncate">
                    👤 {eq.ownerName}
                  </span>
                  {eq.specs.operatorIncluded && (
                    <span className="text-[8px] bg-[#3E5C31]/10 text-[#3E5C31] font-bold px-1 rounded">
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
