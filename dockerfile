FROM node:18

# Instalar herramientas necesarias
RUN apt-get update && \
    apt-get install -y libreoffice imagemagick && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar solo backend
COPY backend ./backend
COPY package*.json ./

# Instalar dependencias si package.json está en raíz
RUN cd backend && npm install

# Exponer el puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "backend/server.js"]
