import { mutation } from "./_generated/server";

export const clearAllTables = mutation({
  handler: async (ctx) => {
    // Clear all messages
    const messages = await ctx.db.query("messages").collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Clear all room members
    const roomMembers = await ctx.db.query("roomMembers").collect();
    for (const member of roomMembers) {
      await ctx.db.delete(member._id);
    }

    // Clear all rooms
    const rooms = await ctx.db.query("rooms").collect();
    for (const room of rooms) {
      await ctx.db.delete(room._id);
    }

    // Clear all users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    return { success: true, message: "Database cleared successfully" };
  },
});