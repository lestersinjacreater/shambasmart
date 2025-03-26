import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table stores authenticated user details.
  users: defineTable({
    clerkId: v.string(),              // Unique identifier from Clerk.
    username: v.string(),             // User's display name.
    email: v.string(),                // User's email address.
    phone: v.string(),                // Contact number.
    location: v.string(),             // Geographic location (e.g., county or region in Kenya).
    role: v.union(v.literal("user"), v.literal("admin")), // User role.
    image: v.optional(v.string()),    // Optional profile image URL.
  }).index("by_clerk_id", ["clerkId"]),

  // Predictions table stores yield prediction records.
  predictions: defineTable({
    userId: v.id("users"),            // Reference to the user who made the prediction.
    cropType: v.string(),             // Type of crop (e.g., maize, beans).
    plantingDate: v.number(),         // Planting date as a Unix timestamp.
    yieldPrediction: v.string(),      // The predicted yield (could be a numeric value with units or a textual description).
    harvestDate: v.number(),          // Estimated harvest date as a Unix timestamp.
    predictionData: v.optional(v.string()), // Optional additional prediction data (as a JSON string, for example).
  }).index("by_user_id", ["userId"]),

  // Feedback table stores user feedback regarding predictions.
  feedback: defineTable({
    predictionId: v.id("predictions"), // Reference to the associated prediction.
    userId: v.id("users"),             // Reference to the user submitting the feedback.
    accuracyRating: v.number(),        // Rating (e.g., 1 to 5).
    comment: v.optional(v.string()),   // Optional comment about the prediction.
    actualYield: v.optional(v.string()), // Optional actual yield value reported by the user.
  }).index("by_prediction_id", ["predictionId"]),
});
