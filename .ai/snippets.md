# AI Code Snippets

Quick reference snippets for common patterns in this codebase.

## Adding a New Slider Control

### 1. HTML (overlay_editor.html)
```html
<div class="input-group">
    <label for="feature-control">Feature Name</label>
    <div style="display: flex; align-items: center; gap: 8px;">
        <input type="range" id="feature-control"
               min="0" max="100" value="50" step="1"
               oninput="updateFeature()">
        <span id="feature-control-value">50</span>
    </div>
</div>
```

### 2. Module (featureModule.js)
```javascript
static updateFeature() {
    const value = UIHelpers.getNumericValue('feature-control', 'feature-control-value', 0, 50);
    const svgDoc = appState.getSvgDoc();
    const element = svgDoc?.querySelector('#target-element');
    if (element) {
        element.setAttribute('some-attr', value);
    }
}
```

### 3. Wiring (overlay_editor.js)
```javascript
window.updateFeature = () => FeatureModule.updateFeature();
```

### 4. Save/Load (configManager.js)
```javascript
// In collectConfig():
feature: {
    value: parseFloat(document.getElementById('feature-control')?.value) || 50
}

// In applyConfig():
if (config.feature) {
    this.setInputValue('feature-control', config.feature.value);
}
```

---

## Adding a Color Picker

### HTML
```html
<div class="input-group">
    <label for="element-color">Element Color</label>
    <input type="color" id="element-color" value="#000000"
           onchange="updateElementColor()">
</div>
```

### Module
```javascript
static updateElementColor() {
    const color = UIHelpers.getColorValue('element-color', '#000000');
    const svgDoc = appState.getSvgDoc();
    const element = svgDoc?.querySelector('#target-element');
    if (element) {
        element.setAttribute('fill', color);
    }
}
```

---

## Adding a Checkbox Toggle

### HTML
```html
<div class="input-group">
    <label>
        <input type="checkbox" id="feature-enabled" onchange="toggleFeature()">
        Enable Feature
    </label>
</div>
```

### Module
```javascript
static toggleFeature() {
    const enabled = UIHelpers.getCheckboxValue('feature-enabled');
    const svgDoc = appState.getSvgDoc();
    const element = svgDoc?.querySelector('#target-element');
    if (element) {
        element.style.display = enabled ? 'block' : 'none';
    }
}
```

---

## Adding State for Artwork

### stateManager.js
```javascript
// In constructor
this._featureData = null;
this._featureOriginalData = null;
this._featurePosition = { x: 0, y: 0 };
this._featureScale = 1.0;
this._featureOpacity = 1.0;
this._featureRotation = 0;

// Getters
getFeatureData() { return this._featureData; }
getFeatureOriginalData() { return this._featureOriginalData; }
getFeaturePosition() { return { ...this._featurePosition }; }
getFeatureScale() { return this._featureScale; }
getFeatureOpacity() { return this._featureOpacity; }
getFeatureRotation() { return this._featureRotation; }

// Setters
setFeatureData(data) { this._featureData = data; }
setFeatureOriginalData(data) { this._featureOriginalData = data; }
setFeaturePosition(x, y) { this._featurePosition = { x, y }; }
setFeatureScale(scale) { this._featureScale = scale; }
setFeatureOpacity(opacity) { this._featureOpacity = opacity; }
setFeatureRotation(rotation) { this._featureRotation = rotation; }

// In reset()
this._featureData = null;
this._featureOriginalData = null;
this._featurePosition = { x: 0, y: 0 };
this._featureScale = 1.0;
this._featureOpacity = 1.0;
this._featureRotation = 0;
```

---

## Creating SVG Elements

### Image Element
```javascript
const svgNS = "http://www.w3.org/2000/svg";
const xlinkNS = "http://www.w3.org/1999/xlink";

const image = document.createElementNS(svgNS, 'image');
image.setAttribute('id', 'my-image');
image.setAttributeNS(xlinkNS, 'xlink:href', dataURL);
image.setAttribute('x', '0');
image.setAttribute('y', '0');
image.setAttribute('width', '55.6');
image.setAttribute('height', '90.4');
image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
image.setAttribute('opacity', '1.0');

// Insert after a reference element
refElement.parentNode.insertBefore(image, refElement.nextSibling);
```

### Rect Element
```javascript
const rect = document.createElementNS(svgNS, 'rect');
rect.setAttribute('id', 'my-rect');
rect.setAttribute('x', '0');
rect.setAttribute('y', '0');
rect.setAttribute('width', '10');
rect.setAttribute('height', '10');
rect.setAttribute('rx', '1.5');  // Rounded corners
rect.setAttribute('ry', '1.5');
rect.setAttribute('fill', '#ff0000');
```

### Text Element with Tspans
```javascript
const text = document.createElementNS(svgNS, 'text');
text.setAttribute('x', '10');
text.setAttribute('y', '10');

const lines = ['Line 1', 'Line 2'];
lines.forEach((line, i) => {
    const tspan = document.createElementNS(svgNS, 'tspan');
    tspan.setAttribute('x', '10');
    tspan.setAttribute('dy', i === 0 ? '0' : '1.2em');
    tspan.textContent = line;
    text.appendChild(tspan);
});
```

---

## Transform Strings

```javascript
// Position only
const transform = `translate(${x}, ${y})`;

// Rotation around center
const transform = `rotate(${degrees}, ${centerX}, ${centerY})`;

// Scale from center
const transform = `translate(${cx}, ${cy}) scale(${scale}) translate(${-cx}, ${-cy})`;

// Combined
const transforms = [];
if (x !== 0 || y !== 0) transforms.push(`translate(${x}, ${y})`);
if (rotation !== 0) transforms.push(`rotate(${rotation}, ${cx}, ${cy})`);
if (scale !== 1.0) {
    transforms.push(`translate(${cx}, ${cy})`);
    transforms.push(`scale(${scale})`);
    transforms.push(`translate(${-cx}, ${-cy})`);
}
element.setAttribute('transform', transforms.join(' '));
```

---

## Font Selection Handling

```javascript
// Getting font family from select
const fontSelect = document.getElementById('feature-font-select');
const fontValue = fontSelect.value;
let fontFamily = 'Arial, sans-serif';

if (fontValue) {
    try {
        const { fontFamily: parsedFamily } = FontManager.parseFontData(fontValue);
        fontFamily = parsedFamily;
    } catch (e) {
        console.error('Error parsing font:', e);
    }
}

element.setAttribute('font-family', fontFamily);
```

---

## Clearing Artwork Properly

```javascript
static clearFeatureArtwork() {
    const svgDoc = appState.getSvgDoc();
    const element = svgDoc?.querySelector('#feature-artwork');

    // Remove SVG element if exists
    if (element) element.remove();

    // ALWAYS clear state unconditionally
    const hadArtwork = element || appState.getFeatureData();

    appState.setFeatureData(null);
    appState.setFeatureOriginalData(null);
    appState.setFeaturePosition(0, 0);
    appState.setFeatureScale(1.0);
    appState.setFeatureOpacity(1.0);
    appState.setFeatureRotation(0);

    // Reset UI
    document.getElementById('feature-upload').value = '';
    document.getElementById('feature-controls').style.display = 'none';

    if (hadArtwork) {
        UIManager.showStatus('Artwork cleared', 'success');
    }
}
```
