
import React from 'react';
import { platformData } from '@/data/platformData';
import { Badge } from '@/components/ui/badge';

const PlatformLayers = () => {
  const layerColors = {
    "User Interface Layer": "bg-dna-copper text-white",
    "Community Layer": "bg-dna-emerald text-white",
    "Investment Layer": "bg-dna-gold text-dna-forest",
    "Data Layer": "bg-dna-forest text-white"
  };

  return (
    <div className="space-y-6">
      {platformData.platform_layers.map((layer, index) => (
        <div key={index} className="border-l-4 border-dna-copper pl-4">
          <h3 className="font-semibold text-dna-forest mb-3">{layer.layer}</h3>
          <div className="flex flex-wrap gap-2">
            {layer.components.map((component, compIndex) => (
              <Badge 
                key={compIndex} 
                variant="secondary"
                className={layerColors[layer.layer as keyof typeof layerColors] || "bg-neutral-200"}
              >
                {component}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlatformLayers;
