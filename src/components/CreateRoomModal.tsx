import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { User } from '../types';
import { X, Users, MessageCircle } from 'lucide-react';

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

  const users = useQuery(api.users.getAllUsers);
  const createRoom = useMutation(api.rooms.createRoom);

  const availableUsers = users?.filter(user => user._id !== currentUser._id) || [];

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleCreateRoom} className="p-6">
          {/* Room Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Conversation Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRoomType('direct')}
                className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                  roomType === 'direct'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm font-medium">Direct Message</span>
              </button>
              <button
                type="button"
                onClick={() => setRoomType('group')}
                className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                  roomType === 'group'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-6 h-6" />
                <span className="text-sm font-medium">Group Chat</span>
              </button>
            </div>
          </div>

          {/* Group Name Input */}
          {roomType === 'group' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={roomType === 'group'}
              />
            </div>
          )}

          {/* User Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {roomType === 'direct' ? 'Select Contact' : 'Add Members'}
              {roomType === 'group' && (
                <span className="text-gray-500 font-normal">
                  ({selectedUsers.length} selected)
                </span>
              )}
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {availableUsers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => toggleUserSelection(user._id)}
                  className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUsers.includes(user._id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        {user.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    {selectedUsers.includes(user._id) && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedUsers.length === 0}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                selectedUsers.length > 0
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
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