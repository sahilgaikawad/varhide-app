import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import {
    Page,
    Layout,
    Card,
    BlockStack,
    RadioButton,
    Button,
    Text,
    Banner,
    InlineStack,
    Box,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { hasActiveSubscription } from "../lib/subscription.server";

// --- LOADER ---
export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request);

    // 🔐 Subscription check
    const isSubscribed = await hasActiveSubscription(admin);

    const response = await admin.graphql(
        `#graphql
      query {
        currentAppInstallation {
          id
          metafield(namespace: "varhide", key: "enabled") {
            value
          }
        }
      }`
    );

    const data = await response.json();
    const appInstallation = data.data.currentAppInstallation;

    const isEnabled = appInstallation.metafield?.value === "true";

    return {
        isEnabled,
        appInstallationId: appInstallation.id,
        isSubscribed,
    };
};

// --- ACTION ---
export const action = async ({ request }) => {
    const { admin } = await authenticate.admin(request);

    // 🔐 Double safety: subscription check
    const isSubscribed = await hasActiveSubscription(admin);
    if (!isSubscribed) {
        throw new Response("Subscription required", { status: 403 });
    }

    const formData = await request.formData();
    const enabled = formData.get("enabled");
    const appInstallationId = formData.get("appInstallationId");

    await admin.graphql(
        `#graphql
      mutation CreateAppData($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors {
            field
            message
          }
        }
      }`,
        {
            variables: {
                metafields: [
                    {
                        ownerId: appInstallationId,
                        namespace: "varhide",
                        key: "enabled",
                        value: enabled,
                        type: "boolean",
                    },
                ],
            },
        }
    );

    return { status: "success" };
};

// --- UI ---
export default function VarhideSettings() {
    const { isEnabled, appInstallationId, isSubscribed } = useLoaderData();
    const submit = useSubmit();
    const nav = useNavigation();
    const actionData = useActionData();

    const [enabledState, setEnabledState] = useState(isEnabled);
    const [showBanner, setShowBanner] = useState(false);

    const isSaving = nav.state === "submitting";

    useEffect(() => {
        if (actionData?.status === "success") {
            setShowBanner(true);
        }
    }, [actionData]);

    const handleChange = (newValue) => {
        setEnabledState(newValue);
        setShowBanner(false);
    };

    const handleSave = () => {
        if (!isSubscribed) return;

        const formData = new FormData();
        formData.append("enabled", enabledState ? "true" : "false");
        formData.append("appInstallationId", appInstallationId);

        submit(formData, { method: "post" });
    };

    return (
        <Page title="Varhide Settings" narrowWidth>
            <Layout>
                <Layout.Section>

                    {/* 🔔 Subscription Warning */}
                    {!isSubscribed && (
                        <Box paddingBlockEnd="400">
                            <Banner title="Subscription required" tone="warning">
                                <p>
                                    Please subscribe to <strong>Varhide Pro</strong> to enable and
                                    save these settings.
                                </p>
                            </Banner>
                        </Box>
                    )}

                    {/* ✅ Success Banner */}
                    {showBanner && (
                        <Box paddingBlockEnd="400">
                            <Banner
                                title="Settings saved successfully"
                                tone="success"
                                onDismiss={() => setShowBanner(false)}
                            />
                        </Box>
                    )}

                    <Card>
                        <BlockStack gap="500">
                            <BlockStack gap="200">
                                <Text variant="headingMd" as="h2">
                                    Variant Hiding Status
                                </Text>
                                <Text tone="subdued">
                                    Enable this feature to automatically hide product variants
                                    that are out-of-stock or unavailable.
                                </Text>
                            </BlockStack>

                            <BlockStack gap="300">
                                <RadioButton
                                    label={
                                        <Text>
                                            <strong>Enable Varhide</strong> (Hide unavailable variants)
                                        </Text>
                                    }
                                    checked={enabledState === true}
                                    disabled={!isSubscribed}
                                    onChange={() => handleChange(true)}
                                />

                                <RadioButton
                                    label={
                                        <Text>
                                            <strong>Disable Varhide</strong> (Show all variants)
                                        </Text>
                                    }
                                    checked={enabledState === false}
                                    disabled={!isSubscribed}
                                    onChange={() => handleChange(false)}
                                />
                            </BlockStack>

                            <InlineStack align="start">
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    loading={isSaving}
                                    disabled={!isSubscribed}
                                >
                                    Save Changes
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
