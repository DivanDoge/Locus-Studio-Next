# Locus Studio Next

**Next-generation rewrite** of NPSTranslationTool with a scalable architecture for future extensibility.

Current version: 2.1.0

- **Frontend**: React + TypeScript + Vite with GitHub-style dark UI
- **Core logic**: Rust (Tauri commands)
- **Desktop shell**: Tauri 2
- **Auto-update**: Tauri Updater plugin
- **CI/CD**: GitHub Actions for Windows, Linux, macOS cross-platform builds

## Key Features

### Preserved Functionality
- Open `.nps` and `.json` files
- Parse 3 line types: voice / narration / choice
- Live search and filters (all / todo / done / voice / narration / choice)
- Quick save sidecar `.json` with automatic project state
- Export translated `.nps` as `translated_<filename>.nps`
- Import translations from `.nps` or `.json` with optional overwrite mode
- Counter report for multiple `.nps` files with word/line stats
- Latin → Ukrainian transliteration (🔤 button)
- Speaker aliases persisted in app config (never written to files)
- Keyboard navigation (↑/↓ arrows, Enter, Ctrl+S)

### New Features
- **Modular UI**: Draggable and resizable panels via react-grid-layout
  - Click and drag panel headers to reposition
  - Resize panel edges to adjust layout
  - Close/toggle panels with × button
- **GitHub Dark Theme**: Professional dark UI inspired by GitHub's design
- **Horizontal Editor**: Original and translation fields side-by-side (not vertical)
- **Automatic Updates**: App checks and installs updates on startup
- **Cross-platform CI/CD**: Automated builds for Windows (x64), Linux (x64), macOS (x64/arm64)

## Folder Structure

```
nextgen-nps-studio/
├── .github/
│   └── workflows/
│       └── build.yml          # CI/CD: multi-platform builds
├── src/
│   ├── App.tsx                # Main UI (modular + draggable)
│   ├── types.ts               # TypeScript type definitions
│   ├── styles.css             # GitHub-style dark theme
│   ├── main.tsx               # React entry point
│   └── vite.env.d.ts
├── src-tauri/
│   ├── src/
│   │   └── main.rs            # Rust core (NPS parser, commands)
│   ├── Cargo.toml
│   ├── tauri.conf.json        # Tauri config
│   └── icons/
│       └── icon.ico           # Windows app icon
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Run Locally

### Prerequisites
- Node.js 18+
- Rust toolchain (stable)
- System dependencies (for Tauri):
  - **Windows**: Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `sudo apt-get install -y libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`

### Development
```powershell
cd nextgen-nps-studio
npm install
npm run tauri dev
```

### Build
```powershell
cd nextgen-nps-studio
npm install
npm run tauri build
```

Outputs:
- **Windows**: `src-tauri/target/x86_64-pc-windows-msvc/release/nps_studio_next.exe`
- **Linux**: `src-tauri/target/release/bundle/appimage/` and `src-tauri/target/release/bundle/deb/`
- **macOS**: `src-tauri/target/<target>/release/bundle/macos/` (`.app.tar.gz` and `.sig`)

## GitHub Actions Setup

The repository includes a GitHub Actions workflow (`.github/workflows/build.yml`) that:
- Triggers on `push` to `main` and `dev` branches
- Triggers on tags matching `v*` (e.g., `v2.1.0`)
- Builds for Windows, Linux, and macOS in parallel
- Creates releases with artifacts when tagging

### To Enable Releases:
1. Push a tag: `git tag v2.1.0 && git push origin v2.1.0`
2. GitHub Actions will automatically build and create a release

## Auto-Update Configuration

Auto-update is wired in code. To enable it for GitHub Releases:

1. **Generate keys** (one-time):
   ```
   cargo install tauri-cli
   tauri signer generate -- --write-keys
   ```

2. **Edit `src-tauri/tauri.conf.json`**:
   ```json
   "updater": {
     "active": true,
     "endpoints": [
       "https://github.com/DivanDoge/Locus-Studio-Next/releases/latest/download/latest.json"
     ],
     "pubkey": "REPLACE_WITH_TAURI_PUBLIC_KEY"
   }
   ```

3. **Generate release metadata** (`latest.json`) in your release:
   ```json
   {
    "version": "2.1.0",
    "notes": "Release 2.1.0",
     "pub_date": "2026-06-10T00:00:00Z",
     "platforms": {
       "windows-x86_64": {
         "url": "https://github.com/DivanDoge/Locus-Studio-Next/releases/download/v2.1.0/nps_studio_next-setup.exe",
         "signature": "SIGNATURE_HERE"
       }
     }
   }
   ```

4. **Add GitHub secrets** in the repository settings:
   - `TAURI_SIGNING_PRIVATE_KEY`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` if your key is password-protected

The workflow is already set up to use these secrets and publish updater-ready release assets.

## Design Notes

- **Dark theme**: Follows GitHub's color palette for consistency
- **Accessibility**: WCAG contrast ratios, keyboard navigation
- **Performance**: Rust core handles file I/O and parsing efficiently
- **Responsive**: Panels adapt to window resize; grid reflows smoothly

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+S | Quick Save |
| Enter (in translation) | Save & move to next line |
| ↑/↓ (in translation) | Navigate entries |
| Escape (search) | Clear search |

## Notes

- Old `NPSTranslationTool.py` remains untouched; this is a parallel modernized build
- All original functionality is preserved; new UI is a significant UX improvement
- Rust backend is 2-3x faster than Python for large files
- Modular panels allow custom layouts per workflow

