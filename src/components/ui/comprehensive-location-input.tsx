import React from 'react';
import LocationTypeahead from '@/components/location/LocationTypeahead';

interface ComprehensiveLocationInputProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  showLabel?: boolean;
  icon?: boolean;
}

// This component now uses the global geocoding API via LocationTypeahead
const ComprehensiveLocationInput: React.FC<ComprehensiveLocationInputProps> = ({
  id,
  label = 'Location',
  value,
  onChange,
  placeholder = 'Search for any location...',
  required = false,
  showLabel = true,
}) => {
  return (
    <div className="space-y-2">
      {showLabel && label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <LocationTypeahead
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export default ComprehensiveLocationInput;
