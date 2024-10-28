# Use the official Node.js image with version 16
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy the React app's package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the production build files from the local build directory
COPY ./build .

# Expose port 80 to the outside world
EXPOSE 80

# Command to serve the static files using 'serve' package
CMD ["npx", "serve", "-s", "."]
