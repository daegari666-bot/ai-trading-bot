# Dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV LANG C.UTF-8
CMD ["node", "index_home_full.js"]
