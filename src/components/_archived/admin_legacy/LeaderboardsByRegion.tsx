import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, MapPin, Briefcase } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

interface LeaderboardUser {
  user_id: string;
  full_name: string;
  avatar_url: string;
  score: number;
  rank: number;
  location: string;
}

const LeaderboardsByRegion = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [boardType, setBoardType] = useState<string>('total');

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedRegion, selectedSector, boardType]);

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_leaderboard', {
        board_type: boardType,
        country_filter: selectedRegion === 'all' ? null : selectedRegion,
        sector_filter: selectedSector === 'all' ? null : selectedSector,
        limit_count: 50
      });

      if (error) throw error;
      setLeaderboardData(data || []);
    } catch (error) {
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-neutral-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = ['bg-yellow-500', 'bg-neutral-400', 'bg-amber-600'];
      return <Badge className={`${colors[rank - 1]} text-white`}>#{rank}</Badge>;
    }
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const regions = [
    { value: 'all', label: 'All Regions' },
    { value: 'Nigeria', label: 'Nigeria' },
    { value: 'Ghana', label: 'Ghana' },
    { value: 'Kenya', label: 'Kenya' },
    { value: 'South Africa', label: 'South Africa' },
    { value: 'United States', label: 'United States' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Canada', label: 'Canada' },
  ];

  const sectors = [
    { value: 'all', label: 'All Sectors' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Education', label: 'Education' },
    { value: 'Agriculture', label: 'Agriculture' },
    { value: 'Energy', label: 'Energy' },
  ];

  const boardTypes = [
    { value: 'total', label: 'Total Score' },
    { value: 'connect', label: 'Connect Score' },
    { value: 'collaborate', label: 'Collaborate Score' },
    { value: 'contribute', label: 'Contribute Score' },
  ];

  if (loading) {
    return <Loader label="Loading leaderboards..." />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={boardType} onValueChange={setBoardType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select board type" />
          </SelectTrigger>
          <SelectContent>
            {boardTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.value} value={region.value}>
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select sector" />
          </SelectTrigger>
          <SelectContent>
            {sectors.map((sector) => (
              <SelectItem key={sector.value} value={sector.value}>
                {sector.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={fetchLeaderboards} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 10 Leaders
          </h3>
          <div className="space-y-3">
            {leaderboardData.slice(0, 10).map((user) => (
              <div key={user.user_id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {getRankIcon(user.rank)}
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>
                    {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.full_name || 'Unknown User'}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{user.location || 'Location not set'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg">{user.score.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Extended Rankings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Extended Rankings</h3>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto mobile-table-responsive">
            {leaderboardData.slice(10, 50).map((user) => (
              <div key={user.user_id} className="flex items-center gap-3 p-2 border rounded">
                {getRankBadge(user.rank)}
                
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || 'Unknown User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.location}</p>
                </div>

                <p className="text-sm font-semibold">{user.score.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-dna-forest">{leaderboardData.length}</p>
            <p className="text-sm text-muted-foreground">Total Ranked Users</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {leaderboardData.length > 0 ? leaderboardData[0]?.score.toLocaleString() : '0'}
            </p>
            <p className="text-sm text-muted-foreground">Highest Score</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-copper-600">
              {leaderboardData.length > 0 
                ? Math.round(leaderboardData.reduce((sum, user) => sum + user.score, 0) / leaderboardData.length).toLocaleString()
                : '0'
              }
            </p>
            <p className="text-sm text-muted-foreground">Average Score</p>
          </div>
        </Card>
      </div>

      {leaderboardData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No leaderboard data available for the selected filters</p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardsByRegion;