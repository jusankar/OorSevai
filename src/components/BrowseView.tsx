import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, SlidersHorizontal, ArrowLeft, Star, ArrowUpDown, X, Check, RotateCcw } from "lucide-react";
import { Equipment, Laborer, Booking } from "../types";
import { CATEGORIES_METADATA } from "../data";
import { getTranslation, Language } from "../translate";
import { getDistanceBetween } from "../utils/geo";

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
  adminLocation = "Thirumanancheri, Tamil Nadu",
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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== "all") count++;
    if (selectedSubCategory !== "All") count++;
    if (minRating > 0) count++;
    if (quickFilters.availableToday) count++;
    if (quickFilters.verifiedOnly) count++;
    if (quickFilters.lowestPrice) count++;
    return count;
  }, [activeCategory, selectedSubCategory, minRating, quickFilters]);

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

  // Sync searchQuery prop to local state
  React.useEffect(() => {
    setLocalSearch(searchQuery || "");
  }, [searchQuery]);

  // Handle category changes - reset subcategory, search, & rating filter
  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setSelectedSubCategory("All");
    setMinRating(0);
    setLocalSearch("");
  };

  // Pre-calculate dynamic distances based on current adminLocation
  const mappedEquipment = useMemo(() => {
    return allEquipment.map(eq => ({
      ...eq,
      distance: getDistanceBetween(eq.location || "Thirumanancheri, Tamil Nadu", adminLocation)
    }));
  }, [allEquipment, adminLocation]);

  const mappedLaborers = useMemo(() => {
    return allLaborers.map(lb => ({
      ...lb,
      distance: getDistanceBetween(lb.location || "Thirumanancheri, Tamil Nadu", adminLocation)
    }));
  }, [allLaborers, adminLocation]);

  // Filter & Sort listings
  const filteredItems = useMemo(() => {
    // 1. FILTERING LABORS
    if (isLaborSelected) {
      return mappedLaborers.filter((lb) => {
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
    return mappedEquipment.filter((eq) => {
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
  }, [isLaborSelected, mappedEquipment, mappedLaborers, activeCategory, selectedSubCategory, localSearch, sortBy, minRating, quickFilters, bookings]);

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
              className="w-full debossed-input text-[#2D2D2A] dark:text-slate-100 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3E5C31] dark:focus:ring-emerald-500 transition-all"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8A867E]" />
          </div>
        </div>

        {/* All Filters Single Row */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {/* Main Filter Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase transition-all shrink-0 cursor-pointer border-none ${
              activeFiltersCount > 0
                ? "embossed-btn text-white"
                : "embossed-btn-secondary text-[#2D2D2A] dark:text-slate-200"
            }`}
          >
            <SlidersHorizontal className="h-3 w-3 shrink-0" />
            <span>{t("filters")}</span>
            {activeFiltersCount > 0 && (
              <span className="flex items-center justify-center bg-white text-[#3E5C31] text-[9px] font-black w-4 h-4 rounded-full ml-1">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Active Category Pill */}
          {activeCategory !== "all" && (
            <button
              onClick={() => handleCategoryChange("all")}
              className="flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 text-[#3E5C31] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 px-3 py-1 rounded-full text-[10px] font-bold shrink-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
            >
              <span className="capitalize">{availableCategories.find(c => c.id === activeCategory)?.label || activeCategory}</span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          )}

          {/* Active Subcategory Pill */}
          {selectedSubCategory !== "All" && (
            <button
              onClick={() => setSelectedSubCategory("All")}
              className="flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 text-[#3E5C31] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 px-3 py-1 rounded-full text-[10px] font-bold shrink-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
            >
              <span>{selectedSubCategory}</span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          )}

          {/* Active Rating Pill */}
          {minRating > 0 && (
            <button
              onClick={() => setMinRating(0)}
              className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 px-3 py-1 rounded-full text-[10px] font-bold shrink-0 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition"
            >
              <span className="flex items-center space-x-0.5">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                <span>{minRating}+</span>
              </span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          )}

          {/* Active Available Today Pill */}
          {quickFilters.availableToday && (
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, availableToday: false }))}
              className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-3 py-1 rounded-full text-[10px] font-bold shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
            >
              <span>⚡ {t("available_today")}</span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          )}

          {/* Active Verified Only Pill */}
          {quickFilters.verifiedOnly && (
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, verifiedOnly: false }))}
              className="flex items-center space-x-1 bg-[#3E5C31]/10 dark:bg-emerald-950/30 text-[#3E5C31] dark:text-emerald-400 border border-[#3E5C31]/20 dark:border-emerald-900/30 px-3 py-1 rounded-full text-[10px] font-bold shrink-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
            >
              <span>🛡️ {t("verified_only")}</span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          )}

          {/* Active Lowest Price Pill */}
          {quickFilters.lowestPrice && (
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, lowestPrice: false }))}
              className="flex items-center space-x-1 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 px-3 py-1 rounded-full text-[10px] font-bold shrink-0 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition"
            >
              <span>💰 {t("lowest_price_first")}</span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          )}
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

      {/* Sorting and result metrics block */}
      <div className="px-4 space-y-2.5">

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

      {/* Filters Slide-up Bottom Sheet Drawer */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="relative bg-[#FDFCF9] dark:bg-[#151B18] w-full max-w-lg rounded-t-[28px] shadow-2xl overflow-hidden flex flex-col z-10 border-t border-[#E8E6E1] dark:border-slate-800 pb-safe"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-[#E8E6E1] dark:bg-slate-700 rounded-full mx-auto my-3 shrink-0" />
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-[#E8E6E1] dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("all");
                    setSelectedSubCategory("All");
                    setMinRating(0);
                    setQuickFilters({ availableToday: false, verifiedOnly: false, lowestPrice: false });
                    setSortBy("distance");
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center space-x-1.5 cursor-pointer bg-transparent border-none py-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{t("reset_filters")}</span>
                </button>
                
                <h2 className="text-xs font-black text-center text-[#2D2D2A] dark:text-slate-100 uppercase tracking-wider">
                  {language === "ta" ? "வடிகட்டி & வரிசைப்படுத்து" : "Filter & Sort"}
                </h2>
                
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-1.5 hover:bg-[#FAF7F2] dark:hover:bg-[#1C2420] rounded-full border border-[#E8E6E1] dark:border-slate-800 transition text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[55vh] px-5 py-4 space-y-6">
                
                {/* 1. Category Selection */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black text-[#5C5952] dark:text-slate-400 uppercase tracking-wider">
                    {language === "ta" ? "சேவை பிரிவு" : "Service Category"}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {availableCategories.map((cat) => {
                      const isActive = activeCategory === cat.id;
                      let icon = "📦";
                      if (cat.id === "agriculture") icon = "🚜";
                      else if (cat.id === "labor") icon = "👷";
                      else if (cat.id === "construction") icon = "🏗️";
                      else if (cat.id === "tools") icon = "🔧";
                      else if (cat.id === "function") icon = "🎪";
                      else if (cat.id === "all") icon = "🌈";

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#3E5C31] text-white border-[#3E5C31] shadow-xs"
                              : "bg-[#FAF7F2] dark:bg-[#1C2420] text-[#2D2D2A] dark:text-slate-300 border-[#E8E6E1] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <span className="text-lg mb-1">{icon}</span>
                          <span className="text-[9px] font-black leading-tight tracking-tight">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Subcategory Selection */}
                {subCategories.length > 1 && (
                  <div className="space-y-2.5">
                    <h3 className="text-[10px] font-black text-[#5C5952] dark:text-slate-400 uppercase tracking-wider">
                      {t("browse_categories")} ({availableCategories.find(c => c.id === activeCategory)?.label})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {subCategories.map((sub) => {
                        const isActive = selectedSubCategory === sub;
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setSelectedSubCategory(sub)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                              isActive
                                ? "bg-[#3E5C31] text-white border-[#3E5C31] shadow-xs"
                                : "bg-[#FAF7F2] dark:bg-[#1C2420] text-[#2D2D2A] dark:text-slate-300 border-[#E8E6E1] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/50"
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Sort By Options */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black text-[#5C5952] dark:text-slate-400 uppercase tracking-wider">
                    {t("sort_by")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "distance", label: t("nearby"), icon: "📍" },
                      { id: "price_low", label: t("price_low_high"), icon: "📉" },
                      { id: "price_high", label: t("price_high_low") || "Price: High to Low", icon: "📈" },
                      { id: "rating", label: t("top_rated") || "Top Rated", icon: "★" }
                    ].map((option) => {
                      const isActive = sortBy === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSortBy(option.id as any)}
                          className={`flex items-center space-x-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#3E5C31]/10 text-[#3E5C31] border-[#3E5C31] dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-[#FAF7F2] dark:bg-[#1C2420] text-[#2D2D2A] dark:text-slate-300 border-[#E8E6E1] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <span className="text-xs">{option.icon}</span>
                          <span className="text-[11px] font-bold">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Min Rating Options */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black text-[#5C5952] dark:text-slate-400 uppercase tracking-wider">
                    {language === "ta" ? "மதிப்பீடு" : "Minimum Rating"}
                  </h3>
                  <div className="flex items-center space-x-1.5">
                    {[0, 4.3, 4.5, 4.7].map((ratingVal) => {
                      const isActive = minRating === ratingVal;
                      return (
                        <button
                          key={ratingVal}
                          type="button"
                          onClick={() => setMinRating(ratingVal)}
                          className={`flex-1 flex items-center justify-center space-x-1 py-2 px-1.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer ${
                            isActive
                              ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                              : "bg-[#FAF7F2] dark:bg-[#1C2420] text-[#2D2D2A] dark:text-slate-300 border-[#E8E6E1] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/50"
                          }`}
                        >
                          {ratingVal === 0 ? (
                            <span>{t("all_ratings")}</span>
                          ) : (
                            <>
                              <span>{ratingVal}</span>
                              <Star className={`h-3 w-3 ${isActive ? "text-white fill-white" : "text-amber-500 fill-amber-500"}`} />
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Quick Status Switches */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black text-[#5C5952] dark:text-slate-400 uppercase tracking-wider">
                    {t("filters")}
                  </h3>
                  <div className="space-y-2">
                    {/* Available Today */}
                    <button
                      type="button"
                      onClick={() => setQuickFilters(prev => ({ ...prev, availableToday: !prev.availableToday }))}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                        quickFilters.availableToday
                          ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-300"
                          : "bg-[#FAF7F2] dark:bg-[#1C2420] border-[#E8E6E1] dark:border-slate-800 text-[#2D2D2A] dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-sm">⚡</span>
                        <div>
                          <div className="text-[11px] font-black">{t("available_today")}</div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                            {language === "ta" ? "இன்று வாடகைக்குக் கிடைக்கக்கூடியவை மட்டும்" : "Show items ready to be hired immediately"}
                          </div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                        quickFilters.availableToday
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-slate-300 dark:border-slate-700"
                      }`}>
                        {quickFilters.availableToday && <Check className="h-2.5 w-2.5 stroke-[3px]" />}
                      </div>
                    </button>

                    {/* Verified Only */}
                    <button
                      type="button"
                      onClick={() => setQuickFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                        quickFilters.verifiedOnly
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300"
                          : "bg-[#FAF7F2] dark:bg-[#1C2420] border-[#E8E6E1] dark:border-slate-800 text-[#2D2D2A] dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-sm">🛡️</span>
                        <div>
                          <div className="text-[11px] font-black">{t("verified_only")}</div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                            {language === "ta" ? "அரசு ஐடி மற்றும் KYC சரிபார்க்கப்பட்ட உரிமையாளர்கள் மட்டும்" : "Verified KYC & Government ID verified partners only"}
                          </div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                        quickFilters.verifiedOnly
                          ? "border-[#3E5C31] bg-[#3E5C31] text-white"
                          : "border-slate-300 dark:border-slate-700"
                      }`}>
                        {quickFilters.verifiedOnly && <Check className="h-2.5 w-2.5 stroke-[3px]" />}
                      </div>
                    </button>

                    {/* Lowest Price first */}
                    <button
                      type="button"
                      onClick={() => setQuickFilters(prev => ({ ...prev, lowestPrice: !prev.lowestPrice }))}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                        quickFilters.lowestPrice
                          ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40 text-purple-900 dark:text-purple-300"
                          : "bg-[#FAF7F2] dark:bg-[#1C2420] border-[#E8E6E1] dark:border-slate-800 text-[#2D2D2A] dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-sm">💰</span>
                        <div>
                          <div className="text-[11px] font-black">{t("lowest_price_first")}</div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                            {language === "ta" ? "விலை குறைந்த வரிசையில் காண்பிக்கவும்" : "Show lowest daily hire rates first"}
                          </div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                        quickFilters.lowestPrice
                          ? "border-purple-500 bg-purple-500 text-white"
                          : "border-slate-300 dark:border-slate-700"
                      }`}>
                        {quickFilters.lowestPrice && <Check className="h-2.5 w-2.5 stroke-[3px]" />}
                      </div>
                    </button>
                  </div>
                </div>

              </div>
              
              {/* Apply Footer */}
              <div className="p-4 bg-white dark:bg-[#1C2420] border-t border-[#E8E6E1] dark:border-slate-800 shrink-0 flex items-center justify-between gap-4 pb-safe">
                <div className="text-left shrink-0">
                  <div className="text-[9px] text-slate-500 uppercase font-black tracking-wider">
                    {language === "ta" ? "முடிவுகள்" : "Matching Results"}
                  </div>
                  <div className="text-xs font-black text-[#3E5C31] dark:text-emerald-400">
                    {filteredItems.length} {isLaborSelected ? t("labor") : t("all_items")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 bg-[#3E5C31] hover:bg-[#324a27] text-white py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer text-center"
                >
                  {language === "ta" ? "வடிகட்டிகளைப் பயன்படுத்து" : "Apply Filters"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
