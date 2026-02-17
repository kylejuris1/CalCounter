import { ReactNode } from "react";

type PlacementParams = Record<string, string | number | boolean | null | undefined>;
type RegisterPlacementArgs = {
  placement: string;
  params?: PlacementParams;
};

type SuperwallModule = {
  SuperwallProvider: ({ children }: { children: ReactNode }) => ReactNode;
  CustomPurchaseControllerProvider: ({ children }: { children: ReactNode }) => ReactNode;
  usePlacement: (args?: unknown) => {
    registerPlacement: (args: RegisterPlacementArgs) => Promise<void>;
  };
};

let cachedModule: SuperwallModule | null | undefined;

function getSuperwallModule(): SuperwallModule | null {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  try {
    cachedModule = require("expo-superwall") as SuperwallModule;
  } catch {
    cachedModule = null;
  }

  return cachedModule;
}

export function SuperwallProvider({
  children,
  apiKeys,
  options,
  onConfigurationError,
}: {
  children: ReactNode;
  apiKeys?: unknown;
  options?: unknown;
  onConfigurationError?: (error: unknown) => void;
}) {
  const superwall = getSuperwallModule();
  if (!superwall) return <>{children}</>;
  return (
    <superwall.SuperwallProvider
      apiKeys={apiKeys}
      options={options}
      onConfigurationError={onConfigurationError}
    >
      {children}
    </superwall.SuperwallProvider>
  );
}

export function CustomPurchaseControllerProvider({
  children,
  controller,
}: {
  children: ReactNode;
  controller?: unknown;
}) {
  const superwall = getSuperwallModule();
  if (!superwall) return <>{children}</>;
  return (
    <superwall.CustomPurchaseControllerProvider controller={controller}>
      {children}
    </superwall.CustomPurchaseControllerProvider>
  );
}

export function usePlacement(args?: unknown) {
  const superwall = getSuperwallModule();
  if (!superwall) {
    return {
      registerPlacement: async () => {
        throw new Error(
          "Superwall is unavailable in Expo Go. Use a development build to use paywalls."
        );
      },
    };
  }

  return superwall.usePlacement(args);
}
