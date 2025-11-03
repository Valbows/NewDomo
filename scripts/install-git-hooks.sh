#!/bin/bash

# Install Git Hooks for Push Authorization
# This script sets up a pre-push hook to require explicit permission

echo "🔧 Installing Git Push Authorization Hook..."

# Create the pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/sh

# Git Push Authorization Hook
# Requires explicit permission before any push operation

echo ""
echo "🚨 GIT PUSH AUTHORIZATION REQUIRED"
echo "=================================="
echo ""
echo "This repository requires explicit permission before pushing changes."
echo ""
echo "Please review your changes:"
echo ""

# Show what will be pushed
echo "📋 Files to be pushed:"
git diff --name-only origin/$(git branch --show-current)..HEAD | head -10
if [ $(git diff --name-only origin/$(git branch --show-current)..HEAD | wc -l) -gt 10 ]; then
    echo "... and $(( $(git diff --name-only origin/$(git branch --show-current)..HEAD | wc -l) - 10 )) more files"
fi

echo ""
echo "📝 Commits to be pushed:"
git log --oneline origin/$(git branch --show-current)..HEAD | head -5
if [ $(git log --oneline origin/$(git branch --show-current)..HEAD | wc -l) -gt 5 ]; then
    echo "... and $(( $(git log --oneline origin/$(git branch --show-current)..HEAD | wc -l) - 5 )) more commits"
fi

echo ""
echo "⚠️  REQUIRED: Request permission from project owner before proceeding"
echo ""
echo "Have you received explicit permission to push these changes? (y/N)"
read -r response

case "$response" in
    [yY]|[yY][eE][sS])
        echo "✅ Permission confirmed - proceeding with push"
        exit 0
        ;;
    *)
        echo "❌ Push cancelled - obtain permission first"
        echo ""
        echo "To request permission, provide this summary:"
        echo "- Files modified: $(git diff --name-only origin/$(git branch --show-current)..HEAD | wc -l) files"
        echo "- Commits: $(git log --oneline origin/$(git branch --show-current)..HEAD | wc -l) commits"
        echo "- Branch: $(git branch --show-current)"
        echo ""
        exit 1
        ;;
esac
EOF

# Make the hook executable
chmod +x .git/hooks/pre-push

echo "✅ Git push authorization hook installed successfully!"
echo ""
echo "📋 What this does:"
echo "   - Intercepts all 'git push' commands"
echo "   - Shows summary of changes to be pushed"
echo "   - Requires explicit 'y' confirmation to proceed"
echo "   - Cancels push if permission not confirmed"
echo ""
echo "🔧 To remove this hook later:"
echo "   rm .git/hooks/pre-push"
echo ""
echo "⚠️  Remember: Always request permission before pushing!"