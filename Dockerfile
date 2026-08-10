FROM node:20-alpine

# Install OpenSSL required by Prisma query engine on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

EXPOSE 5000

CMD ["node", "src/server.js"]
