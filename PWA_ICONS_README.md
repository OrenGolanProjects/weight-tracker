# PWA Icons Setup

The Progressive Web App (PWA) configuration requires icon files to be added to the `public` directory.

## Required Icon Files

You need to create the following icon files and place them in the `public/` directory:

1. **icon-192x192.png** - 192x192 pixels
2. **icon-512x512.png** - 512x512 pixels
3. **favicon.ico** - Standard favicon

## How to Create Icons

### Option 1: Use an Online Generator

1. Visit [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
2. Upload your logo or design
3. Download the generated icon pack
4. Copy `icon-192x192.png` and `icon-512x512.png` to the `public/` folder

### Option 2: Use Figma/Photoshop/GIMP

1. Create a square canvas (512x512px recommended)
2. Design your app icon with the app theme color (#1976d2)
3. Export as PNG at 512x512px and save as `icon-512x512.png`
4. Resize to 192x192px and save as `icon-192x192.png`
5. Create a 32x32px version and convert to `favicon.ico`

### Option 3: Simple Placeholder (For Testing)

For quick testing, you can use a simple colored square:

1. Open any image editor
2. Create a 512x512px image with a solid color background (#1976d2)
3. Add white text "WT" in the center
4. Export and resize as needed

## Icon Guidelines

- **Format**: PNG with transparency
- **Content**: Should be recognizable at small sizes
- **Safe Zone**: Keep important content within the center 80% of the icon
- **Theme**: Use app's primary color (#1976d2) and white
- **Suggested Design**:
  - FitnessCenter icon or dumbbell symbol
  - Or letters "WT" (Weight Tracker)
  - With the app's blue theme color

## Current Status

⚠️ **Action Required**: PWA icons need to be added before the app can be installed.

The manifest.json file is configured and ready, but requires these icon files to function properly.
