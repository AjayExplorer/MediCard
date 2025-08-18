const API_BASE_URL = 'http://localhost:5000/api';

// DOM elements
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const patientType = document.getElementById('patientType');
const hospitalType = document.getElementById('hospitalType');
const loginForms = document.getElementById('loginForms');
const registrationForms = document.getElementById('registrationForms');
const errorAlert = document.getElementById('errorAlert');
const successAlert = document.getElementById('successAlert');

// Form elements
const patientLoginForm = document.getElementById('patientLoginForm');
const hospitalLoginForm = document.getElementById('hospitalLoginForm');
const patientRegForm = document.getElementById('patientRegForm');
const hospitalRegForm = document.getElementById('hospitalRegForm');

let currentUserType = 'patient';
let isLoginMode = true;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    const token = localStorage.getItem('medicard_token');
    const user = localStorage.getItem('medicard_user');
    
    if (token && user) {
        const userData = JSON.parse(user);
        if (userData.role === 'patient') {
            window.location.href = '/patient';
        } else {
            window.location.href = '/hospital';
        }
        return;
    }
    
    setupEventListeners();
});

function setupEventListeners() {
    // Tab switching
    loginTab.addEventListener('click', () => switchMode(true));
    registerTab.addEventListener('click', () => switchMode(false));
    
    // User type switching
    patientType.addEventListener('click', () => switchUserType('patient'));
    hospitalType.addEventListener('click', () => switchUserType('hospital'));
    
    // Form submissions
    patientLoginForm.addEventListener('submit', handlePatientLogin);
    hospitalLoginForm.addEventListener('submit', handleHospitalLogin);
    patientRegForm.addEventListener('submit', handlePatientRegistration);
    hospitalRegForm.addEventListener('submit', handleHospitalRegistration);
}

function switchMode(loginMode) {
    isLoginMode = loginMode;
    
    if (loginMode) {
        loginTab.classList.add('active');
        loginTab.classList.remove('btn-outline-primary');
        loginTab.classList.add('btn-primary');
        registerTab.classList.remove('active');
        registerTab.classList.add('btn-outline-primary');
        registerTab.classList.remove('btn-primary');
        
        loginForms.classList.remove('d-none');
        registrationForms.classList.add('d-none');
    } else {
        registerTab.classList.add('active');
        registerTab.classList.remove('btn-outline-primary');
        registerTab.classList.add('btn-primary');
        loginTab.classList.remove('active');
        loginTab.classList.add('btn-outline-primary');
        loginTab.classList.remove('btn-primary');
        
        registrationForms.classList.remove('d-none');
        loginForms.classList.add('d-none');
    }
    
    hideAlerts();
    switchUserType(currentUserType);
}

function switchUserType(userType) {
    currentUserType = userType;
    
    if (userType === 'patient') {
        patientType.classList.add('active');
        hospitalType.classList.remove('active');
        
        if (isLoginMode) {
            patientLoginForm.classList.remove('d-none');
            hospitalLoginForm.classList.add('d-none');
        } else {
            patientRegForm.classList.remove('d-none');
            hospitalRegForm.classList.add('d-none');
        }
    } else {
        hospitalType.classList.add('active');
        patientType.classList.remove('active');
        
        if (isLoginMode) {
            hospitalLoginForm.classList.remove('d-none');
            patientLoginForm.classList.add('d-none');
        } else {
            hospitalRegForm.classList.remove('d-none');
            patientRegForm.classList.add('d-none');
        }
    }
    
    hideAlerts();
}

function hideAlerts() {
    errorAlert.classList.add('d-none');
    successAlert.classList.add('d-none');
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorAlert.classList.remove('d-none');
    successAlert.classList.add('d-none');
}

function showSuccess(message) {
    document.getElementById('successMessage').textContent = message;
    successAlert.classList.remove('d-none');
    errorAlert.classList.add('d-none');
}

async function apiRequest(endpoint, method, data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(API_BASE_URL + endpoint, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Request failed');
        }
        
        return result;
    } catch (error) {
        throw error;
    }
}

async function handlePatientLogin(e) {
    e.preventDefault();
    
    const spinner = document.getElementById('patientLoginSpinner');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    const medicardId = document.getElementById('patientMedicardId').value.trim();
    const password = document.getElementById('patientPassword').value;
    
    if (!medicardId || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        spinner.classList.remove('d-none');
        submitBtn.disabled = true;
        
        const response = await apiRequest('/auth/patient/login', 'POST', {
            medicardId,
            password
        });
        
        // Store auth data
        localStorage.setItem('medicard_token', response.token);
        localStorage.setItem('medicard_user', JSON.stringify(response.user));
        
        // Redirect to patient dashboard
        window.location.href = '/patient';
        
    } catch (error) {
        showError(error.message);
    } finally {
        spinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
}

async function handleHospitalLogin(e) {
    e.preventDefault();
    
    const spinner = document.getElementById('hospitalLoginSpinner');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    const ninNumber = document.getElementById('hospitalNin').value.trim();
    const password = document.getElementById('hospitalPassword').value;
    
    if (!ninNumber || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        spinner.classList.remove('d-none');
        submitBtn.disabled = true;
        
        const response = await apiRequest('/auth/hospital/login', 'POST', {
            ninNumber,
            password
        });
        
        // Store auth data
        localStorage.setItem('medicard_token', response.token);
        localStorage.setItem('medicard_user', JSON.stringify(response.user));
        
        // Redirect to hospital dashboard
        window.location.href = '/hospital';
        
    } catch (error) {
        showError(error.message);
    } finally {
        spinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
}

async function handlePatientRegistration(e) {
    e.preventDefault();
    
    const spinner = document.getElementById('patientRegSpinner');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    const formData = {
        name: document.getElementById('patientRegName').value.trim(),
        gender: document.getElementById('patientRegGender').value,
        email: document.getElementById('patientRegEmail').value.trim(),
        contactNumber: document.getElementById('patientRegContact').value.trim(),
        dateOfBirth: document.getElementById('patientRegDob').value,
        weight: parseFloat(document.getElementById('patientRegWeight').value),
        height: parseInt(document.getElementById('patientRegHeight').value),
        bloodGroup: document.getElementById('patientRegBloodGroup').value,
        organDonation: document.getElementById('patientRegOrganDonation').checked,
        password: document.getElementById('patientRegPassword').value,
        confirmPassword: document.getElementById('patientRegConfirmPassword').value
    };
    
    // Validate
    if (!formData.name || !formData.email || !formData.contactNumber || !formData.dateOfBirth || 
        !formData.weight || !formData.height || !formData.password) {
        showError('Please fill in all required fields');
        return;
    }
    
    if (formData.password !== formData.confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (formData.password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    try {
        spinner.classList.remove('d-none');
        submitBtn.disabled = true;
        
        const { confirmPassword, ...registerData } = formData;
        const response = await apiRequest('/auth/patient/register', 'POST', registerData);
        
        showSuccess(`Registration successful! Your Medicard ID is: ${response.medicardId}. Please save this ID for login.`);
        
        // Switch to login mode
        setTimeout(() => {
            switchMode(true);
            document.getElementById('patientMedicardId').value = response.medicardId;
        }, 3000);
        
    } catch (error) {
        showError(error.message);
    } finally {
        spinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
}

async function handleHospitalRegistration(e) {
    e.preventDefault();
    
    const spinner = document.getElementById('hospitalRegSpinner');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    const formData = {
        hospitalName: document.getElementById('hospitalRegName').value.trim(),
        ninNumber: document.getElementById('hospitalRegNin').value.trim(),
        licenseNumber: document.getElementById('hospitalRegLicense').value.trim(),
        address: document.getElementById('hospitalRegAddress').value.trim(),
        contactNumber: document.getElementById('hospitalRegContact').value.trim(),
        email: document.getElementById('hospitalRegEmail').value.trim(),
        specialties: document.getElementById('hospitalRegSpecialties').value.trim(),
        password: document.getElementById('hospitalRegPassword').value,
        confirmPassword: document.getElementById('hospitalRegConfirmPassword').value
    };
    
    // Validate
    if (!formData.hospitalName || !formData.ninNumber || !formData.licenseNumber || 
        !formData.address || !formData.contactNumber || !formData.email || !formData.password) {
        showError('Please fill in all required fields');
        return;
    }
    
    if (formData.password !== formData.confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (formData.password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    try {
        spinner.classList.remove('d-none');
        submitBtn.disabled = true;
        
        const { confirmPassword, specialties, ...registerData } = formData;
        const requestData = {
            ...registerData,
            specialties: specialties ? specialties.split(',').map(s => s.trim()).filter(s => s) : []
        };
        
        await apiRequest('/auth/hospital/register', 'POST', requestData);
        
        showSuccess('Hospital registration successful! You can now log in with your credentials.');
        
        // Switch to login mode
        setTimeout(() => {
            switchMode(true);
            switchUserType('hospital');
            document.getElementById('hospitalNin').value = formData.ninNumber;
        }, 2000);
        
    } catch (error) {
        showError(error.message);
    } finally {
        spinner.classList.add('d-none');
        submitBtn.disabled = false;
    }
}