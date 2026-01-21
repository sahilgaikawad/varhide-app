/**
 * Check if shop has an active app subscription
 * Shopify considers only ACTIVE subscriptions as valid
 *
 * @param {object} admin - Shopify Admin GraphQL client
 * @returns {boolean}
 */
export async function hasActiveSubscription(admin) {
  try {
    const response = await admin.graphql(
      `#graphql
      query ActiveSubscriptions {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
          }
        }
      }
      `
    );

    const json = await response.json();

    const subscriptions =
      json?.data?.currentAppInstallation?.activeSubscriptions ?? [];

    // ✅ Only ACTIVE subscriptions are valid
    return subscriptions.some(
      (subscription) => subscription.status === "ACTIVE"
    );
  } catch (error) {
    console.error("❌ Error checking subscription:", error);
    return false;
  }
}
