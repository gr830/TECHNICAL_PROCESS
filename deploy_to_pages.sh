#!/bin/bash

# Скрипт для деплоя на GitHub Pages с правильной настройкой

echo "Начинаем деплой на GitHub Pages..."

# Удаляем старую папку dist, если существует
rm -rf dist

# Устанавливаем переменную окружения и собираем проект
export DEPLOY_ENV=GH_PAGES
npm run build

# Проверяем, успешно ли прошла сборка
if [ $? -ne 0 ]; then
  echo "Ошибка при сборке проекта!"
  exit 1
fi

echo "Сборка завершена, обновляем index.html для GitHub Pages..."

# Создаем правильный index.html без importmap
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grosver | TechProcess Designer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #020617;
            color: #f8fafc;
            margin: 0;
        }
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #0f172a;
        }
        ::-webkit-scrollbar-thumb {
            background: #ea580c;
            border-radius: 10px;
        }
        /* Grid background for industrial feel */
        .bg-grid {
            background-image: radial-gradient(#334155 0.5px, transparent 0.5px);
            background-size: 24px 24px;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <!-- Dependencies loaded via CDN -->
    <script src="https://unpkg.com/react@19.2.4/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@19.2.4/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/recharts@3.7.0/lib/umd/Recharts.min.js"></script>
    
    <!-- Main application script -->
EOF

# Находим и добавляем правильный путь к главному JS файлу
MAIN_JS=$(ls dist/assets/index-*.js | head -n 1 | xargs basename)
echo "    <script type=\"module\" src=\"/TECHNICAL_PROCESS/assets/$MAIN_JS\"></script>" >> dist/index.html
echo '</body>' >> dist/index.html
echo '</html>' >> dist/index.html

echo "Обновленный index.html создан."

# Деплоим на GitHub Pages
npx gh-pages -d dist -b gh-pages -m "Deploy to GitHub Pages with updated index.html"

echo "Деплой завершен! Приложение доступно по адресу: https://gr830.github.io/TECHNICAL_PROCESS/"