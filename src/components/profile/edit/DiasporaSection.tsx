import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, ChevronsUpDown, X, Info, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagMultiSelect } from '@/components/ui/TagMultiSelect';
import { ProfileEditSectionProps } from './types';
import { LANGUAGES } from '@/data/languages';
import { DIASPORA_NETWORK_OPTIONS } from '@/data/profileOptions';

export function DiasporaSection({
  formData,
  onUpdate,
  errors = {},
  disabled = false,
}: ProfileEditSectionProps) {
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');

  const languages = formData.languages || [];

  const handleLanguageToggle = (language: string) => {
    const normalizedLang = LANGUAGES.find(
      l => l.toLowerCase() === language.toLowerCase()
    ) || language;

    if (languages.includes(normalizedLang)) {
      onUpdate('languages', languages.filter((l: string) => l !== normalizedLang));
    } else {
      onUpdate('languages', [...languages, normalizedLang]);
    }
  };

  const removeLanguage = (language: string) => {
    onUpdate('languages', languages.filter((l: string) => l !== language));
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-dna-copper fill-dna-copper/20" />
          My Connection to Africa
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Whether diaspora, continental African, or ally, tell us how you connect
        </p>
      </CardHeader>
      <CardContent className="space-y-6">


        {/* Languages */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            Languages You Speak
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Add all languages you speak to connect across cultures</p>
              </TooltipContent>
            </Tooltip>
          </Label>

          <Popover open={languagesOpen} onOpenChange={setLanguagesOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={languagesOpen}
                className="w-full justify-between min-h-[44px]"
                disabled={disabled}
              >
                {languages.length > 0
                  ? `${languages.length} language${languages.length > 1 ? 's' : ''} selected`
                  : "Select languages..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-popover border border-border z-50" align="start">
              <Command>
                <CommandInput
                  placeholder="Search languages..."
                  value={languageSearch}
                  onValueChange={setLanguageSearch}
                />
                <CommandList className="max-h-60 overflow-auto">
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup>
                    {LANGUAGES.filter(lang =>
                      lang.toLowerCase().includes(languageSearch.toLowerCase())
                    ).map((language) => (
                      <CommandItem
                        key={language}
                        value={language}
                        onSelect={() => handleLanguageToggle(language)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            languages.some(l => l.toLowerCase() === language.toLowerCase())
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {language}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Selected languages display */}
          {languages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {languages.map((language: string) => (
                <Badge key={language} variant="secondary">
                  {language}
                  <button
                    type="button"
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                    onClick={() => removeLanguage(language)}
                    disabled={disabled}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Type to search or scroll through the list.
          </p>
        </div>

        {/* Networks */}
        <TagMultiSelect
          label="Networks & Communities"
          options={Array.from(DIASPORA_NETWORK_OPTIONS)}
          selected={formData.diaspora_networks || []}
          onChange={(values) => onUpdate('diaspora_networks', values)}
          placeholder="Select networks you're part of"
          colorClass="bg-dna-copper/10 text-dna-copper border-dna-copper/20"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}

export default DiasporaSection;
