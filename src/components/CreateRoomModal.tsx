import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { User } from '../types';
import { X, Users, MessageCircle, Search } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [roomType, setRoomType] = useState<'direct' | 'group'>('direct');
  const [roomName, setRoomName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const users = useQuery(api.users.getAllUsers);
  const createRoom = useMutation(api.rooms.createRoom);

  const availableUsers = users?.filter(user => 
    user._id !== currentUser._id &&
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) return;

    try {
      const participants = [currentUser._id, ...selectedUsers];
      const name = roomType === 'direct' 
        ? `${currentUser.name} & ${availableUsers.find(u => u._id === selectedUsers[0])?.name}`
        : roomName || 'New Group';

      await createRoom({
        name,
        type: roomType,
        participants,
        createdBy: currentUser._id,
      });

      // Reset form
      setRoomName('');
      setSelectedUsers([]);
      setRoomType('direct');
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (roomType === 'direct') {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers(prev => 
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateRoom} className="p-6">
          {/* Room Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Conversation Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRoomType('direct')}
                className={`p-4 border-2 rounded-2xl flex flex-col items-center space-y-3 transition-all duration-200 hover-lift ${
                  roomType === 'direct'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <MessageCircle className="w-8 h-8" />
                <span className="text-sm font-semibold">Direct Message</span>
              </button>
              <button
                type="button"
                onClick={() => setRoomType('group')}
                className={`p-4 border-2 rounded-2xl flex flex-col items-center space-y-3 transition-all duration-200 hover-lift ${
                  roomType === 'group'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Users className="w-8 h-8" />
                <span className="text-sm font-semibold">Group Chat</span>
              </button>
            </div>
          </div>

          {/* Group Name Input */}
          {roomType === 'group' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                required={roomType === 'group'}
              />
            </div>
          )}

          {/* Search Users */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* User Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {roomType === 'direct' ? 'Select Contact' : 'Add Members'}
              {roomType === 'group' && selectedUsers.length > 0 && (
                <span className="text-blue-600 font-normal ml-2">
                  ({selectedUsers.length} selected)
                </span>
              )}
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-2xl custom-scrollbar">
              {availableUsers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => toggleUserSelection(user._id)}
                  className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                    selectedUsers.includes(user._id) ? 'bg-blue-50 border-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        alt={user.name}
                        className="w-12 h-12 rounded-full shadow-sm"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        user.isOnline ? 'status-online' : 'status-offline'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        {user.isOnline ? 'Active now' : 'Offline'}
                      </p>
                    </div>
                    {selectedUsers.includes(user._id) && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {availableUsers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedUsers.length === 0}
              className={`flex-1 px-6 py-3 rounded-2xl transition-all duration-200 font-semibold ${
                selectedUsers.length > 0
                  ? 'btn-primary text-white shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};