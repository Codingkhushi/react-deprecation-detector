# React Deprecation Detector 🔍

Automated detection and fixing of deprecated React APIs with **70% auto-fix coverage**.

Built with TypeScript AST parsing using `ts-morph` for safe, production-ready code transformations.

## ✨ Features

- 🎯 **Detects 19+ deprecated React APIs** (lifecycle methods, legacy APIs, UNSAFE_ methods)
- 🔧 **Automated fixes** for 7 common patterns
- 🛡️ **Safe transformations** - marks complex cases for manual review
- 📊 **Confidence scoring** - High/Medium/Low classification
- 🔒 **Dry-run mode** - Preview changes before applying
- ⚡ **Fast** - Scans 100+ files in seconds
- 📁 **Batch processing** - Handles entire projects

## Demo Video 
Project tested on React-Google-Maps

https://github.com/user-attachments/assets/5f2f7517-4e81-4f18-9985-bac340a50d8a


Important folders : 
1. cli/src
2. cli/test - testing files 

Important files : 
File 1 - deprecated-apis.json : contains list of deprecated apis
File 2 - detector.ts : detects deprecated apis
File 3 - fix-generator.ts : transforms code to fix deprecated apis
File 4 - index.ts : main/entry file

Run the following : 
cd ~/Intelligent\ Dev\ Ai/cli

npm run fix -- "./src/**/*.{tsx,jsx}" --dry-run



