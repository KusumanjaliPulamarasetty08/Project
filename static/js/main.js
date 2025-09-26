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

    // --- Intercept the form submission event ---
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
});