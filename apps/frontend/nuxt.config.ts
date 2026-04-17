// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
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
      // SSE Stream URL from purrsurance-sse-stream stack
      // In dev mode: use relative path for proxy; in prod: use full AWS URL from env
      sseStreamUrl: process.env.NUXT_PUBLIC_SSE_STREAM_URL || '/stream',
      // Chat API URL from purrsurance-service-router stack
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
              50: '#fdf2f8',
              100: '#fce7f3',
              200: '#fbcfe8',
              300: '#f9a8d4',
              400: '#f472b6',
              500: '#ec4899',
              600: '#db2777',
              700: '#be185d',
              800: '#9d174d',
              900: '#831843'
            },
            mint: {
              50: '#f0fdf4',
              100: '#dcfce7',
              200: '#bbf7d0',
              300: '#86efac',
              400: '#4ade80',
              500: '#22c55e',
              600: '#16a34a',
              700: '#15803d',
              800: '#166534',
              900: '#14532d'
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