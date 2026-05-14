import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDashboardPreferences, DashboardModule } from '@/hooks/useDashboardPreferences';
import { MateMasie } from '@/components/icons/adinkra';

import { GripVertical, X } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MODULE_LABELS: Record<DashboardModule, { label: string; description: string }> = {
  upcoming_events: { label: 'Upcoming Events', description: 'Events you might be interested in' },
  recommended_spaces: { label: 'Recommended Spaces', description: 'Projects and communities for you' },
  open_needs: { label: 'Open Needs', description: 'Ways you can contribute' },
  suggested_people: { label: 'Suggested People', description: 'People to connect with' },
  recent_stories: { label: 'Recent Stories', description: 'Latest updates from the network' },
  resume_section: { label: 'Resume Your Work', description: 'Quick access to your last activity' },
};

function SortableModule({ 
  module, 
  isVisible, 
  onToggle, 
  isSystem 
}: { 
  module: DashboardModule; 
  isVisible: boolean; 
  onToggle: (module: DashboardModule) => void;
  isSystem: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const moduleInfo = MODULE_LABELS[module];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 border rounded-lg ${isDragging ? 'bg-accent' : 'bg-card'}`}
    >
      <div {...attributes} {...listeners} className="cursor-move">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{moduleInfo.label}</h4>
        <p className="text-sm text-muted-foreground">{moduleInfo.description}</p>
      </div>
      <Switch
        checked={isVisible}
        onCheckedChange={() => onToggle(module)}
        disabled={isSystem}
      />
    </div>
  );
}

export default function DashboardSettings() {
  const navigate = useNavigate();
  const { preferences, updatePreferences, isLoading, isUpdating } = useDashboardPreferences();
  const [localModules, setLocalModules] = useState<DashboardModule[]>(preferences.visible_modules);
  const [localDensity, setLocalDensity] = useState(preferences.density);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localModules.indexOf(active.id as DashboardModule);
      const newIndex = localModules.indexOf(over.id as DashboardModule);
      const reordered = arrayMove(localModules, oldIndex, newIndex);
      setLocalModules(reordered);
    }
  };

  const handleModuleToggle = (module: DashboardModule) => {
    if (module === 'resume_section') return; // System module
    
    setLocalModules(prev => 
      prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const handleSave = () => {
    updatePreferences({
      visible_modules: localModules,
      density: localDensity,
    });
  };

  const hasChanges = 
    JSON.stringify(localModules) !== JSON.stringify(preferences.visible_modules) ||
    localDensity !== preferences.density;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 relative">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10"
        onClick={() => navigate('/dna/feed')}
        aria-label="Close settings"
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="container max-w-4xl mx-auto pb-8 px-4">
        <div className="mb-6">
          <h1 className="text-h1 font-serif flex items-center gap-2">
            <MateMasie className="h-8 w-8 text-primary" />
            Dashboard Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize your home dashboard layout and modules
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Density</CardTitle>
              <CardDescription>
                Choose how compact or spacious your dashboard should be
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={localDensity} onValueChange={(v) => setLocalDensity(v as 'standard' | 'compact')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard">Standard (Recommended)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="compact" id="compact" />
                  <Label htmlFor="compact">Compact</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Right Column Modules</CardTitle>
              <CardDescription>
                Drag to reorder, toggle to show/hide. Resume module is always visible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={localModules} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {localModules.map(module => (
                      <SortableModule
                        key={module}
                        module={module}
                        isVisible={localModules.includes(module)}
                        onToggle={handleModuleToggle}
                        isSystem={module === 'resume_section'}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setLocalModules(preferences.visible_modules);
                setLocalDensity(preferences.density);
              }}
              disabled={!hasChanges || isUpdating}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
