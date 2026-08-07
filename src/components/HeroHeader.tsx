import { useState } from "react";
import { Calendar, ChevronDown, MapPin, Zap, Building2, Sun, Wind } from "lucide-react";
import { plantLocations, PlantLocation } from "@/data/energyData";

interface HeroHeaderProps {
  selectedPlant: PlantLocation;
  onSelectPlant: (plant: PlantLocation) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function HeroHeader({
  selectedPlant,
  onSelectPlant,
  selectedDate,
  onSelectDate,
}: HeroHeaderProps) {
  const [plantDropdownOpen, setPlantDropdownOpen] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-[#F7F5F0] to-[#EBF4EE] border border-[#E6E1D7] p-8 shadow-xs mb-6">
      {/* Background Subtle Industrial Energy Vector Illustration */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-25 dark:opacity-15 flex items-center justify-end pr-6">
        <svg
          className="h-full max-h-56 w-auto text-[#1B4D3E]"
          viewBox="0 0 600 240"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {/* Transmission Tower */}
          <path d="M 480 220 L 520 40 L 560 220 M 495 150 L 545 150 M 505 100 L 535 100 M 480 150 L 560 150" />
          {/* Wind Turbine 1 */}
          <path d="M 380 220 L 380 90 M 380 90 L 350 70 M 380 90 L 410 70 M 380 90 L 380 120" strokeWidth="2" />
          <circle cx="380" cy="90" r="4" fill="currentColor" />
          {/* Wind Turbine 2 */}
          <path d="M 430 220 L 430 110 M 430 110 L 410 95 M 430 110 L 450 95 M 430 110 L 430 135" strokeWidth="1.8" />
          <circle cx="430" cy="110" r="3" fill="currentColor" />
          {/* Solar Panel Grid */}
          <path d="M 220 180 L 320 180 L 340 220 L 200 220 Z M 220 180 L 200 220 M 270 180 L 260 220 M 320 180 L 340 220 M 210 200 L 330 200" />
          {/* Steel Plant Silhouettes & Chimney */}
          <path d="M 80 220 L 80 140 L 140 140 L 140 220 M 140 170 L 190 170 L 190 220 M 100 140 L 100 100 L 120 100 L 120 140" fill="currentColor" fillOpacity="0.1" />
          <path d="M 105 100 C 105 70 125 60 110 40" strokeDasharray="3 3" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Left Hero Content */}
        <div className="max-w-2xl">
          {/* Greeting */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF8F5] border border-[#E6E1D7] px-3.5 py-1 text-xs font-semibold text-[#1F2937] mb-3">
            <Sun className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
            <span>Good morning, Energy Team! 👋</span>
          </div>

          {/* Main Heading */}
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#1F2937] leading-[1.15]">
            <span>Optimize energy.</span>
            <br />
            <span className="text-[#1B4D3E]">Protect production.</span>
          </h2>

          {/* Subtitle */}
          <p className="mt-3 text-sm sm:text-base text-[#6B7280] leading-relaxed max-w-xl">
            AI-powered energy orchestration that continuously balances cost, carbon and reliability across industrial energy sources.
          </p>
        </div>

        {/* Right Selectors: Date & Plant Dropdown */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Date Selector */}
          <div className="flex items-center gap-2 rounded-2xl border border-[#E6E1D7] bg-white px-3.5 py-2 text-xs font-medium text-[#1F2937] shadow-2xs hover:border-[#1B4D3E]/40 transition-colors cursor-pointer">
            <Calendar className="h-4 w-4 text-[#1B4D3E]" />
            <select
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-[#1F2937] cursor-pointer"
            >
              <option value="8 Aug 2026">8 Aug 2026</option>
              <option value="9 Aug 2026">9 Aug 2026</option>
              <option value="10 Aug 2026">10 Aug 2026</option>
            </select>
          </div>

          {/* Plant Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPlantDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-2xl border border-[#1B4D3E]/20 bg-white px-4 py-2 text-xs font-semibold text-[#1F2937] shadow-2xs hover:border-[#1B4D3E] hover:bg-[#FAF8F5] transition-all"
            >
              <div className="grid h-6 w-6 place-items-center rounded-lg bg-[#1B4D3E] text-white">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div className="text-left leading-tight">
                <p className="font-bold text-[#1F2937]">{selectedPlant.name}</p>
                <p className="text-[10px] text-[#6B7280]">{selectedPlant.location}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-[#6B7280] ml-1" />
            </button>

            {plantDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#E6E1D7] bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Select Industrial Plant
                </p>
                {plantLocations.map((plant) => (
                  <button
                    key={plant.id}
                    onClick={() => {
                      onSelectPlant(plant);
                      setPlantDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                      plant.id === selectedPlant.id
                        ? "bg-[#E8F5E9] font-bold text-[#1B4D3E]"
                        : "hover:bg-[#FAF8F5] text-[#1F2937]"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{plant.name}</p>
                      <p className="text-[10px] text-[#6B7280]">{plant.location}</p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {plant.demandMW} MW
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
