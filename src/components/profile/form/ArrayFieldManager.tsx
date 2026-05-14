
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface ArrayFieldManagerProps {
  label: string;
  items: string[];
  newItem: string;
  placeholder: string;
  badgeColor?: string;
  onNewItemChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (item: string) => void;
}

const ArrayFieldManager: React.FC<ArrayFieldManagerProps> = ({
  label,
  items,
  newItem,
  placeholder,
  badgeColor = "text-neutral-700 border-neutral-300",
  onNewItemChange,
  onAddItem,
  onRemoveItem,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddItem();
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 mb-2">
        <Input
          value={newItem}
          onChange={(e) => onNewItemChange(e.target.value)}
          placeholder={placeholder}
          onKeyPress={handleKeyPress}
        />
        <Button type="button" onClick={onAddItem} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={index} variant="outline" className={`${badgeColor} group relative`}>
            {item}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-1 h-4 w-4 p-0 rounded-full hover:bg-red-100 opacity-70 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemoveItem(item)}
            >
              <Minus className="w-3 h-3 text-red-600" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ArrayFieldManager;
