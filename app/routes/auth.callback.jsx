import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    // 🔥 Completes ONLINE session
    return authenticate.callback(request);
};
