# Module Architecture

## Dependency Graph

```
overlay_editor.html (HTML)
    │
    ├── CSS
    │   ├── theme.css (variables)
    │   ├── main.css (layout)
    │   └── components.css (UI)
    │
    └── overlay_editor.js (Entry Point)
            │
            ├── Services Layer
            │   ├── api.js
            │   │   └── Handles: HTTP requests to backend
            │   │
            │   └── stateManager.js
            │       └── Handles: Application state
            │
            └── Modules Layer
                ├── uiManager.js
                │   └── Handles: Status messages, UI utilities
                │
                ├── imageProcessor.js
                │   └── Handles: Canvas image processing
                │
                ├── svgManager.js
                │   ├── Uses: api.js, stateManager.js, uiManager.js
                │   ├── Uses: fontManager.js, titleEditor.js
                │   ├── Uses: buttonEditor.js, actionButtons.js, bottomControls.js
                │   └── Handles: SVG template loading & initialization
                │
                ├── fontManager.js
                │   ├── Uses: api.js, stateManager.js, uiManager.js
                │   ├── Uses: buttonEditor.js, actionButtons.js
                │   └── Handles: Font loading and application
                │
                ├── titleEditor.js
                │   ├── Uses: stateManager.js, uiManager.js
                │   └── Handles: Title text and styling
                │
                ├── buttonEditor.js
                │   ├── Uses: stateManager.js
                │   └── Handles: Button label editing
                │
                ├── buttonArtwork.js
                │   ├── Uses: stateManager.js, uiManager.js, imageProcessor.js
                │   └── Handles: Individual button artwork
                │
                ├── mainArtwork.js
                │   ├── Uses: stateManager.js, uiManager.js
                │   └── Handles: Main overlay artwork
                │
                ├── actionButtons.js
                │   ├── Uses: stateManager.js
                │   └── Handles: Action button controls
                │
                ├── bottomControls.js
                │   ├── Uses: stateManager.js
                │   └── Handles: Bottom text and arrows
                │
                └── exportManager.js
                    ├── Uses: stateManager.js, uiManager.js, api.js
                    └── Handles: PNG export and reset
```

## Module Relationships

### Core Services
- **api.js**: Backend communication (no dependencies)
- **stateManager.js**: State management (no dependencies)

### Utility Modules
- **uiManager.js**: UI helpers (no dependencies)
- **imageProcessor.js**: Image processing (no dependencies)

### Coordinator Module
- **svgManager.js**: Orchestrates initialization (depends on everything)

### Editor Modules
All editor modules depend on `stateManager.js`:
- **titleEditor.js**: Title editing
- **buttonEditor.js**: Button labels
- **buttonArtwork.js**: Button artwork
- **mainArtwork.js**: Main artwork
- **actionButtons.js**: Action buttons
- **bottomControls.js**: Bottom controls

### Font Module
- **fontManager.js**: Font management (cross-cutting concern)

### Export Module
- **exportManager.js**: Export functionality (aggregates all state)

## Data Flow

```
User Input (HTML)
    ↓
Event Handler (overlay_editor.js)
    ↓
Module Function (e.g., titleEditor.js)
    ↓
State Update (stateManager.js)
    ↓
SVG DOM Update
    ↓
Visual Feedback (uiManager.js)
```

## Import/Export Pattern

### Services
```javascript
// Exports singleton or class with static methods
export class APIService { ... }
export const appState = new StateManager();
```

### Modules
```javascript
// Exports class with static methods
export class TitleEditor { ... }
```

### Entry Point
```javascript
// Imports everything and coordinates
import { SVGManager } from './modules/svgManager.js';
import { TitleEditor } from './modules/titleEditor.js';
// ... etc
```

## Module Responsibilities

| Module | Responsibility | State Access | DOM Access |
|--------|---------------|--------------|------------|
| **api.js** | HTTP requests | None | None |
| **stateManager.js** | State storage | Full | None |
| **uiManager.js** | Status messages | None | Read/Write |
| **imageProcessor.js** | Canvas processing | None | Canvas |
| **svgManager.js** | Initialization | Write | Write |
| **fontManager.js** | Font management | Write | Write |
| **titleEditor.js** | Title editing | Read/Write | Write |
| **buttonEditor.js** | Button editing | Read | Write |
| **buttonArtwork.js** | Button artwork | Read/Write | Write |
| **mainArtwork.js** | Main artwork | Read/Write | Write |
| **actionButtons.js** | Action buttons | Read | Write |
| **bottomControls.js** | Bottom controls | Read | Write |
| **exportManager.js** | Export/Reset | Read | Read/Write |

## Extensibility Points

### Adding a New Feature

1. **Create new module**: `static/js/modules/myFeature.js`
2. **Import dependencies**:
   ```javascript
   import { appState } from '../services/stateManager.js';
   import { UIManager } from './uiManager.js';
   ```
3. **Export class**:
   ```javascript
   export class MyFeature {
       static doSomething() { ... }
   }
   ```
4. **Wire up in entry point**: `overlay_editor.js`
   ```javascript
   import { MyFeature } from './modules/myFeature.js';
   // Add event handlers
   ```

### Adding State

1. **Update stateManager.js**:
   ```javascript
   constructor() {
       this.myNewState = null;
   }

   getMyNewState() { return this.myNewState; }
   setMyNewState(value) { this.myNewState = value; }
   ```

2. **Use in modules**:
   ```javascript
   const value = appState.getMyNewState();
   appState.setMyNewState(newValue);
   ```

## Best Practices

1. **Keep modules focused**: Each module should have one clear responsibility
2. **Use stateManager**: Always go through state manager for global state
3. **Avoid circular dependencies**: Keep dependency graph acyclic
4. **Static methods**: Use static methods for stateless operations
5. **Error handling**: Use try/catch and UIManager for user feedback
6. **Naming**: Use descriptive names that indicate purpose
7. **Comments**: Add JSDoc comments for public APIs
8. **Testing**: Each module should be independently testable

## Performance Considerations

1. **Lazy loading**: Consider dynamic imports for rarely-used features
2. **Debouncing**: Add debouncing to frequent operations (e.g., slider inputs)
3. **Caching**: Leverage browser caching for static files
4. **Minification**: Minify CSS/JS for production
5. **Code splitting**: Split large modules if needed

## Security Considerations

1. **Input validation**: Validate all user inputs
2. **XSS prevention**: Sanitize any user content before DOM insertion
3. **CSP**: Consider Content Security Policy headers
4. **HTTPS**: Use HTTPS for all API calls
5. **File uploads**: Validate file types and sizes server-side
