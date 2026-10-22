# Multi-stage production Dockerfile for Co. (Codot) RKPD Collaboration App
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and client package definitions
COPY package*.json ./
RUN npm install

COPY client/package*.json ./client/
RUN cd client && npm install

# Copy source code and templates
COPY . .

# Build frontend production bundle
RUN cd client && npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and built assets
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/data ./data
COPY --from=builder /app/Template ./Template

RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server/index.js"]
