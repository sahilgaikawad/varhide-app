/**
 * Create app subscription for Varhide
 */
export async function createAppSubscription(admin) {
    const response = await admin.graphql(
        `#graphql
    mutation CreateSubscription(
      $name: String!
      $lineItems: [AppSubscriptionLineItemInput!]!
      $returnUrl: URL!
      $trialDays: Int!
    ) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        trialDays: $trialDays
        lineItems: $lineItems
      ) {
        confirmationUrl
        userErrors {
          message
        }
      }
    }
    `,
        {
            variables: {
                name: "Varhide Pro",
                trialDays: 7,
                returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing/callback`,
                lineItems: [
                    {
                        plan: {
                            appRecurringPricingDetails: {
                                price: {
                                    amount: 9.99,
                                    currencyCode: "USD",
                                },
                                interval: "EVERY_30_DAYS",
                            },
                        },
                    },
                ],
            },
        }
    );

    const json = await response.json();
    const data = json.data.appSubscriptionCreate;

    if (data.userErrors?.length) {
        throw new Error(data.userErrors[0].message);
    }

    return data.confirmationUrl;
}
