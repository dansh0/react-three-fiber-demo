powershell -Command "(gc ./dist/index.html) -replace '/assets/', 'https://shores.design/r3f/assets/' | Out-File -encoding ASCII ./dist/index.html"
powershell -Command "(gc ./dist/index.html) -replace '/favicon.ico', 'https://shores.design/r3f/favicon.ico' | Out-File -encoding ASCII ./dist/index.html"