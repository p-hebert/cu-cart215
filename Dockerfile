FROM node:24-bookworm-slim

WORKDIR /app

# Keep npm cache inside the container/volume, not your host machine.
ENV NPM_CONFIG_CACHE=/home/node/.npm

# Vite dev server port.
EXPOSE 5173

# Runtime command is defined in docker-compose.yml.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]