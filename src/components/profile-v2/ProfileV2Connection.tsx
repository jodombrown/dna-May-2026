import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Heart, Languages, Users, Globe, Plane, Target, MapPin, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  CONNECTION_TYPE_OPTIONS, 
  isAfricanLanguage,
  RETURN_INTENTIONS_OPTIONS,
  AFRICAN_CAUSES_OPTIONS,
  VISIT_FREQUENCY_OPTIONS 
} from '@/data/profileOptions';

interface ProfileV2ConnectionProps {
  profile: {
    diaspora_status?: string | null;
    languages?: string[] | null;
    diaspora_networks?: string[] | null;
    engagement_intentions?: string[] | null;
    ethnic_heritage?: string[] | null;
    return_intentions?: string | null;
    african_causes?: string[] | null;
    africa_visit_frequency?: string | null;
  };
  isOwner: boolean;
  onEdit?: () => void;
}

const ProfileV2Connection: React.FC<ProfileV2ConnectionProps> = ({
  profile,
  isOwner,
  onEdit,
}) => {
  const navigate = useNavigate();
  
  // Get label from value for select options
  const getConnectionLabel = (value: string | null | undefined) => {
    if (!value) return null;
    const option = CONNECTION_TYPE_OPTIONS.find(o => o.value === value);
    return option ? option.label : value;
  };

  const getReturnIntentionsLabel = (value: string | null | undefined) => {
    if (!value) return null;
    const option = RETURN_INTENTIONS_OPTIONS.find(o => o.value === value);
    return option ? option.label : value;
  };

  const getVisitFrequencyLabel = (value: string | null | undefined) => {
    if (!value) return null;
    const option = VISIT_FREQUENCY_OPTIONS.find(o => o.value === value);
    return option ? option.label : value;
  };

  const getCauseLabel = (value: string) => {
    const option = AFRICAN_CAUSES_OPTIONS.find(o => o.value === value);
    return option ? option.label : value;
  };

  // Filter to only show African languages in this section
  const africanLanguages = (profile.languages || []).filter(isAfricanLanguage);

  const hasContent = profile.diaspora_status || 
    africanLanguages.length > 0 ||
    (profile.diaspora_networks && profile.diaspora_networks.length > 0) ||
    (profile.engagement_intentions && profile.engagement_intentions.length > 0) ||
    (profile.ethnic_heritage && profile.ethnic_heritage.length > 0) ||
    profile.return_intentions ||
    (profile.african_causes && profile.african_causes.length > 0) ||
    profile.africa_visit_frequency;

  // Hide empty section for public viewers
  if (!hasContent && !isOwner) {
    return null;
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      navigate('/dna/profile/edit');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          My Connection to Africa
        </CardTitle>
        {isOwner && (
          <Button variant="ghost" size="sm" onClick={handleEdit} className="h-8 w-8 p-0">
            <Edit className="w-4 h-4" />
            <span className="sr-only">Edit connection</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {hasContent ? (
          <div className="space-y-4">
            {/* Connection Type */}
            {profile.diaspora_status && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Connection Type</div>
                  <div className="font-medium text-sm">{getConnectionLabel(profile.diaspora_status)}</div>
                </div>
              </div>
            )}

            {/* Ethnic Heritage */}
            {profile.ethnic_heritage && profile.ethnic_heritage.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground mb-1.5">Heritage</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.ethnic_heritage.slice(0, 4).map((heritage) => (
                      <Badge key={heritage} variant="secondary" className="text-xs">
                        {heritage}
                      </Badge>
                    ))}
                    {profile.ethnic_heritage.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.ethnic_heritage.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* African Languages */}
            {africanLanguages.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Languages className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground mb-1.5">African Languages</div>
                  <div className="flex flex-wrap gap-1.5">
                    {africanLanguages.slice(0, 5).map((lang) => (
                      <Badge key={lang} variant="secondary" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                    {africanLanguages.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{africanLanguages.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* African Causes */}
            {profile.african_causes && profile.african_causes.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground mb-1.5">Causes I Care About</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.african_causes.slice(0, 4).map((cause) => (
                      <Badge key={cause} variant="secondary" className="text-xs">
                        {getCauseLabel(cause)}
                      </Badge>
                    ))}
                    {profile.african_causes.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.african_causes.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Return Intentions & Visit Frequency - Side by side on larger screens */}
            {(profile.return_intentions || profile.africa_visit_frequency) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.return_intentions && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Return Plans</div>
                      <div className="font-medium text-sm">{getReturnIntentionsLabel(profile.return_intentions)}</div>
                    </div>
                  </div>
                )}
                {profile.africa_visit_frequency && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Plane className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Visit Frequency</div>
                      <div className="font-medium text-sm">{getVisitFrequencyLabel(profile.africa_visit_frequency)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Diaspora Networks */}
            {profile.diaspora_networks && profile.diaspora_networks.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground mb-1.5">Networks</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.diaspora_networks.slice(0, 4).map((network) => (
                      <Badge key={network} variant="secondary" className="text-xs">
                        {network}
                      </Badge>
                    ))}
                    {profile.diaspora_networks.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.diaspora_networks.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Engagement Intentions */}
            {profile.engagement_intentions && profile.engagement_intentions.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground mb-1.5">Here to</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.engagement_intentions.slice(0, 4).map((intention) => (
                      <Badge key={intention} variant="secondary" className="text-xs">
                        {intention}
                      </Badge>
                    ))}
                    {profile.engagement_intentions.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.engagement_intentions.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          isOwner && (
            <button
              onClick={handleEdit}
              className="w-full text-left p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors"
            >
              <p className="text-muted-foreground italic text-sm">
                🌍 Share how you connect to Africa, whether diaspora, continental, or ally.
              </p>
            </button>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileV2Connection;