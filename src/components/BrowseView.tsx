import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, MapPin, SlidersHorizontal, ArrowLeft, Star, ArrowUpDown } from "lucide-react";
import { Equipment, Laborer, Booking } from "../types";
import { CATEGORIES_METADATA } from "../data";
import { getTranslation, Language } from "../translate";

interface BrowseViewProps {
  initialCategory: string;
  searchQuery: string;
  allEquipment: Equipment[];
  allLaborers: Laborer[];
  bookings?: Booking[];
  onBack: () => void;
  onSelectEquipment: (eq: Equipment) => void;
  onSelectLaborer: (lb: Laborer) => void;
  adminLocation?: string;
  adminDistance?: number;
  language?: Language;
}

export default function BrowseView({
  initialCategory,
  searchQuery,
  allEquipment,
  allLaborers,
  bookings = [],
  onBack,
  onSelectEquipment,
  onSelectLaborer,
  adminLocation = "Coimbatore, Tamil Nadu",
  adminDistance = 15,
  language = "en"
}: BrowseViewProps) {
  const t = (key: Parameters<typeof getTranslation>[1]): string => getTranslation(language, key);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory || "all");
  const [localSearch, setLocalSearch] = useState<string>(searchQuery || "");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"distance" | "price_low" | "price_high" | "rating">("distance");
  const [minRating, setMinRating] = useState<number>(0);
  const [quickFilters, setQuickFilters] = useState<{
    availableToday: boolean;
    verifiedOnly: boolean;
    lowestPrice: boolean;
  }>({
    availableToday: false,
    verifiedOnly: false,
    lowestPrice: false,
  });

  const isLaborSelected = activeCategory === "labor";

  // Categories config
  const availableCategories = useMemo(() => [
    { id: "all", label: t("all_items") },
    { id: "agriculture", label: t("agriculture") },
    { id: "labor", label: t("labor") },
    { id: "construction", label: t("construction") },
    { id: "tools", label: t("tools") },
    { id: "function", label: t("function") }
  ], [language]);

  // Subcategories list based on selected category
  const subCategories = useMemo(() => {
    if (activeCategory === "all") return ["All"];
    const metadata = (CATEGORIES_METADATA as any)[activeCategory];
    if (metadata) {
      return ["All", ...metadata.subCategories];
    }
    return ["All"];
  }, [activeCategory]);

  // Handle category changes - reset subcategory & rating filter
  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setSelectedSubCategory("All");
    setMinRating(0);
  };

  // Filter & Sort listings
  const filteredItems = useMemo(() => {
    // 1. FILTERING LABORS
    if (isLaborSelected) {
      return allLaborers.filter((lb) => {
        const matchesSub = selectedSubCategory === "All" || lb.category.toLowerCase().includes(selectedSubCategory.toLowerCase().split(" ")[0]);
        const matchesSearch = localSearch === "" || 
          lb.name.toLowerCase().includes(localSearch.toLowerCase()) ||
          lb.category.toLowerCase().includes(localSearch.toLowerCase());
        const matchesRating = lb.rating >= minRating;
        const matchesAvailable = !quickFilters.availableToday || lb.availability === "available";
        const matchesVerified = !quickFilters.verifiedOnly || lb.verified === true;
        return matchesSub && matchesSearch && matchesRating && matchesAvailable && matchesVerified;
      }).sort((a, b) => {
        const activeSortBy = quickFilters.lowestPrice ? "price_low" : sortBy;
        if (activeSortBy === "distance") return a.distance - b.distance;
        if (activeSortBy === "price_low") return a.pricePerDay - b.pricePerDay;
        if (activeSortBy === "price_high") return b.pricePerDay - a.pricePerDay;
        if (activeSortBy === "rating") return b.rating - a.rating;
        return 0;
      });
    }

    // 2. FILTERING EQUIPMENT
    return allEquipment.filter((eq) => {
      const matchesCat = activeCategory === "all" || eq.category === activeCategory;
      const matchesSub = selectedSubCategory === "All" || eq.subCategory.toLowerCase() === selectedSubCategory.toLowerCase() || eq.name.toLowerCase().includes(selectedSubCategory.toLowerCase());
      const matchesSearch = localSearch === "" || 
        eq.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        eq.subCategory.toLowerCase().includes(localSearch.toLowerCase()) ||
        eq.about.toLowerCase().includes(localSearch.toLowerCase());
      const matchesRating = eq.rating >= minRating;
      
      const isBookedToday = bookings?.some(b => b.itemId === eq.id && b.status === "ongoing") || false;
      const matchesAvailable = !quickFilters.availableToday || !isBookedToday;
      const matchesVerified = !quickFilters.verifiedOnly || eq.verified === true;
      
      return matchesCat && matchesSub && matchesSearch && matchesRating && eq.status === "active" && matchesAvailable && matchesVerified;
    }).sort((a, b) => {
      const activeSortBy = quickFilters.lowestPrice ? "price_low" : sortBy;
      if (activeSortBy === "distance") return a.distance - b.distance;
      if (activeSortBy === "price_low") return a.pricePerDay - b.pricePerDay;
      if (activeSortBy === "price_high") return b.pricePerDay - a.pricePerDay;
      if (activeSortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [isLaborSelected, allEquipment, allLaborers, activeCategory, selectedSubCategory, localSearch, sortBy, minRating, quickFilters, bookings]);

  return (
    <div id="browse-view-container" className="space-y-4 max-w-lg mx-auto bg-[#FDFCF9] dark:bg-[#111613] min-h-screen pb-20 text-[#2D2D2A] dark:text-slate-100">
      
      {/* Search Header */}
      <div id="browse-header" className="bg-white dark:bg-[#1C2420] px-4 pt-4 pb-3 shadow-xs border-b border-[#E8E6E1] dark:border-slate-800 sticky top-0 z-20 space-y-3">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack} 
            className="p-1.5 hover:bg-[#F3F1ED] dark:hover:bg-[#25302A] rounded-full text-[#2D2D2A] dark:text-slate-100 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`${t("search_in")} ${isLaborSelected ? t("labor") : t("agriculture")}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-[#F3F1ED] dark:bg-[#252F2A] text-[#2D2D2A] dark:text-slate-100 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3E5C31] dark:focus:ring-emerald-500 border border-transparent dark:border-slate-800 focus:bg-white dark:focus:bg-[#1C2420] transition-all"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8A867E]" />
          </div>
        </div>

        {/* Scrollable Category selector pills */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {availableCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-[#3E5C31] dark:bg-emerald-600 text-white border-[#3E5C31] dark:border-emerald-600 shadow-sm"
                  : "bg-white dark:bg-[#252F2A] text-[#5C5952] dark:text-slate-300 border-[#E8E6E1] dark:border-slate-800 hover:bg-[#FAF7F2] dark:hover:bg-[#2E3C34] shadow-xs hover:shadow-sm"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Operating Geofence Area Banner */}
      <div className="mx-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-2xl flex items-center justify-between text-[10px]">
        <div className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-400">
          <MapPin className="h-3.5 w-3.5 text-[#3E5C31] dark:text-emerald-400 shrink-0" />
          <span>
            {t("operating_in_geofence")} <strong className="font-extrabold">{adminLocation}</strong> {t("within_radius")} <strong className="font-extrabold">{adminDistance} KM</strong>
          </span>
        </div>
        <span className="text-[8px] bg-[#3E5C31]/10 dark:bg-emerald-500/20 text-[#3E5C31] dark:text-emerald-400 font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
          {t("geofence_active")}
        </span>
      </div>

      {/* Subcategory scrollable & Sorting block */}
      <div className="px-4 space-y-2.5">
        
        {/* Dynamic Subcategories tab from images (All, Tractor, Tillage, etc.) */}
        {subCategories.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-1.5 scrollbar-none">
            {subCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubCategory(sub)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                  selectedSubCategory === sub
                    ? "bg-[#2D2D2A] dark:bg-emerald-600 text-white border-[#2D2D2A] dark:border-emerald-600 shadow-sm"
                    : "bg-white dark:bg-[#252F2A] text-[#5C5952] dark:text-slate-300 border-[#E8E6E1] dark:border-slate-800 hover:bg-[#FAF7F2] dark:hover:bg-[#2E3C34] shadow-xs hover:shadow-sm"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Quick Filters */}
        <div id="quick-filters-container" className="bg-[#FAF7F2] dark:bg-[#1A221E] p-2.5 rounded-2xl border border-[#E8E6E1] dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-[#5C5952] dark:text-slate-400 font-black uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3 text-[#3E5C31] dark:text-emerald-400" />
              {t("quick_filters")}
            </span>
            {(quickFilters.availableToday || quickFilters.verifiedOnly || quickFilters.lowestPrice) && (
              <button
                onClick={() => setQuickFilters({ availableToday: false, verifiedOnly: false, lowestPrice: false })}
                className="text-rose-600 font-extrabold normal-case hover:underline cursor-pointer focus:outline-none"
              >
                {t("reset_filters")}
              </button>
            )}
          </div>
          <div className="flex space-x-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {/* Available Today Chip */}
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, availableToday: !prev.availableToday }))}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                quickFilters.availableToday
                  ? "bg-[#3E5C31] dark:bg-emerald-600 text-white border-[#3E5C31] dark:border-emerald-600 shadow-xs"
                  : "bg-white dark:bg-[#252F2A] text-[#5C5952] dark:text-slate-300 border-[#E8E6E1] dark:border-slate-800 hover:bg-amber-50/40 dark:hover:bg-slate-800/50 hover:border-amber-200"
              }`}
            >
              <span>⚡</span>
              <span>{t("available_today")}</span>
            </button>

            {/* Verified Only Chip */}
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                quickFilters.verifiedOnly
                  ? "bg-[#3E5C31] dark:bg-emerald-600 text-white border-[#3E5C31] dark:border-emerald-600 shadow-xs"
                  : "bg-white dark:bg-[#252F2A] text-[#5C5952] dark:text-slate-300 border-[#E8E6E1] dark:border-slate-800 hover:bg-amber-50/40 dark:hover:bg-slate-800/50 hover:border-amber-200"
              }`}
            >
              <span>🛡️</span>
              <span>{t("verified_only")}</span>
            </button>

            {/* Lowest Price First Chip */}
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, lowestPrice: !prev.lowestPrice }))}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                quickFilters.lowestPrice
                  ? "bg-[#3E5C31] dark:bg-emerald-600 text-white border-[#3E5C31] dark:border-emerald-600 shadow-xs"
                  : "bg-white dark:bg-[#252F2A] text-[#5C5952] dark:text-slate-300 border-[#E8E6E1] dark:border-slate-800 hover:bg-amber-50/40 dark:hover:bg-slate-800/50 hover:border-amber-200"
              }`}
            >
              <span>💰</span>
              <span>{t("lowest_price_first")}</span>
            </button>
          </div>
        </div>

        {/* Star Rating Filter */}
        <div id="star-rating-filter-container" className="bg-[#FAF7F2] dark:bg-[#1A221E] p-2.5 rounded-2xl border border-[#E8E6E1] dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-[#5C5952] dark:text-slate-400 font-black uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              {t("filter_by_rating")}
            </span>
            {minRating > 0 && (
              <button
                onClick={() => setMinRating(0)}
                className="text-rose-600 dark:text-rose-400 font-extrabold normal-case hover:underline cursor-pointer focus:outline-none"
              >
                {t("clear_filter")}
              </button>
            )}
          </div>
          <div className="flex space-x-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {[
              { label: t("all_ratings"), value: 0 },
              { label: `4.7 ★ ${t("and_above")}`, value: 4.7 },
              { label: `4.5 ★ ${t("and_above")}`, value: 4.5 },
              { label: `4.3 ★ ${t("and_above")}`, value: 4.3 },
            ].map((opt) => {
              const isSelected = minRating === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setMinRating(opt.value)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                    isSelected
                      ? "bg-[#3E5C31] dark:bg-emerald-600 text-white border-[#3E5C31] dark:border-emerald-600 shadow-xs"
                      : "bg-white dark:bg-[#252F2A] text-[#5C5952] dark:text-slate-300 border-[#E8E6E1] dark:border-slate-800 hover:bg-amber-50/40 dark:hover:bg-slate-800/50 hover:border-amber-200"
                  }`}
                >
                  {opt.value > 0 && (
                    <Star
                      className={`h-2.5 w-2.5 ${
                        isSelected ? "text-white fill-white" : "text-amber-500 fill-amber-500"
                      }`}
                    />
                  )}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sorting and result metrics */}
        <div className="flex justify-between items-center text-xs text-[#8A867E] dark:text-slate-400">
          <span className="font-semibold text-[#2D2D2A] dark:text-slate-200">
            {filteredItems.length} {isLaborSelected ? t("labor") : t("all_items")} {t("found")}
          </span>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#8A867E] dark:text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-[#2D2D2A] dark:text-slate-200 focus:outline-none cursor-pointer border-none py-0 text-xs"
              >
                <option value="distance" className="dark:bg-[#1C2420] dark:text-white">{t("nearby")} ({sortBy === "distance" ? "📍" : ""})</option>
                <option value="price_low" className="dark:bg-[#1C2420] dark:text-white">{t("price_low_high")}</option>
                <option value="price_high" className="dark:bg-[#1C2420] dark:text-white">{t("price_high_low")}</option>
                <option value="rating" className="dark:bg-[#1C2420] dark:text-white">{t("top_rated")}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main listings list */}
      <div className="px-4 space-y-3 pb-6">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-[#1C2420] rounded-2xl p-8 text-center border border-[#E8E6E1] dark:border-slate-800 space-y-2">
            <span className="text-4xl">🌾</span>
            <h4 className="font-extrabold text-[#2D2D2A] dark:text-white text-sm">{t("no_listings_found")}</h4>
            <p className="text-xs text-[#8A867E] dark:text-slate-400 max-w-xs mx-auto">
              {t("adjust_filters")}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isLabor = isLaborSelected;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#1C2420] rounded-2xl p-3 border border-[#E8E6E1] dark:border-slate-800/80 shadow-sm flex items-center space-x-3 hover:shadow-md transition-all cursor-pointer relative"
                onClick={() => isLabor ? onSelectLaborer(item as Laborer) : onSelectEquipment(item as Equipment)}
              >
                {/* Image Section */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#FAF7F2] dark:bg-[#252F2A] shrink-0 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {item.verified && (
                    <span className="absolute top-1 left-1 bg-[#3E5C31] dark:bg-emerald-600 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0 space-y-1 text-[#2D2D2A] dark:text-slate-200">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[9px] bg-[#F3F1ED] dark:bg-[#252F2A] text-[#5C5952] dark:text-slate-300 font-bold px-1.5 py-0.5 rounded capitalize">
                        {isLabor ? (item as Laborer).category : (item as Equipment).subCategory}
                      </span>
                      {isLabor && (item as Laborer).gender && (
                        <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black px-1.5 py-0.5 rounded uppercase">
                          {(item as Laborer).gender}
                        </span>
                      )}
                      {isLabor && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                          (item as Laborer).availability === "available"
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400"
                            : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400"
                        }`}>
                          ● {(item as Laborer).availability === "available" ? "Ready Today" : "Busy"}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8A867E] dark:text-slate-400 font-semibold flex items-center">
                      <MapPin className="h-3 w-3 text-[#3E5C31] dark:text-emerald-400 mr-0.5 shrink-0" />
                      {item.distance} km
                    </span>
                  </div>

                  <h3 className="font-extrabold text-[#2D2D2A] dark:text-white text-sm truncate leading-tight">
                    {item.name}
                  </h3>

                  <div className="flex items-center space-x-1.5 text-xs text-[#8A867E] dark:text-slate-400">
                    <span className="flex items-center text-[#D97706] dark:text-amber-500 font-bold text-[11px]">
                      ★ {item.rating}
                    </span>
                    <span className="text-[10px] text-[#8A867E] dark:text-slate-400 font-medium">
                      ({item.reviewsCount} reviews)
                    </span>
                  </div>

                  {/* Pricing and Details */}
                  <div className="flex justify-between items-end pt-1">
                    <div>
                      <span className="text-base font-black text-[#2D2D2A] dark:text-white">
                        ₹{item.pricePerDay}
                      </span>
                      <span className="text-[10px] text-[#8A867E] dark:text-slate-400 font-bold">
                        /day
                      </span>
                    </div>

                    <button 
                      className="bg-[#3E5C31] dark:bg-emerald-600 hover:bg-[#3E5C31]/90 dark:hover:bg-emerald-500 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all active:scale-95 shrink-0 cursor-pointer"
                    >
                      {isLabor ? "Hire Services" : "Book Equipment"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
}
