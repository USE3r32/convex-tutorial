import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Room, User, Message } from '../types';
import { Send, Phone, Video, MoreVertical, Users } from 'lucide-react';

interface ChatWindowProps {
  room: Room;
  currentUser: User;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ room, currentUser }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useQuery(api.messages.getRoomMessages, { roomId: room._id });
  const roomDetails = useQuery(api.rooms.getRoomById, { roomId: room._id });
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when room changes
    markAsRead({ roomId: room._id, userId: currentUser._id });
  }, [room._id, currentUser._id, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage({
        roomId: room._id,
        senderId: currentUser._id,
        content: newMessage.trim(),
      });
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatMessageTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRoomDisplayName = () => {
    if (room.type === 'direct' && room.otherParticipants?.length) {
      return room.otherParticipants[0].name;
    }
    return room.name;
  };

  const getRoomAvatar = () => {
    if (room.type === 'direct' && room.otherParticipants?.length) {
      const otherUser = room.otherParticipants[0];
      return otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.name}`;
    }
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${room.name}`;
  };

  const getOnlineStatus = () => {
    if (room.type === 'direct' && room.otherParticipants?.length) {
      return room.otherParticipants[0].isOnline ? 'Online' : 'Offline';
    }
    return `${roomDetails?.participants?.length || 0} members`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={getRoomAvatar()}
                alt={getRoomDisplayName()}
                className="w-10 h-10 rounded-full"
              />
              {room.type === 'direct' && room.otherParticipants?.[0]?.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{getRoomDisplayName()}</h2>
              <p className="text-sm text-gray-500">{getOnlineStatus()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message: Message, index) => {
          const isOwnMessage = message.senderId === currentUser._id;
          const showAvatar = !isOwnMessage && (
            index === 0 || 
            messages[index - 1]?.senderId !== message.senderId
          );

          return (
            <div
              key={message._id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                {showAvatar && !isOwnMessage && (
                  <img
                    src={message.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender?.name}`}
                    alt={message.sender?.name}
                    className="w-8 h-8 rounded-full mr-2 mt-1"
                  />
                )}
                
                <div className={`${!showAvatar && !isOwnMessage ? 'ml-10' : ''}`}>
                  {!isOwnMessage && showAvatar && (
                    <p className="text-xs text-gray-500 mb-1 ml-1">
                      {message.sender?.name}
                    </p>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${getRoomDisplayName()}...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`p-2 rounded-full transition-colors ${
              newMessage.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};