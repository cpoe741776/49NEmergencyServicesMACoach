// Environment configuration for the Mental Armor app

export interface AppEnvironment {
  mode: 'development' | 'production' | 'demo';
  openai: {
    enabled: boolean;   // client flag only — no key here
    model: string;
  };
  features: {
    emergencyDetection: boolean;
    aiChatEnabled: boolean;
    dataCollection: boolean;
    analytics: boolean;
  };
  organization: {
    name: string;
    logoUrl?: string;
    customColors?: {
      primary: string;
      secondary: string;
    };
  };
}

// Defaults used if no env vars provided
const defaultConfig: AppEnvironment = {
  mode: 'development',
  openai: {
    enabled: false,     // client can be enabled without exposing key
    model: 'gpt-4o-mini',
  },
  features: {
    emergencyDetection: true,
    aiChatEnabled: false,
    dataCollection: false,
    analytics: false,
  },
  organization: {
    name: '49 North™',
    logoUrl: '/logo.png',
    customColors: {
      primary: '#003049',
      secondary: '#1E3A8A',
    },
  },
};

export function loadEnvironmentConfig(): AppEnvironment {
  const mode = (import.meta.env.VITE_APP_MODE as AppEnvironment['mode']) || 'development';

  const model = import.meta.env.VITE_OPENAI_MODEL || defaultConfig.openai.model;
  const aiChatEnabled =
    (import.meta.env.VITE_AI_CHAT_ENABLED?.toString() === 'true') ||
    (mode === 'production'); // enable by default in prod if you want

  const emergencyDetection =
    import.meta.env.VITE_EMERGENCY_DETECTION_ENABLED?.toString() === 'false' ? false : true;

  const orgName = import.meta.env.VITE_ORG_NAME || defaultConfig.organization.name;
  const orgLogo = import.meta.env.VITE_ORG_LOGO || defaultConfig.organization.logoUrl;
  const primary = import.meta.env.VITE_PRIMARY_COLOR || defaultConfig.organization.customColors?.primary || '#003049';
  const secondary = import.meta.env.VITE_SECONDARY_COLOR || defaultConfig.organization.customColors?.secondary || '#1E3A8A';

  return {
    mode,
    openai: {
      enabled: aiChatEnabled, // client-side flag; actual key is server-only
      model,
    },
    features: {
      emergencyDetection,
      aiChatEnabled,
      dataCollection: mode === 'production',
      analytics: mode === 'production',
    },
    organization: {
      name: orgName,
      logoUrl: orgLogo,
      customColors: {
        primary,
        secondary,
      },
    },
  };
}

// Helpers (safe to keep)
export function isFeatureEnabled(feature: keyof AppEnvironment['features']): boolean {
  const config = loadEnvironmentConfig();
  return config.features[feature];
}

export function getOpenAIConfig() {
  const config = loadEnvironmentConfig();
  // Intentionally NO apiKey here — serverless function uses process.env.OPENAI_API_KEY
  return config.openai;
}

export function isDemoMode(): boolean {
  return loadEnvironmentConfig().mode === 'demo';
}

export function isProductionMode(): boolean {
  return loadEnvironmentConfig().mode === 'production';
}

export const appConfig = loadEnvironmentConfig();

/*
ENV VARS (CLIENT — OK TO EXPOSE):
VITE_APP_MODE=development|production|demo
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_AI_CHAT_ENABLED=true|false
VITE_EMERGENCY_DETECTION_ENABLED=true|false
VITE_ORG_NAME="Your Organization Name"
VITE_ORG_LOGO="/your-logo.png"
VITE_PRIMARY_COLOR=#003049
VITE_SECONDARY_COLOR=#1E3A8A

ENV VARS (SERVER ONLY — DO NOT PREFIX WITH VITE_):
OPENAI_API_KEY=sk-... (Netlify > Site settings > Environment variables)

Netlify secrets scan:
- Allow the non-sensitive VITE_* vars by setting SECRETS_SCAN_OMIT_KEYS
  (comma-separated) to: VITE_APP_MODE,VITE_OPENAI_MODEL,VITE_AI_CHAT_ENABLED,VITE_EMERGENCY_DETECTION_ENABLED,VITE_ORG_NAME,VITE_ORG_LOGO,VITE_PRIMARY_COLOR,VITE_SECONDARY_COLOR
- Keep OPENAI_API_KEY as server-only; never expose it in client code.
*/
