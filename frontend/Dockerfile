# Stage 1: Build the React app
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the build using a simple static server
FROM node:18-alpine

WORKDIR /app

# Install a lightweight static server like serve
RUN npm install -g serve

# Copy the build folder from previous stage
COPY --from=build /app/build ./build

EXPOSE 3000

# Serve the React build on port 3000
CMD ["serve", "-s", "build", "-l", "3000"]
