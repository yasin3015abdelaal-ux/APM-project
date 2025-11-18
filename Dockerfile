FROM node:18-alpine AS builder
WORKDIR /app

# install production deps (as requested)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# copy source and build
COPY . .
RUN npm run build

# production stage
FROM nginx:alpine
# copy built app
COPY --from=builder /app/build /usr/share/nginx/html
# provide custom nginx config (overwrites default)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]