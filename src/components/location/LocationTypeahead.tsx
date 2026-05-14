import { useEffect, useState } from 'react';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { GlobalProvider, LocationTier } from '@/lib/location/provider';
import { MapPin, Globe, Map, Building2 } from 'lucide-react';

export type LocationTypeaheadProps = {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  provider?: 'global'; // Using global geocoding by default
};

export default function LocationTypeahead({
  value = '',
  onChange,
  placeholder = 'Current location',
  provider = 'global',
}: LocationTypeaheadProps) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const { results, loading } = useLocationSearch(GlobalProvider, q, 500);

  useEffect(() => {
    if (focused && q.trim() && results.length > 0) {
      setOpen(true);
    } else if (!results.length) {
      setOpen(false);
    }
  }, [focused, q, results]);

  const pick = (label: string) => {
    setQ(label);
    onChange(label);
    setOpen(false);
  };

  const getTierIcon = (tier: LocationTier) => {
    switch (tier) {
      case 'local': return <Building2 className="w-4 h-4" />;
      case 'regional': return <Map className="w-4 h-4" />;
      case 'international': return <MapPin className="w-4 h-4" />;
      case 'global': return <Globe className="w-4 h-4" />;
    }
  };

  const getTierColor = (tier: LocationTier) => {
    switch (tier) {
      case 'local': return 'text-blue-600';
      case 'regional': return 'text-green-600';
      case 'international': return 'text-orange-600';
      case 'global': return 'text-copper-600';
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={q}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            onChange(v);
            if (v.trim()) setOpen(true);
          }}
          onFocus={() => { setFocused(true); if (results.length) setOpen(true); }}
          onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 150); }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="location-typeahead-list"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
      
      {open && results.length > 0 && (
        <div 
          id="location-typeahead-list" 
          role="listbox" 
          className="absolute z-[999] mt-1 w-full rounded-md border bg-background shadow-lg max-h-80 overflow-auto"
        >
          {results.map((opt) => (
            <button
              key={opt.id}
              role="option"
              className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(opt.label)}
            >
              <span className={getTierColor(opt.tier)}>
                {getTierIcon(opt.tier)}
              </span>
              <div className="flex-1">
                <div className="font-medium">{opt.label}</div>
                {opt.category && (
                  <div className="text-xs text-muted-foreground capitalize">
                    {opt.tier} · {opt.category}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
