# What Can I Use Copilot for?

A comprehensive, feature-rich search application for discovering GitHub Copilot use cases. Built with React, Vite, and modern web technologies.

🔗 **Live Demo**: Deploy to Vercel to see it in action!

## 🚀 Features Implemented

### ✅ P0 Features (Critical)
1. **One-Click Copy Prompts** - Copy example prompts to clipboard with visual feedback
2. **Advanced Filters Panel** - Filter by surface, mode, risk level, language, and category
3. **Dark Mode Toggle** - Theme switching with system preference detection
4. **Deep Linking** - Share searches via URL (`?q=search+term`)
5. **Responsive Design** - Perfect experience on all screen sizes

### ✅ P1 Features (High Priority)
6. **Favorites/Bookmarks** - Save favorite use cases (stored locally)
7. **Filter Chips** - Visual display of active filters
8. **Sort Options** - 6 ways to sort results
9. **Local Storage** - Persists favorites, preferences, history
10. **Keyboard Shortcuts** - `Ctrl+K` or `/` for search, `Esc` to close
11. **Related Use Cases** - Discover similar use cases
12. **Export Results** - Markdown, JSON, or CSV
13. **Loading & Error States** - Graceful handling of all scenarios

### ✅ P2 Features (Medium Priority)
14. **Search History** - Track previous searches
15. **Autocomplete** - Smart suggestions as you type
16. **Collections** - Organize favorites into lists
17. **Fuzzy Search** - Typo-tolerant search with Fuse.js
18. **Role-Based Filtering** - Quick filters by developer role
19. **View Toggle** - Compact or expanded result view
20. **Highlight Matches** - See where search terms appear

## 🛠️ Tech Stack

- React 18 + Vite
- React Router (URL sync)
- Fuse.js (fuzzy search)
- CSS Variables (theming)
- Local Storage API

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 🌐 Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
cd copilot-search
vercel
```

### Option 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Click "Deploy" (Vite is auto-detected!)

The `vercel.json` is already configured with:
- SPA routing (rewrites all routes to index.html)
- Caching headers for JSON data
- Security headers

## ⌨️ Keyboard Shortcuts

- `Ctrl+K` or `/` - Focus search
- `Esc` - Close modals
- `↑↓` - Navigate suggestions
- `Enter` - Select suggestion

## 📁 Project Structure

```
src/
├── components/      # SearchBar, SearchResults, FilterPanel, ThemeToggle
├── context/         # ThemeContext, AppContext
├── hooks/           # useKeyboardShortcuts
├── utils/           # localStorage, searchUtils, exportUtils
├── App.jsx         # Main app
└── index.css       # Global styles + CSS variables
```

## 🎨 Customization

### Change Colors
Edit `src/index.css`:
```css
:root {
  --color-primary: #1a73e8;    /* Change primary color */
  --color-background: #ffffff;  /* Light mode background */
}

[data-theme="dark"] {
  --color-background: #18191a;  /* Dark mode background */
}
```

### Modify Search Weights
Edit `src/utils/searchUtils.js`:
```javascript
// Adjust scoring
if (useCase.title.includes(query)) score += 100  // Title weight
if (useCase.category.includes(query)) score += 50  // Category weight
```

## 📊 Data Format

Place your data in `public/copilotusecases.json`:
```json
{
  "usecases": [
    {
      "id": "uc-xxx",
      "title": "Use Case Title",
      "description": "Description",
      "category": "Category",
      "copilot_surface": ["Chat", "Inline"],
      "mode": ["generate"],
      "risk_level": "low",
      "tags": ["tag1"],
      "example_prompts": ["prompt1"],
      "languages": ["javascript"]
    }
  ]
}
```

## 🔧 Configuration

The app works out of the box, but you can customize:
- **Search algorithm**: `src/utils/searchUtils.js`
- **Theme colors**: `src/index.css`
- **Local storage keys**: `src/utils/localStorage.js`
- **Keyboard shortcuts**: `src/hooks/useKeyboardShortcuts.js`

## 🐛 Troubleshooting

**Build fails?**
```bash
rm -rf node_modules dist
npm install
npm run build
```

**Search not working?**
- Verify `copilotusecases.json` is in `public/` folder
- Check JSON is valid

**Styles broken?**
- Clear browser cache
- Check for console errors

## 📝 Features Summary

**Search & Discovery**
- Intelligent multi-field search with scoring
- Fuzzy search fallback
- Real-time results
- Autocomplete suggestions

**Filtering & Sorting**
- 5 filter categories
- Visual filter chips
- 6 sort options
- Combined filtering

**User Experience**
- Auto-focus search
- Keyboard navigation
- Related use cases
- View mode toggle
- Export options

**Personalization**
- Favorites system
- Collections
- Search history
- Theme preference
- View preference

## 📦 Deployment Options

- **Vercel** (recommended) - Zero config
- **Netlify** - `netlify deploy --dir=dist`
- **GitHub Pages** - Use `gh-pages` package
- **Any static host** - Upload `dist/` folder

## 🤝 Contributing

Feel free to submit issues and pull requests!

---

Built with React + Vite | Deployed on Vercel
