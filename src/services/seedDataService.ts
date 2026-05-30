export interface SeedUser {
  id: string;
  full_name: string;
  email: string;
  diaspora_identity: string;
  /** Primary origin country, ISO code, sourced from member_heritage (BD038). */
  primary_origin_country: string;
  country_of_residence: string;
  last_seen_at: string;
}

export interface SeedConnection {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
}

export interface SeedPost {
  id: string;
  author_id: string;
  content: string;
  pillar: string;
  created_at: string;
}

export interface SeedEvent {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  start_time: string;
  created_at: string;
}

// Seed data import structure
export interface SeedDataImport {
  profiles: SeedUser[];
  connections: SeedConnection[];
  posts: SeedPost[];
  events: SeedEvent[];
}

// Generic record type for CSV conversion
type CsvRecord = Record<string, string | number | boolean | null | undefined>;
type CsvDataset = Record<string, CsvRecord[]>;

export const seedDataService = {
  // Export data as JSON or CSV - temporarily disabled due to TypeScript issues
  async exportData(format: 'json' | 'csv' = 'json') {
    // TODO: Implement export functionality once TypeScript issues are resolved
    return {
      profiles: [],
      connections: [],
      posts: [],
      events: []
    };
  },

  // Clear all seeded data - temporarily disabled
  async clearSeedData() {
    return { success: true, message: 'Function temporarily disabled' };
  },

  // Import seed data - temporarily disabled
  async importSeedData(data: SeedDataImport) {
    return {
      success: true,
      message: 'Function temporarily disabled',
      results: {
        profiles: [],
        connections: [],
        posts: [],
        events: []
      }
    };
  },

  // Helper methods - temporarily disabled
  async insertSeedProfiles(profiles: SeedUser[]) {
    return [];
  },

  async insertSeedConnections(connections: SeedConnection[]) {
    return [];
  },

  async insertSeedPosts(posts: SeedPost[]) {
    return [];
  },

  async insertSeedEvents(events: SeedEvent[]) {
    return [];
  },

  // Convert data to CSV format
  convertToCSV(data: CsvDataset): Record<string, string> {
    const csvData: Record<string, string> = {};

    Object.keys(data).forEach(table => {
      const rows = data[table];
      if (rows.length === 0) {
        csvData[table] = '';
        return;
      }

      const headers = Object.keys(rows[0]);
      const csvRows = [
        headers.join(','),
        ...rows.map((row) =>
          headers.map(header =>
            JSON.stringify(row[header] ?? '')
          ).join(',')
        )
      ];

      csvData[table] = csvRows.join('\n');
    });

    return csvData;
  },

  // Download data as file
  downloadData(data: CsvDataset | string, filename: string, format: 'json' | 'csv' = 'json') {
    const content = format === 'json' 
      ? JSON.stringify(data, null, 2)
      : typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      
    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};