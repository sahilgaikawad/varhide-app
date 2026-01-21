import { Page, Card, Button, Text } from "@shopify/polaris";

export default function PricingPage() {
    const goToSubscribe = () => {
        // React Router navigation (no Remix)
        window.location.href = "/app/billing/subscribe";
    };

    return (
        <Page title="Varhide Pricing">
            <Card sectioned>
                <Text as="h2" variant="headingMd">
                    Varhide Pro
                </Text>

                <Text as="p" variant="bodyMd" tone="subdued">
                    Hide out-of-stock variants automatically.
                </Text>

                <Text as="p" variant="headingLg" marginTop="300">
                    $9.99 / month
                </Text>

                <Button primary onClick={goToSubscribe}>
                    Start Free Trial
                </Button>
            </Card>
        </Page>
    );
}
