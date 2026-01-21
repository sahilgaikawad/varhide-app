import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
    const { topic, payload } = await authenticate.webhook(request);

    console.log("🔔 Subscription webhook:", topic);
    console.log(payload);

    // Here you would:
    // - update DB
    // - mark subscription ACTIVE / CANCELLED

    return new Response("OK");
};
