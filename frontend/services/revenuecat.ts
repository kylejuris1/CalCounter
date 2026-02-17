import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PRODUCT_CATEGORY,
  PurchasesOffering,
  PurchasesStoreProduct,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

export const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_API_KEY ?? "";
export const REVENUECAT_OFFERING_ID = "default";

export const REVENUECAT_PRODUCTS = {
  credits500: "credits_500",
  credits1000: "credits_1000",
  credits2000: "credits_2000",
} as const;

export const REVENUECAT_CREDITS_PRODUCT_IDS = Object.values(REVENUECAT_PRODUCTS);

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

export const syncRevenueCatAppUser = async (userId: string | null) => {
  const configured = await Purchases.isConfigured();
  if (!configured) {
    await initializeRevenueCat();
  }

  if (userId) {
    await Purchases.logIn(userId);
    return;
  }

  await Purchases.logOut();
};

export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  return Purchases.getCustomerInfo();
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
  const productCategory = PRODUCT_CATEGORY.NON_SUBSCRIPTION;

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

export const purchaseProductByIdentifier = async (
  productId: string
): Promise<RevenueCatPurchaseResult> => {
  return purchaseProduct(productId as RevenueCatProductId);
};

export const restorePurchases = async (): Promise<CustomerInfo> => {
  return Purchases.restorePurchases();
};

export const presentPaywall = async (): Promise<PAYWALL_RESULT> => {
  return RevenueCatUI.presentPaywall();
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
