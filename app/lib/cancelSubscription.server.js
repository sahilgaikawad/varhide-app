export async function cancelSubscription(admin) {
    const response = await admin.graphql(
        `#graphql
    mutation CancelSubscription($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription {
          id
          status
        }
        userErrors {
          message
        }
      }
    }
    `,
        {
            variables: {
                id: "gid://shopify/AppSubscription/YOUR_ID_HERE",
            },
        }
    );

    const json = await response.json();

    if (json.data.appSubscriptionCancel.userErrors.length > 0) {
        throw new Error(
            json.data.appSubscriptionCancel.userErrors[0].message
        );
    }

    return true;
}
