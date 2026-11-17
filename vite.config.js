import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode})=>{
  const localEnvironment=loadEnv(mode,process.cwd(),'');
  const apiProxyTarget = process.env.PRATYAKSH_API_PROXY_TARGET || localEnvironment.PRATYAKSH_API_PROXY_TARGET || 'http://127.0.0.1:3001';
  return {
  plugins: [react()],
  optimizeDeps: {
    entries: ['index.html']
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    watch: {
      ignored: ['**/.local-tools/**','**/.local-content/**','**/temp_discovery/**','**/reference/**','**/artifacts/**','**/audit/**','**/localhost_screenshots/**','**/*.sqlite*']
    },
    fs: {
      deny: ['.env','.env.*','**/.env','**/.env.*','**/.local-tools/**','**/.local-content/**','**/temp_discovery/**','**/database/import-output/**','**/*.sqlite*','**/*.{crt,pem,key}']
    },
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true
      },
      '/upload': {
        target: apiProxyTarget,
        changeOrigin: true
      }
    }
  }
  };
});

