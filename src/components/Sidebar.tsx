import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { User, Room } from '../types';
import { MessageCircle, Users, Plus, Search, Settings } from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  selectedRoom: Room | null;
  onRoomSelect: (room: Room) => void;
  onCreateRoom: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  selectedRoom,
  onRoomSelect,
  onCreateRoom,
}) => {
  const rooms = useQuery(api.rooms.getUserRooms, { userId: currentUser._id });

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getRoomDisplayName = (room: Room) => {
    if (room.type === 'direct' && room.otherParticipants?.length) {
      return room.otherParticipants[0].name;
    }
    return room.name;
  };

  const getRoomAvatar = (room: Room) => {
    if (room.type === 'direct' && room.otherParticipants?.length) {
      const otherUser = room.otherParticipants[0];
      return otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.name}`;
    }
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${room.name}`;
  };

  const truncateMessage = (message: string, maxLength: number = 35) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full sidebar-gradient">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCreateRoom}
              className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover-lift"
              title="New conversation"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Current User */}
        <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-2xl border border-gray-200/50">
          <div className="relative">
            <img
              src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full ring-2 ring-white shadow-sm"
            />
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
              currentUser.isOnline ? 'status-online' : 'status-offline'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{currentUser.name}</p>
            <p className="text-sm text-gray-500">
              {currentUser.isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2">
          {rooms?.map((room) => (
            <div
              key={room._id}
              onClick={() => onRoomSelect(room)}
              className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 mb-2 hover-lift ${
                selectedRoom?._id === room._id 
                  ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={getRoomAvatar(room)}
                    alt={getRoomDisplayName(room)}
                    className="w-14 h-14 rounded-full shadow-sm"
                  />
                  {room.type === 'direct' && room.otherParticipants?.[0]?.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 status-online rounded-full" />
                  )}
                  {room.type === 'group' && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 truncate text-base">
                      {getRoomDisplayName(room)}
                    </p>
                    {room.lastMessageTime && (
                      <span className="text-xs text-gray-500 font-medium">
                        {formatTime(room.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {room.lastMessage ? truncateMessage(room.lastMessage) : 'Start a conversation...'}
                    </p>
                    {room.unreadCount && room.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-semibold shadow-sm">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {rooms?.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 mb-6">Start chatting with your friends and colleagues</p>
            <button
              onClick={onCreateRoom}
              className="btn-primary text-white px-6 py-3 rounded-xl font-semibold"
            >
              Start Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};