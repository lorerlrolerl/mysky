# Push to GitHub Instructions

## After creating the repository on GitHub, run:

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/MySky.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/MySky.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## If you already have a remote, update it:

```bash
# Check current remote
git remote -v

# Update remote URL if needed
git remote set-url origin https://github.com/YOUR_USERNAME/MySky.git

# Push
git push -u origin main
```

