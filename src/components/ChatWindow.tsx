import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Room, User, Message } from '../types';
import { Send, Phone, Video, MoreVertical, Users, Smile, Paperclip, Info } from 'lucide-react';

interface ChatWindowProps {
  room: Room;
  currentUser: User;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ room, currentUser }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
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
      const user = room.otherParticipants[0];
      return user.isOnline ? 'Active now' : `Last seen ${formatMessageTime(user.lastSeen)}`;
    }
    return `${roomDetails?.participants?.length || 0} members`;
  };

  const shouldShowAvatar = (message: Message, index: number) => {
    if (message.senderId === currentUser._id) return false;
    if (index === 0) return true;
    const prevMessage = messages?.[index - 1];
    return !prevMessage || prevMessage.senderId !== message.senderId;
  };

  const shouldShowTimestamp = (message: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages?.[index - 1];
    if (!prevMessage) return true;
    
    const timeDiff = message.timestamp - prevMessage.timestamp;
    return timeDiff > 5 * 60 * 1000; // 5 minutes
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={getRoomAvatar()}
                alt={getRoomDisplayName()}
                className="w-12 h-12 rounded-full shadow-sm"
              />
              {room.type === 'direct' && room.otherParticipants?.[0]?.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 status-online rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{getRoomDisplayName()}</h2>
              <p className="text-sm text-gray-500">{getOnlineStatus()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
              <Info className="w-5 h-5" />
            </button>
            <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-1 custom-scrollbar">
        {messages?.map((message: Message, index) => {
          const isOwnMessage = message.senderId === currentUser._id;
          const showAvatar = shouldShowAvatar(message, index);
          const showTimestamp = shouldShowTimestamp(message, index);

          return (
            <div key={message._id} className="message-animate">
              {showTimestamp && (
                <div className="flex justify-center my-4">
                  <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>
              )}
              
              <div className={`flex items-end space-x-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1`}>
                {!isOwnMessage && (
                  <div className="w-8 h-8 flex-shrink-0">
                    {showAvatar && (
                      <img
                        src={message.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender?.name}`}
                        alt={message.sender?.name}
                        className="w-8 h-8 rounded-full shadow-sm"
                      />
                    )}
                  </div>
                )}
                
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                  {!isOwnMessage && showAvatar && (
                    <p className="text-xs text-gray-500 mb-1 ml-3 font-medium">
                      {message.sender?.name}
                    </p>
                  )}
                  
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      isOwnMessage
                        ? 'chat-bubble-sent rounded-br-md ml-auto'
                        : 'chat-bubble-received rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8"></div>
            <div className="bg-gray-200 rounded-2xl px-4 py-3">
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${getRoomDisplayName()}...`}
              className="w-full px-4 py-3 pr-24 bg-gray-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`p-3 rounded-2xl transition-all duration-200 ${
              newMessage.trim()
                ? 'btn-primary text-white shadow-lg'
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