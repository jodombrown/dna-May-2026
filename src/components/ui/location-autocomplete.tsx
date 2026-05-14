import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SelectedLocation = {
  city: string;
  region?: string;
  countryCode: string;
  countryName: string;
  lat?: string;
  lon?: string;
  label: string;
};

interface LocationResult {
  display_name: string;
  place_id: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    state?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
}
interface LocationAutocompleteProps {
  id?: string;
  label?: string;
  value: string;
  onChange?: (location: SelectedLocation) => void;
  onSelect?: (location: SelectedLocation) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  id = 'location',
  label = 'Location',
  value,
  onChange,
  onSelect,
  placeholder = 'Search for city, country...',
  required = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searchTerm, setSearchTerm] = useState(value);
  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Using Nominatim (OpenStreetMap) - free geocoding service
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(searchTerm)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const formattedResults: LocationResult[] = data.map((item: any) => ({
            display_name: item.display_name,
            place_id: String(item.place_id),
            lat: String(item.lat),
            lon: String(item.lon),
            address: item.address || {}
          }));
          setResults(formattedResults);
          setIsOpen(formattedResults.length > 0);
        }
      } catch (error) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setSelected(null);
    // Do NOT commit value on typing; commit only on selection
  };

  // Handle result selection
  const handleResultSelect = (result: LocationResult) => {
    const addr = result.address || {};
    const city = addr.city || addr.town || addr.village || addr.hamlet || '';
    const region = addr.state || addr.region || '';
    const countryName = addr.country || '';
    const countryCode = (addr.country_code || '').toUpperCase();

    const pieces = [city, region, countryName].filter(Boolean);
    const label = pieces.length ? pieces.join(', ') : result.display_name;

    const sel: SelectedLocation = {
      city,
      region: region || undefined,
      countryCode,
      countryName,
      lat: result.lat,
      lon: result.lon,
      label,
    };

    setSelected(sel);
    setSearchTerm(label);
    onSelect?.(sel);
    onChange?.(sel);
    setIsOpen(false);
    setResults([]);
  };

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)}>
      {label && (
        <Label htmlFor={id} className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-dna-emerald" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className="pr-8"
          autoComplete="off"
        />
        
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-neutral-400" />
        )}
        
        {!isLoading && searchTerm && (
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dna-emerald" />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((result, index) => {
            // Format display for dropdown
            const parts = result.display_name.split(', ');
            const country = parts[parts.length - 1];
            const city = parts[0];
            const region = parts.length > 2 ? parts[1] : '';
            
            return (
              <button
                key={result.place_id || index}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none border-b border-neutral-100 last:border-b-0"
                onClick={() => handleResultSelect(result)}
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 text-dna-emerald flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 truncate">
                      {city}
                    </div>
                    <div className="text-xs text-neutral-500 truncate">
                      {region && `${region}, `}{country}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;