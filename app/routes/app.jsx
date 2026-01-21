import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  AppProvider as ShopifyAppProvider,
} from "@shopify/shopify-app-react-router/react";

import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";

/* Polaris CSS */
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

/**
 * ✅ Shopify Embedded Auth
 * ❌ No manual 401
 * ❌ No offline forcing
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request, {
    isOnline: true,
  });

  // Shopify khud OAuth redirect karega
  // tumhe kuch throw karne ki zarurat nahi
  return {
    apiKey: process.env.SHOPIFY_API_KEY,
  };
};

export default function AppLayout() {
  const { apiKey } = useLoaderData();

  return (
    <ShopifyAppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={enTranslations}>
        <Outlet />
      </PolarisAppProvider>
    </ShopifyAppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (args) => boundary.headers(args);
