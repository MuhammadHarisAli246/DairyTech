# Sample Dockerfile for a Node.js backend - adjust base image/commands for your stack (Python, Go, etc.)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app .
ENV NODE_ENV=production
EXPOSE 8080

# Task definition expects a /health endpoint for the ALB health check
CMD ["node", "server.js"]
