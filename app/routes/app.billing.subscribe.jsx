import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { createAppSubscription } from "../lib/billing.server";

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request, {
        isOnline: true,
    });

    const confirmationUrl = await createAppSubscription(
        admin,
        session.shop
    );

    // 🔥 TOP-LEVEL redirect (Shopify safe)
    throw redirect(confirmationUrl);
};

export default function BillingSubscribe() {
    return null;
}
