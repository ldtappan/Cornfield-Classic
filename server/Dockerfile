FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --quiet || npm i
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
