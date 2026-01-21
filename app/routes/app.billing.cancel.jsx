import { authenticate } from "../shopify.server";
import { cancelSubscription } from "../lib/cancelSubscription.server";

export const action = async ({ request }) => {
    // ✅ Shopify authentication
    const { admin } = await authenticate.admin(request);

    // ✅ Cancel subscription (Shopify side)
    await cancelSubscription(admin);

    // ✅ Redirect to pricing page (React Router style)
    return new Response(null, {
        status: 302,
        headers: {
            Location: "/app/pricing",
        },
    });
};

export default function BillingCancel() {
    return null;
}
