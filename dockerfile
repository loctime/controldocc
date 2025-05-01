# Imagen base
FROM node:18

# Instalar LibreOffice e ImageMagick
RUN apt-get update && \
    apt-get install -y libreoffice imagemagick && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Carpeta de trabajo
WORKDIR /app

# Copiar todo
COPY . .

# Instalar dependencias
RUN npm install

# Puerto del backend
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]
