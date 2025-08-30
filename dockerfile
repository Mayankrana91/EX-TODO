# Use official Node.js image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy app source code
COPY . .

# Expose port
EXPOSE 8080

# Start app
CMD ["npm", "start"]
