FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_RATES_URL
ARG VITE_HISTORY_URL
ENV VITE_RATES_URL=$VITE_RATES_URL
ENV VITE_HISTORY_URL=$VITE_HISTORY_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
