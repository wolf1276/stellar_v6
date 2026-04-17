FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose dev server port (or use a simple server for production)
EXPOSE 4000

# Start the dev server for now (can be replaced with nginx for full prod)
CMD ["npm", "run", "start"]
