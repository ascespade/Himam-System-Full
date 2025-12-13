#!/bin/bash
# Cleanup old/duplicate documentation files

cd docs

# Keep only essential documentation
KEEP_FILES=(
  "README.md"
  "ARCHITECTURE_PATTERNS.md"
  "REPOSITORY_MIGRATION_GUIDE.md"
  "COMPLETE_REFACTORING_SUMMARY.md"
  "ENTERPRISE_SYSTEM_README.md"
  "MCP_ENHANCED_BEST_PRACTICES.md"
  "QUICK_START.md"
  "WHATSAPP_INTEGRATION_GUIDE.md"
  "WHATSAPP_ACTIVATION_STEPS.md"
)

# Archive old files
mkdir -p ../docs-archive 2>/dev/null

for file in *.md; do
  if [[ ! " ${KEEP_FILES[@]} " =~ " ${file} " ]]; then
    echo "Archiving: $file"
    mv "$file" ../docs-archive/ 2>/dev/null || true
  fi
done

echo "✅ Documentation cleanup complete"


