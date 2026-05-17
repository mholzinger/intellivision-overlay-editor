/**
 * Tooltip helper — single shared DOM element, hover + touch long-press.
 *
 * Why not CSS-only? CSS pseudo-elements (::after / ::before) don't work on
 * <input>, <select>, and other replaced elements. Since many tooltips are
 * on form controls, we use a single shared <div> positioned in fixed
 * coordinates on hover/long-press.
 *
 * Markup contract: any element with `data-tooltip="some text"` triggers
 * a tooltip showing that text. The native `title` attribute is still
 * honored for accessibility on the iframe and other non-tooltip elements.
 */

const SHOW_DELAY_MS = 300;       // hover delay before showing (desktop)
const LONG_PRESS_MS = 400;       // long-press delay (touch)
const EDGE_PAD = 8;              // px padding from viewport edges

let tipEl = null;
let arrowEl = null;
let showTimer = null;
let touchTimer = null;
let currentTarget = null;

function ensureTooltipEl() {
    if (tipEl) return;
    tipEl = document.createElement('div');
    tipEl.className = 'js-tooltip';
    tipEl.setAttribute('role', 'tooltip');
    tipEl.style.cssText = [
        'position: fixed',
        'z-index: 100000',
        'pointer-events: none',
        'background: #1a1a2e',
        'color: #f4f4f5',
        'padding: 6px 10px',
        'border-radius: 5px',
        'font: 400 12px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'max-width: 280px',
        'text-align: center',
        'box-shadow: 0 4px 12px rgba(0,0,0,0.25)',
        'opacity: 0',
        'transform: translateY(4px)',
        'transition: opacity 0.15s ease, transform 0.15s ease',
        'left: 0',
        'top: 0',
    ].join(';');
    arrowEl = document.createElement('div');
    arrowEl.style.cssText = [
        'position: absolute',
        'width: 0',
        'height: 0',
        'border: 6px solid transparent',
    ].join(';');
    tipEl.appendChild(arrowEl);
    document.body.appendChild(tipEl);
}

function findTooltipTarget(el) {
    while (el && el !== document.body) {
        if (el.hasAttribute && el.hasAttribute('data-tooltip')) return el;
        el = el.parentElement;
    }
    return null;
}

function positionTooltip(target) {
    if (!tipEl) return;
    const rect = target.getBoundingClientRect();
    const tipRect = tipEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: above the target, centered horizontally
    let placeBelow = false;
    let top = rect.top - tipRect.height - 10;
    if (top < EDGE_PAD) {
        // Not enough room above — flip below
        placeBelow = true;
        top = rect.bottom + 10;
    }

    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    if (left < EDGE_PAD) left = EDGE_PAD;
    if (left + tipRect.width > vw - EDGE_PAD) {
        left = vw - tipRect.width - EDGE_PAD;
    }

    tipEl.style.left = `${Math.round(left)}px`;
    tipEl.style.top = `${Math.round(top)}px`;

    // Arrow position — points at the trigger's horizontal center
    const arrowX = rect.left + rect.width / 2 - left - 6;
    arrowEl.style.left = `${Math.max(6, Math.min(tipRect.width - 18, arrowX))}px`;
    if (placeBelow) {
        arrowEl.style.top = '-12px';
        arrowEl.style.bottom = 'auto';
        arrowEl.style.borderBottomColor = '#1a1a2e';
        arrowEl.style.borderTopColor = 'transparent';
    } else {
        arrowEl.style.top = 'auto';
        arrowEl.style.bottom = '-12px';
        arrowEl.style.borderTopColor = '#1a1a2e';
        arrowEl.style.borderBottomColor = 'transparent';
    }
}

function showTooltip(target) {
    ensureTooltipEl();
    const text = target.getAttribute('data-tooltip');
    if (!text) return;
    currentTarget = target;
    // Strip arrow before setting text, then re-append (innerText replaces children)
    tipEl.textContent = text;
    tipEl.appendChild(arrowEl);
    // Position requires the element to have a measurable size — show invisibly first
    tipEl.style.opacity = '0';
    tipEl.style.transform = 'translateY(4px)';
    // Force layout, then position
    requestAnimationFrame(() => {
        positionTooltip(target);
        tipEl.style.opacity = '1';
        tipEl.style.transform = 'translateY(0)';
    });
}

function hideTooltip() {
    currentTarget = null;
    if (!tipEl) return;
    tipEl.style.opacity = '0';
    tipEl.style.transform = 'translateY(4px)';
}

function cancelShowTimer() {
    if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
    }
}

function cancelTouchTimer() {
    if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
    }
}

export function tooltipInit() {
    // Desktop: pointerenter delays show; pointerleave hides
    document.addEventListener('pointerover', (e) => {
        if (e.pointerType === 'touch') return; // touch handled separately
        const target = findTooltipTarget(e.target);
        if (!target || target === currentTarget) return;
        cancelShowTimer();
        showTimer = setTimeout(() => showTooltip(target), SHOW_DELAY_MS);
    }, true);

    document.addEventListener('pointerout', (e) => {
        if (e.pointerType === 'touch') return;
        const target = findTooltipTarget(e.target);
        if (!target) return;
        cancelShowTimer();
        if (currentTarget === target) hideTooltip();
    }, true);

    // Touch: long-press to show, tap-elsewhere to hide
    document.addEventListener('touchstart', (e) => {
        const target = findTooltipTarget(e.target);
        if (!target) return;
        cancelTouchTimer();
        touchTimer = setTimeout(() => {
            showTooltip(target);
        }, LONG_PRESS_MS);
    }, { passive: true });

    document.addEventListener('touchmove', cancelTouchTimer, { passive: true });
    document.addEventListener('touchend', cancelTouchTimer);
    document.addEventListener('touchcancel', cancelTouchTimer);

    document.addEventListener('click', (e) => {
        if (!currentTarget) return;
        if (!currentTarget.contains(e.target)) hideTooltip();
    });

    // Hide on scroll/resize to avoid floating in wrong place
    window.addEventListener('scroll', hideTooltip, { passive: true, capture: true });
    window.addEventListener('resize', hideTooltip);

    // ESC dismisses
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancelShowTimer();
            hideTooltip();
        }
    });
}
