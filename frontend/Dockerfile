FROM node:lts

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the Next.js application for production
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "start"]
