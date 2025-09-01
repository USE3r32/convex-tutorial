import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  }).index("by_email", ["email"]),

  rooms: defineTable({
    name: v.string(),
    type: v.union(v.literal("direct"), v.literal("group")),
    participants: v.array(v.id("users")),
    lastMessage: v.optional(v.string()),
    lastMessageTime: v.optional(v.number()),
    createdBy: v.id("users"),
  }).index("by_participant", ["participants"]),

  messages: defineTable({
    roomId: v.id("rooms"),
    senderId: v.id("users"),
    content: v.string(),
    timestamp: v.number(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("file")),
    edited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
  }).index("by_room", ["roomId", "timestamp"]),

  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
    role: v.union(v.literal("admin"), v.literal("member")),
  }).index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_user", ["roomId", "userId"]),
});