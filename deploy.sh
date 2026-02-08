#!/bin/bash

# Скрипт для деплоя на GitHub Pages

# Устанавливаем переменную окружения для корректной сборки
export DEPLOY_ENV=GH_PAGES

# Собираем проект
npm run build

# Деплоим на GitHub Pages
npx gh-pages -d dist -b gh-pages -m "Deploy to GitHub Pages"

echo "Деплой завершен! Ваше приложение доступно по адресу: https://gr830.github.io/TECHNICAL_PROCESS/"