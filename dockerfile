# Usa una imagen base oficial de Node.js
FROM node:18

# Instala LibreOffice e ImageMagick para conversiones
RUN apt-get update && \
    apt-get install -y libreoffice imagemagick && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia dependencias y código del backend
COPY package*.json ./
COPY backend ./backend

# Instala las dependencias del backend
WORKDIR /app/backend
RUN npm install

# Expone el puerto 3001 (el que usa tu backend)
EXPOSE 3001

# Comando para iniciar tu servidor
CMD ["node", "server.js"]
