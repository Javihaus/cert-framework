# Dashboard Deployment Guide

## Local Development
```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:3000

## Production Build (Self-Hosted)
```bash
cd dashboard
npm run build
npm run start
```

The dashboard runs on port 3000 by default.

## Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps.

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
cd dashboard
vercel
```

Follow the prompts. Vercel will:
- Build your app
- Deploy it
- Give you a URL (e.g., cert-dashboard.vercel.app)

### Step 3: Environment Variables

In the Vercel dashboard, add any environment variables from `.env.example`.

## Deploy to Other Platforms

### Docker
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
```

Build and run:
```bash
docker build -t cert-dashboard .
docker run -p 3000:3000 cert-dashboard
```

### Traditional Server

1. Build: `npm run build`
2. Copy `.next/` directory to server
3. Install Node.js 20+
4. Run: `npm run start`

## Security Considerations

For production:

1. Use HTTPS (Vercel provides this automatically)
2. Add authentication if needed
3. Validate file uploads
4. Set CORS policies
5. Enable rate limiting

## Performance

The dashboard is static after build - it's very fast. File uploads are processed client-side, so no backend needed.

For large evaluation files (>10MB), consider:
- Pagination
- Lazy loading
- Server-side processing
