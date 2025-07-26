#!/bin/bash

echo "▶ Building the React app..."
npm run build

echo "📦 Cleaning up old docs folder..."
rm -rf docs/*

echo "📁 Copying build output to docs..."
cp -r build/* docs/

echo "📤 Committing and pushing to GitHub..."
git add .
git commit -m "🚀 Deployed latest build to docs"
git push origin main

echo "✅ Done! Visit your site after 1–2 minutes:"
echo "🌐 https://github.com/master-skill/web/"
