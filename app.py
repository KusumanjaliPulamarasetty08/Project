import os
from flask import Flask, render_template, request, url_for, flash, redirect
from werkzeug.utils import secure_filename
import datetime

# --- Configuration ---
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SECRET_KEY'] = 'a_super_secret_key' # Required for flashing messages
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size

# --- Helper Functions ---
def allowed_file(filename):
    """Checks if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_mrz(passport_type, country_code, surname, given_names, passport_no, nationality, dob, gender, expiry_date):
    """Generates a simplified Machine-Readable Zone (MRZ) string."""
    # Line 1
    surname_mrz = surname.upper().replace(" ", "<")
    given_names_mrz = given_names.upper().replace(" ", "<")
    line1 = f"{passport_type}<{country_code}{surname_mrz}<<{given_names_mrz}"
    line1 = (line1 + '<' * 44)[:44]

    # Line 2
    passport_no_mrz = (passport_no.upper() + '<' * 10)[:10]
    dob_mrz = dob.strftime('%y%m%d')
    expiry_date_mrz = expiry_date.strftime('%y%m%d')
    # Dummy check digits for demonstration
    line2 = f"{passport_no_mrz}1{nationality}{dob_mrz}1{gender}{expiry_date_mrz}6<<<<<<<<<<<<<<0"
    
    return [line1, line2]


# --- Routes ---
@app.route('/')
def index():
    """Renders the main form page."""
    # List of major international cities for dropdowns
    cities = [
        "New York (JFK)", "London (LHR)", "Paris (CDG)", "Tokyo (HND)",
        "Dubai (DXB)", "Singapore (SIN)", "Hong Kong (HKG)", "Los Angeles (LAX)",
        "Frankfurt (FRA)", "Amsterdam (AMS)", "Istanbul (IST)", "Delhi (DEL)",
        "Mumbai (BOM)", "Sydney (SYD)", "Toronto (YYZ)", "Beijing (PEK)"
    ]
    return render_template('index.html', cities=cities)

@app.route('/generate', methods=['POST'])
def generate():
    """Processes the form and generates the preview page."""
    if request.method == 'POST':
        # --- Collect Form Data ---
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

        # --- Handle File Upload ---
        if 'profile_photo' not in request.files:
            flash('No file part')
            return redirect(request.url)
        
        file = request.files['profile_photo']

        if file.filename == '':
            flash('No selected file')
            return redirect(url_for('index'))

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Ensure the upload folder exists
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            photo_url = url_for('static', filename=f'uploads/{filename}')
        else:
            flash('Invalid file type. Please upload a JPG, JPEG, or PNG file.')
            return redirect(url_for('index'))

        # --- Data Processing ---
        try:
            # Convert date strings to datetime objects for formatting
            dob = datetime.datetime.strptime(form_data['dob_str'], '%Y-%m-%d')
            issue_date = datetime.datetime.strptime(form_data['issue_date_str'], '%Y-%m-%d')
            expiry_date = datetime.datetime.strptime(form_data['expiry_date_str'], '%Y-%m-%d')
        except ValueError:
            flash('Invalid date format provided.')
            return redirect(url_for('index'))

        # Generate MRZ
        mrz_lines = generate_mrz(
            passport_type='P',
            country_code=form_data['country_code'],
            surname=form_data['surname'],
            given_names=form_data['given_names'],
            passport_no=form_data['passport_no'],
            nationality=form_data['country_code'], # Using country code for nationality in MRZ
            dob=dob,
            gender=form_data['gender'][0].upper(), # 'M' or 'F'
            expiry_date=expiry_date
        )

        # --- Render Preview ---
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

if __name__ == '__main__':
    app.run(debug=True)