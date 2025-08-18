const API_BASE_URL = 'http://localhost:5000/api';

let currentPatient = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('medicard_token');
    const user = localStorage.getItem('medicard_user');
    
    if (!token || !user) {
        window.location.href = '/';
        return;
    }
    
    currentUser = JSON.parse(user);
    if (currentUser.role !== 'hospital') {
        window.location.href = '/';
        return;
    }
    
    // Initialize dashboard
    displayHospitalInfo();
    setupEventListeners();
});

function displayHospitalInfo() {
    document.getElementById('hospitalName').textContent = currentUser.hospitalName;
    document.getElementById('ninNumber').textContent = currentUser.ninNumber;
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('[data-tab]').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Form submissions
    document.getElementById('searchForm').addEventListener('submit', handlePatientSearch);
    document.getElementById('adrForm').addEventListener('submit', handleADRCheck);
    document.getElementById('updateRequestForm').addEventListener('submit', handleUpdateRequest);
    
    // Update type change
    document.getElementById('updateType').addEventListener('change', handleUpdateTypeChange);
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

async function handlePatientSearch(e) {
    e.preventDefault();
    
    const medicardId = document.getElementById('searchMedicardId').value.trim();
    
    if (!medicardId) {
        showError('Please enter a Medicard ID');
        return;
    }
    
    try {
        const patient = await apiRequest(`/hospital/patient/${medicardId}`, 'GET');
        currentPatient = patient;
        displaySearchResults(patient);
        displayPatientRecords(patient);
        
    } catch (error) {
        showError('Patient not found: ' + error.message);
        document.getElementById('searchResults').classList.add('d-none');
    }
}

function displaySearchResults(patient) {
    const container = document.getElementById('searchResults');
    
    container.innerHTML = `
        <div class="alert alert-success">
            <h6 class="fw-bold mb-2">Patient Found!</h6>
            <div class="row">
                <div class="col-md-6">
                    <p class="mb-1"><strong>Name:</strong> ${patient.name}</p>
                    <p class="mb-1"><strong>Medicard ID:</strong> ${patient.medicardId}</p>
                    <p class="mb-1"><strong>Blood Group:</strong> <span class="badge bg-danger">${patient.bloodGroup}</span></p>
                </div>
                <div class="col-md-6">
                    <p class="mb-1"><strong>Gender:</strong> ${patient.gender}</p>
                    <p class="mb-1"><strong>Age:</strong> ${calculateAge(patient.dateOfBirth)} years</p>
                    <p class="mb-1"><strong>Contact:</strong> ${patient.contactNumber}</p>
                </div>
            </div>
            <div class="mt-2">
                <button class="btn btn-primary btn-sm me-2" onclick="switchTab('patient-records')">
                    <i class="fas fa-file-medical me-1"></i>View Records
                </button>
                <button class="btn btn-warning btn-sm me-2" onclick="prepareADRCheck()">
                    <i class="fas fa-shield-alt me-1"></i>ADR Check
                </button>
                <button class="btn btn-info btn-sm" onclick="prepareUpdateRequest()">
                    <i class="fas fa-edit me-1"></i>Request Update
                </button>
            </div>
        </div>
    `;
    
    container.classList.remove('d-none');
}

function displayPatientRecords(patient) {
    const container = document.getElementById('patientRecords');
    
    container.innerHTML = `
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h6 class="mb-0">Patient Information</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-borderless table-sm">
                            <tr><td><strong>Name:</strong></td><td>${patient.name}</td></tr>
                            <tr><td><strong>Medicard ID:</strong></td><td>${patient.medicardId}</td></tr>
                            <tr><td><strong>Date of Birth:</strong></td><td>${formatDate(patient.dateOfBirth)}</td></tr>
                            <tr><td><strong>Gender:</strong></td><td>${patient.gender}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-borderless table-sm">
                            <tr><td><strong>Blood Group:</strong></td><td><span class="badge bg-danger">${patient.bloodGroup}</span></td></tr>
                            <tr><td><strong>Weight:</strong></td><td>${patient.weight} kg</td></tr>
                            <tr><td><strong>Height:</strong></td><td>${patient.height} cm</td></tr>
                            <tr><td><strong>Organ Donation:</strong></td><td>${patient.organDonation ? 'Yes' : 'No'}</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0"><i class="fas fa-procedures me-2"></i>Chronic Conditions (${patient.chronicConditions.length})</h6>
                    </div>
                    <div class="card-body">
                        ${displayConditions(patient.chronicConditions)}
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-danger text-white">
                        <h6 class="mb-0"><i class="fas fa-exclamation-triangle me-2"></i>Allergies (${patient.allergies.length})</h6>
                    </div>
                    <div class="card-body">
                        ${displayAllergies(patient.allergies)}
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="fas fa-pills me-2"></i>Current Medications (${patient.currentMedications.length})</h6>
                    </div>
                    <div class="card-body">
                        ${displayMedications(patient.currentMedications)}
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="fas fa-flask me-2"></i>Lab Reports (${patient.labReports.length})</h6>
                    </div>
                    <div class="card-body">
                        ${displayLabReports(patient.labReports)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function displayConditions(conditions) {
    if (conditions.length === 0) {
        return '<p class="text-muted">No chronic conditions recorded</p>';
    }
    
    return conditions.map(condition => `
        <div class="border-start border-warning border-3 ps-3 mb-3">
            <h6 class="fw-bold mb-1">${condition.condition}</h6>
            <p class="small mb-1">Severity: <span class="badge bg-${getSeverityColor(condition.severity)}">${condition.severity}</span></p>
            <p class="small text-muted mb-0">Diagnosed: ${formatDate(condition.diagnosedDate)}</p>
            ${condition.notes ? `<p class="small mt-1 mb-0">${condition.notes}</p>` : ''}
        </div>
    `).join('');
}

function displayAllergies(allergies) {
    if (allergies.length === 0) {
        return '<p class="text-muted">No known allergies</p>';
    }
    
    return allergies.map(allergy => `
        <div class="border-start border-danger border-3 ps-3 mb-3">
            <h6 class="fw-bold mb-1">${allergy.allergen}</h6>
            <p class="small mb-1">Reaction: ${allergy.reaction}</p>
            <p class="small mb-1">Severity: <span class="badge bg-${getSeverityColor(allergy.severity)}">${allergy.severity}</span></p>
            <p class="small text-muted mb-0">Diagnosed: ${formatDate(allergy.diagnosedDate)}</p>
        </div>
    `).join('');
}

function displayMedications(medications) {
    if (medications.length === 0) {
        return '<p class="text-muted">No current medications</p>';
    }
    
    return medications.map(medication => `
        <div class="border-start border-success border-3 ps-3 mb-3">
            <h6 class="fw-bold mb-1">${medication.name}</h6>
            <p class="small mb-1">Dosage: ${medication.dosage}</p>
            <p class="small mb-1">Frequency: ${medication.frequency}</p>
            <p class="small text-muted mb-0">Started: ${formatDate(medication.startDate)}</p>
        </div>
    `).join('');
}

function displayLabReports(reports) {
    if (reports.length === 0) {
        return '<p class="text-muted">No lab reports available</p>';
    }
    
    return reports.slice(0, 5).map(report => `
        <div class="border-start border-info border-3 ps-3 mb-3">
            <h6 class="fw-bold mb-1">${report.testName}</h6>
            <p class="small mb-1">Result: ${report.result}</p>
            ${report.normalRange ? `<p class="small mb-1">Normal: ${report.normalRange}</p>` : ''}
            <p class="small text-muted mb-0">Date: ${formatDate(report.testDate)}</p>
        </div>
    `).join('') + (reports.length > 5 ? `<p class="small text-muted">... and ${reports.length - 5} more</p>` : '');
}

async function handleADRCheck(e) {
    e.preventDefault();
    
    const medicardId = document.getElementById('adrMedicardId').value.trim();
    const medications = [];
    
    // Collect all medications
    document.querySelectorAll('.medication-row').forEach(row => {
        const name = row.querySelector('.medication-name').value.trim();
        const dosage = row.querySelector('.medication-dosage').value.trim();
        const frequency = row.querySelector('.medication-frequency').value.trim();
        
        if (name && dosage && frequency) {
            medications.push({ name, dosage, frequency });
        }
    });
    
    if (!medicardId || medications.length === 0) {
        showError('Please enter patient ID and at least one medication');
        return;
    }
    
    try {
        const result = await apiRequest('/hospital/adr-check', 'POST', {
            medicardId,
            medications
        });
        
        displayADRResults(result);
        
    } catch (error) {
        showError('ADR check failed: ' + error.message);
    }
}

function displayADRResults(result) {
    const container = document.getElementById('adrResults');
    
    let alertClass = result.safeToAdminister ? 'alert-success' : 'alert-danger';
    let statusIcon = result.safeToAdminister ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
    let statusText = result.safeToAdminister ? 'SAFE TO ADMINISTER' : 'CAUTION: POTENTIAL RISKS DETECTED';
    
    let warningsHtml = '';
    if (result.warnings.length > 0) {
        warningsHtml = `
            <div class="mt-3">
                <h6 class="fw-bold">Warnings:</h6>
                ${result.warnings.map(warning => `
                    <div class="adr-warning severity-${warning.severity.toLowerCase()} mb-2">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold mb-0">${warning.medication}</h6>
                            <span class="badge bg-${getSeverityColor(warning.severity)}">${warning.severity}</span>
                        </div>
                        <p class="mb-1"><strong>${warning.type === 'condition' ? 'Condition' : 'Allergy'}:</strong> 
                           ${warning.condition || warning.allergen}</p>
                        <p class="mb-1"><strong>Warning:</strong> ${warning.warning}</p>
                        ${warning.alternativeSuggestion ? `<p class="mb-0"><strong>Suggestion:</strong> ${warning.alternativeSuggestion}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="alert ${alertClass}">
            <div class="d-flex align-items-center mb-3">
                <i class="${statusIcon} fa-2x me-3"></i>
                <div>
                    <h5 class="mb-1">${statusText}</h5>
                    <p class="mb-0">Patient: ${result.patientName} (${result.patientId})</p>
                </div>
            </div>
            
            <div class="mb-3">
                <h6 class="fw-bold">Medications Checked:</h6>
                <ul class="mb-0">
                    ${result.medicationsChecked.map(med => `
                        <li>${med.name} - ${med.dosage} (${med.frequency})</li>
                    `).join('')}
                </ul>
            </div>
            
            ${warningsHtml}
        </div>
    `;
    
    container.classList.remove('d-none');
}

function prepareADRCheck() {
    if (currentPatient) {
        document.getElementById('adrMedicardId').value = currentPatient.medicardId;
        switchTab('adr-check');
    }
}

function prepareUpdateRequest() {
    if (currentPatient) {
        document.getElementById('updateMedicardId').value = currentPatient.medicardId;
        switchTab('update-request');
    }
}

function addMedication() {
    const container = document.getElementById('medicationsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'medication-row mb-2';
    newRow.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <input type="text" class="form-control medication-name" placeholder="Medication name" required>
            </div>
            <div class="col-md-3">
                <input type="text" class="form-control medication-dosage" placeholder="Dosage" required>
            </div>
            <div class="col-md-3">
                <input type="text" class="form-control medication-frequency" placeholder="Frequency" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-outline-danger" onclick="removeMedication(this)">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
        </div>
    `;
    container.appendChild(newRow);
}

function removeMedication(button) {
    const medicationRows = document.querySelectorAll('.medication-row');
    if (medicationRows.length > 1) {
        button.closest('.medication-row').remove();
    }
}

function handleUpdateTypeChange() {
    const updateType = document.getElementById('updateType').value;
    const container = document.getElementById('updateFields');
    
    container.innerHTML = '';
    
    switch (updateType) {
        case 'addCondition':
            container.innerHTML = `
                <div class="mb-3">
                    <label class="form-label fw-semibold">Condition Name</label>
                    <input type="text" class="form-control" id="conditionName" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Severity</label>
                        <select class="form-control" id="conditionSeverity" required>
                            <option value="">Select severity</option>
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Diagnosed Date</label>
                        <input type="date" class="form-control" id="conditionDate" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Notes (Optional)</label>
                    <textarea class="form-control" id="conditionNotes" rows="2"></textarea>
                </div>
            `;
            break;
            
        case 'addMedication':
            container.innerHTML = `
                <div class="mb-3">
                    <label class="form-label fw-semibold">Medication Name</label>
                    <input type="text" class="form-control" id="medicationName" required>
                </div>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label fw-semibold">Dosage</label>
                        <input type="text" class="form-control" id="medicationDosage" required>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label fw-semibold">Frequency</label>
                        <input type="text" class="form-control" id="medicationFrequency" required>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label fw-semibold">Start Date</label>
                        <input type="date" class="form-control" id="medicationStartDate" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">End Date (Optional)</label>
                    <input type="date" class="form-control" id="medicationEndDate">
                </div>
            `;
            break;
            
        case 'addAllergy':
            container.innerHTML = `
                <div class="mb-3">
                    <label class="form-label fw-semibold">Allergen</label>
                    <input type="text" class="form-control" id="allergen" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Reaction</label>
                    <input type="text" class="form-control" id="allergyReaction" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Severity</label>
                        <select class="form-control" id="allergySeverity" required>
                            <option value="">Select severity</option>
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Diagnosed Date</label>
                        <input type="date" class="form-control" id="allergyDate" required>
                    </div>
                </div>
            `;
            break;
            
        case 'addLabReport':
            container.innerHTML = `
                <div class="mb-3">
                    <label class="form-label fw-semibold">Test Name</label>
                    <input type="text" class="form-control" id="testName" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Result</label>
                        <input type="text" class="form-control" id="testResult" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Test Date</label>
                        <input type="date" class="form-control" id="testDate" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Normal Range (Optional)</label>
                    <input type="text" class="form-control" id="normalRange">
                </div>
            `;
            break;
    }
}

async function handleUpdateRequest(e) {
    e.preventDefault();
    
    const medicardId = document.getElementById('updateMedicardId').value.trim();
    const updateType = document.getElementById('updateType').value;
    const requestMessage = document.getElementById('requestMessage').value.trim();
    
    if (!medicardId || !updateType) {
        showError('Please fill in all required fields');
        return;
    }
    
    let requestData = {};
    
    // Collect data based on update type
    switch (updateType) {
        case 'addCondition':
            requestData = {
                condition: document.getElementById('conditionName').value,
                severity: document.getElementById('conditionSeverity').value,
                diagnosedDate: document.getElementById('conditionDate').value,
                notes: document.getElementById('conditionNotes').value
            };
            break;
            
        case 'addMedication':
            requestData = {
                name: document.getElementById('medicationName').value,
                dosage: document.getElementById('medicationDosage').value,
                frequency: document.getElementById('medicationFrequency').value,
                startDate: document.getElementById('medicationStartDate').value,
                endDate: document.getElementById('medicationEndDate').value || null
            };
            break;
            
        case 'addAllergy':
            requestData = {
                allergen: document.getElementById('allergen').value,
                reaction: document.getElementById('allergyReaction').value,
                severity: document.getElementById('allergySeverity').value,
                diagnosedDate: document.getElementById('allergyDate').value
            };
            break;
            
        case 'addLabReport':
            requestData = {
                testName: document.getElementById('testName').value,
                result: document.getElementById('testResult').value,
                testDate: document.getElementById('testDate').value,
                normalRange: document.getElementById('normalRange').value
            };
            break;
    }
    
    try {
        await apiRequest(`/hospital/patient/${medicardId}/request-update`, 'POST', {
            requestType: updateType,
            requestData,
            requestMessage
        });
        
        showSuccess('Update request sent successfully! The patient will be notified.');
        
        // Reset form
        document.getElementById('updateRequestForm').reset();
        document.getElementById('updateFields').innerHTML = '';
        
    } catch (error) {
        showError('Failed to send update request: ' + error.message);
    }
}

function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function getSeverityColor(severity) {
    switch (severity) {
        case 'Mild': return 'warning';
        case 'Moderate': return 'primary';
        case 'Severe': return 'danger';
        case 'Critical': return 'danger';
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