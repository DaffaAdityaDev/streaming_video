FROM node:lts

# # Install FFmpeg with necessary codecs
# RUN apt-get update && \
#     apt-get install -y ffmpeg libx264-dev && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/*

# Install FFmpeg with necessary codecs
RUN apt-get update && \
    apt-get install -y ffmpeg libx264-dev libavcodec-extra && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/backend

COPY package*.json ./
COPY ./prisma ./prisma

# Install dependencies inside the container
RUN npm ci

COPY . .

RUN npm run generate
RUN npm run build

# Create the video directory structure
RUN mkdir -p /usr/src/backend/video/defaultQuality /usr/src/backend/video/144p /usr/src/backend/video/240p /usr/src/backend/video/480p /usr/src/backend/video/720p /usr/src/backend/video/1080p /usr/src/backend/video/4k
RUN mkdir -p /usr/src/backend/thumbnails
RUN mkdir -p /usr/src/backend/profileImages

EXPOSE 8000
EXPOSE 8001

CMD ["npm", "run", "start"] 

