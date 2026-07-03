import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { MapPin, Sliders, Plus, Trash2, Info, Navigation, CheckCircle2, DollarSign } from "lucide-react";
import { Equipment, DeliveryZone } from "../types";

// Region neighborhoods coordinate mapping
export const LOCAL_NEIGHBORHOODS = [
  { name: "Coimbatore Central", x: 200, y: 150, desc: "City hub & main markets" },
  { name: "RS Puram", x: 160, y: 160, desc: "Commercial & residential zone" },
  { name: "Peelamedu", x: 240, y: 140, desc: "Colleges & IT Parks region" },
  { name: "Singanallur", x: 270, y: 170, desc: "Industrial & residential hub" },
  { name: "Thudiyalur", x: 175, y: 100, desc: "North agricultural gateway" },
  { name: "Sulur", x: 310, y: 200, desc: "Eastern bypass farming hub" },
  { name: "Kinathukadavu", x: 180, y: 240, desc: "Southern coconut belt" },
  { name: "Mettupalayam", x: 150, y: 50, desc: "North mountain foot farmlands" },
  { name: "Pollachi", x: 165, y: 310, desc: "Junction to southern green estates" }
];

// Helper to calculate coordinates from location string
export const getCoordinates = (locationStr: string): { x: number; y: number } => {
  const norm = locationStr.toLowerCase();
  if (norm.includes("pollachi")) return { x: 165, y: 310 };
  if (norm.includes("bypass")) return { x: 250, y: 185 };
  if (norm.includes("sulur")) return { x: 310, y: 200 };
  if (norm.includes("thudiyalur")) return { x: 175, y: 100 };
  if (norm.includes("mettupalayam")) return { x: 150, y: 50 };
  if (norm.includes("kinathukadavu")) return { x: 180, y: 240 };
  if (norm.includes("singanallur")) return { x: 270, y: 170 };
  if (norm.includes("peelamedu")) return { x: 240, y: 140 };
  if (norm.includes("rs puram")) return { x: 160, y: 160 };
  return { x: 200, y: 150 }; // Default to Coimbatore Central
};

// Helper to measure pixel distance and convert to km
// Scale: 4 pixels = 1 km
export const getDistanceInKm = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  const pixels = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  return Number((pixels * 0.25).toFixed(1));
};

// Helper to match distance to delivery fee zone
export const getDeliveryFeeForDistance = (equipment: Equipment, distanceKm: number): { fee: number; zoneName: string; outside: boolean } => {
  const defaultZones: DeliveryZone[] = [
    { id: "z1-default", name: "Standard Radius", radiusKm: 15, deliveryFee: 600, color: "rgba(59, 130, 246, 0.15)" }
  ];
  const zones = equipment.deliveryZones && equipment.deliveryZones.length > 0 ? equipment.deliveryZones : defaultZones;
  
  // Sort zones by radius ascending
  const sortedZones = [...zones].sort((a, b) => a.radiusKm - b.radiusKm);
  for (const zone of sortedZones) {
    if (distanceKm <= zone.radiusKm) {
      return { fee: zone.deliveryFee, zoneName: zone.name, outside: false };
    }
  }
  
  // Outside standard zones calculate custom incremental fare
  const maxZone = sortedZones[sortedZones.length - 1];
  const extraKm = Math.ceil(distanceKm - maxZone.radiusKm);
  const extraFee = extraKm * 40; // ₹40 per extra km
  return {
    fee: maxZone.deliveryFee + extraFee,
    zoneName: "Outside Standard Zones (Extended Rate Applied)",
    outside: true
  };
};

interface GeofenceMapProps {
  mode: "owner" | "customer";
  equipment: Equipment;
  customerLocationName?: string;
  onCustomerLocationChange?: (locationName: string, fee: number) => void;
  onUpdateZones?: (zones: DeliveryZone[]) => void;
}

export default function GeofenceMap({
  mode,
  equipment,
  customerLocationName = "Coimbatore Central",
  onCustomerLocationChange,
  onUpdateZones
}: GeofenceMapProps) {
  // Coordinates setup
  const eqCoords = getCoordinates(equipment.location);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Local state for zones
  const [zones, setZones] = useState<DeliveryZone[]>(() => {
    return equipment.deliveryZones && equipment.deliveryZones.length > 0
      ? equipment.deliveryZones
      : [
          { id: "z1", name: "Immediate Neighborhood", radiusKm: 5, deliveryFee: 250, color: "rgba(16, 185, 129, 0.15)" },
          { id: "z2", name: "Coimbatore Mid-Ring", radiusKm: 15, deliveryFee: 600, color: "rgba(245, 158, 11, 0.15)" },
          { id: "z3", name: "Extended Rural Belt", radiusKm: 35, deliveryFee: 1400, color: "rgba(239, 68, 68, 0.12)" }
        ];
  });

  // Selected Location for Customer mode
  const [selectedLoc, setSelectedLoc] = useState<{ x: number; y: number }>(() => {
    return getCoordinates(customerLocationName);
  });
  
  const [selectedLocName, setSelectedLocName] = useState(customerLocationName);

  // Editor states for owner mode
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(zones[0]?.id || null);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneRadius, setNewZoneRadius] = useState(10);
  const [newZoneFee, setNewZoneFee] = useState(400);

  // Notify parent on initialization or zone updates
  useEffect(() => {
    if (mode === "owner" && onUpdateZones) {
      onUpdateZones(zones);
    }
  }, [zones, mode]);

  // Keep customer selection in sync with parent prop changes
  useEffect(() => {
    if (mode === "customer" && customerLocationName) {
      const coords = getCoordinates(customerLocationName);
      setSelectedLoc(coords);
      setSelectedLocName(customerLocationName);
      
      const distance = getDistanceInKm(coords, eqCoords);
      const feeDetails = getDeliveryFeeForDistance({ ...equipment, deliveryZones: zones }, distance);
      if (onCustomerLocationChange) {
        onCustomerLocationChange(customerLocationName, feeDetails.fee);
      }
    }
  }, [customerLocationName]);

  const activeDistance = getDistanceInKm(selectedLoc, eqCoords);
  const activeFeeResult = getDeliveryFeeForDistance({ ...equipment, deliveryZones: zones }, activeDistance);

  // Map clicks handler
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert to 400x350 scaled space
    const x = Math.round((clickX / rect.width) * 400);
    const y = Math.round((clickY / rect.height) * 350);

    if (mode === "customer") {
      // Find nearest neighborhood to display human name, or custom coordinate
      let closestNeigh = LOCAL_NEIGHBORHOODS[0];
      let minDist = Math.sqrt(Math.pow(x - closestNeigh.x, 2) + Math.pow(y - closestNeigh.y, 2));
      
      LOCAL_NEIGHBORHOODS.forEach(neigh => {
        const d = Math.sqrt(Math.pow(x - neigh.x, 2) + Math.pow(y - neigh.y, 2));
        if (d < minDist) {
          minDist = d;
          closestNeigh = neigh;
        }
      });

      const chosenName = minDist < 35 ? closestNeigh.name : `Custom Location (${getDistanceInKm({ x, y }, eqCoords)} km)`;
      setSelectedLoc({ x, y });
      setSelectedLocName(chosenName);
      
      const distance = getDistanceInKm({ x, y }, eqCoords);
      const feeDetails = getDeliveryFeeForDistance({ ...equipment, deliveryZones: zones }, distance);
      if (onCustomerLocationChange) {
        onCustomerLocationChange(chosenName, feeDetails.fee);
      }
    }
  };

  // Add new delivery zone
  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName) return;

    // Pick a semi-random color
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

  return (
    <div id="geofencing-module" className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden shadow-xs space-y-4">
      {/* Title Header */}
      <div className="bg-[#3E5C31]/5 px-4 py-3 border-b border-[#E8E6E1] flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Navigation className="h-4 w-4 text-[#3E5C31] animate-pulse" />
          <h3 className="font-black text-xs text-[#2D2D2A] uppercase tracking-wider">
            {mode === "owner" ? "Hyperlocal Geo-Fencing Editor" : "Delivery Zone Geo-Fence Map"}
          </h3>
        </div>
        <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
          Coimbatore Region
        </span>
      </div>

      {/* Primary Grid Layout */}
      <div className="p-3 space-y-3">
        {/* Interactive Vector Canvas Map */}
        <div className="relative">
          <div 
            ref={mapRef}
            onClick={handleMapClick}
            className={`w-full h-[280px] bg-[#FAF8F5] rounded-xl border border-[#E8E6E1] overflow-hidden relative ${
              mode === "customer" ? "cursor-crosshair" : "cursor-default"
            }`}
          >
            {/* Map Decorative Grid Mesh Lines */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-25 pointer-events-none">
              {Array.from({ length: 64 }).map((_, idx) => (
                <div key={idx} className="border-t border-l border-[#8A867E]/20"></div>
              ))}
            </div>

            {/* Simulated Road Lines to look like a high-end vector GIS software */}
            <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none">
              {/* NH-544 bypass line */}
              <path d="M 0,200 Q 150,180 250,185 T 400,220" fill="none" stroke="#D1CFC9" strokeWidth="4" />
              {/* Mettupalayam Highway */}
              <path d="M 200,150 L 150,50" fill="none" stroke="#D1CFC9" strokeWidth="2.5" />
              {/* Pollachi Highway */}
              <path d="M 200,150 L 165,310" fill="none" stroke="#D1CFC9" strokeWidth="2.5" />
              {/* Eastern bypass */}
              <path d="M 200,150 L 310,200" fill="none" stroke="#D1CFC9" strokeWidth="2" strokeDasharray="3 3" />
            </svg>

            {/* Neighborhood landmark node text backdrops */}
            {LOCAL_NEIGHBORHOODS.map((neigh) => (
              <button
                key={neigh.name}
                onClick={(e) => {
                  e.stopPropagation();
                  if (mode === "customer") {
                    setSelectedLoc({ x: neigh.x, y: neigh.y });
                    setSelectedLocName(neigh.name);
                    const distance = getDistanceInKm({ x: neigh.x, y: neigh.y }, eqCoords);
                    const feeDetails = getDeliveryFeeForDistance({ ...equipment, deliveryZones: zones }, distance);
                    if (onCustomerLocationChange) {
                      onCustomerLocationChange(neigh.name, feeDetails.fee);
                    }
                  }
                }}
                className={`absolute pointer-events-auto flex flex-col items-center group`}
                style={{ left: `${(neigh.x / 400) * 100}%`, top: `${(neigh.y / 350) * 100}%` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#8A867E] group-hover:bg-[#3E5C31] group-hover:scale-125 transition-all"></div>
                <span className="text-[8px] font-bold text-[#8A867E]/80 group-hover:text-[#3E5C31] bg-[#FAF8F5]/90 px-1 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)] select-none mt-0.5 whitespace-nowrap">
                  {neigh.name.replace(", Coimbatore", "")}
                </span>
              </button>
            ))}

            {/* concentric delivery zones visualization */}
            {zones.map((zone) => {
              // Convert km to pixel radius: 1 km = 4 pixels
              // Radius in percent = (radiusKm * 4) / 400 * 100
              const radiusPixels = zone.radiusKm * 4;
              return (
                <div
                  key={zone.id}
                  className="absolute rounded-full border border-dashed transition-all duration-300 pointer-events-none"
                  style={{
                    left: `${(eqCoords.x - radiusPixels) / 400 * 100}%`,
                    top: `${(eqCoords.y - radiusPixels) / 350 * 100}%`,
                    width: `${(radiusPixels * 2) / 400 * 100}%`,
                    height: `${(radiusPixels * 2) / 350 * 100}%`,
                    backgroundColor: selectedZoneId === zone.id && mode === "owner" ? "rgba(59, 130, 246, 0.08)" : zone.color || "rgba(0,0,0,0.03)",
                    borderColor: selectedZoneId === zone.id && mode === "owner" ? "#3B82F6" : "rgba(138, 134, 126, 0.4)",
                    borderWidth: selectedZoneId === zone.id && mode === "owner" ? "2px" : "1px"
                  }}
                >
                  {/* Zone radius text pointer */}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white px-1.5 py-0.2 rounded-md text-[7px] font-bold border border-[#E8E6E1] text-[#5C5952] shadow-xs">
                    {zone.name} ({zone.radiusKm} km) • ₹{zone.deliveryFee}
                  </span>
                </div>
              );
            })}

            {/* Equipment location node */}
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center"
              style={{ left: `${(eqCoords.x / 400) * 100}%`, top: `${(eqCoords.y / 350) * 100}%` }}
            >
              <div className="relative">
                <span className="absolute -inset-2 bg-emerald-500/30 rounded-full animate-ping"></span>
                <div className="w-6 h-6 bg-[#3E5C31] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md border border-white">
                  🚜
                </div>
              </div>
              <span className="text-[8px] font-black uppercase text-white bg-[#3E5C31] px-1.5 py-0.5 rounded shadow-sm mt-1 whitespace-nowrap">
                {equipment.ownerName}'s Hub
              </span>
            </div>

            {/* Customer Location marker node */}
            {mode === "customer" && (
              <div 
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300 pointer-events-none flex flex-col items-center"
                style={{ left: `${(selectedLoc.x / 400) * 100}%`, top: `${(selectedLoc.y / 350) * 100}%` }}
              >
                <div className="relative">
                  <span className="absolute -inset-1.5 bg-amber-500/40 rounded-full animate-pulse"></span>
                  <MapPin className="h-6 w-6 text-amber-500 drop-shadow-md" fill="#FFF" />
                </div>
                <span className="text-[7px] font-black uppercase text-white bg-amber-500 px-1 py-0.5 rounded shadow-xs mt-0.5 whitespace-nowrap">
                  Delivery Destination
                </span>
              </div>
            )}
          </div>
          
          {mode === "customer" && (
            <p className="text-[9px] text-[#8A867E] text-center italic mt-1.5">
              💡 Drag your finger or click anywhere on the map grid to pin your exact farm site location.
            </p>
          )}
        </div>

        {/* ==================================== CUSTOMER VIEW METRICS ==================================== */}
        {mode === "customer" && (
          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E6E1] space-y-2.5">
            <div className="flex justify-between items-start text-xs border-b border-[#E8E6E1] pb-2">
              <div>
                <span className="text-[9px] font-bold text-[#8A867E] uppercase block">Selected Location</span>
                <span className="font-black text-[#2D2D2A] text-xs flex items-center">
                  <MapPin className="h-3 w-3 text-amber-500 mr-1 shrink-0" />
                  {selectedLocName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-[#8A867E] uppercase block">Air Distance</span>
                <span className="font-extrabold text-[#2D2D2A] text-xs">{activeDistance} km from owner</span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-[#E8E6E1]">
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-600 block">
                  🛡️ Hyperlocal Geofenced Zone Match
                </span>
                <span className="font-bold text-xs text-[#2D2D2A]">{activeFeeResult.zoneName}</span>
                {activeFeeResult.outside && (
                  <p className="text-[8px] text-[#8A867E] leading-tight">
                    *Site is outside standard limits. An incremental out-of-zone surcharge of ₹40/km is included.
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-[#3E5C31]">₹{activeFeeResult.fee}</span>
                <span className="text-[8px] text-[#8A867E] block font-bold leading-none">delivery fee</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================== OWNER EDITOR CONTROLS ==================================== */}
        {mode === "owner" && (
          <div className="space-y-3 pt-1">
            {/* Zone list selectors */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-[#8A867E] uppercase tracking-wider block">
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
                    className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold border transition flex items-center space-x-1 cursor-pointer ${
                      selectedZoneId === zone.id
                        ? "bg-[#3B82F6] text-white border-[#3B82F6]"
                        : "bg-[#FAF7F2] text-[#2D2D2A] border-[#E8E6E1] hover:bg-slate-100"
                    }`}
                  >
                    <span>{zone.name} ({zone.radiusKm} km)</span>
                    <span className="font-extrabold text-opacity-90 pl-1">₹{zone.deliveryFee}</span>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteZone(zone.id);
                      }}
                      className="ml-1.5 p-0.5 hover:bg-black/10 rounded-full"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active zone adjustments sliders */}
            {selectedZone && (
              <div className="bg-slate-50 border border-[#E8E6E1] rounded-xl p-3.5 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-[#E8E6E1]">
                  <span className="text-[10px] font-black text-slate-700 flex items-center gap-1">
                    <Sliders className="h-3 w-3" /> Adjusting: {selectedZone.name}
                  </span>
                  <span className="text-[9px] text-[#8A867E] font-medium">Zone Center: {equipment.location}</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[#8A867E]">Radius Bound</span>
                      <span className="text-blue-600 font-extrabold">{selectedZone.radiusKm} km</span>
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
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[#8A867E]">Delivery Fare</span>
                      <span className="text-emerald-600 font-extrabold">₹{newZoneFee}</span>
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
                      className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Add new zone quick form */}
            <form onSubmit={handleAddZone} className="border-t border-[#E8E6E1] pt-3.5 space-y-2.5">
              <div className="flex items-center space-x-1.5">
                <Plus className="h-3.5 w-3.5 text-[#3E5C31]" />
                <span className="text-[10px] font-extrabold text-[#2D2D2A] uppercase tracking-wider">
                  Create Custom Geofence Ring
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Zone Name (e.g. Village, Outer)"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1] text-[10px]"
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
                    className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1] text-[10px]"
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
                    className="w-full bg-[#FAF7F2] text-[#2D2D2A] p-2 rounded-lg border border-[#E8E6E1] text-[10px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#3E5C31]/10 text-[#3E5C31] hover:bg-[#3E5C31]/15 font-black text-[10px] py-2 rounded-lg transition uppercase tracking-wider cursor-pointer"
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
