import { authenticate } from "../shopify.server";
import { hasActiveSubscription } from "../lib/subscription.server";
import { redirect } from "react-router";

export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request, {
        isOnline: true,
    });

    const isActive = await hasActiveSubscription(admin);

    if (!isActive) {
        throw redirect("/app/pricing");
    }

    throw redirect("/app");
};

export default function BillingCallback() {
    return null;
}
