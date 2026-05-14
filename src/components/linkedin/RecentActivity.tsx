import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark, Users, Calendar } from 'lucide-react';

const RecentActivity = () => {
  const menuItems = [
    { icon: Users, label: 'Network', href: '/app/connect' },
    { icon: Calendar, label: 'Dashboard', href: '/app/dashboard' },
    { icon: Bookmark, label: 'Home', href: '/app/dashboard' },
  ];

  return (
    <Card className="bg-white border border-neutral-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-900">Recent</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center py-2 px-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded transition-colors"
            >
              <item.icon className="w-4 h-4 mr-3 text-neutral-400" />
              {item.label}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;