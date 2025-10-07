/**
 * Theme Switcher Module
 * Handles theme switching between light and dark modes
 * Persists user preferences using localStorage
 */

document.addEventListener('DOMContentLoaded', () => {
    // ======================================================
    // INITIALIZATION
    // ======================================================
    
    /**
     * Reference to the theme toggle button in the DOM
     * @type {HTMLElement}
     */
    const themeToggle = document.getElementById('theme-toggle');
    
    // ======================================================
    // THEME MANAGEMENT FUNCTIONS
    // ======================================================
    
    /**
     * Loads the saved theme from localStorage or uses default
     * @returns {string} The theme to apply ('light' or 'dark')
     */
    function loadSavedTheme() {
        return localStorage.getItem('theme') || 'light';
    }
    
    /**
     * Applies the specified theme to the document
     * @param {string} theme - The theme to apply ('light' or 'dark')
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    /**
     * Saves the current theme preference to localStorage
     * @param {string} theme - The theme to save ('light' or 'dark')
     */
    function saveThemePreference(theme) {
        localStorage.setItem('theme', theme);
    }
    
    /**
     * Toggles between light and dark themes
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        applyTheme(newTheme);
        saveThemePreference(newTheme);
    }
    
    // ======================================================
    // INITIALIZATION AND EVENT LISTENERS
    // ======================================================
    
    // Apply the saved theme on page load
    const initialTheme = loadSavedTheme();
    applyTheme(initialTheme);
    
    // Set up click event for theme toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});