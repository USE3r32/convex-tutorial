import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { faker } from "@faker-js/faker";
import { useClearDatabase } from "./utils/clearDatabase";
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
  const clearDatabase = useClearDatabase();

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
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
          <button
            onClick={clearDatabase}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            Clear Database (Fix Schema Issues)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar
        currentUser={currentUser}
        selectedRoom={selectedRoom}
        onRoomSelect={setSelectedRoom}
        onCreateRoom={() => setShowCreateModal(true)}
      />
      
      {selectedRoom ? (
        <ChatWindow room={selectedRoom} currentUser={currentUser} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Welcome to Messages
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Connect with friends and colleagues through secure, real-time messaging. Select a conversation or start a new one.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg"
            >
              Start Conversation
            </button>
          </div>
        </div>
      )}
      
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        currentUser={currentUser}
      />
      
      {/* Debug: Clear Database Button */}
      <button
        onClick={clearDatabase}
        className="fixed bottom-6 right-6 p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all duration-200 text-xs opacity-30 hover:opacity-100 shadow-lg hover-lift"
        title="Clear Database"
      >
        🗑️
      </button>
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
