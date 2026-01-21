// app/routes/webhooks.inventory_levels.update.jsx
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

  console.log("========== INVENTORY WEBHOOK ==========");
  console.log("Shop:", shop);
  console.log("Topic:", topic);
  console.log("Payload:", payload);
  console.log("=======================================");

  try {
    const inventoryItemId = payload.inventory_item_id;
    const available = payload.available;

    if (!inventoryItemId) {
      console.log("No inventory_item_id in payload, skipping");
      return new Response("ok");
    }

    // 1) InventoryItem ka GraphQL ID banaye
    const inventoryItemGid = `gid://shopify/InventoryItem/${inventoryItemId}`;
    console.log("InventoryItem GID:", inventoryItemGid);

    // 2) InventoryItem se Variant ID nikalna
    const variantQuery = `#graphql
      query GetVariantFromInventoryItem($inventoryItemId: ID!) {
        inventoryItem(id: $inventoryItemId) {
          id
          variant {
            id
            title
          }
        }
      }
    `;

    const variantResponse = await admin.graphql(variantQuery, {
      variables: {
        inventoryItemId: inventoryItemGid,
      },
    });

    const variantJson = await variantResponse.json();
    console.log(
      "Variant query result:",
      JSON.stringify(variantJson, null, 2)
    );

    const variantId =
      variantJson?.data?.inventoryItem?.variant?.id ?? null;

    if (!variantId) {
      console.log(
        "No variant found for inventory item:",
        inventoryItemId
      );
      return new Response("ok");
    }

    console.log("Variant ID:", variantId);

    // 3) Hidden decide karna (boolean → string)
    const hidden = available <= 0; // boolean
    const hiddenValue = hidden ? "true" : "false"; // ✅ string

    console.log("Setting varhide.hidden =", hiddenValue);

    // 4) Metafield set / update karna
    const metafieldMutation = `#graphql
      mutation SetVarhideMetafield($ownerId: ID!, $hiddenValue: String!) {
        metafieldsSet(metafields: [
          {
            ownerId: $ownerId
            namespace: "varhide"
            key: "hidden"
            type: "boolean"
            value: $hiddenValue
          }
        ]) {
          metafields {
            id
            namespace
            key
            type
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const metafieldResponse = await admin.graphql(metafieldMutation, {
      variables: {
        ownerId: variantId,
        hiddenValue,
      },
    });

    const metafieldJson = await metafieldResponse.json();
    console.log(
      "Metafield mutation result:",
      JSON.stringify(metafieldJson, null, 2)
    );

    const errors =
      metafieldJson?.data?.metafieldsSet?.userErrors ?? [];
    if (errors.length > 0) {
      console.error("Metafield userErrors:", errors);
    }
  } catch (error) {
    console.error("GraphQL error while handling inventory webhook:");
    console.error(error);
  }

  return new Response("ok");
};
