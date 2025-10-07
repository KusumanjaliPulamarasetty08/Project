# ======================================================
# IMPORTS AND CONFIGURATION
# ======================================================
import os
from flask import Flask, render_template, request, url_for, flash, redirect, session
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from functools import wraps

# --- File Upload Configuration ---
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# --- Flask App Configuration ---
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SECRET_KEY'] = 'a_super_secret_key'  # Required for sessions and flashing messages
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size

# --- User Storage ---
# In a production app, this would be a database
users = {}

# ======================================================
# HELPER FUNCTIONS
# ======================================================

def allowed_file(filename):
    """Validates if the uploaded file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def login_required(f):
    """Authentication decorator to protect routes that require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def generate_mrz(passport_type, country_code, surname, given_names, passport_no, nationality, dob, gender, expiry_date):
    """Creates a simplified Machine-Readable Zone (MRZ) for passport display"""
    # Format first MRZ line: Type, Country, Name
    surname_mrz = surname.upper().replace(" ", "<")
    given_names_mrz = given_names.upper().replace(" ", "<")
    line1 = f"{passport_type}<{country_code}{surname_mrz}<<{given_names_mrz}"
    line1 = (line1 + '<' * 44)[:44]  # Pad to 44 characters

    # Format second MRZ line: Document number, Nationality, DOB, Gender, Expiry date
    passport_no_mrz = (passport_no.upper() + '<' * 10)[:10]
    dob_mrz = dob.strftime('%y%m%d')
    expiry_date_mrz = expiry_date.strftime('%y%m%d')
    # Note: Using dummy check digits (1, 6, 0) for demonstration
    line2 = f"{passport_no_mrz}1{nationality}{dob_mrz}1{gender}{expiry_date_mrz}6<<<<<<<<<<<<<<0"
    
    return [line1, line2]


# ======================================================
# ROUTE DEFINITIONS
# ======================================================

@app.route('/')
@login_required
def index():
    """Main page - displays the passport and ticket generation form"""
    # Predefined list of major international airports for the flight dropdowns
    cities = [
        "New York (JFK)", "London (LHR)", "Paris (CDG)", "Tokyo (HND)",
        "Dubai (DXB)", "Singapore (SIN)", "Hong Kong (HKG)", "Los Angeles (LAX)",
        "Frankfurt (FRA)", "Amsterdam (AMS)", "Istanbul (IST)", "Delhi (DEL)",
        "Mumbai (BOM)", "Sydney (SYD)", "Toronto (YYZ)", "Beijing (PEK)"
    ]
    return render_template('index.html', cities=cities)

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User authentication - handles login form and validation"""
    if request.method == 'POST':
        # Get form data
        email = request.form.get('email')
        password = request.form.get('password')
        remember = request.form.get('remember') == 'on'

        # Validate credentials
        if email in users and check_password_hash(users[email]['password'], password):
            # Set session data
            session['user_id'] = email
            session.permanent = remember  # Keep session if remember is checked
            flash('Welcome', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password.', 'danger')

    # GET request - show login form
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """User registration - handles new account creation with validation"""
    if request.method == 'POST':
        # Get form data
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        fullname = request.form.get('fullname')
        terms = request.form.get('terms') == 'on'

        # --- Form Validation ---
        # 1. Terms acceptance
        if not terms:
            flash('You must accept the terms and conditions.', 'warning')
            return redirect(url_for('signup'))

        # 2. Email uniqueness
        if email in users:
            flash('Email already registered.', 'danger')
            return redirect(url_for('signup'))
            
        # 3. Password match
        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return redirect(url_for('signup'))
            
        # 4. Password length
        if len(password) < 8:
            flash('Password must be at least 8 characters long.', 'danger')
            return redirect(url_for('signup'))
            
        # 5. Password complexity
        has_letter = any(c.isalpha() for c in password)
        has_number = any(c.isdigit() for c in password)
        has_special = any(not c.isalnum() for c in password)
        
        if not (has_letter and has_number and has_special):
            flash('Password must include at least one letter, one number, and one special character.', 'danger')
            return redirect(url_for('signup'))

        # Store user data (using secure password hashing)
        users[email] = {
            'password': generate_password_hash(password),
            'fullname': fullname
        }

        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))

    # GET request - show signup form
    return render_template('signup.html')

@app.route('/logout')
def logout():
    """User logout - clears session data"""
    # Remove user_id from session
    session.pop('user_id', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

@app.route('/generate', methods=['POST'])
@login_required
def generate():
    """Document generation - processes form data and creates passport/ticket preview"""
    if request.method == 'POST':
        # --- 1. Collect Form Data ---
        form_data = {
            "surname": request.form.get('surname'),
            "given_names": request.form.get('given_names'),
            "nationality": request.form.get('nationality'),
            "gender": request.form.get('gender'),
            "dob_str": request.form.get('dob'),
            "place_of_birth": request.form.get('place_of_birth'),
            "country_code": request.form.get('country_code'),
            "passport_no": request.form.get('passport_no'),
            "issue_date_str": request.form.get('issue_date'),
            "expiry_date_str": request.form.get('expiry_date'),
            "boarding": request.form.get('boarding'),
            "landing": request.form.get('landing')
        }

        # --- 2. Process Profile Photo Upload ---
        photo_url = process_photo_upload(request)
        if not photo_url:
            return redirect(url_for('index'))

        # --- 3. Process Date Information ---
        try:
            # Convert date strings to datetime objects
            dob = datetime.datetime.strptime(form_data['dob_str'], '%Y-%m-%d')
            issue_date = datetime.datetime.strptime(form_data['issue_date_str'], '%Y-%m-%d')
            expiry_date = datetime.datetime.strptime(form_data['expiry_date_str'], '%Y-%m-%d')
        except ValueError:
            flash('Invalid date format provided.', 'danger')
            return redirect(url_for('index'))

        # --- 4. Generate Machine Readable Zone (MRZ) ---
        mrz_lines = generate_mrz(
            passport_type='P',
            country_code=form_data['country_code'],
            surname=form_data['surname'],
            given_names=form_data['given_names'],
            passport_no=form_data['passport_no'],
            nationality=form_data['country_code'],  # Using country code for nationality
            dob=dob,
            gender=form_data['gender'][0].upper(),  # Extract first letter (M or F)
            expiry_date=expiry_date
        )

        # --- 5. Render Preview Page ---
        return render_template(
            'preview.html',
            data=form_data,
            dob=dob,
            issue_date=issue_date,
            expiry_date=expiry_date,
            photo_url=photo_url,
            mrz_lines=mrz_lines
        )

    return redirect(url_for('index'))


def process_photo_upload(request):
    """Helper function to handle photo upload validation and processing"""
    if 'profile_photo' not in request.files:
        flash('No file part', 'warning')
        return None
    
    file = request.files['profile_photo']

    if file.filename == '':
        flash('No selected file', 'warning')
        return None

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Ensure the upload folder exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        return url_for('static', filename=f'uploads/{filename}')
    else:
        flash('Invalid file type. Please upload a JPG, JPEG, or PNG file.', 'danger')
        return None

# ======================================================
# APPLICATION ENTRY POINT
# ======================================================

if __name__ == '__main__':
    app.run(debug=True)  # Set to False in production