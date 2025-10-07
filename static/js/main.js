/**
 * Main JavaScript functionality for the Passport & Ticket Generator application
 * Handles form validation, password strength checking, and UI interactions
 * 
 * @author Passport Generator Team
 * @version 1.0.0
 */

$(document).ready(function() {
    // ======================================================
    // FORM VALIDATION HELPER FUNCTIONS
    // ======================================================
    
    /**
     * Displays validation error for a form field
     * Adds error class and displays error message
     * 
     * @param {string} fieldId - The ID selector of the field (with # prefix)
     * @param {string} message - The error message to display
     */
    function showError(fieldId, message) {
        $(fieldId).addClass('is-invalid').removeClass('is-valid');
        $(fieldId + 'Error').text(message);
    }

    /**
     * Displays validation success for a form field
     * Adds success class and removes error class
     * 
     * @param {string} fieldId - The ID selector of the field (with # prefix)
     */
    function showSuccess(fieldId) {
        $(fieldId).addClass('is-valid').removeClass('is-invalid');
    }
    
    /**
     * Validates if a field is empty
     * 
     * @param {string} value - The field value to check
     * @returns {boolean} - True if field is empty, false otherwise
     */
    function isEmpty(value) {
        return value.trim() === '';
    }
    
    /**
     * Validates email format using regex
     * 
     * @param {string} email - The email to validate
     * @returns {boolean} - True if email format is valid, false otherwise
     */
    function isValidEmail(email) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        return emailRegex.test(email.trim());
    }

    // ======================================================
    // PASSWORD VISIBILITY TOGGLE
    // ======================================================
    
    /**
     * Toggles password field visibility between masked and visible text
     * Updates the eye icon accordingly for better user experience
     */
    function setupPasswordToggle() {
        $('.toggle-password').click(function() {
            const input = $(this).closest('.input-group').find('input');
            const type = input.attr('type') === 'password' ? 'text' : 'password';
            input.attr('type', type);
            $(this).find('i').toggleClass('bi-eye bi-eye-slash');
        });
    }
    
    // Initialize password toggle functionality
    setupPasswordToggle();

    // ======================================================
    // PASSWORD STRENGTH VISUALIZATION
    // ======================================================
    
    /**
     * Initialize password strength indicator for the signup form
     * Creates and updates the strength indicator in real-time as user types
     */
    function initializePasswordStrengthIndicator() {
        if ($('#signup-form').length) {
            // Create password strength indicator if it doesn't exist
            if (!$('.password-strength').length) {
                $('.password-feedback').before('<div class="password-strength"></div>');
            }
            
            // Monitor password input and update strength indicator
            $('#password').on('input', function() {
                const password = $(this).val();
                const strength = checkPasswordStrength(password);
                updatePasswordStrengthIndicator(strength);
            });
        }
    }
    
    // Initialize password strength indicator
    initializePasswordStrengthIndicator();

    // ======================================================
    // FEEDBACK FORM VALIDATION
    // ======================================================
    
    /**
     * Validates the feedback form on submission
     * Checks name, email format, and message content
     * Prevents form submission if validation fails
     */
    function setupFeedbackFormValidation() {
        $('#feedbackForm').submit(function(event) {
            let isFormValid = true;

            // Validate name field (required)
            const nameField = $('#name');
            if (isEmpty(nameField.val())) {
                showError('#name', 'Name cannot be empty.');
                isFormValid = false;
            } else {
                showSuccess('#name');
            }

            // Validate email field (required and format check)
            const emailField = $('#email');
            const email = emailField.val();
            
            if (isEmpty(email)) {
                showError('#email', 'Email is required.');
                isFormValid = false;
            } else if (!isValidEmail(email)) {
                showError('#email', 'Please enter a valid email format.');
                isFormValid = false;
            } else {
                showSuccess('#email');
            }

            // Validate message field (required)
            const messageField = $('#message');
            if (isEmpty(messageField.val())) {
                showError('#message', 'Message field cannot be blank.');
                isFormValid = false;
            } else {
                showSuccess('#message');
            }

            // Prevent form submission if validation failed
            if (!isFormValid) {
                event.preventDefault();
            }
        });
    }
    
    // Initialize feedback form validation
    setupFeedbackFormValidation();

    // ======================================================
    // LOGIN AND SIGNUP FORM VALIDATION
    // ======================================================
    
    /**
     * Handles validation for login and signup forms
     * Includes password matching, complexity requirements, and visual feedback
     */
    function setupAuthFormValidation() {
        $('form').not('#feedbackForm').on('submit', function(e) {
            const form = $(this);
            
            // Perform basic HTML5 validation with visual feedback
            if (!validateFormBasics(form, e)) {
                return; // Stop if basic validation fails
            }

            // Additional validation for signup form
            if (form.attr('id') === 'signup-form') {
                validateSignupForm(form, e);
            }
        });
    }
    
    /**
     * Performs basic HTML5 validation with visual feedback
     * 
     * @param {jQuery} form - The form jQuery object
     * @param {Event} e - The submit event
     * @returns {boolean} - True if validation passes, false otherwise
     */
    function validateFormBasics(form, e) {
        if (!form[0].checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
            form.addClass('was-validated');
            
            // Add shake animation for invalid fields
            form.find(':invalid').closest('.mb-3').addClass('shake');
            setTimeout(() => {
                form.find('.shake').removeClass('shake');
            }, 600);
            
            return false;
        }
        return true;
    }
    
    /**
     * Validates signup form with password matching and complexity checks
     * 
     * @param {jQuery} form - The form jQuery object
     * @param {Event} e - The submit event
     */
    function validateSignupForm(form, e) {
        const password = $('#password').val();
        const confirmPassword = $('#confirm_password').val();

        // Check if passwords match
        if (password !== confirmPassword) {
            e.preventDefault();
            $('#confirm_password')[0].setCustomValidity('Passwords do not match');
            form.addClass('was-validated');
        } else {
            $('#confirm_password')[0].setCustomValidity('');
        }

        // Check password complexity requirements
        validatePasswordComplexity(password, form, e);
    }
    
    /**
     * Validates password complexity requirements
     * 
     * @param {string} password - The password to validate
     * @param {jQuery} form - The form jQuery object
     * @param {Event} e - The submit event
     */
    function validatePasswordComplexity(password, form, e) {
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        
        if (password.length < 8 || !(hasLetter && hasNumber && hasSpecial)) {
            e.preventDefault();
            $('#password')[0].setCustomValidity('Password must be at least 8 characters long and include a number, a letter and a special character');
            form.addClass('was-validated');
        } else {
            $('#password')[0].setCustomValidity('');
        }
    }
    
    // Initialize authentication form validation
    setupAuthFormValidation();

    // ======================================================
    // REAL-TIME PASSWORD CONFIRMATION
    // ======================================================
    
    /**
     * Sets up real-time password confirmation validation
     * Shows immediate feedback if passwords don't match as user types
     */
    function setupRealtimePasswordConfirmation() {
        $('#confirm_password').on('input', function() {
            const password = $('#password').val();
            const confirmPassword = $(this).val();
            
            if (password !== confirmPassword) {
                this.setCustomValidity('Passwords do not match');
            } else {
                this.setCustomValidity('');
            }
        });
    }
    
    // Initialize real-time password confirmation
    setupRealtimePasswordConfirmation();

    // ======================================================
    // PASSWORD STRENGTH EVALUATION
    // ======================================================
    
    /**
     * Evaluates password strength based on multiple criteria
     * 
     * @param {string} password - The password to evaluate
     * @returns {string} - Strength rating: '', 'weak', 'medium', or 'strong'
     */
    function checkPasswordStrength(password) {
        // Handle empty password
        if (password.length === 0) return '';
        
        // Handle too short password
        if (password.length < 8) return 'weak';
        
        // Calculate strength score based on criteria
        let strength = calculatePasswordScore(password);

        // Determine strength category
        return categorizePasswordStrength(strength);
    }
    
    /**
     * Calculates a password strength score based on various criteria
     * 
     * @param {string} password - The password to evaluate
     * @returns {number} - The calculated strength score
     */
    function calculatePasswordScore(password) {
        let score = 0;
        
        // Length criterion
        if (password.length >= 8) score++;
        
        // Character type criteria
        if (password.match(/[A-Z]/)) score++;  // Has uppercase
        if (password.match(/[a-z]/)) score++;  // Has lowercase
        if (password.match(/[0-9]/)) score++;  // Has number
        if (password.match(/[^A-Za-z0-9]/)) score++;  // Has special char
        
        return score;
    }
    
    /**
     * Categorizes password strength based on score
     * 
     * @param {number} score - The password strength score
     * @returns {string} - Strength category: 'weak', 'medium', or 'strong'
     */
    function categorizePasswordStrength(score) {
        if (score < 3) return 'weak';
        if (score < 5) return 'medium';
        return 'strong';
    }

    /**
     * Updates the visual password strength indicator
     * 
     * @param {string} strength - The password strength ('weak', 'medium', 'strong')
     */
    function updatePasswordStrengthIndicator(strength) {
        const indicator = $('.password-strength');
        indicator.removeClass('weak medium strong');
        
        if (strength) {
            // Set appropriate class and width based on strength
            indicator.addClass(strength);
            const widthMap = {
                'weak': '33%',
                'medium': '66%',
                'strong': '100%'
            };
            indicator.css('width', widthMap[strength] || '0');
        } else {
            indicator.css('width', '0');
        }
    }

    // ======================================================
    // UI ENHANCEMENTS AND INTERACTIONS
    // ======================================================
    
    /**
     * Sets up all UI enhancements and interactions
     * Centralizes initialization of all UI-related functionality
     */
    function setupUIEnhancements() {
        setupFormFieldAnimations();
        setupRealtimeEmailValidation();
        setupTermsCheckboxStyling();
        setupFormSubmissionFeedback();
    }
    
    /**
     * Form field focus animations
     * Adds visual feedback when fields are focused
     */
    function setupFormFieldAnimations() {
        $('.form-control').on('focus', function() {
            $(this).closest('.mb-3').addClass('focused');
        }).on('blur', function() {
            $(this).closest('.mb-3').removeClass('focused');
        });
    }

    /**
     * Real-time email validation
     * Validates email format as user types
     */
    function setupRealtimeEmailValidation() {
        $('input[type="email"]').on('input', function() {
            const email = $(this).val();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                this.setCustomValidity('Please enter a valid email address');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    /**
     * Terms checkbox styling
     * Adds visual feedback when terms are accepted
     */
    function setupTermsCheckboxStyling() {
        $('#terms').on('change', function() {
            $(this).closest('.form-check').toggleClass('is-valid', this.checked);
        });
    }

    /**
     * Form submission visual feedback
     * Shows loading spinner when form is submitted
     */
    function setupFormSubmissionFeedback() {
        $('form').on('submit', function() {
            if (this.checkValidity()) {
                $(this).find('.btn-primary').addClass('disabled').html(`
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Please wait...
                `);
            }
        });
    }
    
    // Initialize all UI enhancements
    setupUIEnhancements();
    
    // End of document ready function
});