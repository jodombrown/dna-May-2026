import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Send, Users, MessageSquare, ArrowLeft } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';

const MobileMessagingView = () => {
  const { isMobile } = useMobile();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  // Mock data for now - replace with real data once backend is ready
  const mockConversations = [
    {
      id: '1',
      name: 'Amara Okafor',
      lastMessage: 'Looking forward to collaborating on the fintech project!',
      timestamp: '2 min ago',
      unread: 2,
      online: true
    },
    {
      id: '2', 
      name: 'Dr. Kwame Asante',
      lastMessage: 'Thanks for the introduction to the investment team.',
      timestamp: '1 hour ago',
      unread: 0,
      online: false
    },
    {
      id: '3',
      name: 'Zara Hassan',
      lastMessage: 'The healthcare innovation summit was fantastic!',
      timestamp: '3 hours ago', 
      unread: 1,
      online: true
    }
  ];

  const mockMessages = [
    {
      id: '1',
      senderId: 'other',
      content: 'Hi! I saw your profile and would love to discuss potential collaboration opportunities.',
      timestamp: '10:30 AM'
    },
    {
      id: '2', 
      senderId: 'me',
      content: 'That sounds great! I\'d be interested to learn more about your work in fintech.',
      timestamp: '10:35 AM'
    },
    {
      id: '3',
      senderId: 'other', 
      content: 'Looking forward to collaborating on the fintech project!',
      timestamp: '10:52 AM'
    }
  ];

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // TODO: Implement actual message sending via messaging service
      setMessageText('');
    }
  };

  const currentConversation = mockConversations.find(c => c.id === selectedConversation);

  if (!isMobile) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">Messages Coming Soon</h3>
        <p className="text-neutral-600">Real-time messaging will be available in the next update.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {!selectedConversation ? (
        // Conversations List
        <div className="flex-1">
          <div className="p-4 border-b bg-white">
            <h2 className="text-xl font-semibold text-dna-forest mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Search conversations"
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {mockConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className="p-4 border-b border-neutral-100 hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-dna-emerald text-white">
                        {conversation.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-dna-forest truncate">
                        {conversation.name}
                      </p>
                      <span className="text-xs text-neutral-500">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unread > 0 && (
                    <div className="bg-dna-copper text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {mockConversations.length === 0 && (
              <div className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-600 mb-2">No conversations yet</h3>
                <p className="text-neutral-500">Start connecting with other members to begin messaging.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Chat View
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b bg-white flex items-center space-x-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBackToList}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-dna-emerald text-white">
                {currentConversation?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-dna-forest">
                {currentConversation?.name}
              </p>
              <p className="text-sm text-neutral-600">
                {currentConversation?.online ? 'Online' : 'Last seen recently'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.senderId === 'me'
                      ? 'bg-dna-copper text-white'
                      : 'bg-neutral-100 text-neutral-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === 'me' ? 'text-white/80' : 'text-neutral-500'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-dna-copper hover:bg-dna-gold text-white min-w-[48px] min-h-[48px]"
                disabled={!messageText.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMessagingView;