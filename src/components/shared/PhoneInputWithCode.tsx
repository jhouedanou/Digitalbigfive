"use client";

import { useState } from "react";

const COUNTRY_CODES = [
  { code: "+225", country: "CI", label: "🇨🇮 Côte d'Ivoire (+225)" },
  { code: "+221", country: "SN", label: "🇸🇳 Sénégal (+221)" },
  { code: "+223", country: "ML", label: "🇲🇱 Mali (+223)" },
  { code: "+226", country: "BF", label: "🇧🇫 Burkina Faso (+226)" },
  { code: "+228", country: "TG", label: "🇹🇬 Togo (+228)" },
  { code: "+229", country: "BJ", label: "🇧🇯 Bénin (+229)" },
  { code: "+227", country: "NE", label: "🇳🇪 Niger (+227)" },
  { code: "+224", country: "GN", label: "🇬🇳 Guinée (+224)" },
  { code: "+237", country: "CM", label: "🇨🇲 Cameroun (+237)" },
  { code: "+241", country: "GA", label: "🇬🇦 Gabon (+241)" },
  { code: "+242", country: "CG", label: "🇨🇬 Congo (+242)" },
  { code: "+243", country: "CD", label: "🇨🇩 RD Congo (+243)" },
  { code: "+235", country: "TD", label: "🇹🇩 Tchad (+235)" },
  { code: "+236", country: "CF", label: "🇨🇫 Centrafrique (+236)" },
  { code: "+240", country: "GQ", label: "🇬🇶 Guinée Éq. (+240)" },
  { code: "+212", country: "MA", label: "🇲🇦 Maroc (+212)" },
  { code: "+216", country: "TN", label: "🇹🇳 Tunisie (+216)" },
  { code: "+213", country: "DZ", label: "🇩🇿 Algérie (+213)" },
  { code: "+234", country: "NG", label: "🇳🇬 Nigeria (+234)" },
  { code: "+233", country: "GH", label: "🇬🇭 Ghana (+233)" },
  { code: "+254", country: "KE", label: "🇰🇪 Kenya (+254)" },
  { code: "+250", country: "RW", label: "🇷🇼 Rwanda (+250)" },
  { code: "+257", country: "BI", label: "🇧🇮 Burundi (+257)" },
  { code: "+261", country: "MG", label: "🇲🇬 Madagascar (+261)" },
  { code: "+230", country: "MU", label: "🇲🇺 Maurice (+230)" },
  { code: "+222", country: "MR", label: "🇲🇷 Mauritanie (+222)" },
  { code: "+245", country: "GW", label: "🇬🇼 Guinée-Bissau (+245)" },
  { code: "+239", country: "ST", label: "🇸🇹 São Tomé (+239)" },
  { code: "+269", country: "KM", label: "🇰🇲 Comores (+269)" },
  { code: "+253", country: "DJ", label: "🇩🇯 Djibouti (+253)" },
  { code: "+33", country: "FR", label: "🇫🇷 France (+33)" },
  { code: "+32", country: "BE", label: "🇧🇪 Belgique (+32)" },
  { code: "+41", country: "CH", label: "🇨🇭 Suisse (+41)" },
  { code: "+1", country: "CA", label: "🇨🇦 Canada (+1)" },
  { code: "+1", country: "US", label: "🇺🇸 États-Unis (+1)" },
  { code: "+44", country: "GB", label: "🇬🇧 Royaume-Uni (+44)" },
];

interface PhoneInputWithCodeProps {
  name: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  label?: string;
  optional?: boolean;
}

export default function PhoneInputWithCode({
  name,
  required = false,
  placeholder = "77 000 00 00",
  className = "",
  label = "Téléphone",
  optional = true,
}: PhoneInputWithCodeProps) {
  const [countryCode, setCountryCode] = useState("+225");
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{" "}
        {optional && (
          <span className="text-gray-400 font-normal">(facultatif)</span>
        )}
        {required && !optional && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D] bg-white min-w-[140px]"
          aria-label="Indicatif pays"
        >
          {COUNTRY_CODES.map((c, i) => (
            <option key={`${c.code}-${c.country}-${i}`} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
          placeholder={placeholder}
          required={required}
        />
      </div>
      {/* Hidden input combining code + number for form submission */}
      <input
        type="hidden"
        name={name}
        value={phoneNumber ? `${countryCode} ${phoneNumber}` : ""}
      />
    </div>
  );
}
