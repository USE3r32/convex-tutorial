import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("file"))),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      senderId: args.senderId,
      content: args.content,
      timestamp: Date.now(),
      type: args.type || "text",
    });

    // Update room's last message
    await ctx.db.patch(args.roomId, {
      lastMessage: args.content,
      lastMessageTime: Date.now(),
    });

    return messageId;
  },
});

export const getRoomMessages = query({
  args: { 
    roomId: v.id("rooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(args.limit || 50);

    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender,
        };
      })
    );

    return messagesWithSenders.reverse();
  },
});

export const markMessagesAsRead = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const roomMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => 
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (roomMember) {
      await ctx.db.patch(roomMember._id, {
        lastReadAt: Date.now(),
      });
    }
  },
});