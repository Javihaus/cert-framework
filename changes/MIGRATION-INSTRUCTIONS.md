# 📋 CERT Dashboard 2.0 - Instrucciones Completas de Migración

## 🎯 Objetivo
Transformar el dashboard actual (6/10) en una aplicación profesional unificada (9/10) que integre todas las funcionalidades de CERT Framework en una experiencia coherente y moderna.

## 🏗️ Arquitectura Nueva

```
dashboard.cert-framework.com/
├── / (Overview Dashboard - Estado General)
├── /monitoring (Live Monitoring - Monitoreo en Tiempo Real)
├── /compliance (EU AI Act Compliance Center)
├── /assessments (Risk & Readiness Assessment)
├── /reports (Document Generation)
├── /analytics (Cost & Performance Analytics)
└── /settings (Configuration & API Keys)
```

## 📦 PASO 1: Preparación del Entorno

### 1.1 Instalar Dependencias Necesarias

```bash
cd dashboard
npm install framer-motion@^11.0.0
npm install recharts@^2.12.0
npm install @heroicons/react@^2.1.1
npm install tailwindcss@^3.4.0
npm install @tailwindcss/forms@^0.5.7
```

### 1.2 Actualizar tailwind.config.js

```javascript
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0b',
        },
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

## 📐 PASO 2: Estructura de Archivos

### 2.1 Crear Nueva Estructura de Directorios

```bash
# Desde /dashboard
mkdir -p app/components/layout
mkdir -p app/components/charts
mkdir -p app/components/cards
mkdir -p app/monitoring
mkdir -p app/compliance
mkdir -p app/assessments
mkdir -p app/reports
mkdir -p app/analytics
mkdir -p app/settings
mkdir -p public/images
```

### 2.2 Mover Logo CERT

```bash
# Descargar el logo CERT
wget https://github.com/Javihaus/cert-framework/raw/master/docs/CERT_LOGO_NEW_1.png -O public/images/cert-logo.png
```

## 🔧 PASO 3: Implementar el Nuevo Layout

### 3.1 Crear el Layout Principal

Copiar el archivo `new-dashboard-layout.tsx` a:
`app/components/layout/DashboardLayout.tsx`

### 3.2 Actualizar app/layout.tsx

```tsx
import './globals.css';
import DashboardLayout from './components/layout/DashboardLayout';

export const metadata = {
  title: 'CERT Framework - EU AI Act Compliance Dashboard',
  description: 'Professional monitoring and compliance platform for AI systems under EU regulation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/cert-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
```

## 📊 PASO 4: Implementar las Páginas

### 4.1 Página Principal (Overview)

Copiar `overview-dashboard.tsx` a:
`app/page.tsx`

### 4.2 Página de Monitoring

Copiar `monitoring-dashboard.tsx` a:
`app/monitoring/page.tsx`

### 4.3 Crear Página de Compliance

`app/compliance/page.tsx`:

```tsx
'use client';

import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          EU AI Act Compliance Center
        </h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          Article 15 compliance tracking and documentation...
        </p>
      </div>
    </div>
  );
}
```

### 4.4 Crear Página de Assessments

`app/assessments/page.tsx`:

```tsx
'use client';

import React from 'react';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Risk Assessment
        </h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          AI system risk classification and evaluation...
        </p>
      </div>
    </div>
  );
}
```

## 🎨 PASO 5: Estilos Globales

### 5.1 Actualizar globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
  
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer components {
  /* Card hover effects */
  .card-hover {
    @apply transition-all duration-200 hover:shadow-lg hover:scale-[1.02];
  }
  
  /* Status indicators */
  .status-success {
    @apply bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400;
  }
  
  .status-warning {
    @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400;
  }
  
  .status-error {
    @apply bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400;
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Remove spinner from number inputs */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
```

## 🚀 PASO 6: Despliegue

### 6.1 Build de Producción

```bash
# Verificar que todo funciona
npm run dev

# Build para producción
npm run build

# Test del build
npm run start
```

### 6.2 Variables de Entorno

Crear `.env.production`:

```env
NEXT_PUBLIC_API_URL=https://api.cert-framework.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.cert-framework.com
NEXT_PUBLIC_ENVIRONMENT=production
```

### 6.3 Configurar Vercel/Netlify

```json
// vercel.json
{
  "redirects": [
    {
      "source": "/dashboard",
      "destination": "/",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
        }
      ]
    }
  ]
}
```

## ✅ PASO 7: Checklist de Verificación

### Funcionalidades Core
- [ ] Dashboard principal muestra métricas en tiempo real
- [ ] Navegación lateral funciona correctamente
- [ ] Dark mode toggle funciona
- [ ] Responsive design en mobile/tablet/desktop
- [ ] Los gráficos se renderizan correctamente
- [ ] Las animaciones son fluidas

### Páginas
- [ ] Overview page carga correctamente
- [ ] Monitoring page muestra traces en vivo
- [ ] Compliance page accesible
- [ ] Assessments page accesible
- [ ] Reports page accesible
- [ ] Analytics page accesible
- [ ] Settings page accesible

### UX/UI
- [ ] Logo CERT visible y bien posicionado
- [ ] Colores consistentes con la marca
- [ ] Tipografía legible
- [ ] Estados hover funcionan
- [ ] Loading states implementados
- [ ] Error states manejados

### Performance
- [ ] Tiempo de carga < 3 segundos
- [ ] Lighthouse score > 90
- [ ] No errores en consola
- [ ] Bundle size optimizado

## 🔥 PASO 8: Características Avanzadas

### 8.1 Implementar WebSocket para Live Updates

```tsx
// utils/websocket.ts
export class LiveDataConnection {
  private ws: WebSocket | null = null;
  
  connect(onMessage: (data: any) => void) {
    this.ws = new WebSocket('wss://api.cert-framework.com/live');
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

### 8.2 Implementar Notificaciones

```tsx
// components/NotificationCenter.tsx
import { toast, Toaster } from 'react-hot-toast';

export const notify = {
  success: (message: string) => toast.success(message, {
    style: {
      background: '#10B981',
      color: '#fff',
    },
  }),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast(message, {
    icon: '⚠️',
  }),
};
```

## 📈 PASO 9: Métricas de Éxito

### KPIs del Dashboard
- **Tiempo de carga**: < 2 segundos
- **Tiempo hasta interactividad**: < 3 segundos
- **Tasa de error**: < 0.1%
- **Satisfacción del usuario**: > 4.5/5
- **Accesibilidad**: WCAG 2.2 AA compliant

### Métricas de Negocio
- **Tiempo de generación de reportes**: -80% (de 30min a 6min)
- **Errores de compliance detectados**: +200%
- **Costo de monitoreo**: -60%
- **Tiempo de auditoría**: -70%

## 🛠️ PASO 10: Mantenimiento

### Actualizaciones Semanales
- Review de métricas de performance
- Actualización de dependencias de seguridad
- Backup de configuraciones

### Actualizaciones Mensuales
- Nuevas features basadas en feedback
- Optimización de queries
- Actualización de documentación

## 💡 Tips Profesionales

1. **Usa React.memo()** para componentes pesados
2. **Implementa lazy loading** para páginas secundarias
3. **Usa Suspense boundaries** para mejor UX
4. **Cachea API responses** con SWR o React Query
5. **Implementa error boundaries** para manejo robusto de errores
6. **Usa Web Workers** para procesamiento pesado
7. **Implementa Progressive Enhancement** para mejor accesibilidad

## 🚨 Troubleshooting Común

### Problema: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problema: "Hydration mismatch"
Asegúrate de que el render del servidor y cliente sean idénticos.

### Problema: "Dark mode no funciona"
Verifica que `darkMode: 'class'` esté en tailwind.config.js

## 🎉 Resultado Final

Al completar estos pasos tendrás:
- ✅ Dashboard profesional nivel 9/10
- ✅ Experiencia unificada y coherente
- ✅ Diseño moderno siguiendo tendencias 2025
- ✅ Performance optimizada
- ✅ Listo para vender consultoría premium EU AI Act

## 📞 Soporte

Si encuentras problemas durante la migración:
1. Revisa los logs de consola
2. Verifica las versiones de dependencias
3. Asegúrate de seguir todos los pasos en orden

---

**¡Éxito con la migración! El nuevo CERT Dashboard está listo para impresionar a tus clientes y establecerte como el experto en EU AI Act compliance en España.**