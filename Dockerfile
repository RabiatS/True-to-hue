# Theme API only (OpenAI key via OPENAI_API_KEY on the host — never in the repo)
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY shared ./shared

ENV NODE_ENV=production
EXPOSE 8787

CMD ["npm", "start"]
