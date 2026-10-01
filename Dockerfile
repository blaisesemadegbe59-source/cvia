# Image de production (nécessite PostgreSQL : changer le provider dans prisma/schema.prisma)
FROM mcr.microsoft.com/playwright:v1.55.0-noble AS base
WORKDIR /app
COPY package*.json ./
COPY scripts/copy-fonts.mjs scripts/copy-fonts.mjs
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy || npx prisma db push; npm run start"]
