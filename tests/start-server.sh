#!/bin/bash
cd "$(dirname "$0")"
echo "🌐 Iniciando servidor desde: $(pwd)"
echo "📁 Archivos disponibles:"
ls -la *.html
echo ""
echo "🚀 Servidor ejecutándose en: http://localhost:8000"
echo "📋 Archivos de prueba disponibles:"
echo "   - http://localhost:8000/index.html"
echo "   - http://localhost:8000/test-simple.html"
echo "   - http://localhost:8000/debug-modules.html"
echo "   - http://localhost:8000/test-game.html"
echo ""
python3 -m http.server 8000 