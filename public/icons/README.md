# PWA Icons Setup Instructions

## Required Icon Files

Please create the following icon files and place them in this `/public/icons/` directory:

### iOS Apple Touch Icons
- `apple-touch-icon-180x180.png` (180x180px)
- `apple-touch-icon-167x167.png` (167x167px) 
- `apple-touch-icon-152x152.png` (152x152px)

### Android/General PWA Icons
- `icon-192x192.png` (192x192px)
- `icon-512x512.png` (512x512px)

## Icon Design Guidelines

### Design Requirements:
1. **Format**: PNG with transparency support
2. **Design**: Square format, centered design
3. **No rounded corners** for iOS icons (iOS adds them automatically)
4. **High contrast** for visibility at small sizes
5. **Simple, recognizable design** that works well when scaled down
6. **No text** (hard to read at small sizes)
7. **Consistent branding** with your existing favicon

### Color Scheme:
- **Theme Color**: #dc2626 (red) - matches your zone lines
- **Background**: White or transparent
- **Accent**: Use your brand colors

### Technical Specifications:
- **iOS icons**: No rounded corners, solid background recommended
- **Android icons**: Can have rounded corners, supports transparency
- **All icons**: Optimized PNG files, compressed for web

## Tools for Creating Icons:

### Online Tools:
- **Figma**: Create vector designs, export at multiple sizes
- **Canva**: Easy drag-and-drop icon creation
- **RealFaviconGenerator**: Generate all sizes from one source image

### Design Software:
- **Adobe Illustrator**: Vector design, export at multiple sizes
- **Sketch**: Mac-based design tool
- **GIMP**: Free alternative to Photoshop

## Testing Your Icons:

1. **iOS**: Test on Safari by adding to home screen
2. **Android**: Test on Chrome by adding to home screen
3. **Desktop**: Check browser tab favicon
4. **PWA**: Verify manifest.json icons load correctly

## File Structure After Setup:
```
public/
├── icons/
│   ├── apple-touch-icon-180x180.png
│   ├── apple-touch-icon-167x167.png
│   ├── apple-touch-icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── README.md
├── favicon.ico
└── manifest.json
```

## Next Steps:
1. Create your icon designs following the guidelines above
2. Export at all required sizes
3. Place files in this directory
4. Test on mobile devices
5. Update colors in manifest.json if needed

The app is already configured to use these icons once you add them!
