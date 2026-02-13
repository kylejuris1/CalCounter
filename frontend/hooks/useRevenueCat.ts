import { useCallback, useEffect, useMemo, useState } from "react";
import Purchases, { CustomerInfo, PurchasesOffering } from "react-native-purchases";
import { PAYWALL_RESULT } from "react-native-purchases-ui";
import {
  RevenueCatProductId,
  getCustomerInfo,
  getCurrentOffering,
  hasProEntitlement,
  initializeRevenueCat,
  isUserCancelledError,
  openCustomerCenter,
  presentPaywall,
  presentPaywallIfNeeded,
  purchaseProduct,
  restorePurchases,
} from "../services/revenuecat";

type RevenueCatActionStatus = "idle" | "loading" | "success" | "error";

export function useRevenueCat() {
  const [isReady, setIsReady] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<RevenueCatActionStatus>("idle");

  const refreshCustomerInfo = useCallback(async () => {
    const info = await getCustomerInfo();
    setCustomerInfo(info);
    return info;
  }, []);

  const refreshOffering = useCallback(async () => {
    const nextOffering = await getCurrentOffering();
    setOffering(nextOffering);
    return nextOffering;
  }, []);

  const refreshAll = useCallback(async () => {
    const [info, nextOffering] = await Promise.all([refreshCustomerInfo(), refreshOffering()]);
    return { info, offering: nextOffering };
  }, [refreshCustomerInfo, refreshOffering]);

  useEffect(() => {
    let mounted = true;

    const listener = (updatedCustomerInfo: CustomerInfo) => {
      if (!mounted) return;
      setCustomerInfo(updatedCustomerInfo);
    };

    const initialize = async () => {
      try {
        await initializeRevenueCat();
        if (!mounted) return;

        await refreshAll();
        if (!mounted) return;

        Purchases.addCustomerInfoUpdateListener(listener);
        setIsReady(true);
      } catch (error) {
        if (!mounted) return;
        setLastError(error instanceof Error ? error.message : "Failed to initialize RevenueCat");
      }
    };

    void initialize();

    return () => {
      mounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [refreshAll]);

  const withActionState = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setActionStatus("loading");
    setLastError(null);
    try {
      const result = await action();
      setActionStatus("success");
      return result;
    } catch (error) {
      setActionStatus("error");
      setLastError(error instanceof Error ? error.message : "RevenueCat action failed");
      throw error;
    }
  }, []);

  const showPaywall = useCallback(async () => {
    const result = await withActionState(async () => {
      const paywallResult = await presentPaywall();
      await refreshCustomerInfo();
      return paywallResult;
    });

    return result;
  }, [refreshCustomerInfo, withActionState]);

  const showPaywallIfNeeded = useCallback(async () => {
    const result = await withActionState(async () => {
      const paywallResult = await presentPaywallIfNeeded();
      await refreshCustomerInfo();
      return paywallResult;
    });

    return result;
  }, [refreshCustomerInfo, withActionState]);

  const purchaseByProductId = useCallback(
    async (productId: RevenueCatProductId) => {
      return withActionState(async () => {
        const purchaseResult = await purchaseProduct(productId);
        if (purchaseResult.customerInfo) {
          setCustomerInfo(purchaseResult.customerInfo);
        }
        return purchaseResult;
      });
    },
    [withActionState]
  );

  const restore = useCallback(async () => {
    return withActionState(async () => {
      const info = await restorePurchases();
      setCustomerInfo(info);
      return info;
    });
  }, [withActionState]);

  const openSubscriptionCenter = useCallback(async () => {
    return withActionState(async () => {
      await openCustomerCenter();
      await refreshCustomerInfo();
    });
  }, [refreshCustomerInfo, withActionState]);

  const getPaywallSuccess = useCallback((result: PAYWALL_RESULT) => {
    return (
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED ||
      result === PAYWALL_RESULT.NOT_PRESENTED
    );
  }, []);

  return useMemo(
    () => ({
      isReady,
      customerInfo,
      offering,
      actionStatus,
      lastError,
      isPro: hasProEntitlement(customerInfo),
      refreshAll,
      refreshCustomerInfo,
      refreshOffering,
      showPaywall,
      showPaywallIfNeeded,
      purchaseByProductId,
      restore,
      openSubscriptionCenter,
      getPaywallSuccess,
      isUserCancelledError,
    }),
    [
      actionStatus,
      customerInfo,
      getPaywallSuccess,
      isReady,
      lastError,
      offering,
      openSubscriptionCenter,
      purchaseByProductId,
      refreshAll,
      refreshCustomerInfo,
      refreshOffering,
      restore,
      showPaywall,
      showPaywallIfNeeded,
    ]
  );
}
