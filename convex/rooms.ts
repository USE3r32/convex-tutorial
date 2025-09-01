import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createRoom = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("direct"), v.literal("group")),
    participants: v.array(v.id("users")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // For direct messages, check if room already exists
    if (args.type === "direct" && args.participants.length === 2) {
      const existingRoom = await ctx.db
        .query("rooms")
        .filter((q) => 
          q.and(
            q.eq(q.field("type"), "direct"),
            q.eq(q.field("participants"), args.participants)
          )
        )
        .first();

      if (existingRoom) {
        return existingRoom._id;
      }
    }

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      type: args.type,
      participants: args.participants,
      createdBy: args.createdBy,
    });

    // Add room members
    for (const participantId of args.participants) {
      await ctx.db.insert("roomMembers", {
        roomId,
        userId: participantId,
        joinedAt: Date.now(),
        role: participantId === args.createdBy ? "admin" : "member",
      });
    }

    return roomId;
  },
});

export const getUserRooms = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const roomMembers = await ctx.db
      .query("roomMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const rooms = await Promise.all(
      roomMembers.map(async (member) => {
        const room = await ctx.db.get(member.roomId);
        if (!room) return null;

        // Get other participants for direct messages
        const otherParticipants = await Promise.all(
          room.participants
            .filter(id => id !== args.userId)
            .map(id => ctx.db.get(id))
        );

        // Get unread count
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .order("desc")
          .first();

        const unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .filter((q) => 
            q.gt(q.field("timestamp"), member.lastReadAt || 0)
          )
          .collect();

        return {
          ...room,
          otherParticipants: otherParticipants.filter(Boolean),
          lastMessage,
          unreadCount: unreadCount.length,
          memberInfo: member,
        };
      })
    );

    return rooms
      .filter(Boolean)
      .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
  },
});

export const getRoomById = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const participants = await Promise.all(
      room.participants.map(id => ctx.db.get(id))
    );

    return {
      ...room,
      participants: participants.filter(Boolean),
    };
  },
});