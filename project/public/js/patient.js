const API_BASE_URL = 'http://localhost:5000/api';

let currentPatient = null;
let consentRequests = [];
let currentConsentRequest = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('medicard_token');
    const user = localStorage.getItem('medicard_user');
    
    if (!token || !user) {
        window.location.href = '/';
        return;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'patient') {
        window.location.href = '/';
        return;
    }
    
    // Initialize dashboard
    loadPatientData();
    loadConsentRequests();
    setupEventListeners();
});

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('[data-tab]').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

async function apiRequest(endpoint, method, data = null) {
    try {
        const token = localStorage.getItem('medicard_token');
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(API_BASE_URL + endpoint, options);
        const result = await response.json();
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logout();
                return;
            }
            throw new Error(result.message || 'Request failed');
        }
        
        return result;
    } catch (error) {
        throw error;
    }
}

async function loadPatientData() {
    try {
        const patient = await apiRequest('/patient/profile', 'GET');
        currentPatient = patient;
        displayPatientData(patient);
    } catch (error) {
        showError('Failed to load patient data: ' + error.message);
    }
}

async function loadConsentRequests() {
    try {
        const requests = await apiRequest('/patient/consent-requests', 'GET');
        consentRequests = requests;
        updateConsentNotifications();
        displayConsentRequests();
    } catch (error) {
        console.error('Failed to load consent requests:', error);
    }
}

function displayPatientData(patient) {
    // Update header
    document.getElementById('patientName').textContent = patient.name;
    document.getElementById('medicardId').textContent = patient.medicardId;
    
    // Update overview tab
    document.getElementById('overviewName').textContent = patient.name;
    document.getElementById('overviewMedicardId').textContent = patient.medicardId;
    document.getElementById('overviewDob').textContent = formatDate(patient.dateOfBirth);
    document.getElementById('overviewGender').textContent = patient.gender;
    document.getElementById('overviewBloodGroup').textContent = patient.bloodGroup;
    document.getElementById('overviewContact').textContent = patient.contactNumber;
    document.getElementById('overviewEmail').textContent = patient.email;
    document.getElementById('overviewWeight').textContent = patient.weight + ' kg';
    document.getElementById('overviewHeight').textContent = patient.height + ' cm';
    document.getElementById('overviewOrganDonation').textContent = patient.organDonation ? 'Yes' : 'No';
    document.getElementById('lastUpdated').textContent = formatDateTime(patient.lastUpdated);
    
    // Update counts
    document.getElementById('conditionsCount').textContent = patient.chronicConditions.length;
    document.getElementById('allergiesCount').textContent = patient.allergies.length;
    document.getElementById('medicationsCount').textContent = patient.currentMedications.length;
    document.getElementById('labReportsCount').textContent = patient.labReports.length;
    
    // Display medical data
    displayMedicalHistory(patient.chronicConditions);
    displayMedications(patient.currentMedications);
    displayAllergies(patient.allergies);
    displayLabReports(patient.labReports);
}

function displayMedicalHistory(conditions) {
    const container = document.getElementById('conditionsList');
    
    if (conditions.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-procedures fa-3x mb-3 d-block text-muted"></i>
                <p>No chronic conditions recorded</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = conditions.map(condition => `
        <div class="medical-record-item severity-${condition.severity.toLowerCase()}">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0">${condition.condition}</h6>
                <span class="badge bg-${getSeverityColor(condition.severity)} ms-2">${condition.severity}</span>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <small class="text-muted">
                        <i class="fas fa-calendar me-1"></i>
                        Diagnosed: ${formatDate(condition.diagnosedDate)}
                    </small>
                </div>
                <div class="col-md-6">
                    <small class="text-muted">
                        <i class="fas fa-plus me-1"></i>
                        Added: ${formatDate(condition.addedDate)}
                    </small>
                </div>
            </div>
            ${condition.notes ? `<p class="mt-2 mb-0 small">${condition.notes}</p>` : ''}
        </div>
    `).join('');
}

function displayMedications(medications) {
    const container = document.getElementById('medicationsList');
    
    if (medications.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-pills fa-3x mb-3 d-block text-muted"></i>
                <p>No current medications</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = medications.map(medication => `
        <div class="medical-record-item">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0">${medication.name}</h6>
                <span class="badge bg-success ms-2">Active</span>
            </div>
            <div class="row">
                <div class="col-md-4">
                    <small class="text-muted">
                        <i class="fas fa-pills me-1"></i>
                        Dosage: ${medication.dosage}
                    </small>
                </div>
                <div class="col-md-4">
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>
                        Frequency: ${medication.frequency}
                    </small>
                </div>
                <div class="col-md-4">
                    <small class="text-muted">
                        <i class="fas fa-calendar me-1"></i>
                        Started: ${formatDate(medication.startDate)}
                    </small>
                </div>
            </div>
            ${medication.endDate ? `<p class="mt-2 mb-0 small text-warning">Ends: ${formatDate(medication.endDate)}</p>` : ''}
        </div>
    `).join('');
}

function displayAllergies(allergies) {
    const container = document.getElementById('allergiesList');
    
    if (allergies.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 d-block text-muted"></i>
                <p>No known allergies</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allergies.map(allergy => `
        <div class="medical-record-item severity-${allergy.severity.toLowerCase()}">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0">${allergy.allergen}</h6>
                <span class="badge bg-${getSeverityColor(allergy.severity)} ms-2">${allergy.severity}</span>
            </div>
            <p class="mb-2">
                <strong>Reaction:</strong> ${allergy.reaction}
            </p>
            <div class="row">
                <div class="col-md-6">
                    <small class="text-muted">
                        <i class="fas fa-calendar me-1"></i>
                        Diagnosed: ${formatDate(allergy.diagnosedDate)}
                    </small>
                </div>
                <div class="col-md-6">
                    <small class="text-muted">
                        <i class="fas fa-plus me-1"></i>
                        Added: ${formatDate(allergy.addedDate)}
                    </small>
                </div>
            </div>
        </div>
    `).join('');
}

function displayLabReports(reports) {
    const container = document.getElementById('labReportsList');
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-flask fa-3x mb-3 d-block text-muted"></i>
                <p>No lab reports available</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reports.map(report => `
        <div class="medical-record-item">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0">${report.testName}</h6>
                <small class="text-muted">${formatDate(report.testDate)}</small>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <p class="mb-1">
                        <strong>Result:</strong> ${report.result}
                    </p>
                </div>
                <div class="col-md-6">
                    ${report.normalRange ? `<p class="mb-1"><strong>Normal Range:</strong> ${report.normalRange}</p>` : ''}
                </div>
            </div>
            <small class="text-muted">
                <i class="fas fa-plus me-1"></i>
                Added: ${formatDate(report.addedDate)}
            </small>
        </div>
    `).join('');
}

function displayConsentRequests() {
    const container = document.getElementById('consentRequestsList');
    
    if (consentRequests.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-clipboard-check fa-3x mb-3 d-block text-muted"></i>
                <p>No pending consent requests</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = consentRequests.map(request => `
        <div class="consent-request-item">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0">Update Request from ${request.hospitalId.hospitalName}</h6>
                <span class="badge bg-warning text-dark">${request.status}</span>
            </div>
            <p class="mb-2">
                <strong>Type:</strong> ${getRequestTypeDisplay(request.requestType)}
            </p>
            ${request.requestMessage ? `<p class="mb-2"><strong>Message:</strong> ${request.requestMessage}</p>` : ''}
            <div class="row">
                <div class="col-md-6">
                    <small class="text-muted">
                        <i class="fas fa-calendar me-1"></i>
                        Requested: ${formatDateTime(request.requestedAt)}
                    </small>
                </div>
                <div class="col-md-6">
                    <small class="text-muted">
                        <i class="fas fa-hourglass-half me-1"></i>
                        Expires: ${formatDateTime(request.expiresAt)}
                    </small>
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-sm btn-primary me-2" onclick="viewConsentRequest('${request._id}')">
                    <i class="fas fa-eye me-1"></i>Review Details
                </button>
            </div>
        </div>
    `).join('');
}

function updateConsentNotifications() {
    const pendingCount = consentRequests.filter(r => r.status === 'pending').length;
    
    if (pendingCount > 0) {
        document.getElementById('consentAlert').classList.remove('d-none');
        document.getElementById('consentCount').textContent = pendingCount;
        document.getElementById('consentBadge').textContent = pendingCount;
        document.getElementById('consentBadge').classList.remove('d-none');
    } else {
        document.getElementById('consentAlert').classList.add('d-none');
        document.getElementById('consentBadge').classList.add('d-none');
    }
}

function viewConsentRequest(requestId) {
    const request = consentRequests.find(r => r._id === requestId);
    if (!request) return;
    
    currentConsentRequest = request;
    
    const modalBody = document.getElementById('consentModalBody');
    modalBody.innerHTML = `
        <div class="mb-3">
            <h6 class="fw-bold">Hospital: ${request.hospitalId.hospitalName}</h6>
            <p><strong>Request Type:</strong> ${getRequestTypeDisplay(request.requestType)}</p>
            ${request.requestMessage ? `<p><strong>Message:</strong> ${request.requestMessage}</p>` : ''}
        </div>
        
        <div class="mb-3">
            <h6 class="fw-bold">Proposed Changes:</h6>
            <div class="bg-light p-3 rounded">
                ${formatRequestData(request.requestType, request.requestData)}
            </div>
        </div>
        
        <div class="mb-3">
            <label class="form-label">Response Message (Optional)</label>
            <textarea class="form-control" id="responseMessage" rows="3" 
                      placeholder="Add any notes for your response..."></textarea>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('consentModal'));
    modal.show();
}

async function respondToConsent(status) {
    if (!currentConsentRequest) return;
    
    const responseMessage = document.getElementById('responseMessage').value.trim();
    
    try {
        await apiRequest(`/patient/consent-requests/${currentConsentRequest._id}/respond`, 'POST', {
            status,
            responseMessage
        });
        
        showSuccess(`Consent request ${status} successfully!`);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('consentModal'));
        modal.hide();
        
        // Reload data
        loadConsentRequests();
        loadPatientData();
        
    } catch (error) {
        showError('Failed to process consent request: ' + error.message);
    }
}

function formatRequestData(requestType, data) {
    switch (requestType) {
        case 'addCondition':
            return `
                <p><strong>Condition:</strong> ${data.condition}</p>
                <p><strong>Severity:</strong> ${data.severity}</p>
                <p><strong>Diagnosed Date:</strong> ${formatDate(data.diagnosedDate)}</p>
                ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            `;
        case 'addMedication':
            return `
                <p><strong>Medication:</strong> ${data.name}</p>
                <p><strong>Dosage:</strong> ${data.dosage}</p>
                <p><strong>Frequency:</strong> ${data.frequency}</p>
                <p><strong>Start Date:</strong> ${formatDate(data.startDate)}</p>
                ${data.endDate ? `<p><strong>End Date:</strong> ${formatDate(data.endDate)}</p>` : ''}
            `;
        case 'addAllergy':
            return `
                <p><strong>Allergen:</strong> ${data.allergen}</p>
                <p><strong>Reaction:</strong> ${data.reaction}</p>
                <p><strong>Severity:</strong> ${data.severity}</p>
                <p><strong>Diagnosed Date:</strong> ${formatDate(data.diagnosedDate)}</p>
            `;
        case 'addLabReport':
            return `
                <p><strong>Test Name:</strong> ${data.testName}</p>
                <p><strong>Result:</strong> ${data.result}</p>
                <p><strong>Test Date:</strong> ${formatDate(data.testDate)}</p>
                ${data.normalRange ? `<p><strong>Normal Range:</strong> ${data.normalRange}</p>` : ''}
            `;
        default:
            return '<p>General information update</p>';
    }
}

function getRequestTypeDisplay(type) {
    const types = {
        'addCondition': 'Add Chronic Condition',
        'addMedication': 'Add Medication',
        'addAllergy': 'Add Allergy',
        'addLabReport': 'Add Lab Report',
        'updateInfo': 'Update General Information'
    };
    return types[type] || type;
}

function getSeverityColor(severity) {
    switch (severity) {
        case 'Mild': return 'warning';
        case 'Moderate': return 'primary';
        case 'Severe': return 'danger';
        default: return 'secondary';
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function switchTab(tabId) {
    // Update sidebar
    document.querySelectorAll('[data-tab]').forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('d-none');
    });
    
    const targetContent = document.getElementById(tabId);
    if (targetContent) {
        targetContent.classList.remove('d-none');
    }
    
    // Special handling for consent requests tab
    if (tabId === 'consent-requests') {
        loadConsentRequests();
    }
}

function showConsentRequests() {
    switchTab('consent-requests');
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorAlert').classList.remove('d-none');
    document.getElementById('successAlert').classList.add('d-none');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        document.getElementById('errorAlert').classList.add('d-none');
    }, 5000);
}

function showSuccess(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successAlert').classList.remove('d-none');
    document.getElementById('errorAlert').classList.add('d-none');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        document.getElementById('successAlert').classList.add('d-none');
    }, 5000);
}

function logout() {
    localStorage.removeItem('medicard_token');
    localStorage.removeItem('medicard_user');
    window.location.href = '/';
}