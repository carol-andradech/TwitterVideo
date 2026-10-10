import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // Durante o desenvolvimento, encaminha /api para o servidor Node.
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
});
