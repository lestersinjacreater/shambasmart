import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Mutation to synchronize a user's information from Clerk into our Convex database.
 * It first checks if a user with the provided clerkId already exists.
 * If the user exists and a new role is provided (and it differs from the existing one),
 * it updates the user's role. Otherwise, it inserts a new record with a default role of "user" if not provided.
 */
export const syncUser = mutation({
  args: {
    name: v.string(),  
    clerkId: v.string(), // Unique identifier from Clerk
    username: v.string(), // User's display name
    email: v.string(), // User's email address
    phone: v.string(), // User's contact number
    location: v.string(), // Geographic location (e.g., county or region in Kenya)
    image: v.optional(v.string()), // Optional profile image URL
    // Role is optional; allowed values are "user" or "admin"
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    // Look up an existing user using the "by_clerk_id" index.
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    // If the user exists, update the role if a new role is provided and is different.
    if (existingUser) {
      if (args.role && existingUser.role !== args.role) {
        await ctx.db.patch(existingUser._id, { role: args.role });
      }
      // If the user already exists, no further action is needed.
      return;
    }

    // If no user exists, insert a new record.
    // Default to "user" role if no role is provided.
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: args.username,
      email: args.email,
      phone: args.phone,
      location: args.location,
      image: args.image,
      role: args.role || "user",
    });
  },
});

/**
 * Query to retrieve all users from the "users" table.
 */
export const getUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

/**
 * Query to retrieve a single user by their Clerk ID.
 * Uses the "by_clerk_id" index for efficient lookup.
 */
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});
