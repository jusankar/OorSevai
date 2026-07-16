import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Equipment } from "../types";
import { getDistanceBetween, getCoordsForPlace } from "../utils/geo";
import L from "leaflet";

// Simplified delivery fee calculation (Base flat rate + per-km extra rate)
export const getDeliveryFeeForDistance = (
  equipment: Equipment, 
  distanceKm: number
): { fee: number; zoneName: string; outside: boolean } => {
  const baseDistance = 3;
  const baseFee = 150;
  const extraRate = 30;
  
  if (distanceKm <= baseDistance) {
    return { fee: baseFee, zoneName: "Local Zone (Within 3 KM)", outside: false };
  } else {
    const extraKm = Math.ceil(distanceKm - baseDistance);
    const totalFee = baseFee + (extraKm * extraRate);
    return { 
      fee: totalFee, 
      zoneName: `Extended Zone (${Math.round(distanceKm)} KM)`, 
      outside: distanceKm > 10 // Consider outside standard service if > 10 km
    };
  }
};

interface GeofenceMapProps {
  mode?: "owner" | "customer" | "admin" | "register";
  equipment?: Equipment;
  customerLocationName?: string;
  onCustomerLocationChange?: (locationName: string, fee: number) => void;
  onUpdateZones?: (zones: any[]) => void;
  adminLocation?: string;
  adminDistance?: number;
  nearbyPlaces?: string[];
  onAdminLocationChange?: (locationName: string) => void;
  
  // New clean callbacks for direct lat/lon selection
  selectedLat?: number;
  selectedLon?: number;
  onLocationSelect?: (lat: number, lon: number, placeName: string) => void;
}

export default function GeofenceMap({
  mode = "register",
  equipment,
  customerLocationName = "Thirumanancheri Temple",
  onCustomerLocationChange,
  adminLocation = "Thirumanancheri, Tamil Nadu",
  onAdminLocationChange,
  selectedLat,
  selectedLon,
  onLocationSelect
}: GeofenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Fallbacks for lat/lon
  const defaultCoords = { lat: 11.1444, lon: 79.5744 }; // Thirumanancheri
  const [currentLat, setCurrentLat] = useState(() => {
    if (selectedLat) return selectedLat;
    if (mode === "customer" && customerLocationName) {
      return getCoordsForPlace(customerLocationName).lat;
    }
    if (mode === "admin" && adminLocation) {
      return getCoordsForPlace(adminLocation).lat;
    }
    if (equipment?.location) {
      return getCoordsForPlace(equipment.location).lat;
    }
    return defaultCoords.lat;
  });

  const [currentLon, setCurrentLon] = useState(() => {
    if (selectedLon) return selectedLon;
    if (mode === "customer" && customerLocationName) {
      return getCoordsForPlace(customerLocationName).lon;
    }
    if (mode === "admin" && adminLocation) {
      return getCoordsForPlace(adminLocation).lon;
    }
    if (equipment?.location) {
      return getCoordsForPlace(equipment.location).lon;
    }
    return defaultCoords.lon;
  });

  const [placeName, setPlaceName] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Sync state with selected coordinates from parent
  useEffect(() => {
    if (selectedLat && selectedLon) {
      setCurrentLat(selectedLat);
      setCurrentLon(selectedLon);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([selectedLat, selectedLon], mapInstanceRef.current.getZoom());
      }
    }
  }, [selectedLat, selectedLon]);

  // Load Leaflet CSS dynamically
  useEffect(() => {
    const cssId = "leaflet-css-cdn";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Reverse Geocoding with OSM Nominatim API
  const handleReverseGeocode = async (lat: number, lon: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const parts: string[] = [];

        const local = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || addr.hamlet;
        if (local) parts.push(local);

        const parent = addr.city || addr.county || addr.state_district;
        if (parent) parts.push(parent);

        const state = addr.state;
        if (state) parts.push(state);

        const nameStr = parts.length > 0 ? parts.join(", ") : data.display_name?.split(",").slice(0, 3).join(",") || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setPlaceName(nameStr);
        setIsGeocoding(false);
        triggerCallbacks(lat, lon, nameStr);
        return;
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
    
    // Fallback if API fails
    const fallbackName = `Near ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
    setPlaceName(fallbackName);
    setIsGeocoding(false);
    triggerCallbacks(lat, lon, fallbackName);
  };

  const triggerCallbacks = (lat: number, lon: number, resolvedName: string) => {
    if (onLocationSelect) {
      onLocationSelect(lat, lon, resolvedName);
    }
    
    // Standard callbacks for compatibility
    if (mode === "customer" && onCustomerLocationChange) {
      const centerCoords = equipment ? getCoordsForPlace(equipment.location) : defaultCoords;
      // Get physical distance using Haversine
      const R = 6371;
      const dLat = ((lat - centerCoords.lat) * Math.PI) / 180;
      const dLon = ((lon - centerCoords.lon) * Math.PI) / 180;
      const lat1 = (centerCoords.lat * Math.PI) / 180;
      const lat2 = (lat * Math.PI) / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      const feeDetails = getDeliveryFeeForDistance(equipment!, distance);
      onCustomerLocationChange(resolvedName, feeDetails.fee);
    }

    if (mode === "admin" && onAdminLocationChange) {
      onAdminLocationChange(resolvedName);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet Map Instance
    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLon],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Custom CSS Pin Marker HTML
    const pinHtml = `
      <div class="flex flex-col items-center justify-center">
        <div class="w-8 h-8 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white animate-bounce">
          📍
        </div>
      </div>
    `;

    const markerIcon = L.divIcon({
      html: pinHtml,
      className: "custom-div-icon",
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    // Create marker
    const marker = L.marker([currentLat, currentLon], {
      icon: markerIcon,
      draggable: true
    }).addTo(map);

    markerRef.current = marker;

    // Reverse geocode initial position on load if name is empty
    if (!placeName) {
      handleReverseGeocode(currentLat, currentLon);
    }

    // Handle marker drag
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      setCurrentLat(position.lat);
      setCurrentLon(position.lng);
      handleReverseGeocode(position.lat, position.lng);
    });

    // Handle map click
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setCurrentLat(lat);
      setCurrentLon(lng);
      marker.setLatLng([lat, lng]);
      handleReverseGeocode(lat, lng);
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync marker position if coordinate changes
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([currentLat, currentLon]);
    }
  }, [currentLat, currentLon]);

  // Handle GPS detection button
  const handleGPSDetect = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLat(latitude);
          setCurrentLon(longitude);
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          }
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 14, { animate: true });
          }
          handleReverseGeocode(latitude, longitude);
        },
        (error) => {
          alert("Could not access GPS location. Please click directly on the map to choose.");
          console.error(error);
        }
      );
    } else {
      alert("GPS Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] dark:bg-slate-900 border border-[#E8E6E1] dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col">
      {/* Map display */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[240px] md:h-[280px] relative z-10"
        style={{ minHeight: "240px" }}
      />
      
      {/* Location Details Panel */}
      <div className="p-3.5 bg-white dark:bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-[#E8E6E1] dark:border-slate-800">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-[#2D2D2A] dark:text-slate-100 uppercase tracking-wide">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
            <span>Selected Base Location</span>
          </div>
          
          <div className="text-[11px] font-sans text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            {isGeocoding ? (
              <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                Resolving address...
              </span>
            ) : (
              <span>{placeName || "Click/drag on map to pinpoint address"}</span>
            )}
          </div>
          
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tight flex items-center gap-2">
            <span>Lat: {currentLat.toFixed(5)}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Lon: {currentLon.toFixed(5)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGPSDetect}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 self-start md:self-center cursor-pointer select-none"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>My GPS Position</span>
        </button>
      </div>
    </div>
  );
}
