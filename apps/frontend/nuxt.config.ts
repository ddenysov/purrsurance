// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: {
        lang: 'uk',
      },
    },
  },
  
  // Dev server configuration
  devServer: {
    port: 3001
  },
  
  // Runtime Config
  // Note: Real URLs are automatically fetched from CloudFormation stacks during deployment
  // via deploy.sh script and written to .env file
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
      apiTimeout: process.env.NUXT_PUBLIC_API_TIMEOUT || '10000',
      // SSE Stream URL from vet-expert-sse-stream stack
      // In dev mode: use relative path for proxy; in prod: use full AWS URL from env
      sseStreamUrl: process.env.NUXT_PUBLIC_SSE_STREAM_URL || '/stream',
      // Chat API URL from vet-expert-service-router stack
      // In dev mode: use relative path for proxy; in prod: use full AWS URL from env
      chatApiUrl: process.env.NUXT_PUBLIC_CHAT_API_URL || '/chat',
      /** When true, chat responses are mocked on the client (no backend call). Set NUXT_PUBLIC_CHAT_API_MOCK=true */
      chatApiMock: process.env.NUXT_PUBLIC_CHAT_API_MOCK === 'true',
      // Backend API URL from service-backend stack
      // In dev mode: use relative path for proxy; in prod: use full AWS URL from env
      backendApiUrl: process.env.NUXT_PUBLIC_BACKEND_API_URL || '/api/vet-appointments',
    }
  },

vite: {
    server: {
        proxy: {
            // Proxy for SSE stream
            '/stream': {
                target: 'https://ppfpuxcnyds5oa5zbwsbaevata0gybqg.lambda-url.us-east-1.on.aws/',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/stream/, ''),
            },
            // Proxy for Chat API
            '/chat': {
                target: 'https://f71j8tt6kc.execute-api.us-east-1.amazonaws.com/Prod',
                changeOrigin: true,
            },
            // Proxy for Backend API (vet appointments)
            '/api/vet-appointments': {
                target: 'https://3ehcudxdblj37bv2ovnxakr5340pvqlz.lambda-url.us-east-1.on.aws/',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            }
        }
    }
},
  
  // Modules
  modules: [
      '@nuxtjs/tailwindcss',
      '@pinia/nuxt'
  ],
  
  // CSS Framework
  css: ['~/assets/css/main.css'],
  
  // Tailwind CSS configuration
  tailwindcss: {
    config: {
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0f4ff',
              100: '#e0e9ff',
              200: '#c7d5fe',
              300: '#a4b8fc',
              400: '#7c93f9',
              500: '#1e40af',
              600: '#1e3a8a',
              700: '#172554',
              800: '#0f172a',
              900: '#020617'
            },
            mint: {
              50: '#eff6ff',
              100: '#dbeafe',
              200: '#bfdbfe',
              300: '#93c5fd',
              400: '#60a5fa',
              500: '#3b82f6',
              600: '#2563eb',
              700: '#1d4ed8',
              800: '#1e40af',
              900: '#1e3a8a'
            }
          },
          boxShadow: {
            soft: '0 10px 25px -10px rgba(16, 24, 40, .08), 0 4px 6px -2px rgba(16, 24, 40, .03)'
          }
        }
      }
    }
  }
})