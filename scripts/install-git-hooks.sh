#!/bin/bash

# Install Git Hooks for Add Authorization
# This script sets up a pre-commit hook to require explicit permission before staging

echo "🔧 Installing Git Add Authorization Hook..."

# Create a wrapper script for git add
cat > .git/hooks/git-add-wrapper << 'EOF'
#!/bin/sh

# Git Add Authorization Wrapper
# Requires explicit permission before any add operation

echo ""
echo "🚨 GIT ADD AUTHORIZATION REQUIRED"
echo "================================="
echo ""
echo "This repository requires explicit permission before staging changes."
echo ""

# Check if there are changes to stage
if [ -z "$(git diff --name-only)" ] && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    echo "ℹ️  No changes to stage"
    exit 0
fi

echo "📋 Files to be staged:"
git status --porcelain | head -10
if [ $(git status --porcelain | wc -l) -gt 10 ]; then
    echo "... and $(( $(git status --porcelain | wc -l) - 10 )) more files"
fi

echo ""
echo "📝 Changes summary:"
git diff --stat 2>/dev/null || echo "New files and modifications detected"

echo ""
echo "⚠️  REQUIRED: Request permission from project owner before proceeding"
echo ""
echo "Have you received explicit permission to stage these changes? (y/N)"
read -r response

case "$response" in
    [yY]|[yY][eE][sS])
        echo "✅ Permission confirmed - proceeding with git add"
        # Execute the original git add command with all arguments
        exec git-original "$@"
        ;;
    *)
        echo "❌ Git add cancelled - obtain permission first"
        echo ""
        echo "To request permission, provide this summary:"
        echo "- Files to stage: $(git status --porcelain | wc -l) files"
        echo "- Branch: $(git branch --show-current)"
        echo "- Changes: $(git diff --stat 2>/dev/null | tail -1 || echo 'New files detected')"
        echo ""
        exit 1
        ;;
esac
EOF

# Make the wrapper executable
chmod +x .git/hooks/git-add-wrapper

# Create an alias to intercept git add commands
echo "Creating git add alias..."
git config alias.add '!sh .git/hooks/git-add-wrapper add'

echo "✅ Git add authorization hook installed successfully!"
echo ""
echo "📋 What this does:"
echo "   - Intercepts all 'git add' commands"
echo "   - Shows summary of changes to be staged"
echo "   - Requires explicit 'y' confirmation to proceed"
echo "   - Cancels add if permission not confirmed"
echo ""
echo "🔧 To remove this hook later:"
echo "   git config --unset alias.add"
echo "   rm .git/hooks/git-add-wrapper"
echo ""
echo "⚠️  Remember: Always request permission before staging changes!"