import { authenticate } from "../shopify.server";
import { hasActiveSubscription } from "../lib/subscription.server";
import { redirect } from "react-router";

export const loader = async ({ request }) => {
  const result = await authenticate.admin(request, {
    isOnline: true,
  });

  if (!result?.session?.isOnline) {
    throw new Response("Online session required", { status: 401 });
  }

  const { admin } = result;

  const isSubscribed = await hasActiveSubscription(admin);

  if (!isSubscribed) {
    throw redirect("/app/billing/subscribe");
  }

  throw redirect("/app/varhide");
};

export default function AppIndex() {
  return null;
}
