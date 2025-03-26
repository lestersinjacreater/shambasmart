// Import necessary modules from Convex and Clerk
import { httpRouter } from "convex/server"; // Convex's HTTP router for defining routes
import { httpAction } from "./_generated/server"; // Helper to wrap our HTTP handler as a Convex action
import { WebhookEvent } from "@clerk/nextjs/server"; // Clerk type for webhook events
import { Webhook } from "svix"; // Svix package for verifying webhooks
import { api } from "./_generated/api"; // Auto-generated API functions from Convex

// Create an HTTP router instance using Convex
const http = httpRouter();

// Define an HTTP route to handle Clerk webhooks
http.route({
  path: "/clerk-webhook", // URL endpoint for the webhook
  method: "POST",         // Accept only POST requests
  handler: httpAction(async (ctx, request) => {
    // Retrieve the webhook secret from environment variables.
    // This secret is used to verify that the webhook request is from Clerk.
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    // Extract required Svix headers from the incoming request.
    // These headers are necessary for verifying the webhook signature.
    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    // If any of the required Svix headers are missing, return a 400 response.
    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("No svix headers found", {
        status: 400,
      });
    }

    // Parse the JSON payload from the request.
    const payload = await request.json();
    // Convert the payload to a string (required for signature verification).
    const body = JSON.stringify(payload);

    // Initialize a new Webhook instance using the webhook secret.
    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      // Verify the webhook using the body and the Svix headers.
      // This ensures that the request is authentic and from Clerk.
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      // If verification fails, log the error and return a 400 response.
      console.error("Error verifying webhook:", err);
      return new Response("Error occurred", { status: 400 });
    }

    // Extract the event type from the verified webhook event.
    const eventType = evt.type;

    // Check if the event is a "user.created" event.
    // This means that a new user has been created in Clerk.
    if (eventType === "user.created") {
      // Destructure necessary user data from the event payload.
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      // Get the primary email address from the array.
      const email = email_addresses[0].email_address;
      // Combine first name and last name into a full name, trimming any extra spaces.
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        // Run a Convex mutation to synchronize the new user data into your application's database.
        // This function (api.users.syncUser) will create or update a user record in your database.
        await ctx.runMutation(api.users.syncUser, {
          clerkId: id, // Unique Clerk user ID
          email,       // User's email address
          name,        // User's full name
          image: image_url, // URL of the user's profile image
          username: "", // Default or extracted username
          phone: "",    // Default or extracted phone number
          location: "", // Default or extracted location
        });
      } catch (error) {
        // If there's an error during the mutation, log it and return a 500 response.
        console.log("Error creating user:", error);
        return new Response("Error creating user", { status: 500 });
      }
    }

    // Return a success response if the webhook was processed without errors.
    return new Response("Webhook processed successfully", { status: 200 });
  }),
});

// Export the configured HTTP router as the default export
export default http;
