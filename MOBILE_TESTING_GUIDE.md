# Mobile Testing Guide for Clue/Cluedo Assistant

## Quick Test Methods

### Method 1: Chrome DevTools (Easiest)
1. Open `index.html` in Chrome
2. Press `F12` to open DevTools
3. Press `Ctrl+Shift+M` (Windows) or `Cmd+Shift+M` (Mac) to toggle device toolbar
4. Select device from dropdown (iPhone 12 Pro, Galaxy S20, etc.)
5. Or set custom dimensions (e.g., 375x667 for iPhone)

### Method 2: Firefox Responsive Design Mode
1. Open `index.html` in Firefox
2. Press `F12` to open DevTools
3. Press `Ctrl+Shift+M` (Windows) or `Cmd+Shift+M` (Mac)
4. Select device or set custom size

### Method 3: Safari (Mac only)
1. Enable Developer menu: Safari → Preferences → Advanced → Check "Show Develop menu"
2. Open `index.html` in Safari
3. Develop → Enter Responsive Design Mode
4. Select device from dropdown

### Method 4: Resize Browser Window
1. Open `index.html` in any browser
2. Resize window to narrow width (375px or less)
3. Responsive styles will activate automatically

## Test on Real Device

### Option A: Local Network
1. Find your computer's IP address:
   - Windows: Open Command Prompt, type `ipconfig`, look for IPv4 Address
   - Mac/Linux: Open Terminal, type `ifconfig` or `ip addr`, look for inet address
2. Start a local server (if needed):
   - Python: `python -m http.server 8000`
   - Node.js: `npx http-server -p 8000`
   - VS Code: Use Live Server extension
3. On your phone, open: `http://[YOUR_IP]:8000`

### Option B: Online Hosting
- Upload to GitHub Pages (free)
- Use Netlify Drop (drag and drop, free)
- Use Vercel (free)

## Recommended Test Devices

### Mobile Phones
- iPhone SE (375x667) - Smallest modern iPhone
- iPhone 12/13/14 (390x844) - Standard iPhone
- Galaxy S20 (360x800) - Standard Android
- Pixel 5 (393x851) - Standard Android

### Tablets
- iPad (768x1024) - Standard iPad
- iPad Pro (1024x1366) - Large iPad

## What to Test

1. **Layout**
   - Cards stack vertically on mobile
   - Tables scroll horizontally
   - Buttons are touch-friendly (44px+)

2. **Touch Interactions**
   - All buttons are easy to tap
   - Card status cells are tappable
   - No accidental clicks

3. **Readability**
   - Text is readable without zooming
   - Headers are appropriately sized
   - Tables are scrollable

4. **Performance**
   - Page loads quickly
   - Smooth scrolling
   - No lag when clicking

## Quick Checklist

- [ ] Game setup works on mobile
- [ ] Card status grid scrolls horizontally
- [ ] All buttons are easily tappable
- [ ] Text is readable
- [ ] Collapsible sections work
- [ ] Suggestions are clickable
- [ ] Forms are usable
- [ ] No horizontal scrolling on main page (except tables)

## Browser DevTools Shortcuts

- **Chrome/Edge**: `Ctrl+Shift+M` (Windows) / `Cmd+Shift+M` (Mac)
- **Firefox**: `Ctrl+Shift+M` (Windows) / `Cmd+Shift+M` (Mac)
- **Safari**: `Cmd+Option+R` (after enabling Develop menu)

## Tips

1. **Test in portrait and landscape** - Some layouts may differ
2. **Test different screen sizes** - Not all phones are the same
3. **Test touch interactions** - Use mouse to simulate touch in DevTools
4. **Check performance** - Mobile devices may be slower
5. **Test with slow network** - Use DevTools Network throttling

