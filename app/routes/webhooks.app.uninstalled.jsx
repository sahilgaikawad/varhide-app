import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const { shop, session, topic } = await authenticate.webhook(request);

    console.log(`📦 Webhook received: ${topic} for ${shop}`);

    /**
     * Shopify may send uninstall webhook multiple times.
     * Session might already be deleted — so always handle safely.
     */
    if (session?.shop) {
      await db.session.deleteMany({
        where: { shop: session.shop },
      });

      console.log(`🧹 Sessions cleaned for shop: ${session.shop}`);
    }

    /**
     * 🔮 Future-ready:
     * If later you store subscription / app-specific data in DB,
     * clean it here using shop identifier.
     */

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("❌ Uninstall webhook error:", error);

    // Shopify expects 200 even if cleanup already happened
    return new Response("Webhook error handled", { status: 200 });
  }
};
