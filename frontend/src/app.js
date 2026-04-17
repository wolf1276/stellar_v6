/**
 * Antigravity Application Entry Point
 * Unified Single-Page Dashboard for Stellar Intent Engine
 */

import ThemeManager from './utils/theme';
import { DOM } from './utils/dom';

// Import design systems
import './styles/globals.scss';

// Import unified dashboard logic
import './dashboard/index.js';

class AntigravityApp {
  constructor() {
    this.isInitialized = false;

    DOM.ready(() => {
      this.init();
    });
  }

  init() {
    if (this.isInitialized) return;

    try {
      ThemeManager.init();
      this.initThemeToggle();
      this.isInitialized = true;
      
      this.hideLoader();
    } catch (error) {
      console.error('Antigravity Init Error:', error);
      this.hideLoader();
    }
  }

  initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      const current = ThemeManager.current();
      toggle.checked = current === 'dark';
      
      toggle.addEventListener('change', () => {
        const next = toggle.checked ? 'dark' : 'light';
        ThemeManager.apply(next);
      });
    }
  }

  hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('fadeOut');
      }, 300);
    }
  }
}

const app = new AntigravityApp();
export default app;
