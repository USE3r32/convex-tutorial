import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { faker } from "@faker-js/faker";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { CreateRoomModal } from "./components/CreateRoomModal";
import { User, Room } from "./types";
import { MessageCircle } from "lucide-react";

// For demo purposes - in production, you'd have proper authentication
const CURRENT_USER_EMAIL = "current@user.com";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const users = useQuery(api.users.getAllUsers);
  const createUser = useMutation(api.users.createUser);
  const updateUserStatus = useMutation(api.users.updateUserStatus);

  // Initialize current user
  useEffect(() => {
    const initializeUser = async () => {
      if (!users) return;
      
      let user = users.find(u => u.email === CURRENT_USER_EMAIL);
      
      if (!user) {
        // Create demo user
        const userId = await createUser({
          name: getOrSetFakeName(),
          email: CURRENT_USER_EMAIL,
        });
        
        // Fetch the created user
        const newUsers = await new Promise<typeof users>((resolve) => {
          const checkUsers = () => {
            const updatedUsers = users?.find(u => u._id === userId);
            if (updatedUsers) {
              resolve(users);
            } else {
              setTimeout(checkUsers, 100);
            }
          };
          checkUsers();
        });
        
        user = newUsers?.find(u => u._id === userId);
      }
      
      if (user) {
        setCurrentUser(user);
        // Set user as online
        await updateUserStatus({ userId: user._id, isOnline: true });
      }
    };

    initializeUser();
  }, [users, createUser, updateUserStatus]);

  // Create demo users if they don't exist
  useEffect(() => {
    const createDemoUsers = async () => {
      if (!users || users.length > 1) return;
      
      const demoUsers = [
        { name: "Alice Johnson", email: "alice@demo.com" },
        { name: "Bob Smith", email: "bob@demo.com" },
        { name: "Carol Davis", email: "carol@demo.com" },
        { name: "David Wilson", email: "david@demo.com" },
      ];
      
      for (const demoUser of demoUsers) {
        const existingUser = users.find(u => u.email === demoUser.email);
        if (!existingUser) {
          await createUser(demoUser);
        }
      }
    };
    
    createDemoUsers();
  }, [users, createUser]);

  // Set user offline on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUser) {
        updateUserStatus({ userId: currentUser._id, isOnline: false });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser, updateUserStatus]);

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar
        currentUser={currentUser}
        selectedRoom={selectedRoom}
        onRoomSelect={setSelectedRoom}
        onCreateRoom={() => setShowCreateModal(true)}
      />
      
      {selectedRoom ? (
        <ChatWindow room={selectedRoom} currentUser={currentUser} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Welcome to Convex Chat
            </h2>
            <p className="text-gray-500 mb-6">
              Select a conversation to start messaging
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start New Conversation
            </button>
          </div>
        </div>
      )}
      
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

function getOrSetFakeName() {
  const NAME_KEY = "convex_chat_name";
  const name = sessionStorage.getItem(NAME_KEY);
  if (!name) {
    const newName = faker.person.firstName();
    sessionStorage.setItem(NAME_KEY, newName);
    return newName;
  }
  return name;
}
