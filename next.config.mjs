/** @type {import('next').NextConfig} */
const nextConfig = {
  // Настройка для безопасной загрузки внешних изображений
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Добавляем ваш домен Vercel Blob Storage
        hostname: 'us8w2gtarj9lxoe8.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**', // Разрешаем загрузку любых файлов из любой папки на этом домене
      },
      // Если у вас в БД Neon сохранены картинки с других доменов, добавьте их сюда же
      // {
      //   protocol: 'https',
      //   hostname: 'res.cloudinary.com',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
};

export default nextConfig;