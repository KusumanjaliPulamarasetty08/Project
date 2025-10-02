$(document).ready(function() {
    // --- Helper function to show validation errors ---
    function showError(fieldId, message) {
        $(fieldId).addClass('is-invalid').removeClass('is-valid');
        $(fieldId + 'Error').text(message);
    }

    // --- Helper function to show validation success ---
    function showSuccess(fieldId) {
        $(fieldId).addClass('is-valid').removeClass('is-invalid');
    }

    // Password toggle visibility
    $('.toggle-password').click(function() {
        const input = $(this).closest('.input-group').find('input');
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        $(this).find('i').toggleClass('bi-eye bi-eye-slash');
    });

    // Password strength indicator for signup form
    if ($('#signup-form').length) {
        $('#password').on('input', function() {
            const password = $(this).val();
            const strength = checkPasswordStrength(password);
            updatePasswordStrengthIndicator(strength);
        });

        // Add password strength indicator div after password input
        if (!$('.password-strength').length) {
            $('.password-feedback').before('<div class="password-strength"></div>');
        }
    }

    // Form validation for feedback form
    $('#feedbackForm').submit(function(event) {
        let isFormValid = true;

        // --- 1. Validate Name ---
        const nameField = $('#name');
        if (nameField.val().trim() === '') {
            showError('#name', 'Name cannot be empty.');
            isFormValid = false;
        } else {
            showSuccess('#name');
        }

        // --- 2. Validate Email ---
        const emailField = $('#email');
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (emailField.val().trim() === '') {
            showError('#email', 'Email is required.');
            isFormValid = false;
        } else if (!emailRegex.test(emailField.val().trim())) {
            showError('#email', 'Please enter a valid email format.');
            isFormValid = false;
        } else {
            showSuccess('#email');
        }

        // --- 3. Validate Message ---
        const messageField = $('#message');
        if (messageField.val().trim() === '') {
            showError('#message', 'Message field cannot be blank.');
            isFormValid = false;
        } else {
            showSuccess('#message');
        }

        // --- Prevent form submission if any validation failed ---
        if (!isFormValid) {
            event.preventDefault(); // Stop the form from submitting
        }
    });

    // Form validation for login and signup
    $('form').not('#feedbackForm').on('submit', function(e) {
        const form = $(this);
        if (!form[0].checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
            form.addClass('was-validated');
            
            // Shake animation for invalid fields
            form.find(':invalid').closest('.mb-3').addClass('shake');
            setTimeout(() => {
                form.find('.shake').removeClass('shake');
            }, 600);
        }

        // Additional validation for signup form
        if (form.attr('id') === 'signup-form') {
            const password = $('#password').val();
            const confirmPassword = $('#confirm_password').val();

            if (password !== confirmPassword) {
                e.preventDefault();
                $('#confirm_password')[0].setCustomValidity('Passwords do not match');
                form.addClass('was-validated');
            } else {
                $('#confirm_password')[0].setCustomValidity('');
            }

            if (password.length < 8 || !(/[A-Za-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password))) {
                e.preventDefault();
                $('#password')[0].setCustomValidity('Password must be at least 8 characters long and include a number, a letter and a special character');
                form.addClass('was-validated');
            } else {
                $('#password')[0].setCustomValidity('');
            }
        }
    });

    // Real-time password confirmation validation
    $('#confirm_password').on('input', function() {
        const password = $('#password').val();
        const confirmPassword = $(this).val();
        
        if (password !== confirmPassword) {
            this.setCustomValidity('Passwords do not match');
        } else {
            this.setCustomValidity('');
        }
    });

    // Password strength checker
    function checkPasswordStrength(password) {
        if (password.length === 0) return '';
        if (password.length < 8) return 'weak';
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^A-Za-z0-9]/)) strength++;

        if (strength < 3) return 'weak';
        if (strength < 5) return 'medium';
        return 'strong';
    }

    // Update password strength indicator
    function updatePasswordStrengthIndicator(strength) {
        const indicator = $('.password-strength');
        indicator.removeClass('weak medium strong');
        
        if (strength) {
            indicator.addClass(strength);
            indicator.css('width', strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%');
        } else {
            indicator.css('width', '0');
        }
    }

    // Form field animations
    $('.form-control').on('focus', function() {
        $(this).closest('.mb-3').addClass('focused');
    }).on('blur', function() {
        $(this).closest('.mb-3').removeClass('focused');
    });

    // Email validation in real-time
    $('input[type="email"]').on('input', function() {
        const email = $(this).val();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            this.setCustomValidity('Please enter a valid email address');
        } else {
            this.setCustomValidity('');
        }
    });

    // Terms checkbox custom styling
    $('#terms').on('change', function() {
        $(this).closest('.form-check').toggleClass('is-valid', this.checked);
    });

    // Add smooth transitions to form submissions
    $('form').on('submit', function() {
        if (this.checkValidity()) {
            $(this).find('.btn-primary').addClass('disabled').html(`
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Please wait...
            `);
        }
    });
});