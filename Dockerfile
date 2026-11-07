# Use official lightweight Node.js LTS Alpine image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm install --omit=dev

# Copy all application files (including public/ and server.js)
COPY . .

# Expose default port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Run the management server
CMD ["node", "server.js"]
