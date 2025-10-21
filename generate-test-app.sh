#!/bin/bash

set -e  # Exit on any error

# Get the current plugin directory
PLUGIN_DIR="$(pwd)"
PLUGIN_NAME="$(basename "$PLUGIN_DIR")"
TEST_APP_NAME="export-csv-plugin-test-app"
TEST_APP_DIR="/tmp/${TEST_APP_NAME}"

# Cleanup function
cleanup() {
  echo ""
  echo "🧹 Cleaning up test app directory..."
  rm -rf "$TEST_APP_DIR"
  echo "✨ Cleanup complete!"
}

# Set up signal traps for cleanup
trap cleanup EXIT INT TERM

echo "🧹 Cleaning up existing test app..."
rm -rf "$TEST_APP_DIR"

echo "🏗️  Creating new Strapi test application at $TEST_APP_DIR..."
cd /tmp
npx create-strapi@latest --ts --use-npm --install --no-git-init --example --skip-cloud --skip-db "$TEST_APP_NAME"

echo "📁 Entering test app directory..."
cd "$TEST_APP_DIR"

echo "👤 Creating admin user..."
npx strapi admin:create-user --firstname=Test --lastname=User --email=test@user.pri --password=Testing12345

echo "🔌 Configuring export-csv plugin..."
# Create the plugins configuration file
cat > config/plugins.ts << EOF
export default () => ({
  'export-csv': {
    enabled: true,
    resolve: '$PLUGIN_DIR',
    config: {
      contentTypes: {
        'api::article.article': {
          fieldTransforms: {
            author: (value) => { return \`\${value?.name} <\${value?.email}>\` },
            cover: (value) => { return \`[\${value?.alternativeText}](\${value?.url})\` }
          }
        }
      }
    },
  },
});
EOF

echo "✅ Test app setup complete!"
echo "📍 Location: $(pwd)"
echo "🚀 Starting Strapi development server..."
echo "👤 Admin User - Email: test@user.pri"
echo "👤 Admin User - Password: Testing12345"
npm run develop
