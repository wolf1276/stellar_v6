/**
 * Antigravity Application Entry Point
 * Unified Single-Page Dashboard for Stellar Intent Engine
 */

import ThemeManager from './utils/theme';
import { DOM } from './utils/dom';
import './styles/globals.scss';

// Import unified dashboard logic
import DashboardManager from './dashboard/index.js';

class AntigravityApp {
  constructor() {
    this.isInitialized = false;
    this.currentView = 'dashboard';

    DOM.ready(() => {
      this.init();
    });
  }

  init() {
    if (this.isInitialized) return;

    try {
      ThemeManager.init();
      this.initNavigation();
      this.isInitialized = true;
      
      // Init Dashboard Manager (handles charts, engine, etc.)
      DashboardManager.init();
      
      this.hideLoader();
    } catch (error) {
      console.error('Antigravity Init Error:', error);
      this.hideLoader();
    }
  }

  initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.content-view');

    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = btn.getAttribute('data-view');
        if (!viewId) return;

        // Update Nav
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update Views
        views.forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) targetView.classList.add('active');

        this.currentView = viewId;
        
        // Trigger view-specific re-renders if needed
        if (viewId === 'dashboard') DashboardManager.updateCharts();
      });
    });
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
