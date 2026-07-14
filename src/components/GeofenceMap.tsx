import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  MapPin, 
  Sliders, 
  Plus, 
  Trash2, 
  Info, 
  Navigation, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  HelpCircle,
  Maximize2
} from "lucide-react";
import { Equipment, DeliveryZone } from "../types";
import { getDistanceBetween, getCoordsForPlace, getSuburbsForCenter } from "../utils/geo";
import L from "leaflet";

// Helper to match distance to delivery fee zone
export const getDeliveryFeeForDistance = (
  equipment: Equipment, 
  distanceKm: number, 
  customZones?: DeliveryZone[]
): { fee: number; zoneName: string; outside: boolean } => {
  const defaultZones: DeliveryZone[] = [
    { id: "z1-default", name: "Standard Radius", radiusKm: 15, deliveryFee: 600, color: "rgba(59, 130, 246, 0.15)" }
  ];
  const zones = customZones && customZones.length > 0 
    ? customZones 
    : (equipment.deliveryZones && equipment.deliveryZones.length > 0 ? equipment.deliveryZones : defaultZones);
  
  const sortedZones = [...zones].sort((a, b) => a.radiusKm - b.radiusKm);
  for (const zone of sortedZones) {
    if (distanceKm <= zone.radiusKm) {
      return { fee: zone.deliveryFee, zoneName: zone.name, outside: false };
    }
  }
  
  const maxZone = sortedZones[sortedZones.length - 1] || defaultZones[0];
  const extraKm = Math.ceil(distanceKm - maxZone.radiusKm);
  const extraFee = extraKm * 40; // ₹40 per extra km
  return {
    fee: maxZone.deliveryFee + extraFee,
    zoneName: "Outside Standard Zones (Extended Rate Applied)",
    outside: true
  };
};

interface GeofenceMapProps {
  mode: "owner" | "customer" | "admin";
  equipment?: Equipment;
  customerLocationName?: string;
  onCustomerLocationChange?: (locationName: string, fee: number) => void;
  onUpdateZones?: (zones: DeliveryZone[]) => void;
  adminLocation?: string;
  adminDistance?: number;
  nearbyPlaces?: string[];
  onAdminLocationChange?: (locationName: string) => void;
}

export default function GeofenceMap({
  mode,
  equipment,
  customerLocationName = "Coimbatore Central",
  onCustomerLocationChange,
  onUpdateZones,
  adminLocation = "Coimbatore, Tamil Nadu",
  adminDistance = 15,
  nearbyPlaces = [],
  onAdminLocationChange
}: GeofenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Center node setup
  const centerName = mode === "admin" 
    ? adminLocation 
    : (equipment?.location || "Coimbatore, Tamil Nadu");

  const displayCenterShortName = centerName.split(",")[0];

  // Concentric delivery zones (for owner/customer modes)
  const [zones, setZones] = useState<DeliveryZone[]>(() => {
    return equipment?.deliveryZones && equipment.deliveryZones.length > 0
      ? equipment.deliveryZones
      : [
          { id: "z1", name: "Immediate Neighborhood", radiusKm: 5, deliveryFee: 250, color: "rgba(16, 185, 129, 0.15)" },
          { id: "z2", name: "Mid-Ring Delivery", radiusKm: 15, deliveryFee: 600, color: "rgba(245, 158, 11, 0.15)" },
          { id: "z3", name: "Extended Outpost Belt", radiusKm: 35, deliveryFee: 1400, color: "rgba(239, 68, 68, 0.12)" }
        ];
  });

  // Selected Location for Customer mode
  const [selectedLocName, setSelectedLocName] = useState(customerLocationName);
  const [selectedLocDistance, setSelectedLocDistance] = useState(() => {
    return getDistanceBetween(centerName, customerLocationName);
  });

  // Editor states for owner mode
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(zones[0]?.id || null);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneRadius, setNewZoneRadius] = useState(10);
  const [newZoneFee, setNewZoneFee] = useState(400);

  // Device pinpointing state
  const [devicePin, setDevicePin] = useState<{
    lat: number;
    lon: number;
    distance: number;
    name: string;
  } | null>(null);

  const [isGeocoding, setIsGeocoding] = useState(false);

  // Determine surrounding suburbs/villages based on active center
  const surroundingPlaces = getSuburbsForCenter(centerName).map((place) => {
    const distance = getDistanceBetween(centerName, place);
    return {
      name: place,
      distance,
      isActive: mode === "admin" ? distance <= adminDistance : true
    };
  });

  // Reverse geocoding helper from OSM Nominatim API
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const parts: string[] = [];
        
        // Find specific local area names
        const local = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district;
        if (local) {
          parts.push(local);
        } else if (addr.city) {
          parts.push(addr.city);
        }
        
        if (addr.state) {
          parts.push(addr.state);
        }

        if (parts.length > 0) {
          setIsGeocoding(false);
          return parts.join(", ");
        }
        
        setIsGeocoding(false);
        return data.display_name?.split(",").slice(0, 2).join(",") || `Near ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    } catch (err) {
      console.error("Reverse geocoding failed, generating coordinate label:", err);
    }
    setIsGeocoding(false);
    return `Near ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
  };

  // Ensure Leaflet CSS is loaded dynamically
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

  // Initialize and clean up Leaflet Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const centerCoords = getCoordsForPlace(centerName);

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [centerCoords.lat, centerCoords.lon],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false
    });

    // Add Free OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    // Create LayerGroup for dynamic markers/geofences
    const layersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    layersGroupRef.current = layersGroup;

    // Handle clicks anywhere on the physical map
    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const clickedLocationString = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const dist = getDistanceBetween(centerName, clickedLocationString);

      if (mode === "customer" && equipment) {
        setSelectedLocName("Searching...");
        setSelectedLocDistance(dist);
        
        const realPlaceName = await reverseGeocode(lat, lng);
        setSelectedLocName(realPlaceName);

        if (onCustomerLocationChange) {
          const feeDetails = getDeliveryFeeForDistance(equipment, dist, zones);
          onCustomerLocationChange(realPlaceName, feeDetails.fee);
        }
      } else if (mode === "admin" && onAdminLocationChange) {
        const realPlaceName = await reverseGeocode(lat, lng);
        onAdminLocationChange(realPlaceName);
      }
    };

    map.on("click", handleMapClick);

    // Attempt browser Geolocation pinpoint
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: latD, longitude: lonD } = position.coords;
          const dist = getDistanceBetween(centerName, `${latD.toFixed(4)}, ${lonD.toFixed(4)}`);
          setDevicePin({
            lat: latD,
            lon: lonD,
            distance: dist,
            name: "Your Device"
          });
        },
        (error) => {
          console.log("Device pinpointing disabled or timed out:", error);
        },
        { timeout: 6000 }
      );
    }

    return () => {
      map.off("click", handleMapClick);
      map.remove();
      mapInstanceRef.current = null;
      layersGroupRef.current = null;
    };
  }, [centerName, mode]);

  // Sync state to parent updates
  useEffect(() => {
    if (mode === "owner" && onUpdateZones) {
      onUpdateZones(zones);
    }
  }, [zones, mode]);

  // Keep customer selection in sync with parent prop changes
  useEffect(() => {
    if (mode === "customer" && customerLocationName) {
      setSelectedLocName(customerLocationName);
      const dist = getDistanceBetween(centerName, customerLocationName);
      setSelectedLocDistance(dist);
      
      if (equipment && onCustomerLocationChange) {
        const feeDetails = getDeliveryFeeForDistance(equipment, dist, zones);
        onCustomerLocationChange(customerLocationName, feeDetails.fee);
      }
    }
  }, [customerLocationName, centerName, equipment]);

  // Draw and update markers, circles & interactive overlays on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    // Clear all previously drawn layers inside the dynamic layergroup
    layersGroup.clearLayers();

    const centerCoords = getCoordsForPlace(centerName);
    
    // Pan smoothly to selected Hub coordinates
    map.setView([centerCoords.lat, centerCoords.lon], map.getZoom(), { animate: true });

    // 1. Draw CENTRAL MASTER HUB MARKER
    const hubIconHtml = `
      <div class="flex flex-col items-center justify-center">
        <div class="w-8 h-8 bg-[#3E5C31] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white animate-pulse">
          ${mode === "admin" ? "💼" : "🚜"}
        </div>
        <div class="bg-[#3E5C31] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow mt-0.5 whitespace-nowrap uppercase tracking-wide border border-white/20">
          ${mode === "admin" ? "ADMIN" : "HUB"}
        </div>
      </div>
    `;
    const hubMarkerIcon = L.divIcon({
      html: hubIconHtml,
      className: "custom-div-icon",
      iconSize: [60, 44],
      iconAnchor: [30, 22]
    });

    const hubMarker = L.marker([centerCoords.lat, centerCoords.lon], { icon: hubMarkerIcon }).addTo(layersGroup);
    hubMarker.bindPopup(`<b>${displayCenterShortName} Hub Center</b>`);

    // 2. Draw GEOMAPPING LIMIT CIRCLES
    if (mode === "admin") {
      // Solid boundary overlay in Admin Mode
      L.circle([centerCoords.lat, centerCoords.lon], {
        color: "#3E5C31",
        fillColor: "#10B981",
        fillOpacity: 0.08,
        radius: adminDistance * 1000,
        weight: 1.5,
        dashArray: "5, 5"
      }).addTo(layersGroup);
    } else {
      // Concentric circles for owner/customer delivery zones
      zones.forEach((zone) => {
        const isSelectedZone = selectedZoneId === zone.id && mode === "owner";
        L.circle([centerCoords.lat, centerCoords.lon], {
          color: isSelectedZone ? "#3B82F6" : "rgba(138, 134, 126, 0.6)",
          fillColor: isSelectedZone ? "#3B82F6" : (zone.color || "#000000"),
          fillOpacity: isSelectedZone ? 0.12 : 0.03,
          radius: zone.radiusKm * 1000,
          weight: isSelectedZone ? 2.5 : 1.2,
          dashArray: isSelectedZone ? "None" : "4, 4"
        }).addTo(layersGroup);
      });
    }

    // 3. Draw SURROUNDING VILLAGES/LANDMARKS MARKERS
    surroundingPlaces.forEach((place) => {
      const placeCoords = getCoordsForPlace(place.name, centerCoords);
      const isSelected = mode === "customer" && selectedLocName === place.name;
      const isUnlocked = mode === "admin" ? place.distance <= adminDistance : true;

      const suburbIconHtml = `
        <div class="flex flex-col items-center justify-center group cursor-pointer">
          <div class="w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 shadow-xs transition-all ${
            isSelected
              ? "bg-amber-500 border-white scale-125 shadow-md"
              : (mode === "admin"
                ? (isUnlocked ? "bg-emerald-500 border-white" : "bg-slate-300 border-slate-200")
                : "bg-white border-slate-400 group-hover:border-emerald-600")
          }"></div>
          <span class="text-[8px] font-bold px-1 py-0.2 rounded mt-0.5 whitespace-nowrap shadow-xs border select-none ${
            isSelected
              ? "bg-amber-50 text-amber-700 border-amber-200 font-extrabold"
              : (mode === "admin"
                ? (isUnlocked ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200")
                : "bg-white/95 text-slate-700 border-slate-200 group-hover:text-emerald-700")
          }">
            ${place.name.split(",")[0]}
          </span>
        </div>
      `;

      const suburbIcon = L.divIcon({
        html: suburbIconHtml,
        className: "custom-div-icon",
        iconSize: [80, 30],
        iconAnchor: [40, 7]
      });

      const subMarker = L.marker([placeCoords.lat, placeCoords.lon], { icon: suburbIcon }).addTo(layersGroup);
      
      subMarker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (mode === "admin" && onAdminLocationChange) {
          onAdminLocationChange(place.name);
        } else if (mode === "customer" && equipment) {
          setSelectedLocName(place.name);
          setSelectedLocDistance(place.distance);
          if (onCustomerLocationChange) {
            const feeDetails = getDeliveryFeeForDistance(equipment, place.distance, zones);
            onCustomerLocationChange(place.name, feeDetails.fee);
          }
        }
      });
    });

    // 4. Draw SELECTED CUSTOMER FARM SITE pin
    if (mode === "customer" && selectedLocName) {
      const clientCoords = getCoordsForPlace(selectedLocName, centerCoords);
      const customerIconHtml = `
        <div class="flex flex-col items-center justify-center animate-bounce">
          <div class="relative">
            <span class="absolute -inset-2 bg-amber-500/40 rounded-full animate-pulse"></span>
            <span class="text-xl">📍</span>
          </div>
          <span class="text-[8px] font-black uppercase text-white bg-amber-500 px-1 py-0.2 rounded shadow-xs whitespace-nowrap mt-0.5">
            YOUR FARM
          </span>
        </div>
      `;

      const customerMarkerIcon = L.divIcon({
        html: customerIconHtml,
        className: "custom-div-icon",
        iconSize: [60, 44],
        iconAnchor: [30, 36]
      });

      const customerMarker = L.marker([clientCoords.lat, clientCoords.lon], { icon: customerMarkerIcon }).addTo(layersGroup);
      customerMarker.bindPopup(`<b>Farm Destination:</b><br/>${selectedLocName}<br/>Distance: ${selectedLocDistance} KM`);
    }

    // 5. Draw LIVE DEVICE GEOLOCATION pin
    if (devicePin) {
      const deviceIconHtml = `
        <div class="flex flex-col items-center justify-center">
          <div class="relative">
            <span class="absolute -inset-2 bg-blue-500/35 rounded-full animate-ping"></span>
            <div class="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] shadow border border-white">
              📱
            </div>
          </div>
          <span class="text-[7px] font-bold text-white bg-blue-600 px-1 py-0.1 rounded shadow-xs whitespace-nowrap mt-0.5">
            MY DEVICE (${devicePin.distance} KM)
          </span>
        </div>
      `;

      const deviceMarkerIcon = L.divIcon({
        html: deviceIconHtml,
        className: "custom-div-icon",
        iconSize: [60, 40],
        iconAnchor: [30, 20]
      });

      L.marker([devicePin.lat, devicePin.lon], { icon: deviceMarkerIcon }).addTo(layersGroup);
    }

  }, [centerName, zones, adminDistance, mode, selectedLocName, devicePin, selectedZoneId]);

  // Handle adding new delivery zone
  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName) return;

    const colors = [
      "rgba(139, 92, 246, 0.15)", // purple
      "rgba(59, 130, 246, 0.15)", // blue
      "rgba(14, 165, 233, 0.15)", // sky
      "rgba(236, 72, 153, 0.15)", // pink
      "rgba(20, 184, 166, 0.15)"  // teal
    ];
    const chosenColor = colors[zones.length % colors.length];

    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      name: newZoneName,
      radiusKm: Number(newZoneRadius),
      deliveryFee: Number(newZoneFee),
      color: chosenColor
    };

    const updated = [...zones, newZone].sort((a, b) => a.radiusKm - b.radiusKm);
    setZones(updated);
    setSelectedZoneId(newZone.id);
    setNewZoneName("");
  };

  // Delete zone
  const handleDeleteZone = (id: string) => {
    const updated = zones.filter(z => z.id !== id);
    setZones(updated);
    if (selectedZoneId === id) {
      setSelectedZoneId(updated[0]?.id || null);
    }
  };

  // Edit current zone radius/fee
  const handleUpdateCurrentZone = (field: "radiusKm" | "deliveryFee" | "name", value: any) => {
    if (!selectedZoneId) return;
    const updated = zones.map(z => {
      if (z.id === selectedZoneId) {
        return { ...z, [field]: value };
      }
      return z;
    }).sort((a, b) => a.radiusKm - b.radiusKm);
    setZones(updated);
  };

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const activeFeeResult = equipment ? getDeliveryFeeForDistance(equipment, selectedLocDistance, zones) : { fee: 0, zoneName: "", outside: false };

  return (
    <div id="geofencing-module" className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E8E6E1] dark:border-slate-800 overflow-hidden shadow-xs space-y-4">
      
      {/* Dynamic Header */}
      <div className="bg-[#3E5C31]/5 dark:bg-emerald-500/10 px-4 py-3.5 border-b border-[#E8E6E1] dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Navigation className="h-4 w-4 text-[#3E5C31] dark:text-emerald-400 animate-pulse" />
          <h3 className="font-extrabold text-xs text-[#2D2D2A] dark:text-slate-100 uppercase tracking-wider font-sans">
            {mode === "admin" 
              ? "Service Coverage Live GIS" 
              : (mode === "owner" ? "Hyperlocal Geofence Zone Editor" : "Interactive Delivery Geofence Map")}
          </h3>
        </div>
        <span className="text-[10px] bg-[#3E5C31] dark:bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-extrabold shadow-xs">
          📍 {displayCenterShortName} Region
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Real Interactive Leaflet Map Container */}
        <div className="relative">
          <div 
            ref={mapContainerRef}
            className="w-full h-[320px] bg-[#FAF8F5] dark:bg-slate-950 rounded-2xl border border-[#E8E6E1] dark:border-slate-800 overflow-hidden relative z-0"
          />

          {isGeocoding && (
            <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-1 z-10 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              Resolving address...
            </div>
          )}

          <p className="text-[9.5px] text-[#8A867E] dark:text-slate-400 text-center italic mt-2 flex items-center justify-center gap-1">
            <Info className="h-3 w-3 inline shrink-0" />
            {mode === "admin" 
              ? "💡 Click anywhere on the map to set a custom Admin center, or click on a village node."
              : (mode === "customer" 
                ? "💡 Click anywhere on the map to place your Farm site, or click on a village node."
                : "💡 Drag slider controls below to resize rings and automatically adjust pricing.")
            }
          </p>
        </div>

        {/* ==================================== CUSTOMER METRIC INSIGHTS ==================================== */}
        {mode === "customer" && equipment && (
          <div className="bg-[#FAF7F2] dark:bg-slate-800/50 p-3.5 rounded-2xl border border-[#E8E6E1] dark:border-slate-800 space-y-2.5">
            <div className="flex justify-between items-start text-xs border-b border-[#E8E6E1] dark:border-slate-800 pb-2">
              <div>
                <span className="text-[9px] font-bold text-[#8A867E] dark:text-slate-400 uppercase block">Delivery Site</span>
                <span className="font-extrabold text-[#2D2D2A] dark:text-slate-200 text-xs flex items-center mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500 mr-1 shrink-0" />
                  {selectedLocName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-[#8A867E] dark:text-slate-400 uppercase block">Distance to site</span>
                <span className="font-extrabold text-[#2D2D2A] dark:text-slate-200 text-xs">{selectedLocDistance} KM</span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-[#E8E6E1] dark:border-slate-800 shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  🛡️ Hyperlocal Delivery Shield Matches
                </span>
                <span className="font-extrabold text-xs text-[#2D2D2A] dark:text-slate-200">{activeFeeResult.zoneName}</span>
                {activeFeeResult.outside && (
                  <p className="text-[8px] text-[#8A867E] dark:text-slate-400 leading-tight mt-0.5">
                    *Exceeds basic limits. Out-of-geofence extended surcharge of ₹40/KM has been added.
                  </p>
                )}
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-lg font-black text-[#3E5C31] dark:text-emerald-400 block">₹{activeFeeResult.fee}</span>
                <span className="text-[8px] text-[#8A867E] dark:text-slate-400 block font-bold leading-none uppercase">delivery rate</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================== ADMIN MAP INSIGHTS ==================================== */}
        {mode === "admin" && (
          <div className="bg-[#FAF7F2] dark:bg-slate-800/50 p-3.5 rounded-2xl border border-[#E8E6E1] dark:border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-[9px] font-black text-[#8A867E] dark:text-slate-400 uppercase block">Active Boundary</span>
                <span className="text-xs font-black text-[#3E5C31] dark:text-emerald-400 mt-0.5">
                  {adminDistance} KM Radius from {displayCenterShortName}
                </span>
              </div>
              <div className="bg-[#3E5C31]/10 dark:bg-emerald-500/20 text-[#3E5C31] dark:text-emerald-400 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase">
                {surroundingPlaces.filter(p => p.isActive).length} / {surroundingPlaces.length} Unlocked
              </div>
            </div>

            {/* List of mapped places and lock statuses */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {surroundingPlaces.map(place => (
                <div 
                  key={place.name}
                  className={`p-2 rounded-xl border flex items-center justify-between text-[9px] font-bold ${
                    place.isActive
                      ? "bg-white dark:bg-slate-900 text-[#3E5C31] dark:text-emerald-300 border-[#E8E6E1] dark:border-slate-800"
                      : "bg-[#FAF7F2]/40 dark:bg-slate-950/40 text-slate-400 border-dashed border-[#E8E6E1] dark:border-slate-800/80"
                  }`}
                >
                  <span className="truncate max-w-[100px]">{place.name} ({place.distance} KM)</span>
                  {place.isActive ? (
                    <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded">
                      <Unlock className="h-2 w-2" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-[8px] text-[#8A867E] font-bold flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                      <Lock className="h-2 w-2" /> Geofenced
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================== OWNER ZONE EDIT CONTROLS ==================================== */}
        {mode === "owner" && (
          <div className="space-y-3 pt-1">
            {/* Zone tags selector list */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-[#8A867E] dark:text-slate-400 uppercase tracking-wider block">
                Manage Delivery Geofence Rings
              </label>
              <div className="flex flex-wrap gap-1.5">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      setSelectedZoneId(zone.id);
                      setNewZoneRadius(zone.radiusKm);
                      setNewZoneFee(zone.deliveryFee);
                    }}
                    className={`text-[10px] px-2.5 py-1.5 rounded-xl font-bold border transition-all duration-200 flex items-center space-x-1 cursor-pointer ${
                      selectedZoneId === zone.id
                        ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-sm"
                        : "bg-[#FAF7F2] dark:bg-slate-800 text-[#2D2D2A] dark:text-slate-200 border-[#E8E6E1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{zone.name} ({zone.radiusKm} KM)</span>
                    <span className="font-extrabold text-opacity-95 pl-1 text-[9.5px]">₹{zone.deliveryFee}</span>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteZone(zone.id);
                      }}
                      className="ml-1.5 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full animate-pulse"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active zone adjustments sliders */}
            {selectedZone && (
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-[#E8E6E1] dark:border-slate-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-[#E8E6E1] dark:border-slate-800">
                  <span className="text-[10.5px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1 uppercase tracking-wider">
                    <Sliders className="h-3 w-3 text-blue-500 animate-pulse" /> Adjusting: {selectedZone.name}
                  </span>
                  <span className="text-[9px] text-[#8A867E] dark:text-slate-400 font-bold bg-[#FAF7F2] dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                    Hub: {displayCenterShortName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[#8A867E] dark:text-slate-400">Radius Boundary</span>
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold">{selectedZone.radiusKm} KM</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={newZoneRadius}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewZoneRadius(val);
                        handleUpdateCurrentZone("radiusKm", val);
                      }}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[#8A867E] dark:text-slate-400">Delivery Fare</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹{newZoneFee}</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="3000"
                      step="50"
                      value={newZoneFee}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewZoneFee(val);
                        handleUpdateCurrentZone("deliveryFee", val);
                      }}
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Create Custom Ring Form */}
            <form onSubmit={handleAddZone} className="border-t border-[#E8E6E1] dark:border-slate-800 pt-3.5 space-y-2.5">
              <div className="flex items-center space-x-1.5">
                <Plus className="h-3.5 w-3.5 text-[#3E5C31] dark:text-emerald-400" />
                <span className="text-[10px] font-extrabold text-[#2D2D2A] dark:text-slate-200 uppercase tracking-wider">
                  Create Custom Geofence Ring
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Zone Name (e.g. Outer Belt)"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full bg-[#FAF7F2] dark:bg-slate-850 text-[#2D2D2A] dark:text-slate-100 p-2 rounded-xl border border-[#E8E6E1] dark:border-slate-800 text-[10px] font-medium outline-none"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Radius (km)"
                    value={newZoneRadius}
                    onChange={(e) => setNewZoneRadius(Number(e.target.value))}
                    className="w-full bg-[#FAF7F2] dark:bg-slate-850 text-[#2D2D2A] dark:text-slate-100 p-2 rounded-xl border border-[#E8E6E1] dark:border-slate-800 text-[10px] font-medium outline-none"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    placeholder="Fee (₹)"
                    value={newZoneFee}
                    onChange={(e) => setNewZoneFee(Number(e.target.value))}
                    className="w-full bg-[#FAF7F2] dark:bg-slate-850 text-[#2D2D2A] dark:text-slate-100 p-2 rounded-xl border border-[#E8E6E1] dark:border-slate-800 text-[10px] font-medium outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#3E5C31]/10 text-[#3E5C31] dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-[#3E5C31]/15 font-black text-[10px] py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                Add Geo-fence Ring
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
