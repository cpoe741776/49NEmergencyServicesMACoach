// Environment configuration for the Mental Armor app

export interface AppEnvironment {
  mode: 'development' | 'production' | 'demo';
  openai: {
    apiKey?: string;
    enabled: boolean;
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

// Default configuration
const defaultConfig: AppEnvironment = {
  mode: 'development',
  openai: {
    enabled: false, // Set to true when you have API key
    model: 'gpt-4',
  },
  features: {
    emergencyDetection: true,
    aiChatEnabled: false, // Will be true when OpenAI is configured
    dataCollection: false, // For demo mode
    analytics: false,
  },
  organization: {
    name: '49 North™',
    logoUrl: '/logo.png',
    customColors: {
      primary: '#003049',
      secondary: '#1E3A8A'
    }
  }
};

// Production configuration template
const productionConfig: AppEnvironment = {
  mode: 'production',
  openai: {
    enabled: true,
    model: 'gpt-4',
    // apiKey will be loaded from environment variable
  },
  features: {
    emergencyDetection: true,
    aiChatEnabled: true,
    dataCollection: true,
    analytics: true,
  },
  organization: {
    name: 'Your Organization Name',
    logoUrl: '/your-logo.png',
    customColors: {
      primary: '#003049',
      secondary: '#1E3A8A'
    }
  }
};

// Demo configuration for tradeshows
const demoConfig: AppEnvironment = {
  mode: 'demo',
  openai: {
    enabled: false, // Use simulated responses
    model: 'gpt-4',
  },
  features: {
    emergencyDetection: true,
    aiChatEnabled: true, // Simulated
    dataCollection: false,
    analytics: false,
  },
  organization: {
    name: 'Demo Fire Department',
    logoUrl: '/demo-logo.png',
  }
};

// Environment detection and configuration loading
export function loadEnvironmentConfig(): AppEnvironment {
  const mode = (import.meta.env.VITE_APP_MODE as AppEnvironment['mode']) || 'development';
  
  switch (mode) {
    case 'production':
      return {
        ...productionConfig,
        openai: {
          ...productionConfig.openai,
          apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          enabled: !!import.meta.env.VITE_OPENAI_API_KEY,
        },
        features: {
          ...productionConfig.features,
          aiChatEnabled: !!import.meta.env.VITE_OPENAI_API_KEY,
        },
        organization: {
          ...productionConfig.organization,
          name: import.meta.env.VITE_ORG_NAME || productionConfig.organization.name,
          logoUrl: import.meta.env.VITE_ORG_LOGO || productionConfig.organization.logoUrl,
        }
      };
      
    case 'demo':
      return demoConfig;
      
    default:
      return {
        ...defaultConfig,
        openai: {
          ...defaultConfig.openai,
          apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          enabled: !!import.meta.env.VITE_OPENAI_API_KEY,
        },
        features: {
          ...defaultConfig.features,
          aiChatEnabled: !!import.meta.env.VITE_OPENAI_API_KEY,
        }
      };
  }
}

// Utility functions
export function isFeatureEnabled(feature: keyof AppEnvironment['features']): boolean {
  const config = loadEnvironmentConfig();
  return config.features[feature];
}

export function getOpenAIConfig() {
  const config = loadEnvironmentConfig();
  return config.openai;
}

export function isDemoMode(): boolean {
  return loadEnvironmentConfig().mode === 'demo';
}

export function isProductionMode(): boolean {
  return loadEnvironmentConfig().mode === 'production';
}

// Export the current configuration
export const appConfig = loadEnvironmentConfig();

/*
ENVIRONMENT VARIABLES TO SET UP:

For development (.env.local):
VITE_APP_MODE=development
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ORG_NAME="Your Organization Name"
VITE_ORG_LOGO="/your-logo.png"

For production (.env.production):
VITE_APP_MODE=production
VITE_OPENAI_API_KEY=your_production_openai_api_key
VITE_ORG_NAME="Your Organization Name"
VITE_ORG_LOGO="/your-logo.png"

For demo (.env.demo):
VITE_APP_MODE=demo

NETLIFY DEPLOYMENT:
In your Netlify dashboard, set these environment variables:
- VITE_APP_MODE: production (or demo for demo version)
- VITE_OPENAI_API_KEY: your API key
- VITE_ORG_NAME: your organization name
- VITE_ORG_LOGO: path to your logo

GITHUB INTEGRATION:
1. Add these environment variables to your GitHub repository secrets
2. Update your build command in package.json to use the appropriate .env file
3. Netlify will automatically pick up the environment variables from your build
*/