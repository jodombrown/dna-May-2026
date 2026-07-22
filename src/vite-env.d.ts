
// Extend the global window object to include grecaptcha for TypeScript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Public Mapbox token injected by the Lovable connector. Optional: absent in
  // some environments, so consumers must handle the undefined case.
  readonly VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN?: string;
}

interface Grecaptcha {
  ready(cb: () => void): void;
  render(
    container: string | HTMLElement,
    parameters: {
      sitekey: string;
      badge?: string;
      size?: "invisible" | "normal";
      callback?: (token: string) => void;
    }
  ): number;
  execute(siteKey?: string, options?: object): Promise<string> | void;
}

interface Window {
  grecaptcha: Grecaptcha;
}
