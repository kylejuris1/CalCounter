import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PRODUCT_CATEGORY,
  PurchasesOffering,
  PurchasesStoreProduct,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

export const REVENUECAT_API_KEY = "test_FHLAHISuTvnWZPmufpwsJsuqvuT";
export const REVENUECAT_ENTITLEMENT_ID = "Harba Media Pro";
export const REVENUECAT_OFFERING_ID = "default";

export const REVENUECAT_PRODUCTS = {
  monthly: "monthly",
  yearly: "yearly",
  lifetime: "lifetime",
  consumable: "credits_500",
} as const;

const SUBSCRIPTION_PRODUCT_IDS: ReadonlySet<string> = new Set([
  REVENUECAT_PRODUCTS.monthly,
  REVENUECAT_PRODUCTS.yearly,
]);

export type RevenueCatProductId = (typeof REVENUECAT_PRODUCTS)[keyof typeof REVENUECAT_PRODUCTS];

export type RevenueCatPurchaseResult = {
  customerInfo: CustomerInfo | null;
  userCancelled: boolean;
};

type RevenueCatError = {
  userCancelled?: boolean;
  message?: string;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as RevenueCatError).message ?? "Unknown RevenueCat error");
  }

  return "Unknown RevenueCat error";
};

export const isUserCancelledError = (error: unknown): boolean => {
  return typeof error === "object" && error !== null && (error as RevenueCatError).userCancelled === true;
};

export const initializeRevenueCat = async () => {
  if (!REVENUECAT_API_KEY) {
    throw new Error("RevenueCat API key is missing");
  }

  const configured = await Purchases.isConfigured();
  if (configured) {
    return;
  }

  await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
};

export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  return Purchases.getCustomerInfo();
};

export const hasProEntitlement = (customerInfo: CustomerInfo | null): boolean => {
  if (!customerInfo) {
    return false;
  }

  return Boolean(customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]);
};

export const getCurrentOffering = async (): Promise<PurchasesOffering | null> => {
  const offerings = await Purchases.getOfferings();

  if (offerings.current) {
    return offerings.current;
  }

  return offerings.all[REVENUECAT_OFFERING_ID] ?? null;
};

const getStoreProductForId = async (
  productId: RevenueCatProductId
): Promise<PurchasesStoreProduct | null> => {
  const productCategory = SUBSCRIPTION_PRODUCT_IDS.has(productId)
    ? PRODUCT_CATEGORY.SUBSCRIPTION
    : PRODUCT_CATEGORY.NON_SUBSCRIPTION;

  const products = await Purchases.getProducts([productId], productCategory);
  return products[0] ?? null;
};

export const purchaseProduct = async (
  productId: RevenueCatProductId
): Promise<RevenueCatPurchaseResult> => {
  try {
    const product = await getStoreProductForId(productId);
    if (!product) {
      throw new Error(`Product ${productId} is not available in RevenueCat`);
    }

    const purchaseResult = await Purchases.purchaseStoreProduct(product);
    return {
      customerInfo: purchaseResult.customerInfo,
      userCancelled: false,
    };
  } catch (error) {
    if (isUserCancelledError(error)) {
      return {
        customerInfo: null,
        userCancelled: true,
      };
    }

    throw new Error(getErrorMessage(error));
  }
};

export const restorePurchases = async (): Promise<CustomerInfo> => {
  return Purchases.restorePurchases();
};

export const presentPaywall = async (): Promise<PAYWALL_RESULT> => {
  return RevenueCatUI.presentPaywall();
};

export const presentPaywallIfNeeded = async (): Promise<PAYWALL_RESULT> => {
  return RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT_ID,
  });
};

export const openCustomerCenter = async (): Promise<void> => {
  await RevenueCatUI.presentCustomerCenter({
    callbacks: {
      onRestoreStarted: () => {
        console.log("[RevenueCat] Customer Center restore started");
      },
      onRestoreCompleted: ({ customerInfo }) => {
        console.log("[RevenueCat] Customer Center restore completed", customerInfo.activeSubscriptions);
      },
      onRestoreFailed: ({ error }) => {
        console.error("[RevenueCat] Customer Center restore failed", error);
      },
    },
  });
};
