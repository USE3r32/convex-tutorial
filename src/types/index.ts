import { Id } from "../../convex/_generated/dataModel";

export interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: number;
}

export interface Room {
  _id: Id<"rooms">;
  name: string;
  type: "direct" | "group";
  participants: Id<"users">[];
  lastMessage?: string;
  lastMessageTime?: number;
  createdBy: Id<"users">;
  otherParticipants?: User[];
  unreadCount?: number;
}

export interface Message {
  _id: Id<"messages">;
  roomId: Id<"rooms">;
  senderId: Id<"users">;
  content: string;
  timestamp: number;
  type: "text" | "image" | "file";
  edited?: boolean;
  editedAt?: number;
  sender?: User;
}