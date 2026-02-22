/**
 * Nintendo DS Overlay Editor
 * Builds .OVL files for the NINTV-DS emulator (github.com/wavemotion-dave/NINTV-DS)
 *
 * The .ovl format defines 36 touch hotspots for the DS bottom screen (256×192px)
 * and optionally includes tile/map/palette graphics data.
 */

// --- Button definitions (exact order matches overlay.h OVL_* constants) ---
const DS_BUTTONS = [
    // Keypad (indices 0-11)
    { key: 'KEY_1',        label: '1',        group: 'keypad'   },
    { key: 'KEY_2',        label: '2',        group: 'keypad'   },
    { key: 'KEY_3',        label: '3',        group: 'keypad'   },
    { key: 'KEY_4',        label: '4',        group: 'keypad'   },
    { key: 'KEY_5',        label: '5',        group: 'keypad'   },
    { key: 'KEY_6',        label: '6',        group: 'keypad'   },
    { key: 'KEY_7',        label: '7',        group: 'keypad'   },
    { key: 'KEY_8',        label: '8',        group: 'keypad'   },
    { key: 'KEY_9',        label: '9',        group: 'keypad'   },
    { key: 'KEY_CLEAR',    label: 'CLEAR',    group: 'keypad'   },
    { key: 'KEY_0',        label: '0',        group: 'keypad'   },
    { key: 'KEY_ENTER',    label: 'ENTER',    group: 'keypad'   },
    // Action buttons (indices 12-14)
    { key: 'BTN_FIRE',     label: 'FIRE',     group: 'action'   },
    { key: 'BTN_L_ACT',    label: 'L-ACT',    group: 'action'   },
    { key: 'BTN_R_ACT',    label: 'R-ACT',    group: 'action'   },
    // Meta / system (indices 15-26)
    { key: 'META_RESET',   label: 'RESET',    group: 'meta'     },
    { key: 'META_LOAD',    label: 'LOAD',     group: 'meta'     },
    { key: 'META_CONFIG',  label: 'CONFIG',   group: 'meta'     },
    { key: 'META_SCORES',  label: 'SCORES',   group: 'meta'     },
    { key: 'META_QUIT',    label: 'QUIT',     group: 'meta'     },
    { key: 'META_STATE',   label: 'STATE',    group: 'meta'     },
    { key: 'META_MENU',    label: 'MENU',     group: 'meta'     },
    { key: 'META_SWITCH',  label: 'SWITCH',   group: 'meta'     },
    { key: 'META_MANUAL',  label: 'MANUAL',   group: 'meta'     },
    { key: 'META_DISC',    label: 'DISC',     group: 'meta'     },
    { key: 'META_KEYBOARD',label: 'KEYBOARD', group: 'meta'     },
    { key: 'META_SWAPOVL', label: 'SWAPOVL',  group: 'meta'     },
    // Advanced (indices 27-35) — rarely used, disabled by default
    { key: 'META_DISC_UP', label: 'DISC UP',  group: 'advanced' },
    { key: 'META_DISC_DN', label: 'DISC DN',  group: 'advanced' },
    { key: 'META_SPEEDUP', label: 'SPEEDUP',  group: 'advanced' },
    { key: 'META_FASTLOAD',label: 'FASTLOAD', group: 'advanced' },
    { key: 'META_STRETCH', label: 'STRETCH',  group: 'advanced' },
    { key: 'META_GCONFIG', label: 'GCONFIG',  group: 'advanced' },
    { key: 'META_CHEATS',  label: 'CHEATS',   group: 'advanced' },
    { key: 'META_EMUINFO', label: 'EMUINFO',  group: 'advanced' },
    { key: 'META_PICKOVL', label: 'PICKOVL',  group: 'advanced' },
];

// Default hotspot positions from NINTV-DS defaultOverlay in overlay.cpp
const DS_DEFAULT_HOTSPOTS = [
    [120, 155,  30,  60],  // KEY_1
    [158, 192,  30,  60],  // KEY_2
    [195, 230,  30,  60],  // KEY_3
    [120, 155,  65,  95],  // KEY_4
    [158, 192,  65,  95],  // KEY_5
    [195, 230,  65,  95],  // KEY_6
    [120, 155, 101, 135],  // KEY_7
    [158, 192, 101, 135],  // KEY_8
    [195, 230, 101, 135],  // KEY_9
    [120, 155, 140, 175],  // KEY_CLEAR
    [158, 192, 140, 175],  // KEY_0
    [195, 230, 140, 175],  // KEY_ENTER
    [255, 255, 255, 255],  // BTN_FIRE     (disabled)
    [255, 255, 255, 255],  // BTN_L_ACT    (disabled)
    [255, 255, 255, 255],  // BTN_R_ACT    (disabled)
    [ 10,  87,  10,  40],  // META_RESET
    [ 10,  87,  41,  70],  // META_LOAD
    [ 10,  87,  71, 100],  // META_CONFIG
    [255, 255, 255, 255],  // META_SCORES  (disabled)
    [255, 255, 255, 255],  // META_QUIT    (disabled)
    [ 10,  87, 101, 131],  // META_STATE
    [ 10,  87, 131, 160],  // META_MENU
    [255, 255, 255, 255],  // META_SWITCH  (disabled)
    [255, 255, 255, 255],  // META_MANUAL  (disabled)
    [ 50,  86, 161, 191],  // META_DISC
    [  8,  49, 161, 191],  // META_KEYBOARD
    [255, 255, 255, 255],  // META_SWAPOVL (disabled)
    [255, 255, 255, 255],  // META_DISC_UP (disabled)
    [255, 255, 255, 255],  // META_DISC_DN (disabled)
    [255, 255, 255, 255],  // META_SPEEDUP (disabled)
    [255, 255, 255, 255],  // META_FASTLOAD(disabled)
    [255, 255, 255, 255],  // META_STRETCH (disabled)
    [255, 255, 255, 255],  // META_GCONFIG (disabled)
    [255, 255, 255, 255],  // META_CHEATS  (disabled)
    [255, 255, 255, 255],  // META_EMUINFO (disabled)
    [255, 255, 255, 255],  // META_PICKOVL (disabled)
];

const GROUP_COLORS = {
    keypad:   '#3B82F6',  // blue
    action:   '#F59E0B',  // amber
    meta:     '#10B981',  // green
    advanced: '#8B5CF6',  // purple
};

const GROUP_LABELS = {
    keypad:   'Keypad Buttons',
    action:   'Action Buttons',
    meta:     'Meta / System',
    advanced: 'Advanced Functions',
};

// DS touch screen dimensions
const DS_W = 256;
const DS_H = 192;

export class DSOverlayEditor {
    static hotspots = JSON.parse(JSON.stringify(DS_DEFAULT_HOTSPOTS));
    static selectedIndex = -1;
    static backgroundImage = null;
    static isDragging = false;
    static dragStart = null;

    // Canvas is 2× DS resolution for comfortable editing
    static get CANVAS_W() { return 512; }
    static get CANVAS_H() { return 384; }
    static get SCALE() { return DSOverlayEditor.CANVAS_W / DS_W; }

    static init() {
        DSOverlayEditor._buildHotspotTable();
        DSOverlayEditor._attachCanvasEvents();
        DSOverlayEditor.render();
    }

    // -----------------------------------------------------------------------
    // Build the hotspot editing table
    // -----------------------------------------------------------------------
    static _buildHotspotTable() {
        const container = document.getElementById('ds-hotspot-list');
        if (!container) return;
        container.innerHTML = '';

        const groups = ['keypad', 'action', 'meta', 'advanced'];
        groups.forEach(group => {
            const buttons = DS_BUTTONS.filter(b => b.group === group);
            const section = document.createElement('div');
            section.className = 'ds-hotspot-group';

            const header = document.createElement('div');
            header.className = 'ds-hotspot-group-header';
            header.style.borderLeftColor = GROUP_COLORS[group];
            header.textContent = GROUP_LABELS[group];
            section.appendChild(header);

            buttons.forEach(btn => {
                const idx = DS_BUTTONS.indexOf(btn);
                section.appendChild(DSOverlayEditor._buildRow(idx, btn));
            });

            container.appendChild(section);
        });
    }

    static _buildRow(idx, btn) {
        const hs = DSOverlayEditor.hotspots[idx];
        const disabled = DSOverlayEditor._isDisabled(hs);
        const color = GROUP_COLORS[btn.group];

        const row = document.createElement('div');
        row.className = `ds-hotspot-row${disabled ? ' disabled' : ''}`;
        row.dataset.idx = idx;

        row.innerHTML = `
            <div class="ds-hotspot-row-header">
                <label class="ds-hotspot-label">
                    <span class="ds-hotspot-dot" style="background:${color}"></span>
                    ${btn.label}
                </label>
                <label class="ds-hotspot-toggle">
                    <input type="checkbox" data-idx="${idx}" onchange="toggleDSHotspot(${idx})" ${disabled ? '' : 'checked'}>
                    Active
                </label>
            </div>
            <div class="ds-hotspot-coords${disabled ? ' hidden' : ''}">
                <div class="ds-coord-group">
                    <span class="ds-coord-label">X1</span>
                    <input type="number" class="ds-coord-input" min="0" max="255" value="${disabled ? '' : hs[0]}"
                           onchange="updateDSHotspot(${idx},0,this.value)" ${disabled ? 'disabled' : ''}>
                    <span class="ds-coord-label">X2</span>
                    <input type="number" class="ds-coord-input" min="0" max="255" value="${disabled ? '' : hs[1]}"
                           onchange="updateDSHotspot(${idx},1,this.value)" ${disabled ? 'disabled' : ''}>
                </div>
                <div class="ds-coord-group">
                    <span class="ds-coord-label">Y1</span>
                    <input type="number" class="ds-coord-input" min="0" max="255" value="${disabled ? '' : hs[2]}"
                           onchange="updateDSHotspot(${idx},2,this.value)" ${disabled ? 'disabled' : ''}>
                    <span class="ds-coord-label">Y2</span>
                    <input type="number" class="ds-coord-input" min="0" max="255" value="${disabled ? '' : hs[3]}"
                           onchange="updateDSHotspot(${idx},3,this.value)" ${disabled ? 'disabled' : ''}>
                </div>
            </div>`;

        row.addEventListener('click', e => {
            if (e.target.tagName === 'INPUT') return;
            DSOverlayEditor.selectHotspot(idx);
        });

        return row;
    }

    static _isDisabled(hs) {
        return hs[0] === 255 && hs[1] === 255 && hs[2] === 255 && hs[3] === 255;
    }

    // -----------------------------------------------------------------------
    // Selection
    // -----------------------------------------------------------------------
    static selectHotspot(idx) {
        DSOverlayEditor.selectedIndex = idx;
        document.querySelectorAll('.ds-hotspot-row').forEach(row => {
            row.classList.toggle('selected', parseInt(row.dataset.idx) === idx);
        });
        // Scroll the selected row into view
        const selectedRow = document.querySelector(`.ds-hotspot-row[data-idx="${idx}"]`);
        selectedRow?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

        const hint = document.getElementById('ds-draw-hint');
        if (hint) {
            const btn = DS_BUTTONS[idx];
            hint.textContent = `Drawing: ${btn.label} — click and drag on the canvas to set touch area`;
            hint.style.display = 'block';
        }
        DSOverlayEditor.render();
    }

    // -----------------------------------------------------------------------
    // Toggle hotspot active/disabled
    // -----------------------------------------------------------------------
    static toggleHotspot(idx) {
        const hs = DSOverlayEditor.hotspots[idx];
        if (DSOverlayEditor._isDisabled(hs)) {
            DSOverlayEditor.hotspots[idx] = [10, 50, 10, 50];
        } else {
            DSOverlayEditor.hotspots[idx] = [255, 255, 255, 255];
        }
        DSOverlayEditor._refreshRow(idx);
        DSOverlayEditor.render();
    }

    // -----------------------------------------------------------------------
    // Update a single coordinate field
    // -----------------------------------------------------------------------
    static updateCoord(idx, field, value) {
        const v = Math.max(0, Math.min(255, parseInt(value) || 0));
        DSOverlayEditor.hotspots[idx][field] = v;
        DSOverlayEditor.render();
    }

    static _refreshRow(idx) {
        const row = document.querySelector(`.ds-hotspot-row[data-idx="${idx}"]`);
        if (!row) return;
        const hs = DSOverlayEditor.hotspots[idx];
        const disabled = DSOverlayEditor._isDisabled(hs);
        const coordsDiv = row.querySelector('.ds-hotspot-coords');
        const checkbox = row.querySelector('input[type=checkbox]');
        const inputs = row.querySelectorAll('.ds-coord-input');

        row.classList.toggle('disabled', disabled);
        coordsDiv?.classList.toggle('hidden', disabled);
        if (checkbox) checkbox.checked = !disabled;
        inputs.forEach((inp, i) => {
            inp.disabled = disabled;
            if (!disabled) inp.value = hs[i];
        });
    }

    // -----------------------------------------------------------------------
    // Canvas events — drag to draw a hotspot rectangle
    // -----------------------------------------------------------------------
    static _attachCanvasEvents() {
        const canvas = document.getElementById('ds-preview-canvas');
        if (!canvas) return;
        canvas.addEventListener('mousedown', DSOverlayEditor._onMouseDown);
        canvas.addEventListener('mousemove', DSOverlayEditor._onMouseMove);
        canvas.addEventListener('mouseup',   DSOverlayEditor._onMouseUp);
        canvas.addEventListener('mouseleave', DSOverlayEditor._onMouseUp);
    }

    static _onMouseDown(e) {
        if (DSOverlayEditor.selectedIndex < 0) return;
        const rect = e.target.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / DSOverlayEditor.SCALE);
        const y = Math.round((e.clientY - rect.top)  / DSOverlayEditor.SCALE);
        DSOverlayEditor.isDragging = true;
        DSOverlayEditor.dragStart = { x, y };
        e.preventDefault();
    }

    static _onMouseMove(e) {
        if (!DSOverlayEditor.isDragging) return;
        const rect = e.target.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / DSOverlayEditor.SCALE);
        const y = Math.round((e.clientY - rect.top)  / DSOverlayEditor.SCALE);
        const s = DSOverlayEditor.dragStart;
        const idx = DSOverlayEditor.selectedIndex;

        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const x1 = clamp(Math.min(s.x, x), 0, 255);
        const x2 = clamp(Math.max(s.x, x), 0, 255);
        const y1 = clamp(Math.min(s.y, y), 0, 255);
        const y2 = clamp(Math.max(s.y, y), 0, 255);

        DSOverlayEditor.hotspots[idx] = [x1, x2, y1, y2];
        DSOverlayEditor._refreshRow(idx);
        DSOverlayEditor.render();
    }

    static _onMouseUp() {
        DSOverlayEditor.isDragging = false;
    }

    // -----------------------------------------------------------------------
    // Background image
    // -----------------------------------------------------------------------
    static loadBackground(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        // Update filename display
        const filenameEl = document.getElementById('ds-bg-filename');
        if (filenameEl) filenameEl.textContent = file.name;

        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                DSOverlayEditor.backgroundImage = img;
                DSOverlayEditor.render();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // -----------------------------------------------------------------------
    // Render the canvas preview
    // -----------------------------------------------------------------------
    static render() {
        const canvas = document.getElementById('ds-preview-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const scale = DSOverlayEditor.SCALE;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        if (DSOverlayEditor.backgroundImage) {
            ctx.drawImage(DSOverlayEditor.backgroundImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Subtle grid
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            for (let x = 0; x <= canvas.width; x += 32) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
            }
            for (let y = 0; y <= canvas.height; y += 32) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('DS Bottom Screen  256 × 192 px', canvas.width / 2, canvas.height / 2 - 12);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillText('Upload a background PNG or drag hotspots on the canvas', canvas.width / 2, canvas.height / 2 + 10);
            ctx.textAlign = 'left';
        }

        // Draw all enabled hotspots
        DSOverlayEditor.hotspots.forEach((hs, idx) => {
            if (DSOverlayEditor._isDisabled(hs)) return;
            const btn = DS_BUTTONS[idx];
            const color = GROUP_COLORS[btn.group];
            const isSelected = idx === DSOverlayEditor.selectedIndex;

            const rx = hs[0] * scale;
            const ry = hs[2] * scale;
            const rw = (hs[1] - hs[0]) * scale;
            const rh = (hs[3] - hs[2]) * scale;
            if (rw <= 0 || rh <= 0) return;

            ctx.save();
            ctx.fillStyle   = hexAlpha(color, isSelected ? 0.45 : 0.18);
            ctx.strokeStyle = color;
            ctx.lineWidth   = isSelected ? 2.5 : 1.5;
            if (isSelected) {
                ctx.shadowColor = color;
                ctx.shadowBlur = 6;
            }
            ctx.fillRect(rx, ry, rw, rh);
            ctx.strokeRect(rx, ry, rw, rh);
            ctx.shadowBlur = 0;

            // Label
            const fontSize = Math.max(9, Math.min(13, rh * 0.4 / scale * scale));
            ctx.fillStyle = isSelected ? '#fff' : color;
            ctx.font = `${isSelected ? 'bold ' : ''}${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, rx + rw / 2, ry + rh / 2);
            ctx.restore();
        });

        // Safe-area line at y=192 (bottom 64px of 256 is reserved for DS system UI)
        ctx.save();
        ctx.strokeStyle = 'rgba(255,80,80,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        const safeY = DS_H * scale;  // 192 * 2 = 384 = bottom of canvas
        ctx.beginPath();
        ctx.moveTo(0, safeY - 1);
        ctx.lineTo(canvas.width, safeY - 1);
        ctx.stroke();
        ctx.restore();
    }

    // -----------------------------------------------------------------------
    // Load default template
    // -----------------------------------------------------------------------
    static loadTemplate() {
        DSOverlayEditor.hotspots = JSON.parse(JSON.stringify(DS_DEFAULT_HOTSPOTS));
        DSOverlayEditor._buildHotspotTable();
        DSOverlayEditor.selectedIndex = -1;
        DSOverlayEditor.render();
        const hint = document.getElementById('ds-draw-hint');
        if (hint) hint.style.display = 'none';
    }

    // -----------------------------------------------------------------------
    // Generate .ovl text (hotspots only — no tile data)
    // -----------------------------------------------------------------------
    static _generateOvlText() {
        const name = document.getElementById('ds-overlay-name')?.value?.trim() || 'My Overlay';
        const lines = [
            '    // -----------------------------------------------------------------',
            `    // ${name} - Nintellivision Overlay`,
            '    // Generated by Intellivision Overlay Editor',
            '    // https://github.com/mholzinger/intellivision-overlay-editor',
            '    // -----------------------------------------------------------------',
        ];

        DS_BUTTONS.forEach((btn, idx) => {
            const [x1, x2, y1, y2] = DSOverlayEditor.hotspots[idx];
            lines.push(`    .ovl ${String(x1).padStart(4)}, ${String(x2).padStart(4)}, ${String(y1).padStart(4)}, ${String(y2).padStart(4)},    // ${btn.key}`);
        });

        return lines.join('\n') + '\n';
    }

    // -----------------------------------------------------------------------
    // Export: hotspots only (client-side, no server needed)
    // -----------------------------------------------------------------------
    static downloadOvl() {
        const text = DSOverlayEditor._generateOvlText();
        const safeName = (document.getElementById('ds-overlay-name')?.value?.trim() || 'overlay')
            .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
        const blob = new Blob([text], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${safeName || 'overlay'}.ovl`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // -----------------------------------------------------------------------
    // Export: hotspots + image (server converts PNG to NDS tile/map/pal)
    // -----------------------------------------------------------------------
    static async exportWithImage() {
        const imgInput = document.getElementById('ds-bg-upload');
        if (!imgInput?.files?.[0]) {
            // No image uploaded — fall back to hotspot-only export
            DSOverlayEditor.downloadOvl();
            return;
        }

        const statusEl = document.getElementById('ds-export-status');
        if (statusEl) { statusEl.textContent = 'Converting image…'; statusEl.style.display = 'block'; }

        try {
            const reader = new FileReader();
            const imageData = await new Promise((resolve, reject) => {
                reader.onload  = e => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(imgInput.files[0]);
            });

            const name = document.getElementById('ds-overlay-name')?.value?.trim() || 'My Overlay';
            const response = await fetch('/export_ovl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hotspots: DSOverlayEditor.hotspots,
                    image: imageData,
                    name,
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            const blob = await response.blob();
            const safeName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href    = url;
            a.download = `${safeName || 'overlay'}.ovl`;
            a.click();
            URL.revokeObjectURL(url);
            if (statusEl) statusEl.style.display = 'none';
        } catch (err) {
            console.error('DS OVL export failed:', err);
            if (statusEl) { statusEl.textContent = `Export failed: ${err.message}. Falling back to hotspot-only export.`; }
            // Fallback
            DSOverlayEditor.downloadOvl();
        }
    }
}

// Helper: hex color + alpha → rgba string
function hexAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
