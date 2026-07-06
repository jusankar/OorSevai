import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sprout, HardHat, Wrench, Tent, Users, MapPin, Search, Bell, Shield, 
  ThumbsUp, BadgePercent, Sparkles, ArrowRight, ArrowLeft, Star, 
  Calendar, CheckCircle, Info, CreditCard, ChevronRight, MessageSquare, 
  User, Check, X, ShieldAlert, Plus, BarChart3, TrendingUp, AlertTriangle, 
  CheckCircle2, Loader2, Send, HelpCircle, PhoneCall, Truck, Clock
} from "lucide-react";
import { Equipment, Laborer, Booking, ChatMessage, Dispute, AppNotification } from "./types";
import { DEFAULT_EQUIPMENT, DEFAULT_LABORERS, CATEGORIES_METADATA } from "./data";
import { getTranslation, Language } from "./translate";
import { Settings } from "lucide-react";
import HomeView from "./components/HomeView";
import BrowseView from "./components/BrowseView";
import GeofenceMap from "./components/GeofenceMap";
import NotificationCenter from "./components/NotificationCenter";

export default function App() {
  // Application Roles
  const [userRole, setUserRole] = useState<"customer" | "owner" | "labor" | "admin">(() => {
    if (typeof window !== "undefined") {
      try {
        const roles = localStorage.getItem("oorsevai_user_roles");
        const parsed: ("customer" | "owner" | "labor" | "admin")[] = roles ? JSON.parse(roles) : [];
        if (parsed.includes("admin")) return "admin";
        if (parsed.includes("customer")) return "customer";
        if (parsed.length > 0) return parsed[0];
      } catch (e) {
        return "customer";
      }
    }
    return "customer";
  });

  // User Registration State
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oorsevai_registered") === "true";
    }
    return false;
  });

  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oorsevai_user_name") || "";
    }
    return "";
  });

  const [userMobile, setUserMobile] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oorsevai_user_mobile") || "";
    }
    return "";
  });

  const [userLocation, setUserLocation] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oorsevai_user_location") || "Coimbatore, Tamil Nadu";
    }
    return "Coimbatore, Tamil Nadu";
  });

  const [registeredRoles, setRegisteredRoles] = useState<("customer" | "owner" | "labor" | "admin")[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const roles = localStorage.getItem("oorsevai_user_roles");
        return roles ? JSON.parse(roles) : ["customer", "owner", "labor"];
      } catch (e) {
        return ["customer", "owner", "labor"];
      }
    }
    return ["customer", "owner", "labor"];
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProviderPromptModal, setShowProviderPromptModal] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<"home" | "bookings" | "chat" | "dashboard">("home");
  const [activeView, setActiveView] = useState<
    "home" | "browse" | "equipmentDetails" | "laborDetails" | "selectDate" | "bookingSummary"
  >("home");

  // Core Data Lists (In-memory persistent state)
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(DEFAULT_EQUIPMENT);
  const [laborersList, setLaborersList] = useState<Laborer[]>(DEFAULT_LABORERS);

  // Admin Service Location and Radius Geofence (surrounding distance KM)
  const [adminLocation, setAdminLocation] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oorsevai_user_location") || localStorage.getItem("admin_location") || "Coimbatore, Tamil Nadu";
    }
    return "Coimbatore, Tamil Nadu";
  });
  const [adminDistance, setAdminDistance] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_distance");
      return saved ? parseInt(saved, 10) : 15; // default 15 KM
    }
    return 15;
  });

  // Language & Settings states with persistence
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("oorsevai_lang") as Language) || "en";
    }
    return "en";
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oorsevai_dark") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Load persistent datasets from serverless PostgreSQL database on mount
  useEffect(() => {
    const fetchDatabaseData = async () => {
      try {
        const [eqRes, lbRes, bRes, dRes, nRes] = await Promise.all([
          fetch("/api/equipment").then(r => r.json()),
          fetch("/api/laborers").then(r => r.json()),
          fetch("/api/bookings").then(r => r.json()),
          fetch("/api/disputes").then(r => r.json()),
          fetch("/api/notifications").then(r => r.json()),
        ]);
        if (Array.isArray(eqRes)) setEquipmentList(eqRes);
        if (Array.isArray(lbRes)) setLaborersList(lbRes);
        if (Array.isArray(bRes)) setBookings(bRes);
        if (Array.isArray(dRes)) setDisputes(dRes);
        if (Array.isArray(nRes)) setNotifications(nRes);
      } catch (err) {
        console.error("Failed to load persistent datasets from Cloud SQL:", err);
      }
    };
    fetchDatabaseData();
  }, []);

  const t = (key: Parameters<typeof getTranslation>[1]): string => getTranslation(language, key);



  // Dynamically resolve names of owner and labor to the logged-in user name
  const resolvedEquipmentList = useMemo(() => {
    return equipmentList.map(eq => {
      if (eq.ownerId === "owner-1" || eq.ownerName === "Ravi Kumar" || eq.ownerName === "Udaya Kumar") {
        return {
          ...eq,
          ownerName: userName || "Ravi Kumar"
        };
      }
      return eq;
    });
  }, [equipmentList, userName]);

  const resolvedLaborersList = useMemo(() => {
    return laborersList.map(lb => {
      if (lb.id === "lb-4" || lb.name === "Raju Krishnan") {
        return {
          ...lb,
          name: userName || "Raju Krishnan"
        };
      }
      return lb;
    });
  }, [laborersList, userName]);

  // Dynamically filter active equipment and laborers based on Admin configured location distance
  const filteredEquipmentList = useMemo(() => {
    return resolvedEquipmentList.filter(item => item.distance <= adminDistance);
  }, [resolvedEquipmentList, adminDistance]);

  const filteredLaborersList = useMemo(() => {
    return resolvedLaborersList.filter(item => item.distance <= adminDistance);
  }, [resolvedLaborersList, adminDistance]);

  // PWA (Progressive Web App) states
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detect if already installed / standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Auto-prompt mock install support for easy demonstration / testing
    const timer = setTimeout(() => {
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setShowInstallBanner(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install user choice outcome: ${outcome}`);
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } else {
      // Elegant step-by-step instructions for non-Chrome browsers / iOS Safari
      alert("📱 How to install OorSevai on your device:\n\n• On Android (Chrome): Tap 'Add to Home Screen' when prompted.\n• On iOS (Safari): Tap the Share button (square with arrow up) at the bottom, then scroll down and tap 'Add to Home Screen'.");
    }
    setShowInstallBanner(false);
  };
  
  // Bookings Seed Data
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: "BK-12345",
      type: "equipment",
      itemId: "eq-1",
      itemName: "John Deere 5050 D Tractor",
      itemImage: "https://images.unsplash.com/photo-1594142404563-64ccc954aa79?auto=format&fit=crop&w=600&q=80",
      startDate: "2026-07-10",
      endDate: "2026-07-11",
      durationDays: 1,
      totalAmount: 3410,
      status: "upcoming",
      customerName: "Udaya Kumar",
      location: "Coimbatore, Tamil Nadu",
      deliveryMethod: "delivery",
      operatorOption: true,
      paymentStatus: "paid",
      dateBooked: "2026-07-02"
    },
    {
      id: "BK-12546",
      type: "equipment",
      itemId: "eq-3",
      itemName: "JCB 3DX Backhoe",
      itemImage: "https://images.unsplash.com/photo-1579684389782-64d84b5e901d?auto=format&fit=crop&w=600&q=80",
      startDate: "2026-06-15",
      endDate: "2026-06-16",
      durationDays: 1,
      totalAmount: 9500,
      status: "ongoing",
      customerName: "Udaya Kumar",
      location: "Coimbatore Bypass, Tamil Nadu",
      deliveryMethod: "pickup",
      operatorOption: true,
      paymentStatus: "paid",
      dateBooked: "2026-06-10"
    },
    {
      id: "BK-12347",
      type: "equipment",
      itemId: "eq-4",
      itemName: "Power Weeder 7.5 HP",
      itemImage: "https://images.unsplash.com/photo-1589923188900-85dae44fc3e3?auto=format&fit=crop&w=600&q=80",
      startDate: "2026-06-18",
      endDate: "2026-06-19",
      durationDays: 1,
      totalAmount: 1200,
      status: "completed",
      customerName: "Udaya Kumar",
      location: "Sulur, Coimbatore",
      deliveryMethod: "pickup",
      operatorOption: false,
      paymentStatus: "paid",
      dateBooked: "2026-06-15"
    }
  ]);

  // Disputes Seed Data
  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: "DSP-101",
      bookingId: "BK-12347",
      itemName: "Power Weeder 7.5 HP",
      complainant: "Udaya Kumar (Customer)",
      reason: "Machine starter was faulty, spent ₹300 repairing it locally.",
      status: "open",
      date: "2026-06-20"
    }
  ]);

  // Active Selections
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedLaborer, setSelectedLaborer] = useState<Laborer | null>(null);
  const [browseCategory, setBrowseCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Checkout Temp State
  const [selectedDate, setSelectedDate] = useState<string>("2026-07-10");
  const [rentalDuration, setRentalDuration] = useState<number>(1);
  const [operatorOption, setOperatorOption] = useState<boolean>(true);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [customLocation, setCustomLocation] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oorsevai_user_location") || "Coimbatore, Tamil Nadu";
    }
    return "Coimbatore, Tamil Nadu";
  });
  const [deliveryFee, setDeliveryFee] = useState<number>(600);
  const [editingGeofenceId, setEditingGeofenceId] = useState<string | null>(null);
  
  // Maintenance Logging Temp States
  const [bookingHoursInput, setBookingHoursInput] = useState<Record<string, string>>({});
  const [equipmentHoursInput, setEquipmentHoursInput] = useState<Record<string, string>>({});

  // Notification States
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "notif-1",
      bookingId: "BK-12345",
      title: "🚚 Equipment On The Way",
      message: "Ravi Kumar's John Deere 5050 D Tractor is on the way to your farm at Coimbatore, Tamil Nadu!",
      type: "equipment_on_the_way",
      isRead: false,
      timestamp: "5 mins ago"
    },
    {
      id: "notif-2",
      bookingId: "BK-12546",
      title: "⏰ Labor Shift Starting",
      message: "Raju Krishnan's mason shift is about to start at Coimbatore Bypass in 30 minutes.",
      type: "labor_shift_start",
      isRead: true,
      timestamp: "1 hour ago"
    }
  ]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [activeBannerNotification, setActiveBannerNotification] = useState<AppNotification | null>(null);

  // Dynamically resolve notification messages to the logged-in user name & location
  const resolvedNotifications = useMemo(() => {
    return notifications.map(n => {
      let message = n.message;
      if (userName) {
        message = message
          .replace("Ravi Kumar's", `${userName}'s`)
          .replace("Raju Krishnan's", `${userName}'s`)
          .replace("Ravi Kumar", userName)
          .replace("Raju Krishnan", userName);
      }
      if (userLocation) {
        message = message
          .replace(/Coimbatore,\s*Tamil\s*Nadu/gi, userLocation)
          .replace(/Coimbatore/gi, userLocation);
      }
      return { ...n, message };
    });
  }, [notifications, userName, userLocation]);

  const resolvedActiveBannerNotification = useMemo(() => {
    if (!activeBannerNotification) return null;
    let message = activeBannerNotification.message;
    if (userName) {
      message = message
        .replace("Ravi Kumar's", `${userName}'s`)
        .replace("Raju Krishnan's", `${userName}'s`)
        .replace("Ravi Kumar", userName)
        .replace("Raju Krishnan", userName);
    }
    if (userLocation) {
      message = message
        .replace(/Coimbatore,\s*Tamil\s*Nadu/gi, userLocation)
        .replace(/Coimbatore/gi, userLocation);
    }
    return { ...activeBannerNotification, message };
  }, [activeBannerNotification, userName, userLocation]);

  // Dynamically resolve booking locations to the user's current/registered location
  const resolvedBookings = useMemo(() => {
    return bookings.map(b => {
      if (b.location === "Coimbatore, Tamil Nadu") {
        return { ...b, location: userLocation };
      }
      return b;
    });
  }, [bookings, userLocation]);

  // Utility to push new notifications and trigger real-time banner
  const triggerNotification = (bookingId: string, title: string, message: string, type: "equipment_on_the_way" | "labor_shift_start" | "general") => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      bookingId,
      title,
      message,
      type,
      isRead: false,
      timestamp: "Just Now"
    };

    // Save to serverless PostgreSQL database
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNotif)
    }).catch(err => console.error("Failed to save notification to DB:", err));

    setNotifications(prev => [newNotif, ...prev]);
    setActiveBannerNotification(newNotif);
    
    // Automatically dismiss the banner after 4.5 seconds
    setTimeout(() => {
      setActiveBannerNotification(current => current?.id === newNotif.id ? null : current);
    }, 4500);
  };

  // Chat/AI State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "ai",
      text: "Vanakkam! I am your OorSevai Farming & Equipment Assistant. How can I assist you today? I can help predict rental prices, recommend tools for your land size, or share weather-based farming suggestions.",
      timestamp: "10:00 AM"
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Price Predictor State for Owners
  const [predictCategory, setPredictCategory] = useState("Tractor");
  const [predictBrand, setPredictBrand] = useState("John Deere");
  const [predictYear, setPredictYear] = useState("2021");
  const [predictCondition, setPredictCondition] = useState("Excellent");
  const [predictLocation, setPredictLocation] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oorsevai_user_location") || "Coimbatore, Tamil Nadu";
    }
    return "Coimbatore, Tamil Nadu";
  });
  const [predictionResult, setPredictionResult] = useState<any | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // New Equipment Listing State for Owners
  const [newEqName, setNewEqName] = useState("");
  const [newEqCategory, setNewEqCategory] = useState<"agriculture" | "construction" | "tools" | "function">("agriculture");
  const [newEqSubCategory, setNewEqSubCategory] = useState("Tractor");
  const [newEqPrice, setNewEqPrice] = useState("");
  const [newEqAbout, setNewEqAbout] = useState("");
  const [newEqPower, setNewEqPower] = useState("50 HP");
  const [newEqFuel, setNewEqFuel] = useState("Diesel");
  const [newEqDrive, setNewEqDrive] = useState("4 WD");
  const [newEqYear, setNewEqYear] = useState("2021");
  const [newEqOperator, setNewEqOperator] = useState(true);
  const [newEqImage, setNewEqImage] = useState("");
  const [showEqSuccessModal, setShowEqSuccessModal] = useState(false);

  // New Labor Registration State
  const [newLaborName, setNewLaborName] = useState("");
  const [newLaborCategory, setNewLaborCategory] = useState("General");
  const [newLaborPrice, setNewLaborPrice] = useState("");
  const [newLaborExperience, setNewLaborExperience] = useState("5 Years");
  const [newLaborGender, setNewLaborGender] = useState<"Male" | "Female" | "Other">("Male");
  const [newLaborKycDocType, setNewLaborKycDocType] = useState("Aadhaar Card");
  const [newLaborKycFileName, setNewLaborKycFileName] = useState("");
  const [isLaborRegistered, setIsLaborRegistered] = useState(false);

  // KYC Verifications for Admin Panel
  const [kycRequests, setKycRequests] = useState([
    { id: "kyc-1", name: "Murugan Swamy", type: "Owner", document: "Aadhaar Card", status: "pending" },
    { id: "kyc-2", name: "Raju Krishnan", type: "Labor", document: "Electrical License", status: "pending" },
    { id: "kyc-3", name: "Arun Vignesh", type: "Owner", document: "GST Registration", status: "pending" }
  ]);

  // Handle Equipment/Labor verifications by Admin
  const [pendingEquipmentApprovals, setPendingEquipmentApprovals] = useState([
    { id: "eq-approve-1", name: "New Power Tiller 15 HP", owner: "Murugan Swamy", status: "pending" }
  ]);

  // Quick navigation handlers
  const handleSelectCategory = (cat: string) => {
    setBrowseCategory(cat);
    setSearchQuery("");
    setActiveView("browse");
  };

  const handleStartSearch = (query: string) => {
    setSearchQuery(query);
    setBrowseCategory("all");
    setActiveView("browse");
  };

  const handleSelectEquipment = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setOperatorOption(eq.specs.operatorIncluded || false);
    setActiveView("equipmentDetails");
  };

  const handleSelectLaborer = (lb: Laborer) => {
    setSelectedLaborer(lb);
    setActiveView("laborDetails");
  };

  // Chat submission with backend API
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsgText = chatInput;
    setChatInput("");
    
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsgText,
          history: chatMessages.slice(-8) // Send recent conversational history
        })
      });

      const data = await response.json();
      
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: data.text || "I apologize, I am unable to connect to the server at this time.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 2}`,
        sender: "ai",
        text: "Error connecting to agricultural advisor database. Please check your network.",
        timestamp: "Now"
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Price Predictor submission with backend API
  const handlePredictPrice = async () => {
    setIsPredicting(true);
    setPredictionResult(null);

    try {
      const res = await fetch("/api/predict-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentType: predictCategory,
          brand: predictBrand,
          year: predictYear,
          condition: predictCondition,
          location: predictLocation
        })
      });

      const data = await res.json();
      setPredictionResult(data);
    } catch (err) {
      console.error(err);
      // Fallback in case of server failure/no key
      setPredictionResult({
        predictedPrice: 1950,
        priceRange: "₹1,750 - ₹2,200 per day",
        marketDemand: "High",
        reasoning: "Based on local data in Coimbatore, high agricultural demand for well-maintained machinery drives premium pricing for mid-aged tools.",
        seasonalTips: "Prices can be raised by 15% during Kharif sowing season in June/July."
      });
    } finally {
      setIsPredicting(false);
    }
  };

  // Booking Creation
  const handleConfirmBooking = () => {
    if (!selectedEquipment) return;
    
    const basePrice = selectedEquipment.pricePerDay * rentalDuration;
    const operatorCost = operatorOption ? 600 * rentalDuration : 0;
    const transportCost = deliveryMethod === "delivery" ? deliveryFee : 0;
    const subtotal = basePrice + operatorCost + transportCost;
    const fee = Math.round(subtotal * 0.1);
    const finalTotal = subtotal + fee;

    const newBooking: Booking = {
      id: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
      type: "equipment",
      itemId: selectedEquipment.id,
      itemName: selectedEquipment.name,
      itemImage: selectedEquipment.image,
      startDate: selectedDate,
      endDate: new Date(new Date(selectedDate).getTime() + rentalDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationDays: rentalDuration,
      totalAmount: finalTotal,
      status: "upcoming",
      customerName: "Udaya Kumar",
      location: customLocation,
      deliveryMethod: deliveryMethod,
      operatorOption: operatorOption,
      paymentStatus: "paid",
      dateBooked: new Date().toISOString().split('T')[0]
    };

    // Save to serverless PostgreSQL database
    fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBooking)
    }).catch(err => console.error("Failed to save booking to DB:", err));

    setBookings((prev) => [newBooking, ...prev]);
    setActiveTab("bookings");
    setActiveView("home");
  };

  // Hiring Laborer Action
  const handleHireLaborer = (lb: Laborer) => {
    const newBooking: Booking = {
      id: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
      type: "labor",
      itemId: lb.id,
      itemName: `Hire: ${lb.name} (${lb.category})`,
      itemImage: lb.image,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      durationDays: 1,
      totalAmount: lb.pricePerDay,
      status: "upcoming",
      customerName: "Udaya Kumar",
      location: lb.location,
      paymentStatus: "paid",
      dateBooked: new Date().toISOString().split('T')[0]
    };

    // Save to serverless PostgreSQL database
    fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBooking)
    }).catch(err => console.error("Failed to save booking to DB:", err));

    setBookings((prev) => [newBooking, ...prev]);
    alert(`Successfully booked ${lb.name} for ${lb.category} service! They will contact you shortly.`);
    setActiveTab("bookings");
    setActiveView("home");
  };

  // Add Equipment Owner Action
  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqName || !newEqPrice) return;

    const newEq: Equipment = {
      id: `eq-${Date.now()}`,
      name: newEqName,
      category: newEqCategory,
      subCategory: newEqSubCategory,
      image: newEqImage || "https://images.unsplash.com/photo-1594142404563-64ccc954aa79?auto=format&fit=crop&w=600&q=80",
      pricePerDay: parseFloat(newEqPrice),
      rating: 5.0,
      reviewsCount: 0,
      distance: 1.2,
      ownerName: "Udaya Kumar",
      ownerId: "owner-1",
      specs: {
        power: newEqPower,
        fuel: newEqFuel,
        drive: newEqDrive,
        year: newEqYear,
        operatorIncluded: newEqOperator,
      },
      about: newEqAbout || "Newly listed heavy equipment for short and long-term hiring.",
      location: "Coimbatore, Tamil Nadu",
      verified: false,
      status: "active",
      deliveryZones: [
        { id: `z1-${Date.now()}`, name: "Immediate Neighborhood", radiusKm: 5, deliveryFee: 250, color: "rgba(16, 185, 129, 0.15)" },
        { id: `z2-${Date.now()}`, name: "Coimbatore Mid-Ring", radiusKm: 15, deliveryFee: 600, color: "rgba(245, 158, 11, 0.15)" },
        { id: `z3-${Date.now()}`, name: "Extended Rural Belt", radiusKm: 35, deliveryFee: 1400, color: "rgba(239, 68, 68, 0.12)" }
      ]
    };

    // Save to serverless PostgreSQL database
    fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEq)
    }).catch(err => console.error("Failed to save equipment to DB:", err));

    setEquipmentList((prev) => [newEq, ...prev]);
    
    // Add to pending approvals
    setPendingEquipmentApprovals((prev) => [
      ...prev,
      { id: `eq-approve-${Date.now()}`, name: newEq.name, owner: "Udaya Kumar (You)", status: "pending" }
    ]);

    setShowEqSuccessModal(true);
    
    // Reset fields
    setNewEqName("");
    setNewEqPrice("");
    setNewEqAbout("");
    setNewEqImage("");
  };

  // Register as Laborer Action
  const handleRegisterLaborer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLaborName || !newLaborPrice) return;

    // Use a custom image depending on gender selection
    let defaultImg = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"; // male default
    if (newLaborGender === "Female") {
      defaultImg = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"; // female default
    } else if (newLaborGender === "Other") {
      defaultImg = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
    }

    const docDescription = `${newLaborKycDocType}${newLaborKycFileName ? ` (${newLaborKycFileName})` : ""}`;

    const newLb: Laborer = {
      id: `lb-${Date.now()}`,
      name: newLaborName,
      category: newLaborCategory,
      image: defaultImg,
      pricePerDay: parseFloat(newLaborPrice),
      rating: 5.0,
      reviewsCount: 0,
      location: "Coimbatore, Tamil Nadu",
      distance: 1.0,
      availability: "available",
      experience: newLaborExperience,
      verified: false,
      gender: newLaborGender,
      kycDocName: docDescription,
      kycStatus: "pending"
    };

    // Save to serverless PostgreSQL database
    fetch("/api/laborers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLb)
    }).catch(err => console.error("Failed to save laborer to DB:", err));

    setLaborersList((prev) => [newLb, ...prev]);
    
    // Add to KYC approvals
    setKycRequests((prev) => [
      ...prev,
      { 
        id: `kyc-${Date.now()}`, 
        name: newLaborName, 
        type: "Labor", 
        document: docDescription, 
        status: "pending" 
      }
    ]);

    setIsLaborRegistered(true);
    
    // Reset fields
    setNewLaborName("");
    setNewLaborPrice("");
    setNewLaborKycFileName("");
  };

  // Toggle equipment status (Active / Inactive)
  const handleToggleStatus = (eqId: string) => {
    const updatedEq = equipmentList.find(eq => eq.id === eqId);
    if (updatedEq) {
      const newStatus = updatedEq.status === "active" ? "inactive" : "active";
      fetch(`/api/equipment/${eqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      }).catch(err => console.error("Failed to update status on DB:", err));
    }

    setEquipmentList((prev) => prev.map(eq => {
      if (eq.id === eqId) {
        return { ...eq, status: eq.status === "active" ? "inactive" : "active" };
      }
      return eq;
    }));
  };

  // Log cumulative operating/maintenance hours for equipment and update 'serviceDue' status
  const handleLogEquipmentHours = (equipmentId: string, hours: number, bookingId?: string) => {
    if (bookingId) {
      fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loggedHours: hours })
      }).catch(err => console.error("Failed to update booking logged hours on DB:", err));

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, loggedHours: hours } : b))
      );
    }

    const eq = equipmentList.find(e => e.id === equipmentId);
    if (eq) {
      const currentUsage = eq.usageHours || 0;
      const newUsage = currentUsage + hours;
      const lastService = eq.lastServiceHours || 0;
      const interval = eq.serviceDueIntervalHours || 50;
      const due = newUsage >= lastService + interval;
      
      fetch(`/api/equipment/${equipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usageHours: newUsage, serviceDue: due })
      }).catch(err => console.error("Failed to update equipment usage hours on DB:", err));
    }

    setEquipmentList((prev) =>
      prev.map((eq) => {
        if (eq.id === equipmentId) {
          const currentUsage = eq.usageHours || 0;
          const newUsage = currentUsage + hours;
          const lastService = eq.lastServiceHours || 0;
          const interval = eq.serviceDueIntervalHours || 50;
          const due = newUsage >= lastService + interval;
          return {
            ...eq,
            usageHours: newUsage,
            serviceDue: due,
          };
        }
        return eq;
      })
    );
  };

  // Mark equipment as serviced and reset its 'serviceDue' status back to false
  const handlePerformEquipmentService = (equipmentId: string) => {
    const eq = equipmentList.find(e => e.id === equipmentId);
    if (eq) {
      const currentUsage = eq.usageHours || 0;
      fetch(`/api/equipment/${equipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastServiceHours: currentUsage, serviceDue: false })
      }).catch(err => console.error("Failed to perform service update on DB:", err));
    }

    setEquipmentList((prev) =>
      prev.map((eq) => {
        if (eq.id === equipmentId) {
          const currentUsage = eq.usageHours || 0;
          return {
            ...eq,
            lastServiceHours: currentUsage,
            serviceDue: false,
          };
        }
        return eq;
      })
    );
  };

  // Admin approval KYC
  const handleApproveKYC = (kycId: string) => {
    let approvedName = "";
    let approvedType = "";
    setKycRequests((prev) => prev.map(k => {
      if (k.id === kycId) {
        approvedName = k.name;
        approvedType = k.type;
        return { ...k, status: "approved" };
      }
      return k;
    }));

    if (approvedType === "Labor") {
      const l = laborersList.find(x => x.name === approvedName);
      if (l) {
        fetch(`/api/laborers/${l.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verified: true, kycStatus: "verified" })
        }).catch(err => console.error("Failed to approve KYC on DB:", err));
      }

      setLaborersList((prev) => prev.map(l => {
        if (l.name === approvedName) {
          return { ...l, verified: true, kycStatus: "verified" };
        }
        return l;
      }));
    }
  };

  const handleRejectKYC = (kycId: string) => {
    let rejectedName = "";
    let rejectedType = "";
    setKycRequests((prev) => prev.map(k => {
      if (k.id === kycId) {
        rejectedName = k.name;
        rejectedType = k.type;
        return { ...k, status: "rejected" };
      }
      return k;
    }));

    if (rejectedType === "Labor") {
      const l = laborersList.find(x => x.name === rejectedName);
      if (l) {
        fetch(`/api/laborers/${l.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verified: false, kycStatus: "rejected" })
        }).catch(err => console.error("Failed to reject KYC on DB:", err));
      }

      setLaborersList((prev) => prev.map(l => {
        if (l.name === rejectedName) {
          return { ...l, verified: false, kycStatus: "rejected" };
        }
        return l;
      }));
    }
  };

  // Admin approval Equipment
  const handleApproveEquipment = (approveId: string) => {
    setPendingEquipmentApprovals((prev) => prev.map(eq => eq.id === approveId ? { ...eq, status: "approved" } : eq));
  };

  // Dispute Resolution
  const handleResolveDispute = (disId: string) => {
    fetch(`/api/disputes/${disId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" })
    }).catch(err => console.error("Failed to resolve dispute on DB:", err));

    setDisputes((prev) => prev.map(d => d.id === disId ? { ...d, status: "resolved" } : d));
  };

  // Notification actions
  const handleMarkNotificationRead = (notifId: string) => {
    fetch(`/api/notifications/${notifId}/read`, {
      method: "PUT"
    }).catch(err => console.error("Failed to mark notification read on DB:", err));

    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (bookingId: string) => {
    // Mark specifically as read
    setNotifications(prev => prev.map(n => n.bookingId === bookingId ? { ...n, isRead: true } : n));
    setShowNotificationsDropdown(false);
    setUserRole("customer");
    setActiveTab("bookings");
    const b = resolvedBookings.find(x => x.id === bookingId);
    if (b) {
      setBookingTab(b.status);
    }
  };

  // Filter My Bookings state tabs
  const [bookingTab, setBookingTab] = useState<"upcoming" | "ongoing" | "completed" | "cancelled">("upcoming");
  const filteredBookings = resolvedBookings.filter(b => b.status === bookingTab);

  // Calculate Owner stats
  const ownerEquipment = resolvedEquipmentList.filter(eq => eq.ownerId === "owner-1");
  const ownerTotalEarnings = resolvedBookings
    .filter(b => b.status === "completed" || b.status === "ongoing")
    .reduce((sum, b) => sum + (b.totalAmount * 0.9), 0); // 90% goes to owner after 10% commission

  const [regName, setRegName] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regRoles, setRegRoles] = useState<("customer" | "owner" | "labor")[]>(["customer"]);
  const [regLocation, setRegLocation] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [showAdminField, setShowAdminField] = useState(false);
  const [regError, setRegError] = useState("");

  const handleDetectRegLocation = () => {
    if (!navigator.geolocation) {
      alert(language === "ta" ? "உங்கள் உலாவி இருப்பிடத்தைக் கண்டறிவதை ஆதரிக்கவில்லை" : "Geolocation is not supported by your browser");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detectedName = `Near ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${language}`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const parts: string[] = [];

            // 1. Specific building or amenity
            if (addr.amenity) parts.push(addr.amenity);
            else if (addr.building) parts.push(addr.building);

            // 2. Road and house number
            if (addr.house_number) {
              if (addr.road) {
                parts.push(`${addr.house_number}, ${addr.road}`);
              } else {
                parts.push(addr.house_number);
              }
            } else if (addr.road) {
              parts.push(addr.road);
            }

            // 3. Local area details
            if (addr.neighbourhood) parts.push(addr.neighbourhood);
            if (addr.suburb && addr.suburb !== addr.neighbourhood) parts.push(addr.suburb);
            
            const localPlace = addr.village || addr.town || addr.city;
            if (localPlace && !parts.includes(localPlace)) {
              parts.push(localPlace);
            }

            // 4. District and State (clean up for cleaner reading)
            if (addr.county) {
              const countyClean = addr.county.replace(/\s+District/gi, "").replace(/\s+மாவட்டம்/g, "");
              if (!parts.includes(countyClean) && countyClean !== localPlace) {
                parts.push(countyClean);
              }
            }
            if (addr.state) {
              const stateClean = addr.state.replace(/\s+State/gi, "").replace(/\s+மாநிலம்/g, "");
              if (!parts.includes(stateClean)) {
                parts.push(stateClean);
              }
            }

            // 5. Postal Code
            if (addr.postcode) {
              parts.push(addr.postcode);
            }

            detectedName = parts.length > 1 ? parts.join(", ") : geoData.display_name || detectedName;
          }
        } catch (e) {
          console.error("Reverse geocoding failed, using coordinates:", e);
        }
        setRegLocation(detectedName);
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(language === "ta" ? "இருப்பிடத்தை அணுக முடியவில்லை. கைமுறையாக தட்டச்சு செய்யவும்." : "Location access denied or unavailable. Please type manually.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleDetectSettingsLocation = () => {
    if (!navigator.geolocation) {
      alert(language === "ta" ? "உங்கள் உலாவி இருப்பிடத்தைக் கண்டறிவதை ஆதரிக்கவில்லை" : "Geolocation is not supported by your browser");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detectedName = `Near ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${language}`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const parts: string[] = [];

            // 1. Specific building or amenity
            if (addr.amenity) parts.push(addr.amenity);
            else if (addr.building) parts.push(addr.building);

            // 2. Road and house number
            if (addr.house_number) {
              if (addr.road) {
                parts.push(`${addr.house_number}, ${addr.road}`);
              } else {
                parts.push(addr.house_number);
              }
            } else if (addr.road) {
              parts.push(addr.road);
            }

            // 3. Local area details
            if (addr.neighbourhood) parts.push(addr.neighbourhood);
            if (addr.suburb && addr.suburb !== addr.neighbourhood) parts.push(addr.suburb);
            
            const localPlace = addr.village || addr.town || addr.city;
            if (localPlace && !parts.includes(localPlace)) {
              parts.push(localPlace);
            }

            // 4. District and State
            if (addr.county) {
              const countyClean = addr.county.replace(/\s+District/gi, "").replace(/\s+மாவட்டம்/g, "");
              if (!parts.includes(countyClean) && countyClean !== localPlace) {
                parts.push(countyClean);
              }
            }
            if (addr.state) {
              const stateClean = addr.state.replace(/\s+State/gi, "").replace(/\s+மாநிலம்/g, "");
              if (!parts.includes(stateClean)) {
                parts.push(stateClean);
              }
            }

            // 5. Postal Code
            if (addr.postcode) {
              parts.push(addr.postcode);
            }

            detectedName = parts.length > 1 ? parts.join(", ") : geoData.display_name || detectedName;
          }
        } catch (e) {
          console.error("Reverse geocoding failed, using coordinates:", e);
        }
        setUserLocation(detectedName);
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(language === "ta" ? "இருப்பிடத்தை அணுக முடியவில்லை. கைமுறையாக தட்டச்சு செய்யவும்." : "Location access denied or unavailable. Please type manually.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setRegError(t("reg_error_name"));
      return;
    }
    const cleanMobile = regMobile.replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      setRegError(t("reg_error_mobile"));
      return;
    }
    if (!regLocation.trim()) {
      setRegError(t("reg_error_location"));
      return;
    }
    if (regRoles.length === 0) {
      setRegError(t("reg_error_roles"));
      return;
    }

    const finalRoles: ("customer" | "owner" | "labor" | "admin")[] = [...regRoles];
    if (adminCodeInput.trim() === "1234" || adminCodeInput.trim() === "admin123") {
      finalRoles.push("admin");
    }

    const finalLocation = regLocation.trim();
    localStorage.setItem("oorsevai_user_name", regName.trim());
    localStorage.setItem("oorsevai_user_mobile", cleanMobile);
    localStorage.setItem("oorsevai_user_location", finalLocation);
    localStorage.setItem("oorsevai_user_roles", JSON.stringify(finalRoles));
    localStorage.setItem("oorsevai_registered", "true");
    localStorage.setItem("admin_location", finalLocation);

    setUserName(regName.trim());
    setUserMobile(cleanMobile);
    setUserLocation(finalLocation);
    setCustomLocation(finalLocation);
    setAdminLocation(finalLocation);
    setPredictLocation(finalLocation);
    setRegisteredRoles(finalRoles);
    setIsRegistered(true);

    if (finalRoles.includes("admin")) {
      setUserRole("admin");
      setActiveTab("dashboard");
    } else if (finalRoles.includes("customer")) {
      setUserRole("customer");
      setActiveTab("home");
      setActiveView("home");
    } else {
      setUserRole(finalRoles[0]);
      setActiveTab("dashboard");
    }
  };

  return (
    <div id="main-app-container" className={`min-h-screen bg-[#FAF7F2] dark:bg-slate-950 font-sans flex flex-col items-center justify-start py-0 md:py-8 transition-colors duration-300 ${darkMode ? "dark" : ""}`}>
      
      {/* High Fidelity Screen Wrapper framing a mobile emulator feel on desktop */}
      <div className={`w-full max-w-md bg-[#FDFCF9] dark:bg-[#121212] dark:text-[#F1F5F9] md:rounded-3xl md:shadow-2xl border border-[#E8E6E1] dark:border-slate-800 overflow-hidden flex flex-col h-screen md:h-[840px] max-h-screen md:max-h-[840px] relative transition-all duration-300 ${darkMode ? "dark" : ""}`}>
        
        {!isRegistered ? (
          <div className="flex-1 flex flex-col h-full bg-[#FAF7F2] dark:bg-slate-950 overflow-y-auto scrollbar-none">
            {/* Simple Registration Header */}
            <div className="bg-[#3E5C31] dark:bg-[#203119] text-white px-4 py-4 border-b border-white/10 flex justify-between items-center shadow-sm shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-xl overflow-hidden flex items-center justify-center p-0.5 shadow-sm">
                  <img src="/icon.svg" alt="Oor Sevai" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight leading-none text-white">{t("app_title")}</h1>
                  <span className="text-[8px] uppercase tracking-wider text-white/70 font-bold">{t("app_subtitle")}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1.5">
                {/* Language Switcher */}
                <button
                  type="button"
                  onClick={() => {
                    const newLang = language === "en" ? "ta" : "en";
                    setLanguage(newLang);
                    localStorage.setItem("oorsevai_lang", newLang);
                  }}
                  className="text-[10px] bg-white/10 hover:bg-white/20 border border-white/10 text-white px-2.5 py-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer flex items-center space-x-1"
                >
                  <span>🌐</span>
                  <span className="font-extrabold">{language === "en" ? "EN" : "தம"}</span>
                </button>

                {/* Theme Switcher */}
                <button
                  type="button"
                  onClick={() => {
                    const newMode = !darkMode;
                    setDarkMode(newMode);
                    localStorage.setItem("oorsevai_dark", newMode ? "true" : "false");
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all duration-200 cursor-pointer"
                >
                  {darkMode ? "☀️" : "🌙"}
                </button>
              </div>
            </div>

            {/* Registration Form */}
            <div className="p-5 flex-1 flex flex-col justify-start">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-black text-[#2D2D2A] dark:text-slate-100 tracking-tight">{t("reg_title")}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-sm mx-auto">{t("reg_subtitle")}</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4 flex-1 flex flex-col">
                {regError && (
                  <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-semibold flex items-center space-x-1.5 animate-bounce">
                    <span>⚠️</span>
                    <span>{regError}</span>
                  </div>
                )}

                {/* Name field */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 tracking-wider">{t("reg_name_label")}</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (regError) setRegError("");
                    }}
                    placeholder={t("reg_name_placeholder")}
                    className="w-full bg-white dark:bg-[#1A2320] border border-[#E8E6E1] dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#3E5C31] focus:border-[#3E5C31] dark:text-slate-100 outline-none transition-all"
                  />
                </div>

                {/* Mobile field */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 tracking-wider">{t("reg_mobile_label")}</label>
                  <input
                    type="tel"
                    value={regMobile}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setRegMobile(clean);
                      if (regError) setRegError("");
                    }}
                    maxLength={10}
                    placeholder={t("reg_mobile_placeholder")}
                    className="w-full bg-white dark:bg-[#1A2320] border border-[#E8E6E1] dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#3E5C31] focus:border-[#3E5C31] dark:text-slate-100 outline-none transition-all"
                  />
                </div>

                {/* Location field with GPS Detection */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 tracking-wider">{t("reg_location_label")}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={regLocation}
                      onChange={(e) => {
                        setRegLocation(e.target.value);
                        if (regError) setRegError("");
                      }}
                      placeholder={t("reg_location_placeholder")}
                      className="flex-1 bg-white dark:bg-[#1A2320] border border-[#E8E6E1] dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#3E5C31] focus:border-[#3E5C31] dark:text-slate-100 outline-none transition-all"
                    />
                    <button
                      type="button"
                      disabled={isDetectingLocation}
                      onClick={handleDetectRegLocation}
                      className="px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 text-[#2D2D2A] rounded-xl text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span>📍</span> {isDetectingLocation ? (language === "ta" ? "கண்டறிகிறது..." : "Detecting...") : t("reg_location_detect")}
                    </button>
                  </div>
                </div>

                {/* Roles Selection */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-0.5 tracking-wider">{t("reg_roles_label")}</label>
                  <p className="text-[10px] text-[#8A867E] dark:text-slate-400 mb-3">{t("reg_roles_desc")}</p>
                  
                  <div className="space-y-2.5">
                    {/* Customer role */}
                    <div 
                      onClick={() => {
                        const next = regRoles.includes("customer") 
                          ? regRoles.filter(r => r !== "customer") 
                          : [...regRoles, "customer"];
                        setRegRoles(next);
                        if (regError) setRegError("");
                      }}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-3 select-none ${
                        regRoles.includes("customer")
                          ? "bg-[#3E5C31]/5 border-[#3E5C31] dark:border-emerald-500 dark:bg-emerald-500/5 shadow-xs"
                          : "bg-white dark:bg-[#1A2320] border-[#E8E6E1] dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 shrink-0 mt-0.5 transition-all ${
                        regRoles.includes("customer")
                          ? "border-[#3E5C31] bg-[#3E5C31] text-white dark:border-emerald-500 dark:bg-emerald-500"
                          : "border-[#E8E6E1] dark:border-slate-700"
                      }`}>
                        {regRoles.includes("customer") && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black text-[#2D2D2A] dark:text-slate-100 flex items-center gap-1.5">
                          <span>🚜</span> {t("reg_role_customer_title")}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{t("reg_role_customer_desc")}</p>
                      </div>
                    </div>

                    {/* Owner role */}
                    <div 
                      onClick={() => {
                        const next = regRoles.includes("owner") 
                          ? regRoles.filter(r => r !== "owner") 
                          : [...regRoles, "owner"];
                        setRegRoles(next);
                        if (regError) setRegError("");
                      }}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-3 select-none ${
                        regRoles.includes("owner")
                          ? "bg-[#3E5C31]/5 border-[#3E5C31] dark:border-emerald-500 dark:bg-emerald-500/5 shadow-xs"
                          : "bg-white dark:bg-[#1A2320] border-[#E8E6E1] dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 shrink-0 mt-0.5 transition-all ${
                        regRoles.includes("owner")
                          ? "border-[#3E5C31] bg-[#3E5C31] text-white dark:border-emerald-500 dark:bg-emerald-500"
                          : "border-[#E8E6E1] dark:border-slate-700"
                      }`}>
                        {regRoles.includes("owner") && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black text-[#2D2D2A] dark:text-slate-100 flex items-center gap-1.5">
                          <span>🛠️</span> {t("reg_role_owner_title")}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{t("reg_role_owner_desc")}</p>
                      </div>
                    </div>

                    {/* Labor role */}
                    <div 
                      onClick={() => {
                        const next = regRoles.includes("labor") 
                          ? regRoles.filter(r => r !== "labor") 
                          : [...regRoles, "labor"];
                        setRegRoles(next);
                        if (regError) setRegError("");
                      }}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-3 select-none ${
                        regRoles.includes("labor")
                          ? "bg-[#3E5C31]/5 border-[#3E5C31] dark:border-emerald-500 dark:bg-emerald-500/5 shadow-xs"
                          : "bg-white dark:bg-[#1A2320] border-[#E8E6E1] dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 shrink-0 mt-0.5 transition-all ${
                        regRoles.includes("labor")
                          ? "border-[#3E5C31] bg-[#3E5C31] text-white dark:border-emerald-500 dark:bg-emerald-500"
                          : "border-[#E8E6E1] dark:border-slate-700"
                      }`}>
                        {regRoles.includes("labor") && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black text-[#2D2D2A] dark:text-slate-100 flex items-center gap-1.5">
                          <span>👷</span> {t("reg_role_labor_title")}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{t("reg_role_labor_desc")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discreet Village Admin Section */}
                <div className="border border-[#E8E6E1] dark:border-slate-800 rounded-2xl p-3.5 bg-[#FAF7F2]/50 dark:bg-[#151C1A] mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminField(!showAdminField)}
                    className="flex items-center justify-between w-full text-left font-black text-[#2D2D2A] dark:text-slate-200 text-xs focus:outline-none"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🔑</span> {t("reg_admin_title")}
                    </span>
                    <span className="text-slate-400">{showAdminField ? "▲" : "▼"}</span>
                  </button>
                  
                  {showAdminField && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{t("reg_admin_desc")}</p>
                      <input
                        type="password"
                        value={adminCodeInput}
                        onChange={(e) => setAdminCodeInput(e.target.value)}
                        placeholder={t("reg_admin_placeholder")}
                        className="w-full bg-white dark:bg-[#1A2320] border border-[#E8E6E1] dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#3E5C31] dark:text-slate-100"
                      />
                      {adminCodeInput.trim() && (
                        <p className="text-[10px] font-bold">
                          {adminCodeInput.trim() === "1234" || adminCodeInput.trim() === "admin123" ? (
                            <span className="text-[#3E5C31] dark:text-emerald-400">{t("reg_admin_success")}</span>
                          ) : (
                            <span className="text-rose-500">{t("reg_admin_error")}</span>
                          )}
                        </p>
                      )}
                      <p className="text-[9px] text-[#8A867E] italic">💡 Hint: Enter 1234 to test as Village Admin</p>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-4 mt-auto">
                  <button
                    type="submit"
                    className="w-full bg-[#3E5C31] hover:bg-[#344F28] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl shadow-md transition-all text-xs cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    <span>{t("reg_btn_submit")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* TOP PLATFORM BAR & ROLE SWITCHER */}
            <div id="top-branding-bar" className="bg-[#3E5C31] dark:bg-[#203119] text-white px-4 py-3 border-b border-white/10 flex flex-col space-y-2.5 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-xl overflow-hidden flex items-center justify-center shadow-xs shrink-0 p-0.5">
                <img src="/icon.svg" alt="Oor Sevai Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight leading-none text-white">{t("app_title")}</h1>
                <span className="text-[8px] uppercase tracking-wider text-white/70 font-bold">{t("app_subtitle")}</span>
              </div>
            </div>
            
            {/* Quick Multi-Language / Support Badges & Notifications */}
            <div className="flex items-center space-x-1.5">
              {/* Language Switcher Toggle */}
              <button
                type="button"
                onClick={() => {
                  const newLang = language === "en" ? "ta" : "en";
                  setLanguage(newLang);
                  localStorage.setItem("oorsevai_lang", newLang);
                }}
                className="text-[10px] bg-white/10 hover:bg-white/20 border border-white/10 text-white px-2.5 py-1 rounded-xl font-bold transition-all duration-200 cursor-pointer flex items-center space-x-1"
                title={language === "en" ? "தமிழ் மொழிக்கு மாற்றவும்" : "Switch to English"}
                id="language-toggle-btn"
              >
                <span>🌐</span>
                <span className="font-extrabold">{language === "en" ? "EN" : "தம"}</span>
              </button>

              {/* Theme Switcher Toggle */}
              <button
                type="button"
                onClick={() => {
                  const newMode = !darkMode;
                  setDarkMode(newMode);
                  localStorage.setItem("oorsevai_dark", newMode ? "true" : "false");
                }}
                className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all duration-200 focus:outline-none cursor-pointer flex items-center justify-center text-white text-sm select-none"
                title={darkMode ? "Switch to Light Theme ☀️" : "Switch to Dark Theme 🌙"}
                id="theme-toggle-btn"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              {/* Notification Bell Icon */}
              <button
                type="button"
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all duration-200 focus:outline-none cursor-pointer flex items-center justify-center"
                title="Notifications"
              >
                <Bell className="h-4 w-4 text-white" />
                {resolvedNotifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white font-black text-[8px] rounded-full flex items-center justify-center border border-[#3E5C31] shadow-xs">
                    {resolvedNotifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {/* Settings Icon Toggle */}
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all duration-200 focus:outline-none cursor-pointer flex items-center justify-center text-white"
                title="Settings"
                id="settings-toggle-btn"
              >
                <Settings className="h-4 w-4 text-white" />
              </button>
 
              <span className="text-[9px] bg-[#E9C46A] text-[#2D2D2A] px-2 py-1.2 rounded-xl font-extrabold flex items-center space-x-0.5 shadow-xs shrink-0">
                <span>{t("mvp")}</span>
              </span>
            </div>
          </div>
 
          {/* Quick Role Switcher Panel */}
          <div className="bg-black/20 p-1 rounded-xl flex justify-between items-center">
            <span className="text-[10px] text-white/80 font-bold pl-2">{t("role_label")}</span>
            <div className="flex space-x-1 flex-1 justify-end">
              {registeredRoles.length > 1 ? (
                registeredRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setUserRole(role);
                      // Reset standard tab when switching roles
                      if (role === "customer") {
                        setActiveTab("home");
                        setActiveView("home");
                      } else {
                        setActiveTab("dashboard");
                      }
                    }}
                    className={`text-[9px] font-extrabold px-2 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                      userRole === role 
                        ? "bg-white text-[#3E5C31] shadow-xs" 
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {role === "customer" ? t("role_customer") : 
                     role === "owner" ? t("role_owner") : 
                     role === "labor" ? t("role_labor") : 
                     t("role_admin")}
                  </button>
                ))
              ) : (
                <span className="text-[9px] bg-white text-[#3E5C31] font-black px-2.5 py-1 rounded-lg capitalize">
                  {userRole === "customer" ? t("role_customer") : 
                   userRole === "owner" ? t("role_owner") : 
                   userRole === "labor" ? t("role_labor") : 
                   t("role_admin")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ==================== PWA NETWORK & INSTALLATION BANNERS ==================== */}
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-amber-500 text-white text-[10px] font-black py-2 px-4 flex items-center justify-between shadow-sm border-b border-amber-600/20"
          >
            <div className="flex items-center space-x-1.5">
              <span className="text-sm animate-pulse">⚡</span>
              <span>Offline Mode • Operating from local device cache</span>
            </div>
            <span className="bg-white/20 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">Cached</span>
          </motion.div>
        )}

        {showInstallBanner && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-[#FAF7F2] text-[#2D2D2A] p-3 border-b border-[#E8E6E1] flex items-center justify-between shadow-xs relative"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-white rounded-xl overflow-hidden flex items-center justify-center shadow-xs shrink-0 p-0.5 border border-[#E8E6E1]">
                <img src="/icon.svg" alt="Oor Sevai Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <p className="text-[10px] font-black leading-tight text-[#2D2D2A] flex items-center gap-1">
                  <span>Install OorSevai App</span>
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">PWA</span>
                </p>
                <p className="text-[8px] text-[#8A867E] leading-tight mt-0.5">Launches instantly from your home screen and operates offline!</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 shrink-0 ml-2">
              <button
                onClick={handleInstallApp}
                className="bg-[#3E5C31] text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-[#3E5C31]/90 transition-colors cursor-pointer"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== NOTIFICATIONS DROPDOWN ==================== */}
        <AnimatePresence>
          {showNotificationsDropdown && (
            <NotificationCenter
              notifications={resolvedNotifications}
              onMarkAsRead={handleMarkNotificationRead}
              onMarkAllAsRead={handleMarkAllNotificationsRead}
              onClearAll={handleClearAllNotifications}
              onClose={() => setShowNotificationsDropdown(false)}
              onNotificationClick={handleNotificationClick}
            />
          )}
        </AnimatePresence>

        {/* ==================== REAL-TIME BANNER TOAST ==================== */}
        <AnimatePresence>
          {resolvedActiveBannerNotification && (
            <motion.div
              initial={{ opacity: 0, y: -80, scale: 0.9 }}
              animate={{ opacity: 1, y: 16, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => handleNotificationClick(resolvedActiveBannerNotification.bookingId)}
              className="absolute top-4 left-4 right-4 bg-[#FAF7F2] border-2 border-[#3E5C31] shadow-2xl rounded-2xl p-3.5 z-50 flex gap-3 items-start cursor-pointer hover:bg-white"
            >
              <div className="w-8 h-8 rounded-full bg-[#3E5C31] text-white flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-black text-[#2D2D2A] text-[11px] block">{resolvedActiveBannerNotification.title}</span>
                  <span className="text-[9px] bg-[#3E5C31]/10 text-[#3E5C31] font-black px-1.5 py-0.5 rounded-full">NEW</span>
                </div>
                <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">{resolvedActiveBannerNotification.message}</p>
                <span className="text-[8px] text-[#3E5C31] mt-1.5 block font-black">👉 Tap to inspect booking details</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings & Theme overlay has been simplified into the direct inline theme toggle */}



        {/* MAIN BODY AREA SCROLLABLE */}
        <div className="flex-1 overflow-y-auto pb-24 scrollbar-none">
          
          {/* ==================== CUSTOMER VIEWPORT ==================== */}
          {userRole === "customer" && (
            <>
              {activeTab === "home" && activeView === "home" && (
                <HomeView 
                  popularEquipment={filteredEquipmentList.slice(0, 4)}
                  onSelectCategory={handleSelectCategory}
                  onSelectEquipment={handleSelectEquipment}
                  onStartSearch={handleStartSearch}
                  onChangeRole={(role) => {
                    setUserRole(role);
                    setActiveTab("dashboard");
                  }}
                  onNavigate={(tab: any) => {
                    if (tab === "bookings") setActiveTab("bookings");
                    else if (tab === "messages") setActiveTab("chat");
                    else if (tab === "profile") {
                      setUserRole("owner");
                      setActiveTab("dashboard");
                    }
                  }}
                  adminLocation={adminLocation}
                  adminDistance={adminDistance}
                  language={language}
                  userName={userName}
                />
              )}

              {activeTab === "home" && activeView === "browse" && (
                <BrowseView 
                  initialCategory={browseCategory}
                  searchQuery={searchQuery}
                  allEquipment={filteredEquipmentList}
                  allLaborers={filteredLaborersList}
                  bookings={resolvedBookings}
                  onBack={() => setActiveView("home")}
                  onSelectEquipment={handleSelectEquipment}
                  onSelectLaborer={handleSelectLaborer}
                  adminLocation={adminLocation}
                  adminDistance={adminDistance}
                  language={language}
                />
              )}

              {/* Equipment Details Screen */}
              {activeView === "equipmentDetails" && selectedEquipment && (
                <div id="equipment-details" className="p-4 space-y-4">
                  <div className="flex items-center space-x-2 text-xs text-[#8A867E]">
                    <button onClick={() => setActiveView("home")} className="hover:underline flex items-center">
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Home
                    </button>
                    <span>/</span>
                    <span className="truncate">{selectedEquipment.name}</span>
                  </div>

                  <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-100 shadow-xs border border-[#E8E6E1]">
                    <img 
                      src={selectedEquipment.image} 
                      alt={selectedEquipment.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs font-bold text-[#2D2D2A] shadow-sm flex items-center space-x-1">
                      <span className="text-[#D97706]">★</span>
                      <span>{selectedEquipment.rating} ({selectedEquipment.reviewsCount} reviews)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-[#3E5C31]/10 text-[#3E5C31] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          {selectedEquipment.subCategory}
                        </span>
                        <h2 className="text-xl font-extrabold text-[#2D2D2A] mt-1.5 leading-snug">
                          {selectedEquipment.name}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-[#2D2D2A]">₹{selectedEquipment.pricePerDay}</span>
                        <p className="text-[10px] text-[#8A867E] font-bold">per day rental</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-[#8A867E]">
                      <MapPin className="h-3.5 w-3.5 text-[#3E5C31]" />
                      <span className="font-semibold">{selectedEquipment.location} ({selectedEquipment.distance} km away)</span>
                    </div>
                  </div>

                  {/* Specifications grid */}
                  <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] space-y-3 shadow-xs">
                    <h3 className="font-bold text-xs text-[#2D2D2A] uppercase tracking-wider">Specifications & Capacity</h3>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E6E1]">
                        <span className="text-[9px] text-[#8A867E] block font-semibold">Power</span>
                        <span className="text-xs font-black text-[#2D2D2A]">{selectedEquipment.specs.power || "N/A"}</span>
                      </div>
                      <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E6E1]">
                        <span className="text-[9px] text-[#8A867E] block font-semibold">Fuel Type</span>
                        <span className="text-xs font-black text-[#2D2D2A]">{selectedEquipment.specs.fuel || "N/A"}</span>
                      </div>
                      <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E6E1]">
                        <span className="text-[9px] text-[#8A867E] block font-semibold">Drive System</span>
                        <span className="text-xs font-black text-[#2D2D2A]">{selectedEquipment.specs.drive || "N/A"}</span>
                      </div>
                      <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E6E1]">
                        <span className="text-[9px] text-[#8A867E] block font-semibold">Year</span>
                        <span className="text-xs font-black text-[#2D2D2A]">{selectedEquipment.specs.year || "2020"}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-[#E8E6E1]">
                      <div className="w-2 h-2 rounded-full bg-[#3E5C31]"></div>
                      <span className="text-xs font-semibold text-[#2D2D2A]">
                        {selectedEquipment.specs.operatorIncluded 
                          ? "👨🌾 Skilled machinery operator included for free" 
                          : "⚠️ No operator included by default (Self-drive)"}
                      </span>
                    </div>
                  </div>

                  {/* About machinery */}
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-[#2D2D2A]">About this Equipment</h4>
                    <p className="text-xs text-[#8A867E] leading-relaxed">
                      {selectedEquipment.about}
                    </p>
                  </div>

                  {/* Owner profile block */}
                  <div className="bg-white p-3 rounded-2xl border border-[#E8E6E1] flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 bg-[#3E5C31]/10 rounded-full flex items-center justify-center font-bold text-[#3E5C31]">
                        {selectedEquipment.ownerName.charAt(0)}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-[#2D2D2A]">{selectedEquipment.ownerName}</h5>
                        <span className="text-[9px] text-[#3E5C31] font-black flex items-center">
                          🛡️ Verified OorSevai Partner
                        </span>
                      </div>
                    </div>
                    <button className="bg-[#F3F1ED] hover:bg-slate-200 text-[#2D2D2A] text-[10px] font-bold px-3 py-1.5 rounded-xl transition">
                      💬 Contact
                    </button>
                  </div>

                  {/* Checkout trigger button */}
                  <button 
                    onClick={() => setActiveView("selectDate")}
                    className="w-full bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Select Date & Book Rental</span>
                  </button>
                </div>
              )}

              {/* Labor Details Screen */}
              {activeView === "laborDetails" && selectedLaborer && (
                <div id="laborer-details" className="p-4 space-y-4">
                  <div className="flex items-center space-x-2 text-xs text-[#8A867E]">
                    <button onClick={() => setActiveView("home")} className="hover:underline flex items-center">
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Home
                    </button>
                    <span>/</span>
                    <span>{selectedLaborer.name}</span>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-[#E8E6E1] text-center space-y-3 shadow-xs">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-[#3E5C31] p-1">
                      <img 
                        src={selectedLaborer.image} 
                        alt={selectedLaborer.name} 
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] bg-[#3E5C31]/10 text-[#3E5C31] px-2.5 py-0.5 rounded font-black uppercase">
                        {selectedLaborer.category}
                      </span>
                      <h3 className="font-extrabold text-lg text-[#2D2D2A] mt-1">{selectedLaborer.name}</h3>
                      <div className="flex items-center justify-center space-x-1.5 text-xs text-[#8A867E] mt-1">
                        <MapPin className="h-3.5 w-3.5 text-[#3E5C31]" />
                        <span>{selectedLaborer.location} • {selectedLaborer.distance} km</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-[#E8E6E1]">
                      <div>
                        <span className="text-[10px] text-[#8A867E] block font-semibold">Experience</span>
                        <span className="text-sm font-black text-[#2D2D2A]">{selectedLaborer.experience}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8A867E] block font-semibold">Daily Wage</span>
                        <span className="text-sm font-black text-[#3E5C31]">₹{selectedLaborer.pricePerDay}/day</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-[#2D2D2A]">Services Offered</h4>
                    <ul className="text-xs text-[#8A867E] space-y-1.5 list-disc pl-4">
                      <li>Professional skill-oriented labor tasks within Coimbatore district.</li>
                      <li>Standard 8-hour workday with meal breaks provided locally.</li>
                      <li>High quality craftsmanship, punctuality, and verified safety record.</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-[#E8E6E1] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1 text-xs">
                        <span className="text-[#D97706] font-bold">★ {selectedLaborer.rating}</span>
                        <span className="text-[#8A867E]">({selectedLaborer.reviewsCount} jobs)</span>
                      </div>
                      <span className="text-[10px] text-[#3E5C31] font-bold block mt-0.5">✓ 100% On-time Completion</span>
                    </div>
                    {(() => {
                      const currentLaborer = resolvedLaborersList.find(l => l.id === selectedLaborer.id) || selectedLaborer;
                      return (
                        <div className="text-[#8A867E] text-[10px] font-bold">
                          Availability: {currentLaborer.availability === "available" ? (
                            <span className="text-emerald-600 font-black">Ready Today</span>
                          ) : (
                            <span className="text-amber-600 font-black">Busy / Unavailable</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {(() => {
                    const currentLaborer = resolvedLaborersList.find(l => l.id === selectedLaborer.id) || selectedLaborer;
                    const isAvailable = currentLaborer.availability === "available";
                    return (
                      <button 
                        onClick={() => isAvailable && handleHireLaborer(currentLaborer)}
                        disabled={!isAvailable}
                        className={`w-full font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                          isAvailable 
                            ? "bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white active:scale-98" 
                            : "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>{isAvailable ? `Hire ${selectedLaborer.name} Now` : `${selectedLaborer.name} is Busy`}</span>
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* Booking Step 1: Select Date & Configuration */}
              {activeView === "selectDate" && selectedEquipment && (
                <div id="booking-configuration" className="p-4 space-y-4">
                  <div className="flex items-center space-x-2 text-xs text-[#8A867E]">
                    <button onClick={() => setActiveView("equipmentDetails")} className="hover:underline flex items-center">
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Details
                    </button>
                    <span>/</span>
                    <span>Setup Booking</span>
                  </div>

                  <h2 className="text-lg font-black text-[#2D2D2A]">Configure Booking Details</h2>

                  {/* Date picker */}
                  <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] space-y-3 shadow-xs">
                    <div>
                      <label className="block text-xs font-bold text-[#2D2D2A] uppercase mb-1">
                        Select Start Date
                      </label>
                      <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-3 rounded-xl border border-[#E8E6E1] font-bold focus:outline-none focus:ring-1 focus:ring-[#3E5C31]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2D2D2A] uppercase mb-1">
                        Rental Duration (Days)
                      </label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 5, 7, 10].map((day) => (
                          <button
                            key={day}
                            onClick={() => setRentalDuration(day)}
                            className={`flex-1 text-xs font-bold py-2 rounded-lg border transition ${
                              rentalDuration === day 
                                ? "bg-[#3E5C31] text-white border-[#3E5C31]" 
                                : "bg-white text-[#5C5952] border-[#E8E6E1] hover:bg-[#FAF7F2]"
                            }`}
                          >
                            {day} d
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Operator Toggle Option */}
                  <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] space-y-2 shadow-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-xs text-[#2D2D2A] uppercase">Skilled Driver Operator</h4>
                        <p className="text-[10px] text-[#8A867E]">Highly experienced operator to execute the field work</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={operatorOption}
                        onChange={(e) => setOperatorOption(e.target.checked)}
                        className="w-4 h-4 text-[#3E5C31] focus:ring-[#3E5C31] border-gray-350 rounded"
                      />
                    </div>
                    {operatorOption && (
                      <p className="text-[10px] text-[#3E5C31] font-bold bg-[#3E5C31]/5 p-2 rounded">
                        ✓ Operator wage included in checkout (+₹600 per day operator allowance)
                      </p>
                    )}
                  </div>

                  {/* Delivery Method */}
                  <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] space-y-3 shadow-xs">
                    <h4 className="font-extrabold text-xs text-[#2D2D2A] uppercase">Logistics & Transportation</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("delivery")}
                        className={`text-xs font-bold p-3 rounded-xl border transition flex flex-col items-center gap-1 ${
                          deliveryMethod === "delivery"
                            ? "bg-[#3E5C31]/10 text-[#3E5C31] border-[#3E5C31]"
                            : "bg-white text-slate-600 border-[#E8E6E1] hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-base">🚚</span>
                        <span>Equipment Delivery</span>
                        <span className="text-[9px] text-[#3E5C31] font-bold">
                          {deliveryMethod === "delivery" ? `₹${deliveryFee} (Geofenced)` : "Dynamic Rate"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("pickup")}
                        className={`text-xs font-bold p-3 rounded-xl border transition flex flex-col items-center gap-1 ${
                          deliveryMethod === "pickup"
                            ? "bg-[#3E5C31]/10 text-[#3E5C31] border-[#3E5C31]"
                            : "bg-white text-slate-600 border-[#E8E6E1] hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-base">📍</span>
                        <span>Self Pickup</span>
                        <span className="text-[9px] text-[#8A867E] font-medium">No charge</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">
                        Selected Delivery/Pickup Destination
                      </label>
                      <input 
                        type="text"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2.5 rounded-lg border border-[#E8E6E1] text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#3E5C31]"
                        placeholder="Enter village, block or select on the map"
                      />
                    </div>

                    {deliveryMethod === "delivery" && (
                      <div className="space-y-3.5 pt-2 border-t border-[#E8E6E1]">
                        {/* Quick agricultural hub shortcuts */}
                        <div>
                          <label className="block text-[8px] font-extrabold text-[#8A867E] uppercase mb-1.5 tracking-wider">
                            ⚡ Quick Select Regional Farming Hubs
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {["Coimbatore Central", "RS Puram", "Peelamedu", "Sulur", "Thudiyalur", "Pollachi", "Mettupalayam"].map((loc) => (
                              <button
                                key={loc}
                                type="button"
                                onClick={() => {
                                  setCustomLocation(loc);
                                }}
                                className={`text-[9px] px-2.5 py-1.5 rounded-lg border font-bold transition cursor-pointer ${
                                  customLocation === loc
                                    ? "bg-[#3E5C31] text-white border-[#3E5C31] shadow-xs"
                                    : "bg-[#FAF7F2] text-[#5C5952] border-[#E8E6E1] hover:bg-slate-100"
                                }`}
                              >
                                {loc}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Visual Geofence map */}
                        <GeofenceMap
                          mode="customer"
                          equipment={selectedEquipment}
                          customerLocationName={customLocation}
                          onCustomerLocationChange={(locName, fee) => {
                            setCustomLocation(locName);
                            setDeliveryFee(fee);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Pricing summary before payment */}
                  <button
                    onClick={() => setActiveView("bookingSummary")}
                    className="w-full bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition flex items-center justify-center space-x-1"
                  >
                    <span>Proceed to Booking Summary</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Booking Step 2: Checkout Summary & Pay */}
              {activeView === "bookingSummary" && selectedEquipment && (
                <div id="booking-summary-checkout" className="p-4 space-y-4">
                  <div className="flex items-center space-x-2 text-xs text-[#8A867E]">
                    <button onClick={() => setActiveView("selectDate")} className="hover:underline flex items-center">
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                    </button>
                    <span>/</span>
                    <span>Checkout Summary</span>
                  </div>

                  <h2 className="text-lg font-black text-[#2D2D2A]">Booking Invoice Summary</h2>

                  <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] space-y-3.5 shadow-xs">
                    <div className="flex items-center space-x-3 pb-3 border-b border-[#E8E6E1]">
                      <div className="w-12 h-12 bg-[#FAF7F2] rounded-xl overflow-hidden shrink-0">
                        <img src={selectedEquipment.image} alt={selectedEquipment.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-[#2D2D2A]">{selectedEquipment.name}</h4>
                        <p className="text-[10px] text-[#8A867E]">₹{selectedEquipment.pricePerDay}/day • Owner: {selectedEquipment.ownerName}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#8A867E]">Booking Date:</span>
                        <span className="font-bold text-[#2D2D2A]">{selectedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8A867E]">Rental Duration:</span>
                        <span className="font-bold text-[#2D2D2A]">{rentalDuration} Day(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8A867E]">Logistics:</span>
                        <span className="font-bold text-[#2D2D2A] capitalize">{deliveryMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8A867E]">Operator:</span>
                        <span className="font-bold text-[#2D2D2A]">{operatorOption ? "Included" : "Excluded"}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-dashed border-[#E8E6E1] space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#8A867E]">Base Rental Price:</span>
                        <span className="font-bold text-[#2D2D2A]">₹{selectedEquipment.pricePerDay * rentalDuration}</span>
                      </div>
                      {operatorOption && (
                        <div className="flex justify-between">
                          <span className="text-[#8A867E]">Operator Fee (₹600/d):</span>
                          <span className="font-bold text-[#2D2D2A]">₹{600 * rentalDuration}</span>
                        </div>
                      )}
                      {deliveryMethod === "delivery" && (
                        <div className="flex justify-between">
                          <span className="text-[#8A867E]">Transport & Logistics (Geofenced):</span>
                          <span className="font-bold text-[#2D2D2A]">₹{deliveryFee}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[#8A867E]">Platform Service Fee (10%):</span>
                        <span className="font-bold text-[#2D2D2A]">
                          ₹{Math.round(((selectedEquipment.pricePerDay * rentalDuration) + (operatorOption ? 600 * rentalDuration : 0) + (deliveryMethod === "delivery" ? deliveryFee : 0)) * 0.1)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm font-black text-[#2D2D2A] pt-2 border-t border-[#E8E6E1]">
                        <span>Total Amount:</span>
                        <span className="text-[#3E5C31]">
                          ₹{
                            (selectedEquipment.pricePerDay * rentalDuration) + 
                            (operatorOption ? 600 * rentalDuration : 0) + 
                            (deliveryMethod === "delivery" ? deliveryFee : 0) + 
                            Math.round(((selectedEquipment.pricePerDay * rentalDuration) + (operatorOption ? 600 * rentalDuration : 0) + (deliveryMethod === "delivery" ? deliveryFee : 0)) * 0.1)
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] space-y-2 shadow-xs">
                    <label className="block text-[10px] font-bold text-[#2D2D2A] uppercase mb-1">Payment Method</label>
                    <select className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2.5 rounded-xl border border-[#E8E6E1] text-xs font-bold focus:outline-none">
                      <option>UPI / PhonePe / GPay (India's standard payment)</option>
                      <option>Credit Card / Debit Card (Visa/Mastercard)</option>
                      <option>Net Banking (SBI, HDFC, ICICI)</option>
                      <option>Cash on Delivery (COD) / Pay on Arrival</option>
                    </select>
                  </div>

                  <button
                    onClick={handleConfirmBooking}
                    className="w-full bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white font-black text-sm py-3.5 rounded-2xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Confirm & Pay Securely</span>
                  </button>
                </div>
              )}

              {/* BOOKINGS SCREEN */}
              {activeTab === "bookings" && (
                <div id="my-bookings-section" className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-black text-[#2D2D2A]">My Rental Bookings</h2>
                    <span className="text-xs bg-[#3E5C31]/10 text-[#3E5C31] px-2.5 py-0.5 rounded-full font-bold">
                      {resolvedBookings.length} Total
                    </span>
                  </div>

                  {/* Horizontal Segment tabs */}
                  <div className="flex bg-[#F3F1ED] p-1 rounded-xl">
                    {(["upcoming", "ongoing", "completed", "cancelled"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setBookingTab(tab)}
                        className={`flex-1 text-[10px] font-extrabold py-2 rounded-lg capitalize transition ${
                          bookingTab === tab 
                            ? "bg-white text-[#2D2D2A] shadow-xs" 
                            : "text-[#8A867E] hover:text-[#2D2D2A]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Bookings List */}
                  <div className="space-y-3">
                    {filteredBookings.length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-[#E8E6E1] text-center space-y-2">
                        <span className="text-3xl">📅</span>
                        <h4 className="font-bold text-xs text-[#2D2D2A]">No {bookingTab} bookings found</h4>
                        <p className="text-[10px] text-[#8A867E]">Rent machinery or hire laborers to see your active schedules.</p>
                      </div>
                    ) : (
                      filteredBookings.map((b) => (
                        <div key={b.id} className="bg-white p-3.5 rounded-2xl border border-[#E8E6E1] shadow-xs space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-bold text-[#8A867E]">Booking ID: {b.id}</span>
                              <h3 className="font-black text-xs text-[#2D2D2A] mt-0.5">{b.itemName}</h3>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                              b.status === 'upcoming' ? 'bg-amber-100 text-amber-800' :
                              b.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                              b.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {b.status}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E6E1] text-xs">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                              <img src={b.itemImage} alt={b.itemName} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-[10px] space-y-0.5">
                              <p className="text-[#2D2D2A] font-bold">📍 {b.location}</p>
                              <p className="text-[#8A867E]">Dates: {b.startDate} to {b.endDate} ({b.durationDays} day)</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1">
                            <span className="text-xs font-black text-[#2D2D2A]">Paid: <span className="text-[#3E5C31]">₹{b.totalAmount}</span></span>
                            
                            <div className="flex space-x-1">
                              {b.status === "completed" && (
                                <button 
                                  onClick={() => {
                                    alert("Review submitted successfully! Thank you for the feedback.");
                                  }}
                                  className="bg-[#3E5C31] text-white text-[9px] font-extrabold px-3 py-1.5 rounded-lg hover:bg-[#3E5C31]/95"
                                >
                                  ⭐ Review
                                </button>
                              )}
                              
                              {b.status !== "cancelled" && (
                                <button
                                  onClick={() => {
                                    const reason = prompt("Enter your reason for dispute/complaint:");
                                    if (reason) {
                                      const newDis: Dispute = {
                                        id: `DSP-${Math.floor(100 + Math.random() * 900)}`,
                                        bookingId: b.id,
                                        itemName: b.itemName,
                                        complainant: "Udaya Kumar (Customer)",
                                        reason: reason,
                                        status: "open",
                                        date: new Date().toISOString().split('T')[0]
                                      };

                                      // Save to serverless PostgreSQL database
                                      fetch("/api/disputes", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(newDis)
                                      }).catch(err => console.error("Failed to save dispute to DB:", err));

                                      setDisputes(prev => [...prev, newDis]);
                                      alert("Dispute lodged successfully. Our admin team will investigate and contact you within 24 hours.");
                                    }
                                  }}
                                  className="bg-rose-50 text-rose-700 text-[9px] font-extrabold px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100"
                                >
                                  🚨 Dispute
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* AI CHATBOT TAB */}
              {activeTab === "chat" && (
                <div id="ai-chat-section" className="p-4 flex flex-col h-[calc(100vh-160px)] max-h-[640px]">
                  <div className="flex items-center space-x-2 border-b border-[#E8E6E1] pb-3 shrink-0">
                    <div className="w-9 h-9 bg-[#3E5C31] text-white rounded-full flex items-center justify-center font-bold">
                      🌾
                    </div>
                    <div>
                      <h2 className="font-extrabold text-sm text-[#2D2D2A] flex items-center">
                        AI Farming & Rental Advisor
                        <span className="ml-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      </h2>
                      <p className="text-[10px] text-[#8A867E]">Ask weather suggestions, price predictions, machinery guide</p>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 scrollbar-thin">
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <div className={`p-3 rounded-2xl text-xs ${
                          msg.sender === "user" 
                            ? "bg-[#3E5C31] text-white rounded-tr-none" 
                            : "bg-[#FAF7F2] text-[#2D2D2A] border border-[#E8E6E1] rounded-tl-none"
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-[#8A867E] mt-1 font-semibold pl-1 pr-1">{msg.timestamp}</span>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="mr-auto items-start max-w-[85%] space-y-1">
                        <div className="bg-[#FAF7F2] text-[#2D2D2A] border border-[#E8E6E1] p-3 rounded-2xl rounded-tl-none flex items-center space-x-2 text-xs">
                          <Loader2 className="h-4 w-4 animate-spin text-[#3E5C31]" />
                          <span>Thinking about farming calendar...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick agricultural prompt suggestions */}
                  <div className="flex space-x-1.5 overflow-x-auto pb-2 scrollbar-none shrink-0">
                    {[
                      "Recommend tools for 1.5 acre paddy field?",
                      "Will it rain tomorrow in Coimbatore?",
                      "Predict daily rent of a 55HP Tractor",
                      "How to repair power weeder start recoil?"
                    ].map((promptText, idx) => (
                      <button
                        key={idx}
                        onClick={() => setChatInput(promptText)}
                        className="text-[9px] font-bold px-2.5 py-1.5 bg-white border border-[#E8E6E1] rounded-xl hover:bg-[#FAF7F2] shrink-0 text-slate-700"
                      >
                        💡 {promptText}
                      </button>
                    ))}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendChatMessage} className="flex items-center space-x-2 border-t border-[#E8E6E1] pt-3 shrink-0">
                    <input
                      type="text"
                      placeholder="Ask OorSevai AI Advisor anything..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-[#FAF7F2] text-[#2D2D2A] text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E6E1] focus:outline-none focus:ring-1 focus:ring-[#3E5C31] focus:bg-white"
                    />
                    <button 
                      type="submit"
                      className="bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white p-2.5 rounded-xl transition cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}


          {/* ==================== OWNER DASHBOARD VIEWPORT ==================== */}
          {userRole === "owner" && activeTab === "dashboard" && (
            <div id="owner-dashboard" className="p-4 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] bg-[#3E5C31]/10 text-[#3E5C31] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Owner Hub
                  </span>
                  <h2 className="text-lg font-black text-[#2D2D2A] mt-1.5">Welcome back, {userName || "Ravi Kumar"}</h2>
                </div>
                <div className="w-10 h-10 rounded-full border border-[#3E5C31] p-0.5">
                  <div className="w-full h-full bg-[#3E5C31]/10 rounded-full flex items-center justify-center font-bold text-[#3E5C31]">
                    {userName ? userName.charAt(0).toUpperCase() : "R"}
                  </div>
                </div>
              </div>

              {/* Earnings & Utilization Overview widgets */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#8A867E] uppercase">Total Earnings</span>
                  <h3 className="text-xl font-black text-[#3E5C31]">₹{ownerTotalEarnings.toLocaleString()}</h3>
                  <p className="text-[8px] text-[#8A867E] font-medium">After platform commission (10%)</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#8A867E] uppercase">My Equipment</span>
                  <h3 className="text-xl font-black text-[#2D2D2A]">{ownerEquipment.length} Listed</h3>
                  <p className="text-[8px] text-emerald-600 font-bold">● {ownerEquipment.filter(e => e.status === "active").length} active now</p>
                </div>
              </div>

              {/* Manage Customer Rent Requests & Deliveries */}
              <div className="bg-white p-4 rounded-3xl border border-[#E8E6E1] shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#E8E6E1]">
                  <h3 className="font-extrabold text-xs text-[#2D2D2A] uppercase tracking-wider">
                    Rent Bookings & Dispatches ({resolvedBookings.filter(b => b.type === "equipment").length})
                  </h3>
                  <span className="bg-[#3E5C31]/10 text-[#3E5C31] text-[8px] font-black uppercase px-2 py-0.5 rounded truncate max-w-[120px]" title={userLocation}>
                    {userLocation.split(",")[0]} Hub
                  </span>
                </div>

                <div className="space-y-3">
                  {resolvedBookings.filter(b => b.type === "equipment").map((b) => {
                    const equipment = resolvedEquipmentList.find(e => e.id === b.itemId);
                    const isDispatched = notifications.some(n => n.bookingId === b.id && n.type === "equipment_on_the_way");
                    
                    return (
                      <div key={b.id} className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E6E1] space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400">Order #{b.id}</span>
                            <h4 className="font-black text-xs text-[#2D2D2A]">{b.itemName}</h4>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                            b.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "ongoing"
                              ? "bg-blue-100 text-blue-800 animate-pulse"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {b.status === "completed" ? "🏁 Completed" : b.status === "ongoing" ? "⚙️ In Use / Ongoing" : "📅 Upcoming"}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#8A867E] space-y-0.5">
                          <p>👤 <strong>Customer:</strong> {b.customerName}</p>
                          <p>📍 <strong>Deliver To:</strong> {b.location}</p>
                          <p>📅 <strong>Rental Period:</strong> {b.startDate} to {b.endDate}</p>
                        </div>

                        <div className="flex justify-between items-center pt-2.5 border-t border-[#E8E6E1]/50">
                          <span className="font-extrabold text-[#3E5C31] text-[11px]">Payout: ₹{Math.round(b.totalAmount * 0.9)}</span>
                          
                          {b.status === "upcoming" && (
                            <button
                              type="button"
                              onClick={() => {
                                // Transition booking status to 'ongoing'
                                fetch(`/api/bookings/${b.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "ongoing" })
                                }).catch(err => console.error("Failed to update booking status:", err));

                                setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: "ongoing" } : x));
                                // Push notification
                                triggerNotification(
                                  b.id,
                                  "🚚 Equipment On The Way",
                                  `Ravi Kumar's ${b.itemName} has been dispatched and is on the way to your site at ${b.location}! Track delivery fees: ₹${b.deliveryMethod === 'delivery' ? deliveryFee : 0}.`,
                                  "equipment_on_the_way"
                                );
                              }}
                              className="bg-[#3E5C31] text-white border-[#3E5C31] hover:bg-[#3E5C31]/95 text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Truck className="h-3 w-3" />
                              Dispatch: On The Way 🚚
                            </button>
                          )}

                          {b.status === "ongoing" && (
                            <button
                              type="button"
                              onClick={() => {
                                // Transition booking status to 'completed'
                                fetch(`/api/bookings/${b.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "completed" })
                                }).catch(err => console.error("Failed to update booking status:", err));

                                setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: "completed" } : x));
                                // Push notification
                                triggerNotification(
                                  b.id,
                                  "🏁 Rental Completed",
                                  `Ravi Kumar's ${b.itemName} has been successfully returned and marked completed. Please log operating hours.`,
                                  "general"
                                );
                              }}
                              className="bg-amber-600 text-white border-amber-600 hover:bg-amber-700 text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-xs animate-pulse"
                            >
                              🏁 Complete Rental & Return
                            </button>
                          )}

                          {b.status === "completed" && (
                            <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                              ✅ Processed
                            </span>
                          )}
                        </div>

                        {/* Maintenance Hours Logging for completed bookings */}
                        {b.status === "completed" && (
                          <div className="mt-2.5 pt-2.5 border-t border-dashed border-[#E8E6E1] bg-amber-50/40 p-2 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-extrabold text-amber-800">⏱️ LOG OPERATING HOURS</span>
                              {equipment && (
                                <span className="text-[9px] font-bold text-slate-500">
                                  Current: {equipment.usageHours || 0} hrs
                                </span>
                              )}
                            </div>
                            
                            {b.loggedHours !== undefined ? (
                              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-lg text-[10px] font-bold flex justify-between items-center">
                                <span>Logged: +{b.loggedHours} hrs for this booking</span>
                                <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase font-black">Success</span>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  placeholder="e.g. 10 hours"
                                  value={bookingHoursInput[b.id] || ""}
                                  onChange={(e) => setBookingHoursInput(prev => ({ ...prev, [b.id]: e.target.value }))}
                                  className="bg-white border border-[#E8E6E1] text-[#2D2D2A] text-xs px-2.5 py-1.5 rounded-lg flex-1 font-extrabold text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const hrs = parseFloat(bookingHoursInput[b.id]);
                                    if (isNaN(hrs) || hrs <= 0) {
                                      alert("Please enter a valid positive operating hours value");
                                      return;
                                    }
                                    handleLogEquipmentHours(b.itemId, hrs, b.id);
                                    // Clear input
                                    setBookingHoursInput(prev => {
                                      const copy = { ...prev };
                                      delete copy[b.id];
                                      return copy;
                                    });
                                  }}
                                  className="bg-[#3E5C31] text-white hover:bg-[#3E5C31]/95 text-[10px] font-black px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                >
                                  Log Hours
                                </button>
                              </div>
                            )}

                            {equipment && (
                              <div className="flex justify-between items-center text-[9px] text-[#8A867E]">
                                <span>Next service due: {(equipment.lastServiceHours || 0) + (equipment.serviceDueIntervalHours || 50)} hrs</span>
                                <span className={`font-black ${equipment.serviceDue ? "text-rose-600" : "text-emerald-600"}`}>
                                  {equipment.serviceDue ? "⚠️ SERVICE DUE NOW!" : "🟢 Running Healthy"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Rental Price Predictor Widget */}
              <div className="bg-[#FAF7F2] border border-[#E8E6E1] rounded-2xl p-4 space-y-3 relative overflow-hidden">
                <div className="absolute right-3 top-3 text-[#E9C46A] font-bold text-xs flex items-center space-x-1 bg-[#3E5C31] text-white px-2 py-0.5 rounded-lg">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-black uppercase">Gemini AI</span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-[#2D2D2A]">AI Smart Price Predictor</h3>
                  <p className="text-[10px] text-[#8A867E]">Calculate perfect rental price based on model age, condition & local market demand.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[8px] font-bold text-[#8A867E] uppercase mb-0.5">Category</label>
                    <select 
                      value={predictCategory} 
                      onChange={(e) => setPredictCategory(e.target.value)}
                      className="w-full bg-white text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1] font-semibold"
                    >
                      <option>Tractor</option>
                      <option>Excavator (JCB)</option>
                      <option>Power Tiller</option>
                      <option>Generator</option>
                      <option>Concrete mixer</option>
                      <option>Drone spraying</option>
                      <option>General Drill</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-[#8A867E] uppercase mb-0.5">Year of Manufacture</label>
                    <input 
                      type="number" 
                      value={predictYear}
                      onChange={(e) => setPredictYear(e.target.value)}
                      className="w-full bg-white text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-[#8A867E] uppercase mb-0.5">Condition</label>
                    <select 
                      value={predictCondition}
                      onChange={(e) => setPredictCondition(e.target.value)}
                      className="w-full bg-white text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1] font-semibold"
                    >
                      <option>Excellent</option>
                      <option>Very Good</option>
                      <option>Good / Average</option>
                      <option>Fair</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-[#8A867E] uppercase mb-0.5">Location</label>
                    <input 
                      type="text" 
                      value={predictLocation}
                      onChange={(e) => setPredictLocation(e.target.value)}
                      className="w-full bg-white text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1] font-semibold"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePredictPrice}
                  disabled={isPredicting}
                  className="w-full bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center space-x-1 cursor-pointer"
                >
                  {isPredicting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Analysing Indian Market Rates...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-3 w-3" />
                      <span>Generate AI Pricing Recommendation</span>
                    </>
                  )}
                </button>

                {predictionResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-3 rounded-xl border border-[#E8E6E1] text-xs space-y-1.5 shadow-sm"
                  >
                    <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-[#E8E6E1]">
                      <span className="font-extrabold text-[#3E5C31] text-sm">Suggested: ₹{predictionResult.predictedPrice}/day</span>
                      <span className="bg-[#D97706]/10 text-[#D97706] text-[8px] font-black px-1.5 rounded uppercase">
                        Demand: {predictionResult.marketDemand}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#2D2D2A] leading-relaxed">
                      <strong>Market Analysis:</strong> {predictionResult.reasoning}
                    </p>
                    <p className="text-[10px] text-[#3E5C31] bg-[#3E5C31]/5 p-1.5 rounded font-bold">
                      💡 {predictionResult.seasonalTips}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Register/Add New Equipment Form */}
              <div className="bg-white rounded-3xl p-4 border border-[#E8E6E1] shadow-xs space-y-4">
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-[#3E5C31]" />
                  <h3 className="font-black text-sm text-[#2D2D2A]">Add New Equipment for Hiring</h3>
                </div>

                <form onSubmit={handleAddEquipment} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Equipment Name</label>
                      <input 
                        type="text" 
                        required
                        value={newEqName}
                        onChange={(e) => setNewEqName(e.target.value)}
                        placeholder="e.g., John Deere 5050 D"
                        className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Category</label>
                      <select 
                        value={newEqCategory}
                        onChange={(e: any) => setNewEqCategory(e.target.value)}
                        className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                      >
                        <option value="agriculture">Agriculture</option>
                        <option value="construction">Construction</option>
                        <option value="tools">General Tools</option>
                        <option value="function">Event Function</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Sub-Category Type</label>
                      <input 
                        type="text" 
                        required
                        value={newEqSubCategory}
                        onChange={(e) => setNewEqSubCategory(e.target.value)}
                        placeholder="e.g., Tractor, Welder, Drills"
                        className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Rental Price (₹/day)</label>
                      <input 
                        type="number" 
                        required
                        value={newEqPrice}
                        onChange={(e) => setNewEqPrice(e.target.value)}
                        placeholder="e.g., 1800"
                        className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Image URL (Optional)</label>
                    <input 
                      type="url" 
                      value={newEqImage}
                      onChange={(e) => setNewEqImage(e.target.value)}
                      placeholder="Paste Unsplash or web image URL"
                      className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Specifications (Power, Fuel, Drive)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <input 
                        type="text" 
                        value={newEqPower}
                        onChange={(e) => setNewEqPower(e.target.value)}
                        placeholder="50 HP / 1500W" 
                        className="bg-[#FAF7F2] p-1.5 rounded text-center border border-[#E8E6E1]" 
                      />
                      <input 
                        type="text" 
                        value={newEqFuel}
                        onChange={(e) => setNewEqFuel(e.target.value)}
                        placeholder="Diesel / Petrol" 
                        className="bg-[#FAF7F2] p-1.5 rounded text-center border border-[#E8E6E1]" 
                      />
                      <input 
                        type="text" 
                        value={newEqDrive}
                        onChange={(e) => setNewEqDrive(e.target.value)}
                        placeholder="4 WD / Manual" 
                        className="bg-[#FAF7F2] p-1.5 rounded text-center border border-[#E8E6E1]" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">About Machinery</label>
                    <textarea 
                      value={newEqAbout}
                      onChange={(e) => setNewEqAbout(e.target.value)}
                      placeholder="Condition, attachments, transport instructions..."
                      rows={2}
                      className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="newEqOperator" 
                      checked={newEqOperator}
                      onChange={(e) => setNewEqOperator(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3E5C31] focus:ring-[#3E5C31]"
                    />
                    <label htmlFor="newEqOperator" className="text-[10px] font-bold text-[#2D2D2A]">Include expert driver/operator in listing</label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white font-black py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    List My Equipment Now
                  </button>
                </form>
              </div>

              {/* My Listed Equipment Inventory Status */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-[#2D2D2A]">My Machinery Inventory ({ownerEquipment.length})</h3>
                <div className="space-y-2.5">
                  {ownerEquipment.map((eq) => (
                    <div key={eq.id} className="bg-white p-3.5 rounded-2xl border border-[#E8E6E1] space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-12 h-12 bg-[#FAF7F2] rounded-xl overflow-hidden shrink-0">
                            <img src={eq.image} alt={eq.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-xs text-[#2D2D2A] truncate">{eq.name}</h4>
                            <span className="text-[10px] text-[#3E5C31] font-bold block">₹{eq.pricePerDay}/day</span>
                            <span className="text-[8px] text-[#8A867E] font-medium block">📍 {eq.location}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(eq.id)}
                            className={`text-[9px] font-black px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                              eq.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            }`}
                          >
                            {eq.status === "active" ? "Active (Listed)" : "Inactive"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingGeofenceId(editingGeofenceId === eq.id ? null : eq.id)}
                            className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                              editingGeofenceId === eq.id
                                ? "bg-[#3E5C31] text-white border-[#3E5C31] shadow-xs"
                                : "bg-white text-slate-700 border-[#E8E6E1] hover:bg-slate-50"
                            }`}
                          >
                            🚚 Geofence {eq.deliveryZones && eq.deliveryZones.length > 0 ? `(${eq.deliveryZones.length})` : "(3)"}
                          </button>
                        </div>
                      </div>

                      {/* Maintenance Health Status Dashboard */}
                      <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E6E1] space-y-2.5 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-[#5C5952] uppercase tracking-wider text-[9px] flex items-center gap-1">
                            🔧 Maintenance & Health
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                            eq.serviceDue
                              ? "bg-rose-100 text-rose-800 animate-pulse"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {eq.serviceDue ? "⚠️ Service Due Now" : "🟢 Healthy"}
                          </span>
                        </div>

                        {/* Progress bar towards next service */}
                        {(() => {
                          const usage = eq.usageHours || 0;
                          const lastService = eq.lastServiceHours || 0;
                          const interval = eq.serviceDueIntervalHours || 50;
                          const nextServiceAt = lastService + interval;
                          const hoursSinceService = Math.max(0, usage - lastService);
                          const pct = Math.min(100, Math.round((hoursSinceService / interval) * 100));

                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-[#8A867E]">
                                <span>{usage} hrs total</span>
                                <span>Next service at {nextServiceAt} hrs</span>
                              </div>
                              <div className="w-full bg-[#E8E6E1] h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    eq.serviceDue ? "bg-rose-500" : pct > 80 ? "bg-amber-500" : "bg-[#3E5C31]"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between items-center text-[9px] pt-1">
                                <span className="text-[#8A867E]">
                                  {hoursSinceService} / {interval} hrs since last service ({pct}%)
                                </span>
                                {eq.serviceDue && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handlePerformEquipmentService(eq.id);
                                      alert(`Service completed for ${eq.name}! Last service meter reset to ${usage} hours.`);
                                    }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                  >
                                    ⚙️ Mark Serviced (Reset)
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Manual Add Hours panel */}
                        <div className="border-t border-[#E8E6E1] pt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-[#8A867E]">Log Custom Hours:</span>
                          <div className="flex items-center space-x-1.5 flex-1 max-w-[150px]">
                            <input
                              type="number"
                              placeholder="e.g. 5"
                              value={equipmentHoursInput[eq.id] || ""}
                              onChange={(e) => setEquipmentHoursInput(prev => ({ ...prev, [eq.id]: e.target.value }))}
                              className="bg-white border border-[#E8E6E1] text-[#2D2D2A] text-[10px] p-1.5 rounded-lg flex-1 font-bold text-center w-full focus:outline-none focus:ring-1 focus:ring-[#3E5C31]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const hrs = parseFloat(equipmentHoursInput[eq.id]);
                                if (isNaN(hrs) || hrs <= 0) {
                                  alert("Please enter a valid positive hours value");
                                  return;
                                }
                                handleLogEquipmentHours(eq.id, hrs);
                                // Clear input
                                setEquipmentHoursInput(prev => {
                                  const copy = { ...prev };
                                  delete copy[eq.id];
                                  return copy;
                                });
                                alert(`Successfully logged ${hrs} operating hours to ${eq.name}!`);
                              }}
                              className="bg-[#3E5C31] text-white hover:bg-[#3E5C31]/95 text-[9px] font-black px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                            >
                              + Log
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Geo-fencing Editor Map Component */}
                      {editingGeofenceId === eq.id && (
                        <div className="pt-3 border-t border-[#E8E6E1]">
                          <GeofenceMap
                            mode="owner"
                            equipment={eq}
                            onUpdateZones={(updatedZones) => {
                              setEquipmentList((prev) => prev.map((item) => {
                                if (item.id === eq.id) {
                                  return { ...item, deliveryZones: updatedZones };
                                }
                                return item;
                              }));
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Owner Success Dialog Modal */}
              {showEqSuccessModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white p-6 rounded-3xl text-center space-y-4 max-w-xs border border-[#E8E6E1]">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-[#2D2D2A]">Equipment Submitted!</h3>
                      <p className="text-[10px] text-[#8A867E] mt-1 leading-relaxed">
                        Your equipment has been submitted to Admin for verification. It will be live on Coimbatore search map in under 2 hours.
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowEqSuccessModal(false)}
                      className="w-full bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white text-xs font-black py-2 rounded-xl"
                    >
                      Okay, Great
                    </button>
                  </div>
                </div>
              )}


            </div>
          )}


          {/* ==================== LABOR VIEWPORT ==================== */}
          {userRole === "labor" && activeTab === "dashboard" && (
            <div id="laborer-dashboard" className="p-4 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] bg-[#3E5C31]/10 text-[#3E5C31] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Labor Hub
                  </span>
                  <h2 className="text-lg font-black text-[#2D2D2A] mt-1.5">Welcome, {userName || "Raju Krishnan"}</h2>
                </div>
                <div className="w-10 h-10 rounded-full border border-[#3E5C31] p-0.5">
                  <div className="w-full h-full bg-[#3E5C31]/10 rounded-full flex items-center justify-center font-bold text-[#3E5C31]">
                    {userName ? userName.charAt(0).toUpperCase() : "R"}
                  </div>
                </div>
              </div>

              {/* Status and Active Jobs widgets */}
              <div className="bg-white p-4 rounded-3xl border border-[#E8E6E1] shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#2D2D2A]">My Availability</h3>
                    <p className="text-[10px] text-[#8A867E]">Toggle to start receiving hyperlocal job bookings.</p>
                  </div>
                  {(() => {
                    const raju = resolvedLaborersList.find(l => l.id === "lb-4" || l.name === "Raju Krishnan");
                    const isAvailable = raju ? raju.availability === "available" : true;
                    return isAvailable ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-1 rounded-md">
                        ● Available
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-1 rounded-md">
                        ● Busy
                      </span>
                    );
                  })()}
                </div>

                <div className="flex space-x-2">
                  {(() => {
                    const raju = resolvedLaborersList.find(l => l.id === "lb-4" || l.name === "Raju Krishnan");
                    const isAvailable = raju ? raju.availability === "available" : true;
                    return (
                      <>
                        <button 
                          onClick={() => {
                            setLaborersList(prev => prev.map(l => {
                              if (l.id === "lb-4" || l.name === "Raju Krishnan") {
                                return { ...l, availability: "available" };
                              }
                              return l;
                            }));
                          }}
                          className={`flex-1 text-xs font-black py-2.5 rounded-xl border transition-all cursor-pointer ${
                            isAvailable 
                              ? "bg-[#3E5C31] text-white border-[#3E5C31] shadow-sm" 
                              : "bg-[#FAF7F2] text-slate-500 border-[#E8E6E1] hover:bg-slate-100"
                          }`}
                        >
                          Set Available
                        </button>
                        <button 
                          onClick={() => {
                            setLaborersList(prev => prev.map(l => {
                              if (l.id === "lb-4" || l.name === "Raju Krishnan") {
                                return { ...l, availability: "unavailable" };
                              }
                              return l;
                            }));
                          }}
                          className={`flex-1 text-xs font-black py-2.5 rounded-xl border transition-all cursor-pointer ${
                            !isAvailable 
                              ? "bg-[#D97706] text-white border-[#D97706] shadow-sm" 
                              : "bg-[#FAF7F2] text-slate-500 border-[#E8E6E1] hover:bg-slate-100"
                          }`}
                        >
                          Set Busy
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* My Booked Shifts & Shifts About to Start */}
              <div className="bg-white p-4 rounded-3xl border border-[#E8E6E1] shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#E8E6E1]">
                  <h3 className="font-extrabold text-xs text-[#2D2D2A] uppercase tracking-wider">
                    My Received Shift Bookings ({resolvedBookings.filter(b => b.type === "labor").length})
                  </h3>
                  <span className="bg-[#3E5C31]/10 text-[#3E5C31] text-[8px] font-black uppercase px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>

                {resolvedBookings.filter(b => b.type === "labor").length === 0 ? (
                  <div className="py-4 text-center space-y-1 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E8E6E1]">
                    <span className="text-xl">📅</span>
                    <p className="text-[11px] font-extrabold text-[#2D2D2A]">No shift bookings yet</p>
                    <p className="text-[9px] text-[#8A867E] px-4 leading-relaxed">
                    To test this, switch to <strong>Customer</strong> role, click <strong>Browse</strong>, select <strong>Labor</strong> tab, and click <strong>Hire Now</strong> on {userName || "Raju Krishnan"}!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resolvedBookings.filter(b => b.type === "labor").map((b) => {
                    const isNotified = notifications.some(n => n.bookingId === b.id && n.type === "labor_shift_start");
                    
                    return (
                      <div key={b.id} className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E6E1] space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400">Shift #{b.id}</span>
                            <h4 className="font-black text-xs text-[#2D2D2A]">{b.itemName}</h4>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                            isNotified ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {isNotified ? "⏰ Shift Alerted" : b.status}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#8A867E] space-y-0.5">
                          <p>👤 <strong>Employer:</strong> {b.customerName}</p>
                          <p>📍 <strong>Location:</strong> {b.location}</p>
                          <p>📅 <strong>Schedule:</strong> {b.startDate}</p>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-[#E8E6E1]/50">
                          <span className="font-extrabold text-[#3E5C31] text-[11px]">Daily Wage: ₹{b.totalAmount}</span>
                          
                          <button
                            type="button"
                            disabled={isNotified}
                            onClick={() => {
                              // Transition booking status to 'ongoing'
                              fetch(`/api/bookings/${b.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "ongoing" })
                              }).catch(err => console.error("Failed to update booking status:", err));

                              setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: "ongoing" } : x));
                              // Push notification
                              triggerNotification(
                                b.id,
                                "⏰ Labor Shift Starting",
                                `${userName || "Raju Krishnan"}'s shift at ${b.location} is starting in 30 minutes! Please prepare the workspace.`,
                                "labor_shift_start"
                              );
                            }}
                              className={`text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                isNotified 
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "bg-[#3E5C31] text-white border-[#3E5C31] hover:bg-[#3E5C31]/95 shadow-xs"
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              {isNotified ? "Starting Notified" : "Notify Shift Starting ⏰"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Register as Laborer (if not already listed, or create another profile) */}
              <div className="bg-white rounded-3xl p-4 border border-[#E8E6E1] shadow-xs space-y-3.5">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-[#3E5C31]" />
                  <h3 className="font-black text-sm text-[#2D2D2A]">Register New Skill Category</h3>
                </div>

                {isLaborRegistered ? (
                  <div className="bg-[#3E5C31]/5 p-3 rounded-2xl border border-[#E8E6E1] text-center space-y-2">
                    <span className="text-xl">🎉</span>
                    <h4 className="font-extrabold text-xs text-[#3E5C31]">Registration Successful!</h4>
                    <p className="text-[9px] text-[#2D2D2A]">Your profile has been forwarded to the KYC verifications desk.</p>
                    <button 
                      onClick={() => setIsLaborRegistered(false)}
                      className="bg-[#3E5C31] text-white text-[9px] font-bold px-3 py-1 rounded"
                    >
                      Add Another Category
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterLaborer} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={newLaborName}
                        onChange={(e) => setNewLaborName(e.target.value)}
                        placeholder="e.g., Raju Krishnan"
                        className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Skill Category</label>
                        <select
                          value={newLaborCategory}
                          onChange={(e) => setNewLaborCategory(e.target.value)}
                          className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                        >
                          <option>General</option>
                          <option>Farm labor</option>
                          <option>Mason</option>
                          <option>Carpenter</option>
                          <option>Electrician</option>
                          <option>Plumber</option>
                          <option>Painter</option>
                          <option>Welder</option>
                          <option>Driver</option>
                          <option>Crane operator</option>
                          <option>Event helpers</option>
                          <option>House shifting labor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Daily Wage (₹/day)</label>
                        <input 
                          type="number" 
                          required
                          value={newLaborPrice}
                          onChange={(e) => setNewLaborPrice(e.target.value)}
                          placeholder="e.g., 900"
                          className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Gender Selection</label>
                        <select
                          value={newLaborGender}
                          onChange={(e) => setNewLaborGender(e.target.value as any)}
                          className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-[#8A867E] uppercase mb-0.5">Work Experience</label>
                        <select
                          value={newLaborExperience}
                          onChange={(e) => setNewLaborExperience(e.target.value)}
                          className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1]"
                        >
                          <option>Under 2 Years</option>
                          <option>2 - 5 Years</option>
                          <option>5 - 10 Years</option>
                          <option>10+ Years</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E6E1] space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[9px] font-bold text-[#8A867E] uppercase">KYC Document Type</label>
                        <span className="text-[8px] text-[#3E5C31] font-bold uppercase">Required Verification</span>
                      </div>
                      
                      <select
                        value={newLaborKycDocType}
                        onChange={(e) => setNewLaborKycDocType(e.target.value)}
                        className="w-full bg-white text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1] text-[11px]"
                      >
                        <option>Aadhaar Card</option>
                        <option>Voter ID</option>
                        <option>Electrical License</option>
                        <option>Driving License</option>
                        <option>MGNREGA Job Card</option>
                        <option>Other Govt ID Proof</option>
                      </select>

                      <div className="relative border border-dashed border-[#3E5C31]/40 rounded-xl p-3 bg-white hover:bg-[#3E5C31]/5 transition-all text-center">
                        <input 
                          type="file" 
                          id="labor-kyc-upload" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setNewLaborKycFileName(e.target.files[0].name);
                            } else {
                              setNewLaborKycFileName("kyc_doc_upload.pdf");
                            }
                          }}
                        />
                        <div className="space-y-1">
                          <span className="text-base block">📁</span>
                          <p className="text-[10px] font-black text-[#3E5C31] truncate">
                            {newLaborKycFileName ? `✓ ${newLaborKycFileName}` : "Click or Drag to Upload KYC"}
                          </p>
                          <p className="text-[8px] text-[#8A867E]">PDF, PNG, JPG up to 5MB</p>
                        </div>
                      </div>

                      {/* Simulation helpers */}
                      {!newLaborKycFileName && (
                        <div className="flex gap-1.5 justify-center">
                          <button
                            type="button"
                            onClick={() => setNewLaborKycFileName("aadhaar_front_back.pdf")}
                            className="bg-white hover:bg-slate-50 text-slate-600 text-[8px] font-bold px-2 py-1 rounded border border-slate-200 cursor-pointer"
                          >
                            📄 Simulate Aadhaar
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewLaborKycFileName("license_copy.jpg")}
                            className="bg-white hover:bg-slate-50 text-slate-600 text-[8px] font-bold px-2 py-1 rounded border border-slate-200 cursor-pointer"
                          >
                            📄 Simulate License
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white font-black py-2 rounded-xl"
                    >
                      Submit Registration For Approval
                    </button>
                  </form>
                )}
              </div>

              {/* Jobs Board */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-[#2D2D2A]">Local Jobs Available (Nearby)</h3>
                <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="bg-[#FAF7F2] text-[#2D2D2A] px-2 py-0.5 rounded font-extrabold">🚨 Urgent Hiring</span>
                    <span className="font-bold text-[#3E5C31]">₹900/day</span>
                  </div>
                  <h4 className="font-black text-xs text-[#2D2D2A]">Mason Needed for House Plastering</h4>
                  <p className="text-[10px] text-[#8A867E]">Location: Peedampalli, Coimbatore. 4 km away. Duration: 3 Days.</p>
                  <button 
                    onClick={() => {
                      alert("You have applied for this job! The homeowner will review your profile and call you.");
                    }}
                    className="w-full mt-2 bg-[#3E5C31] text-white py-1.5 rounded-lg font-bold"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* ==================== ADMIN PANEL VIEWPORT ==================== */}
          {userRole === "admin" && activeTab === "dashboard" && (
            <div id="admin-panel" className="p-4 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] bg-[#D97706]/10 text-[#D97706] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Admin Desk
                  </span>
                  <h2 className="text-lg font-black text-[#2D2D2A] mt-1.5">Platform Controller</h2>
                </div>
                <div className="w-10 h-10 bg-[#FAF7F2] rounded-full border border-[#E8E6E1] flex items-center justify-center font-bold text-[#2D2D2A]">A</div>
              </div>

              {/* Real-time platform analytics */}
              <div className="bg-white p-4 rounded-3xl border border-[#E8E6E1] shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#E8E6E1]">
                  <h3 className="font-extrabold text-xs text-[#2D2D2A] uppercase tracking-wider">Platform Analytics</h3>
                  <span className="text-[9px] text-slate-400 font-bold">Live Data</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E6E1]">
                    <span className="text-[8px] text-[#8A867E] block font-semibold">Total Rent</span>
                    <span className="text-xs font-black text-[#2D2D2A]">₹14,120</span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E6E1]">
                    <span className="text-[8px] text-[#8A867E] block font-semibold">Commission</span>
                    <span className="text-xs font-black text-[#3E5C31]">₹1,412</span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E6E1]">
                    <span className="text-[8px] text-[#8A867E] block font-semibold">Active Jobs</span>
                    <span className="text-xs font-black text-[#2D2D2A]">3 Rentals</span>
                  </div>
                </div>
              </div>

              {/* Geofencing & Coverage Range Configuration */}
              <div className="bg-white p-4 rounded-3xl border border-[#E8E6E1] shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#E8E6E1]">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">🌐</span>
                    <h3 className="font-extrabold text-xs text-[#2D2D2A] uppercase tracking-wider font-sans">
                      Service Coverage & Geofencing
                    </h3>
                  </div>
                  <span className="text-[8px] bg-emerald-100 text-[#3E5C31] font-black uppercase px-2 py-0.5 rounded">
                    Operational Control
                  </span>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Location Field */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-[#5C5952] uppercase tracking-wider">
                      Center Location (Where service is set)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={adminLocation}
                        onChange={(e) => {
                          setAdminLocation(e.target.value);
                          localStorage.setItem("admin_location", e.target.value);
                        }}
                        placeholder="Enter village, town or city..."
                        className="w-full bg-[#FAF7F2] text-[#2D2D2A] border border-[#E8E6E1] rounded-xl px-3.5 py-2 pl-9 font-medium text-xs focus:ring-2 focus:ring-[#3E5C31] focus:bg-white outline-none transition-all font-sans"
                      />
                      <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#3E5C31]" />
                    </div>
                    {/* Common village suggestions for demo */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["Coimbatore, Tamil Nadu", "Pollachi, Coimbatore", "Sulur, Coimbatore", "Peedampalli, Tamil Nadu"].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            setAdminLocation(loc);
                            localStorage.setItem("admin_location", loc);
                          }}
                          className={`text-[9px] px-2 py-1 rounded-lg border font-bold transition-all ${
                            adminLocation === loc
                              ? "bg-[#3E5C31] text-white border-[#3E5C31]"
                              : "bg-[#FAF7F2] text-[#5C5952] border-[#E8E6E1] hover:bg-[#F3F1ED]"
                          }`}
                        >
                          {loc.split(",")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Distance Field (KM) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-[#5C5952] uppercase tracking-wider">
                        Service Radius (Surrounding Distance)
                      </label>
                      <span className="text-xs font-black text-[#3E5C31] bg-[#3E5C31]/10 px-2 py-0.5 rounded-full">
                        {adminDistance} KM
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={adminDistance}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setAdminDistance(val);
                          localStorage.setItem("admin_distance", val.toString());
                        }}
                        className="flex-1 accent-[#3E5C31] h-1.5 bg-[#FAF7F2] rounded-lg border border-[#E8E6E1] cursor-pointer"
                      />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={adminDistance}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setAdminDistance(val);
                          localStorage.setItem("admin_distance", val.toString());
                        }}
                        className="w-14 text-center bg-[#FAF7F2] text-[#2D2D2A] border border-[#E8E6E1] rounded-lg py-1 font-extrabold text-xs"
                      />
                      <span className="text-[10px] font-bold text-[#8A867E]">KM</span>
                    </div>
                  </div>

                  {/* Geofencing Summary Metrics */}
                  <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E6E1] space-y-1">
                    <div className="text-[9px] font-black text-[#8A867E] uppercase tracking-wider">
                      Surrounding App Scope summary
                    </div>
                    <p className="text-[10px] text-slate-700 leading-relaxed font-sans">
                      All products & laborer services outside this <strong className="text-[#3E5C31]">{adminDistance} KM</strong> boundary are automatically geofenced (hidden) from the customer homepage.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[9px] font-bold">
                      <div className="bg-white p-1.5 rounded-lg border border-[#E8E6E1] text-center">
                        <span className="text-[#8A867E] block text-[8px]">Active Equipment</span>
                        <span className="text-[#3E5C31] font-black">{filteredEquipmentList.length} / {resolvedEquipmentList.length}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-[#E8E6E1] text-center">
                        <span className="text-[#8A867E] block text-[8px]">Active Laborers</span>
                        <span className="text-[#3E5C31] font-black">{filteredLaborersList.length} / {resolvedLaborersList.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Geofencing Configured!\n\n📍 Center set to: ${adminLocation}\n📏 Maximum service radius: ${adminDistance} KM.\n\nThe user interface has refreshed to only offer equipment and laborers within this boundary!`);
                    }}
                    className="flex-1 bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white text-[10px] font-black py-2.5 rounded-xl text-center shadow-xs cursor-pointer transition-all font-sans"
                  >
                    💾 Save & Apply Geofence
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminLocation("Coimbatore, Tamil Nadu");
                      setAdminDistance(15);
                      localStorage.setItem("admin_location", "Coimbatore, Tamil Nadu");
                      localStorage.setItem("admin_distance", "15");
                      alert("Geofencing coverage reset to defaults (Coimbatore, 15 KM).");
                    }}
                    className="bg-[#FAF7F2] hover:bg-[#F3F1ED] border border-[#E8E6E1] text-slate-600 text-[10px] font-bold px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* KYC Verifications queue */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-[#2D2D2A]">KYC Verifications Queue ({kycRequests.filter(k => k.status === 'pending').length})</h3>
                <div className="space-y-2">
                  {kycRequests.map((k) => (
                    <div key={k.id} className="bg-white p-3 rounded-2xl border border-[#E8E6E1] flex items-center justify-between shadow-xs text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-black text-[#2D2D2A]">{k.name}</h4>
                          <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 rounded font-bold uppercase">{k.type}</span>
                        </div>
                        <p className="text-[10px] text-[#8A867E]">Doc: {k.document}</p>
                      </div>

                      <div>
                        {k.status === "pending" ? (
                          <div className="flex space-x-1">
                            <button 
                              onClick={() => handleApproveKYC(k.id)}
                              className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100 font-bold text-[10px] cursor-pointer hover:bg-emerald-100 transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => {
                                handleRejectKYC(k.id);
                                alert("KYC document flagged as incomplete and profile rejected.");
                              }}
                              className="bg-rose-50 text-rose-700 px-2 py-1 rounded-lg border border-rose-100 font-bold text-[10px] cursor-pointer hover:bg-rose-100 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : k.status === "approved" ? (
                          <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded border border-emerald-100">✓ Approved</span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-1 rounded border border-rose-100">✗ Rejected</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment Listings verification */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-[#2D2D2A]">Machinery Approvals Desk</h3>
                <div className="space-y-2">
                  {pendingEquipmentApprovals.map((eq) => (
                    <div key={eq.id} className="bg-white p-3 rounded-2xl border border-[#E8E6E1] flex items-center justify-between shadow-xs text-xs">
                      <div className="space-y-0.5">
                        <h4 className="font-black text-[#2D2D2A]">{eq.name}</h4>
                        <p className="text-[10px] text-[#8A867E]">Owner: {eq.owner}</p>
                      </div>

                      <div>
                        {eq.status === "pending" ? (
                          <button
                            onClick={() => handleApproveEquipment(eq.id)}
                            className="bg-[#3E5C31] text-white px-2.5 py-1 rounded-lg font-bold text-[10px]"
                          >
                            Approve Live
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[10px]">✓ Live in Search</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dispute Resolution Center */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-[#2D2D2A]">Disputes & Escrow Claims ({disputes.filter(d => d.status === 'open').length})</h3>
                <div className="space-y-2">
                  {disputes.map((d) => (
                    <div key={d.id} className="bg-white p-3.5 rounded-2xl border border-[#E8E6E1] shadow-xs text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-[#2D2D2A]">{d.itemName} ({d.id})</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 rounded ${
                          d.status === "open" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}>{d.status}</span>
                      </div>
                      <p className="text-[10px] text-[#8A867E]">Complainant: {d.complainant}</p>
                      <p className="bg-[#FAF7F2] p-2 rounded-lg text-[10px] text-slate-700 italic border border-[#E8E6E1]">
                        "{d.reason}"
                      </p>

                      {d.status === "open" && (
                        <div className="flex space-x-1 justify-end pt-1">
                          <button
                            onClick={() => {
                              handleResolveDispute(d.id);
                              alert("Escrow dispute resolved. Refund issued to customer's wallet.");
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-rose-100"
                          >
                            💸 Refund Customer
                          </button>
                          <button
                            onClick={() => {
                              handleResolveDispute(d.id);
                              alert("Escrow dispute resolved. Payment released to owner's bank account.");
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-emerald-100"
                          >
                            💰 Release Payment
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* PWA / Progressive Web App Diagnostics Card (Moved to Admin Panel) */}
              <div className="bg-white p-4 rounded-3xl border border-[#E8E6E1] shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#E8E6E1]">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">📱</span>
                    <h3 className="font-extrabold text-xs text-[#2D2D2A] uppercase tracking-wider">
                      OorSevai PWA Engine
                    </h3>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-[#8A867E]">Network Connection:</span>
                    <span className={`font-bold flex items-center ${isOnline ? "text-emerald-600" : "text-amber-600"}`}>
                      <span className="mr-1">●</span> {isOnline ? "Online (Fully Connected)" : "Offline Mode Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A867E]">Installation Status:</span>
                    <span className="font-bold text-[#2D2D2A]">
                      {isInstalled ? "✓ App Installed" : "Available to Install / Shortcut Option"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A867E]">Offline Engine:</span>
                    <span className="font-bold text-[#3E5C31]">Service Worker Registered</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A867E]">Local Cached Assets:</span>
                    <span className="font-bold text-slate-700">App Shell, Forms, Icons & Static Data</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {!isInstalled && (
                    <button
                      type="button"
                      onClick={handleInstallApp}
                      className="flex-1 bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white text-[10px] font-black py-2 rounded-xl text-center cursor-pointer transition-colors"
                    >
                      📱 Install App Shortcut
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      alert("Offline Sync Test:\n\nIf you go offline (turn off WiFi/data) and rent equipment or submit labor applications, OorSevai's Service Worker holds the UI flow locally, and will attempt to submit when connection is restored! All listing structures are preserved.");
                    }}
                    className="flex-1 bg-[#FAF7F2] hover:bg-[#F3F1ED] border border-[#E8E6E1] text-slate-700 text-[10px] font-bold py-2 rounded-xl text-center cursor-pointer transition-colors"
                  >
                    💡 Test Offline Capability
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* PERSISTENT TAB BAR FOOTER */}
        <div id="persistent-tab-bar" className="absolute bottom-0 inset-x-0 bg-white dark:bg-[#1C2420] border-t border-[#E8E6E1] dark:border-slate-800 py-2.5 px-6 flex justify-between items-center z-40 shadow-lg">
          {userRole === "customer" ? (
            <>
              <button 
                onClick={() => { setActiveTab("home"); setActiveView("home"); }}
                className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${activeTab === "home" ? "text-[#3E5C31] dark:text-emerald-400 font-bold" : "text-[#8A867E] dark:text-slate-400"}`}
              >
                <div className="text-xl">🏠</div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide">{t("tab_home")}</span>
              </button>

              <button 
                onClick={() => setActiveTab("bookings")}
                className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${activeTab === "bookings" ? "text-[#3E5C31] dark:text-emerald-400 font-bold" : "text-[#8A867E] dark:text-slate-400"}`}
              >
                <div className="text-xl">📅</div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide">{t("tab_bookings")}</span>
              </button>

              <button 
                onClick={() => setActiveTab("chat")}
                className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${activeTab === "chat" ? "text-[#3E5C31] dark:text-emerald-400 font-bold" : "text-[#8A867E] dark:text-slate-400"}`}
              >
                <div className="text-xl">💬</div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide">{t("tab_ai_advisor")}</span>
              </button>

              <button 
                onClick={() => {
                  const providers = registeredRoles.filter(r => r === "owner" || r === "labor");
                  if (providers.length > 0) {
                    setUserRole(providers[0]);
                    setActiveTab("dashboard");
                  } else {
                    setShowProviderPromptModal(true);
                  }
                }}
                className="flex flex-col items-center gap-0.5 cursor-pointer text-[#8A867E] dark:text-slate-400 transition-colors"
              >
                <div className="text-xl">👤</div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide">{t("tab_provider")}</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => {
                  if (registeredRoles.includes("customer")) {
                    setUserRole("customer");
                    setActiveTab("home");
                    setActiveView("home");
                  } else {
                    alert(language === "ta" ? "வாடிக்கையாளர் பங்கை செயல்படுத்த அமைப்புகளுக்குச் செல்லவும்!" : "Please enable Customer role in Settings!");
                    setShowSettingsModal(true);
                  }
                }}
                className="flex flex-col items-center gap-0.5 cursor-pointer text-[#8A867E] dark:text-slate-400 transition-colors"
              >
                <div className="text-xl">🚜</div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide">{t("tab_rent_mode")}</span>
              </button>

              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${activeTab === "dashboard" ? "text-[#3E5C31] dark:text-emerald-400 font-bold" : "text-[#8A867E] dark:text-slate-400"}`}
              >
                <div className="text-xl">📊</div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide">{t("tab_dashboard")}</span>
              </button>

              <button 
                onClick={() => {
                  const num = "919698340357";
                  alert(`Connecting you directly to OorSevai Support Desk...\nPhone helpline: +${num}`);
                }}
                className="flex flex-col items-center gap-0.5 cursor-pointer text-[#8A867E] dark:text-slate-400 transition-colors"
              >
                <div className="text-xl">🎧</div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide">{t("tab_support")}</span>
              </button>
            </>
          )}
        </div>
          </>
        )}

        {/* ==================== SETTINGS MODAL ==================== */}
        <AnimatePresence>
          {showSettingsModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto scrollbar-none"
            >
              <motion.div 
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full bg-[#FAF7F2] dark:bg-slate-900 rounded-2xl p-5 border border-[#E8E6E1] dark:border-slate-800 shadow-2xl flex flex-col my-2"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-4 border-b border-[#E8E6E1]/60 dark:border-slate-800 pb-3 shrink-0">
                  <div>
                    <h3 className="text-sm font-black text-[#2D2D2A] dark:text-slate-100 flex items-center gap-1.5">
                      <span>⚙️</span> {t("settings_title")}
                    </h3>
                    <p className="text-[10px] text-[#8A867E] dark:text-slate-400 mt-0.5">{t("settings_profile_info")}</p>
                  </div>
                  <button 
                    onClick={() => setShowSettingsModal(false)}
                    className="w-7 h-7 rounded-full bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-300/60 dark:hover:bg-slate-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-4 flex-1">
                  {/* Name field */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1 tracking-wider">{t("reg_name_label")}</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder={t("reg_name_placeholder")}
                      className="w-full bg-white dark:bg-[#1A2320] border border-[#E8E6E1] dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#3E5C31] dark:text-slate-100 outline-none"
                    />
                  </div>

                  {/* Mobile field */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1 tracking-wider">{t("reg_mobile_label")}</label>
                    <input
                      type="tel"
                      value={userMobile}
                      onChange={(e) => setUserMobile(e.target.value.replace(/\D/g, ""))}
                      maxLength={10}
                      placeholder={t("reg_mobile_placeholder")}
                      className="w-full bg-white dark:bg-[#1A2320] border border-[#E8E6E1] dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#3E5C31] dark:text-slate-100 outline-none"
                    />
                  </div>

                  {/* Location field in settings */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1 tracking-wider">{t("reg_location_label")}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userLocation}
                        onChange={(e) => setUserLocation(e.target.value)}
                        placeholder={t("reg_location_placeholder")}
                        className="flex-1 bg-white dark:bg-[#1A2320] border border-[#E8E6E1] dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#3E5C31] dark:text-slate-100 outline-none"
                      />
                      <button
                        type="button"
                        disabled={isDetectingLocation}
                        onClick={handleDetectSettingsLocation}
                        className="px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 text-[#2D2D2A] rounded-xl text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                      >
                        <span>📍</span> {isDetectingLocation ? (language === "ta" ? "கண்டறிகிறது..." : "Detecting...") : t("reg_location_detect")}
                      </button>
                    </div>
                  </div>

                  {/* Registered Roles */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-0.5 tracking-wider">{t("settings_roles_title")}</label>
                    <p className="text-[9px] text-[#8A867E] dark:text-slate-400 mb-2">{t("settings_roles_desc")}</p>
                    
                    <div className="space-y-2">
                      {(["customer", "owner", "labor"] as const).map((role) => {
                        const isChecked = registeredRoles.includes(role);
                        return (
                          <div
                            key={role}
                            onClick={() => {
                              // We must have at least one role selected
                              if (isChecked && registeredRoles.filter(r => r !== "admin").length <= 1) {
                                alert(language === "ta" ? "குறைந்தது ஒரு பங்கையாவது தேர்ந்தெடுக்க வேண்டும்!" : "At least one role must remain selected!");
                                return;
                              }
                              const nextRoles = isChecked 
                                ? registeredRoles.filter(r => r !== role)
                                : [...registeredRoles, role];
                              
                              setRegisteredRoles(nextRoles);
                              localStorage.setItem("oorsevai_user_roles", JSON.stringify(nextRoles));
                            }}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                              isChecked
                                ? "bg-[#3E5C31]/5 border-[#3E5C31] dark:border-emerald-500 dark:bg-emerald-500/5"
                                : "bg-white dark:bg-[#1A2320] border-[#E8E6E1] dark:border-slate-800"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">
                                {role === "customer" ? "🚜" : role === "owner" ? "🛠️" : "👷"}
                              </span>
                              <span className="text-xs font-bold text-[#2D2D2A] dark:text-slate-200">
                                {role === "customer" ? t("reg_role_customer_title") : 
                                 role === "owner" ? t("reg_role_owner_title") : 
                                 t("reg_role_labor_title")}
                              </span>
                            </div>
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                              isChecked
                                ? "border-[#3E5C31] bg-[#3E5C31] text-white dark:border-emerald-500 dark:bg-emerald-500"
                                : "border-[#E8E6E1] dark:border-slate-700"
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[4px]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Admin Passcode section */}
                  <div className="border border-[#E8E6E1] dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-[#161F1C]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-[#2D2D2A] dark:text-slate-200 flex items-center gap-1">
                        <span>🔑</span> {t("role_admin")} Access
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        registeredRoles.includes("admin") ? "bg-[#3E5C31]/10 text-[#3E5C31] dark:text-emerald-400" : "bg-slate-100 text-slate-400"
                      }`}>
                        {registeredRoles.includes("admin") ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                      Enter passcode to enable Admin panel on this device (use `1234`).
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Admin Code"
                        className="flex-1 bg-slate-50 dark:bg-[#1A2320] border border-[#E8E6E1] dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#3E5C31] dark:text-slate-100"
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          if (val === "1234" || val === "admin123") {
                            if (!registeredRoles.includes("admin")) {
                              const next = [...registeredRoles, "admin"];
                              setRegisteredRoles(next);
                              localStorage.setItem("oorsevai_user_roles", JSON.stringify(next));
                            }
                          }
                        }}
                      />
                      {registeredRoles.includes("admin") && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = registeredRoles.filter(r => r !== "admin");
                            setRegisteredRoles(next);
                            localStorage.setItem("oorsevai_user_roles", JSON.stringify(next));
                            if (userRole === "admin") {
                              setUserRole("customer");
                              setActiveTab("home");
                              setActiveView("home");
                            }
                          }}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-500 px-3 py-1.5 rounded-lg text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Save Button */}
                <div className="pt-4 mt-4 border-t border-[#E8E6E1]/60 dark:border-slate-800 shrink-0">
                  <button
                    onClick={() => {
                      if (!userName.trim()) {
                        alert("Name is required");
                        return;
                      }
                      if (userMobile.replace(/\D/g, "").length < 10) {
                        alert("Valid 10-digit mobile number is required");
                        return;
                      }
                      
                      localStorage.setItem("oorsevai_user_name", userName.trim());
                      localStorage.setItem("oorsevai_user_mobile", userMobile);
                      localStorage.setItem("oorsevai_user_location", userLocation.trim());
                      setCustomLocation(userLocation.trim());
                      setAdminLocation(userLocation.trim());
                      localStorage.setItem("admin_location", userLocation.trim());
                      setPredictLocation(userLocation.trim());
                      
                      // Ensure current active role is still valid
                      if (!registeredRoles.includes(userRole)) {
                        const fallbacks = registeredRoles.filter(r => r !== "admin");
                        const activeFallback = fallbacks.length > 0 ? fallbacks[0] : registeredRoles[0];
                        setUserRole(activeFallback);
                        if (activeFallback === "customer") {
                          setActiveTab("home");
                          setActiveView("home");
                        } else {
                          setActiveTab("dashboard");
                        }
                      }
                      
                      setShowSettingsModal(false);
                    }}
                    className="w-full bg-[#3E5C31] hover:bg-[#344F28] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl shadow-md transition-all text-xs"
                  >
                    Apply & Close Settings
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== PROVIDER PROMPT MODAL ==================== */}
        <AnimatePresence>
          {showProviderPromptModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-xs bg-[#FAF7F2] dark:bg-slate-900 rounded-2xl p-5 border border-[#E8E6E1] dark:border-slate-800 shadow-2xl text-center"
              >
                <div className="text-3xl mb-2.5">🚜💼</div>
                <h3 className="text-sm font-black text-[#2D2D2A] dark:text-slate-100 tracking-tight">
                  {language === "ta" ? "சேவைகளை வழங்கி வருமானம் ஈட்டுங்கள்!" : "Offer Services & Earn!"}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                  {language === "ta" 
                    ? "உங்களின் டிராக்டர் அல்லது விவசாய சேவைகளை ஊர்சேவையில் வழங்க, அமைப்புகளில் 'உரிமையாளர்' அல்லது 'தொழிலாளி' பங்குகளை இயக்கவும்."
                    : "To list your tractor or offer professional farm labor in OorSevai, please enable the Owner or Worker roles in Settings."}
                </p>
                
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      setShowProviderPromptModal(false);
                      setShowSettingsModal(true);
                    }}
                    className="w-full bg-[#3E5C31] hover:bg-[#344F28] text-white text-xs font-black py-2.5 rounded-xl shadow-xs cursor-pointer"
                  >
                    {language === "ta" ? "அமைப்புகளைத் திறக்கவும்" : "Open Settings"}
                  </button>
                  <button
                    onClick={() => setShowProviderPromptModal(false)}
                    className="w-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:bg-slate-300/60 text-xs font-bold py-2 rounded-xl cursor-pointer"
                  >
                    {language === "ta" ? "மூடவும்" : "Cancel"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
