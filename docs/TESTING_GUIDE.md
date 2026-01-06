# Testing Guide

## Pre-Launch Checklist

Before testing the refactored application, ensure:

- [ ] All CSS files are in `/static/css/`
- [ ] All JS files are in `/static/js/` with correct subdirectories
- [ ] Flask/Python backend serves `/static` directory
- [ ] Browser supports ES6 modules (Chrome 61+, Firefox 60+, Safari 11+)

## Testing Steps

### 1. Initial Load Test

**Test**: Application loads without errors

1. Open browser developer console (F12)
2. Navigate to the application URL
3. Check for errors in Console tab
4. Check Network tab for failed resource loads

**Expected**:
- No console errors
- All CSS files load (200 status)
- All JS files load (200 status)
- SVG template loads successfully
- Status message shows "Template loaded successfully!"

### 2. Title Editor Tests

**Test**: Title text editing
1. Type in "Title" input field
2. Observe SVG preview updates in real-time

**Test**: Title color
1. Click color picker for "Font Color"
2. Select different color
3. Observe title color changes

**Test**: Title font
1. Select different font from dropdown
2. Observe font changes in preview

**Test**: Title size
1. Adjust "Font Size" slider
2. Observe size changes in preview

**Test**: Title background
1. Toggle "Enable background fill" checkbox
2. Observe background appears/disappears
3. Change background color
4. Observe color updates

**Expected**: All updates reflected in SVG preview immediately

### 3. Button Label Tests

**Test**: Individual button editing
1. Type in any button input (1-9, Clear, 0, Enter)
2. Observe button label updates in SVG

**Test**: Global button styling
1. Change "Button Label Color"
2. Observe all 12 buttons update
3. Adjust "Button Label Size"
4. Observe all buttons resize

**Test**: Button font
1. Select different font for buttons
2. Observe font changes

**Test**: Button backgrounds
1. Check "Enable" for button background
2. Select background color
3. Observe colored rectangle behind label

**Expected**: All 12 buttons respond to global changes, individual buttons update independently

### 4. Action Button Tests

**Test**: Action button labels
1. Edit "Top Action Buttons" label
2. Observe both top buttons update
3. Edit "Bottom-Left" and "Bottom-Right" separately
4. Observe independent updates

**Test**: Action arrow styling
1. Toggle "Enable arrow fill"
2. Select arrow color
3. Observe 4 arrows update

**Expected**: Top buttons share label, bottom buttons independent, arrows update together

### 5. Bottom Controls Tests

**Test**: Bottom text
1. Edit "Direction Text"
2. Observe text updates in bottom section

**Test**: Bottom text styling
1. Change color, font, size
2. Observe updates

**Test**: Bottom arrows
1. Toggle arrow fill
2. Select color
3. Observe disc arrows update

**Expected**: All bottom controls update independently

### 6. Main Artwork Tests

**Test**: Artwork upload
1. Click "Upload artwork" area
2. Select PNG or JPG image
3. Observe image appears in overlay

**Test**: Artwork positioning
1. Use X/Y sliders to move artwork
2. Use arrow buttons for fine control
3. Observe artwork moves

**Test**: Artwork scaling
1. Adjust scale slider
2. Observe artwork resizes

**Test**: Artwork opacity
1. Adjust opacity slider
2. Observe transparency changes

**Test**: Clear artwork
1. Click "Clear Artwork" button
2. Observe artwork removed

**Expected**: All artwork manipulations work smoothly

### 7. Button Artwork Tests

**Test**: Button selection
1. Select button from dropdown
2. Observe controls appear

**Test**: Button artwork upload
1. Upload small image for button
2. Observe image appears on selected button

**Test**: Transparency
1. Check "Remove white background"
2. Adjust threshold
3. Observe white pixels become transparent

**Test**: Button artwork manipulation
1. Adjust position (X/Y)
2. Adjust rotation
3. Adjust scale
4. Observe changes

**Test**: Clear button artwork
1. Click "Clear Artwork"
2. Observe artwork removed from button

**Expected**: Each button can have independent artwork with full transform controls

### 8. Export Tests

**Test**: PNG export with template
1. Check "Include overlay template"
2. Click "Download PNG"
3. Observe PNG downloads
4. Open PNG - should show full overlay with template

**Test**: PNG export without template
1. Uncheck "Include overlay template"
2. Click "Download PNG"
3. Observe PNG downloads
4. Open PNG - should show only artwork and labels

**Test**: Reset
1. Make several changes
2. Click "Reset All"
3. Confirm dialog
4. Observe page reloads to defaults

**Expected**:
- PNG exports successfully
- Template toggle works
- Reset clears all changes

### 9. State Persistence Tests

**Test**: Multiple operations
1. Add title
2. Upload artwork
3. Change button labels
4. Upload button artwork
5. Export PNG
6. Verify all elements present in export

**Expected**: All state retained through multiple operations

### 10. Error Handling Tests

**Test**: Invalid file upload
1. Try uploading non-image file
2. Observe error handling

**Test**: Network failure
1. Disconnect network
2. Try loading fonts
3. Observe error messages

**Expected**: Graceful error messages, no crashes

## Browser Testing Matrix

Test in multiple browsers:

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ☐ |
| Firefox | 88+ | ☐ |
| Safari | 14+ | ☐ |
| Edge | 90+ | ☐ |

## Performance Tests

1. **Load time**: Application should load in < 2 seconds
2. **Responsiveness**: UI updates should feel immediate (< 100ms)
3. **Memory**: Check for memory leaks after heavy usage
4. **Large files**: Test with high-resolution images

## Regression Tests

Compare with original `overlay_editor.html.backup`:

1. All features work identically
2. UI looks the same
3. Export produces same output
4. No functionality lost

## Console Checks

### No Errors Expected
```
✓ No 404 errors for resources
✓ No JavaScript errors
✓ No CORS errors
✓ No module loading errors
```

### Expected Console Messages
```
✓ Found Eurostile BQ at index...
✓ Selected font index...
✓ IMAGE INSERTED INTO DOM...
```

## Network Checks

### Required Requests (Success)
- `/` - HTML page (200)
- `/static/css/theme.css` (200)
- `/static/css/main.css` (200)
- `/static/css/components.css` (200)
- `/static/js/overlay_editor.js` (200)
- `/static/js/modules/*.js` (200 for each)
- `/static/js/services/*.js` (200 for each)
- `/get_template` - SVG template (200)
- `/fonts/list` - Font list (200)
- `/fonts/{font}` - Font files (200)
- `/export_png` - PNG export (200, POST)

## Common Issues & Solutions

### Issue: "Failed to load module script"
**Solution**: Check that Flask serves `/static` directory, verify file paths

### Issue: "Cannot find module"
**Solution**: Verify import paths use `.js` extension

### Issue: "Uncaught ReferenceError"
**Solution**: Check that window functions are exposed in overlay_editor.js

### Issue: Fonts not loading
**Solution**: Verify `/fonts/list` endpoint works, check font file paths

### Issue: Export fails
**Solution**: Check `/export_png` endpoint, verify SVG serialization

### Issue: Inline handlers not working
**Solution**: Verify functions exposed to window object

## Debugging Tips

1. **Use console.log**: Check state manager values
   ```javascript
   console.log(window.appState?.getSvgDoc());
   ```

2. **Network tab**: Verify all resources load
3. **Sources tab**: Set breakpoints in modules
4. **Application tab**: Check for storage issues
5. **Performance tab**: Profile slow operations

## Automated Testing (Future)

Consider adding:
- Unit tests with Jest
- Integration tests with Playwright
- Visual regression tests
- Performance benchmarks

## Test Report Template

```
Date: ___________
Tester: ___________
Browser: ___________
Version: ___________

Initial Load:          ☐ Pass ☐ Fail
Title Editor:          ☐ Pass ☐ Fail
Button Labels:         ☐ Pass ☐ Fail
Action Buttons:        ☐ Pass ☐ Fail
Bottom Controls:       ☐ Pass ☐ Fail
Main Artwork:          ☐ Pass ☐ Fail
Button Artwork:        ☐ Pass ☐ Fail
Export:                ☐ Pass ☐ Fail
State Persistence:     ☐ Pass ☐ Fail
Error Handling:        ☐ Pass ☐ Fail

Notes:
_____________________________
_____________________________
_____________________________
```

## Success Criteria

✅ All tests pass
✅ No console errors
✅ Feature parity with original
✅ Exports work correctly
✅ Performance acceptable
✅ Works in all target browsers
