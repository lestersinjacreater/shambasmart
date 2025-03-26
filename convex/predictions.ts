import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mutation to add a new yield prediction.
 * Associates the prediction with the user making it.
 */
export const addPrediction = mutation({
  args: {
    userId: v.id("users"),          // ID of the user making the prediction
    cropType: v.string(),           // Type of crop (e.g., maize, beans)
    plantingDate: v.number(),       // Planting date as a Unix timestamp
    yieldPrediction: v.string(),    // Predicted yield
    harvestDate: v.number(),        // Estimated harvest date as a Unix timestamp
    predictionData: v.optional(v.string()), // Optional additional data in JSON string format
  },
  handler: async (ctx, args) => {
    // Insert the new prediction into the 'predictions' table
    const predictionId = await ctx.db.insert("predictions", {
      userId: args.userId,
      cropType: args.cropType,
      plantingDate: args.plantingDate,
      yieldPrediction: args.yieldPrediction,
      harvestDate: args.harvestDate,
      predictionData: args.predictionData,
    });
    return predictionId;
  },
});

/**
 * Query to retrieve all predictions made by a specific user.
 */
export const getPredictionsByUser = query({
  args: {
    userId: v.id("users"), // ID of the user
  },
  handler: async (ctx, args) => {
    // Fetch predictions associated with the given userId
    const predictions = await ctx.db
      .query("predictions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    return predictions;
  },
});
