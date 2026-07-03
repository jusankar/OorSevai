import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Search, Sprout, HardHat, Wrench, Tent, Users, 
  MapPin, Bell, Shield, BadgePercent, ThumbsUp, Sparkles, ArrowRight
} from "lucide-react";
import { Equipment } from "../types";

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
            <span className="text-[9px] font-black tracking-widest text-[#3E5C31] uppercase bg-[#3E5C31]/10 px-2 py-0.5 rounded-md">Ooran</span>
            <span className="text-[10px] font-bold text-[#8A867E]">Your Village Partner</span>
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
