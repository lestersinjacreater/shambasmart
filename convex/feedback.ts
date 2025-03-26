import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mutation to submit feedback for a specific prediction.
 * Links the feedback to both the prediction and the user providing it.
 */
export const submitFeedback = mutation({
  args: {
    predictionId: v.id("predictions"), // ID of the prediction being reviewed
    userId: v.id("users"),             // ID of the user providing feedback
    accuracyRating: v.number(),        // Rating of the prediction's accuracy (e.g., 1 to 5)
    comment: v.optional(v.string()),   // Optional textual feedback
    actualYield: v.optional(v.string()), // Optional actual yield reported by the user
  },
  handler: async (ctx, args) => {
    // Insert the feedback into the 'feedback' table
    const feedbackId = await ctx.db.insert("feedback", {
      predictionId: args.predictionId,
      userId: args.userId,
      accuracyRating: args.accuracyRating,
      comment: args.comment,
      actualYield: args.actualYield,
    });
    return feedbackId;
  },
});

/**
 * Query to retrieve all feedback associated with a specific prediction.
 */
export const getFeedbackByPrediction = query({
  args: {
    predictionId: v.id("predictions"), // ID of the prediction
  },
  handler: async (ctx, args) => {
    // Fetch feedback entries linked to the given predictionId
    const feedbackEntries = await ctx.db
      .query("feedback")
      .withIndex("by_prediction_id", (q) => q.eq("predictionId", args.predictionId))
      .collect();
    return feedbackEntries;
  },
});
