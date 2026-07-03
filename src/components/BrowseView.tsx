import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, MapPin, SlidersHorizontal, ArrowLeft, Star, ArrowUpDown } from "lucide-react";
import { Equipment, Laborer, Booking } from "../types";
import { CATEGORIES_METADATA } from "../data";

interface BrowseViewProps {
  initialCategory: string;
  searchQuery: string;
  allEquipment: Equipment[];
  allLaborers: Laborer[];
  bookings?: Booking[];
  onBack: () => void;
  onSelectEquipment: (eq: Equipment) => void;
  onSelectLaborer: (lb: Laborer) => void;
}

export default function BrowseView({
  initialCategory,
  searchQuery,
  allEquipment,
  allLaborers,
  bookings = [],
  onBack,
  onSelectEquipment,
  onSelectLaborer
}: BrowseViewProps) {
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
    { id: "all", label: "All Items" },
    { id: "agriculture", label: "Agriculture" },
    { id: "construction", label: "Construction" },
    { id: "tools", label: "General Tools" },
    { id: "function", label: "Events & Function" },
    { id: "labor", label: "Labor Services" }
  ], []);

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
    <div id="browse-view-container" className="space-y-4 max-w-lg mx-auto bg-[#FDFCF9] min-h-screen pb-20 text-[#2D2D2A]">
      
      {/* Search Header */}
      <div id="browse-header" className="bg-white px-4 pt-4 pb-3 shadow-xs border-b border-[#E8E6E1] sticky top-0 z-20 space-y-3">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack} 
            className="p-1.5 hover:bg-[#F3F1ED] rounded-full text-[#2D2D2A] transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`Search in ${isLaborSelected ? 'Labor Services' : 'Equipment'}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-[#F3F1ED] text-[#2D2D2A] pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3E5C31] border border-transparent focus:bg-white transition-all"
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
                  ? "bg-[#3E5C31] text-white border-[#3E5C31] shadow-xs"
                  : "bg-white text-[#5C5952] border-[#E8E6E1] hover:bg-[#FAF7F2]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
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
                    ? "bg-[#2D2D2A] text-white border-[#2D2D2A]"
                    : "bg-white text-[#5C5952] border-[#E8E6E1] hover:bg-[#FAF7F2]"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Quick Filters */}
        <div id="quick-filters-container" className="bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#E8E6E1] space-y-2">
          <div className="flex justify-between items-center text-[10px] text-[#5C5952] font-black uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3 text-[#3E5C31]" />
              Quick Filters
            </span>
            {(quickFilters.availableToday || quickFilters.verifiedOnly || quickFilters.lowestPrice) && (
              <button
                onClick={() => setQuickFilters({ availableToday: false, verifiedOnly: false, lowestPrice: false })}
                className="text-rose-600 font-extrabold normal-case hover:underline cursor-pointer focus:outline-none"
              >
                Reset Filters
              </button>
            )}
          </div>
          <div className="flex space-x-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {/* Available Today Chip */}
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, availableToday: !prev.availableToday }))}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                quickFilters.availableToday
                  ? "bg-[#3E5C31] text-white border-[#3E5C31] shadow-xs"
                  : "bg-white text-[#5C5952] border-[#E8E6E1] hover:bg-amber-50/40 hover:border-amber-200"
              }`}
            >
              <span>⚡</span>
              <span>Available Today</span>
            </button>

            {/* Verified Only Chip */}
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                quickFilters.verifiedOnly
                  ? "bg-[#3E5C31] text-white border-[#3E5C31] shadow-xs"
                  : "bg-white text-[#5C5952] border-[#E8E6E1] hover:bg-amber-50/40 hover:border-amber-200"
              }`}
            >
              <span>🛡️</span>
              <span>Verified Only</span>
            </button>

            {/* Lowest Price First Chip */}
            <button
              onClick={() => setQuickFilters(prev => ({ ...prev, lowestPrice: !prev.lowestPrice }))}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                quickFilters.lowestPrice
                  ? "bg-[#3E5C31] text-white border-[#3E5C31] shadow-xs"
                  : "bg-white text-[#5C5952] border-[#E8E6E1] hover:bg-amber-50/40 hover:border-amber-200"
              }`}
            >
              <span>💰</span>
              <span>Lowest Price First</span>
            </button>
          </div>
        </div>

        {/* Star Rating Filter */}
        <div id="star-rating-filter-container" className="bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#E8E6E1] space-y-2">
          <div className="flex justify-between items-center text-[10px] text-[#5C5952] font-black uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              Filter by Rating (Trusted Partners)
            </span>
            {minRating > 0 && (
              <button
                onClick={() => setMinRating(0)}
                className="text-rose-600 font-extrabold normal-case hover:underline cursor-pointer focus:outline-none"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="flex space-x-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {[
              { label: "All Ratings", value: 0 },
              { label: "4.7 ★ & above", value: 4.7 },
              { label: "4.5 ★ & above", value: 4.5 },
              { label: "4.3 ★ & above", value: 4.3 },
            ].map((opt) => {
              const isSelected = minRating === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setMinRating(opt.value)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center space-x-1 ${
                    isSelected
                      ? "bg-[#3E5C31] text-white border-[#3E5C31] shadow-xs"
                      : "bg-white text-[#5C5952] border-[#E8E6E1] hover:bg-amber-50/40 hover:border-amber-200"
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
        <div className="flex justify-between items-center text-xs text-[#8A867E]">
          <span className="font-semibold text-[#2D2D2A]">
            {filteredItems.length} {isLaborSelected ? 'Laborers' : 'Items'} Found
          </span>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#8A867E]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-[#2D2D2A] focus:outline-none cursor-pointer border-none py-0 text-xs"
              >
                <option value="distance">Nearby ({sortBy === "distance" ? "📍" : ""})</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main listings list */}
      <div className="px-4 space-y-3 pb-6">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#E8E6E1] space-y-2">
            <span className="text-4xl">🌾</span>
            <h4 className="font-extrabold text-[#2D2D2A] text-sm">No listings match your search</h4>
            <p className="text-xs text-[#8A867E] max-w-xs mx-auto">
              Try adjusting your subcategory filter or search keywords to find providers near you.
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
                className="bg-white rounded-2xl p-3 border border-[#E8E6E1] shadow-xs flex items-center space-x-3 hover:shadow-md transition-all cursor-pointer relative"
                onClick={() => isLabor ? onSelectLaborer(item as Laborer) : onSelectEquipment(item as Equipment)}
              >
                {/* Image Section */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {item.verified && (
                    <span className="absolute top-1 left-1 bg-[#3E5C31] text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-[#F3F1ED] text-[#5C5952] font-bold px-1.5 py-0.5 rounded capitalize">
                      {isLabor ? "Skilled Labor" : (item as Equipment).subCategory}
                    </span>
                    <span className="text-[10px] text-[#8A867E] font-semibold flex items-center">
                      <MapPin className="h-3 w-3 text-[#3E5C31] mr-0.5 shrink-0" />
                      {item.distance} km
                    </span>
                  </div>

                  <h3 className="font-extrabold text-[#2D2D2A] text-sm truncate leading-tight">
                    {item.name}
                  </h3>

                  <div className="flex items-center space-x-1.5 text-xs text-[#8A867E]">
                    <span className="flex items-center text-[#D97706] font-bold text-[11px]">
                      ★ {item.rating}
                    </span>
                    <span className="text-[10px] text-[#8A867E] font-medium">
                      ({item.reviewsCount} reviews)
                    </span>
                  </div>

                  {/* Pricing and Details */}
                  <div className="flex justify-between items-end pt-1">
                    <div>
                      <span className="text-base font-black text-[#2D2D2A]">
                        ₹{item.pricePerDay}
                      </span>
                      <span className="text-[10px] text-[#8A867E] font-bold">
                        /day
                      </span>
                    </div>

                    <button 
                      className="bg-[#3E5C31] hover:bg-[#3E5C31]/90 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all active:scale-95 shrink-0"
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
