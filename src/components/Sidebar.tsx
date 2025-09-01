import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { User, Room } from '../types';
import { MessageCircle, Users, Plus } from 'lucide-react';

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

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
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

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <button
            onClick={onCreateRoom}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Current User */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full"
            />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              currentUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{currentUser.name}</p>
            <p className="text-sm text-gray-500">
              {currentUser.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {rooms?.map((room) => (
          <div
            key={room._id}
            onClick={() => onRoomSelect(room)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedRoom?._id === room._id ? 'bg-blue-50 border-blue-200' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={getRoomAvatar(room)}
                  alt={getRoomDisplayName(room)}
                  className="w-12 h-12 rounded-full"
                />
                {room.type === 'direct' && room.otherParticipants?.[0]?.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                )}
                {room.type === 'group' && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Users className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 truncate">
                    {getRoomDisplayName(room)}
                  </p>
                  {room.lastMessageTime && (
                    <span className="text-xs text-gray-500">
                      {formatTime(room.lastMessageTime)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 truncate">
                    {room.lastMessage || 'No messages yet'}
                  </p>
                  {room.unreadCount && room.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {room.unreadCount > 99 ? '99+' : room.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {rooms?.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No conversations yet</p>
            <p className="text-sm">Start a new conversation to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};