document.addEventListener('DOMContentLoaded', function () {
    // Mock data for cases
    let cases = [];
    let currentCase = null;

    // Initialize navigation tabs
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetTab = this.getAttribute('data-tab');

            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Initialize case processing tabs
    const caseTabEls = document.querySelectorAll('#caseTabs button[data-bs-toggle="tab"]');
    const caseTabPanes = document.querySelectorAll('#caseTabContent .tab-pane');

    caseTabEls.forEach(tabEl => {
        tabEl.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetId);

            // Remove active class from all tabs and panes
            caseTabEls.forEach(el => el.classList.remove('active'));
            caseTabPanes.forEach(pane => pane.classList.remove('show', 'active'));

            // Add active class to clicked tab and corresponding pane
            this.classList.add('active');
            targetPane.classList.add('show', 'active');
        });
    });

    // Case Creation Form
    const caseForm = document.getElementById('case-creation-form');

    if (caseForm) {
        caseForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const patientName = document.getElementById('patient-name').value;
            const patientDob = document.getElementById('patient-dob').value;
            const patientMedication = document.getElementById('patient-medication').value;

            // Create new case
            currentCase = {
                id: Date.now().toString(),
                patientName,
                patientDob,
                medication: patientMedication,
                steps: {
                    paUpload: { status: 'Not Started', lastUpdated: null, text: null },
                    eligibility: { status: 'Not Started', lastUpdated: null, isComplete: null, notes: null },
                    criteria: { status: 'Not Started', lastUpdated: null, isApproved: null, notes: null },
                    profileUpdate: { status: 'Not Started', lastUpdated: null, memberLetter: null, documentation: [] }
                }
            };

            // Clear all downstream step form data
            document.getElementById('pa-text').value = '';
            document.getElementById('eligibility-complete').checked = false;
            document.getElementById('eligibility-incomplete').checked = false;
            document.getElementById('eligibility-notes').value = '';
            document.getElementById('criteria-approved').checked = false;
            document.getElementById('criteria-declined').checked = false;
            document.getElementById('criteria-notes').value = '';
            document.getElementById('criteria-additional-info').value = '';
            document.getElementById('member-letter').value = '';
            document.getElementById('documentation').value = '';

            // Add to cases array
            cases.push(currentCase);

            // Update dashboard
            updateDashboard();

            alert('Case created successfully! You can now proceed to the processing steps.');
        });
    }

    // Save buttons for each step
    document.getElementById('save-pa')?.addEventListener('click', function () {
        if (!currentCase) {
            alert('Please create a case first');
            return;
        }

        const paText = document.getElementById('pa-text').value;
        if (!paText) {
            alert('Please enter PA form text');
            return;
        }

        currentCase.steps.paUpload = {
            status: 'Complete',
            lastUpdated: new Date().toLocaleString(),
            text: paText
        };

        // Update dashboard
        updateDashboard();

        alert('PA form saved successfully!');
    });

    document.getElementById('save-eligibility')?.addEventListener('click', function () {
        if (!currentCase) {
            alert('Please create a case first');
            return;
        }

        const isComplete = document.getElementById('eligibility-complete').checked;
        const notes = document.getElementById('eligibility-notes').value;

        if (!document.querySelector('input[name="eligibility"]:checked')) {
            alert('Please select an eligibility status');
            return;
        }

        currentCase.steps.eligibility = {
            status: isComplete ? 'Complete' : 'Needs More Info',
            lastUpdated: new Date().toLocaleString(),
            isComplete,
            notes
        };

        // Update dashboard
        updateDashboard();

        alert('Eligibility check saved successfully!');
    });

    // Show appropriate criteria based on medication
    function updateCriteriaDisplay(medication) {
        const ozempicCriteria = document.getElementById('ozempic-criteria');
        const entrestoCriteria = document.getElementById('entresto-criteria');

        // Hide all criteria sections first
        ozempicCriteria.style.display = 'none';
        entrestoCriteria.style.display = 'none';

        // Show the appropriate criteria based on medication
        if (medication.toLowerCase() === 'ozempic') {
            ozempicCriteria.style.display = 'block';

            // Add event listeners for Ozempic criteria checkboxes
            const firstCheckbox = document.getElementById('criteria-1');
            const lastCheckbox = document.getElementById('criteria-4');
            const declinedRadio = document.getElementById('criteria-declined');

            function checkDeclinedStatus() {
                if (firstCheckbox.checked && lastCheckbox.checked) {
                    declinedRadio.checked = true;
                }
            }

            firstCheckbox.addEventListener('change', checkDeclinedStatus);
            lastCheckbox.addEventListener('change', checkDeclinedStatus);
        } else if (medication.toLowerCase() === 'entresto') {
            entrestoCriteria.style.display = 'block';

            // Add event listeners for Entresto criteria checkboxes
            const entrestoCheckbox1 = document.getElementById('entresto-criteria-1');
            const entrestoCheckbox2 = document.getElementById('entresto-criteria-2');
            const entrestoCheckbox3 = document.getElementById('entresto-criteria-3');
            const approvedRadio = document.getElementById('criteria-approved');

            function checkApprovedStatus() {
                if (entrestoCheckbox1.checked && entrestoCheckbox2.checked && entrestoCheckbox3.checked) {
                    approvedRadio.checked = true;
                }
            }

            entrestoCheckbox1.addEventListener('change', checkApprovedStatus);
            entrestoCheckbox2.addEventListener('change', checkApprovedStatus);
            entrestoCheckbox3.addEventListener('change', checkApprovedStatus);
        }
    }

    // Update criteria display when medication is entered in case creation
    document.getElementById('patient-medication')?.addEventListener('input', function () {
        updateCriteriaDisplay(this.value);
    });

    // Update criteria display when viewing patient details
    window.showPatientDetails = function (patientId) {
        const patient = cases.find(p => p.id === patientId);
        if (!patient) return;

        // Update modal content
        document.getElementById('modal-patient-name').textContent = patient.patientName;
        document.getElementById('modal-patient-id').textContent = patient.id;
        document.getElementById('modal-patient-dob').textContent = patient.patientDob;

        // Update criteria display based on medication
        updateCriteriaDisplay(patient.medication);

        // Update step details
        const stepDetails = document.getElementById('step-details');
        stepDetails.innerHTML = '';

        Object.entries(patient.steps).forEach(([stepId, step]) => {
            const stepCard = document.createElement('div');
            stepCard.className = 'card mb-3';
            stepCard.innerHTML = `
                <div class="card-body">
                    <h6>${getStepTitle(stepId)}</h6>
                    <p>${getStepDescription(stepId)}</p>
                    <div class="mt-3">
                        <strong>Status:</strong> <span class="badge bg-${getStatusColor(step.status)}">${step.status}</span>
                    </div>
                    <div class="mt-2">
                        <strong>Last Updated:</strong> ${step.lastUpdated || 'N/A'}
                    </div>
                    ${getStepForm(stepId, step)}
                </div>
            `;
            stepDetails.appendChild(stepCard);
        });

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('patientDetailsModal'));
        modal.show();
    };

    // Update the criteria save handler
    document.getElementById('save-criteria')?.addEventListener('click', function () {
        if (!currentCase) {
            alert('Please create a case first');
            return;
        }

        const medication = currentCase.medication.toLowerCase();
        const selectedCriteria = Array.from(document.querySelectorAll('input[name="specific-criteria"]:checked'))
            .map(checkbox => checkbox.value);
        const additionalInfo = document.getElementById('criteria-additional-info').value;
        const isApproved = document.getElementById('criteria-approved').checked;
        const notes = document.getElementById('criteria-notes').value;

        if (selectedCriteria.length === 0) {
            alert('Please select at least one criterion');
            return;
        }

        if (!document.querySelector('input[name="criteria"]:checked')) {
            alert('Please select an approval decision');
            return;
        }

        currentCase.steps.criteria = {
            status: isApproved ? 'Approved' : 'Denied',
            lastUpdated: new Date().toLocaleString(),
            isApproved,
            selectedCriteria,
            additionalInfo,
            notes,
            medication
        };

        // Update dashboard
        updateDashboard();

        alert('Criteria check saved successfully!');
    });

    // Profile Update Tab
    document.getElementById('finish-profile')?.addEventListener('click', function () {
        if (!currentCase) {
            alert('Please create a case first');
            return;
        }

        const memberLetter = document.getElementById('member-letter').value;
        const documentation = document.getElementById('documentation').files;

        if (!memberLetter) {
            alert('Please enter the member letter text');
            return;
        }

        // Create a new step for profile update
        currentCase.steps.profileUpdate = {
            status: 'Complete',
            lastUpdated: new Date().toLocaleString(),
            memberLetter,
            documentation: Array.from(documentation).map(file => file.name)
        };

        // Add to cases array and complete the case
        cases.push(currentCase);
        currentCase = null;

        alert('Profile update completed and case finished successfully!');
    });

    // Initialize dashboard tables
    updateDashboard();

    // Patient Search
    const searchButton = document.getElementById('search-button');
    const patientSearch = document.getElementById('patient-search');
    const patientResults = document.getElementById('patient-results');

    if (searchButton) {
        searchButton.addEventListener('click', function () {
            const searchTerm = patientSearch.value.trim();
            if (searchTerm) {
                searchPatients(searchTerm);
            }
        });
    }

    // Search patients function
    function searchPatients(term) {
        patientResults.innerHTML = '';

        // Simulate API call delay
        setTimeout(() => {
            const filteredPatients = cases.filter(patient =>
                patient.patientName.toLowerCase().includes(term.toLowerCase()) ||
                patient.id.includes(term)
            );

            if (filteredPatients.length === 0) {
                patientResults.innerHTML = '<div class="alert alert-info">No patients found</div>';
                return;
            }

            const list = document.createElement('div');
            list.className = 'list-group';

            filteredPatients.forEach(patient => {
                const item = document.createElement('button');
                item.className = 'list-group-item list-group-item-action';
                item.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${patient.patientName}</h6>
                        <small>ID: ${patient.id}</small>
                    </div>
                    <small>DOB: ${patient.patientDob}</small>
                `;
                item.addEventListener('click', () => showPatientDetails(patient.id));
                list.appendChild(item);
            });

            patientResults.appendChild(list);
        }, 1000);
    }

    // Helper functions
    function getStepTitle(stepId) {
        const titles = {
            paUpload: 'Prior Authorization Upload',
            eligibility: 'Eligibility Check',
            criteria: 'Criteria Check',
            profileUpdate: 'Profile Update'
        };
        return titles[stepId] || '';
    }

    function getStepDescription(stepId) {
        const descriptions = {
            paUpload: 'This step involves uploading the prior authorization form.',
            eligibility: 'This step verifies the completeness of the form and patient eligibility.',
            criteria: 'This step assesses if the prior authorization should be approved based on criteria.',
            profileUpdate: 'This step updates the member profile with the letter and documentation.'
        };
        return descriptions[stepId] || '';
    }

    function getStatusColor(status) {
        if (status === 'Complete' || status === 'Approved') return 'success';
        if (status === 'Needs More Info') return 'warning';
        if (status === 'Denied') return 'danger';
        return 'secondary';
    }

    function getStepForm(stepId, step) {
        switch (stepId) {
            case 'eligibility':
                return `
                    <div class="mt-3">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="eligibility" id="eligibility-complete" value="complete" ${step.output?.includes('No issues') ? 'checked' : ''}>
                            <label class="form-check-label" for="eligibility-complete">Form is complete, no issues</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="eligibility" id="eligibility-incomplete" value="incomplete" ${step.output?.includes('More information') ? 'checked' : ''}>
                            <label class="form-check-label" for="eligibility-incomplete">More information needed</label>
                        </div>
                        <div class="mt-3" id="missing-info" style="display: ${step.output?.includes('More information') ? 'block' : 'none'}">
                            <label class="form-label">Missing Information</label>
                            <textarea class="form-control" placeholder="Specify what information is missing..."></textarea>
                        </div>
                    </div>
                `;
            case 'criteria':
                return `
                    <div class="mt-3">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="criteria" id="criteria-approved" value="approved" ${step.output?.includes('Approved') ? 'checked' : ''}>
                            <label class="form-check-label" for="criteria-approved">Approved - Meets all criteria</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="criteria" id="criteria-declined" value="declined" ${step.output?.includes('Declined') ? 'checked' : ''}>
                            <label class="form-check-label" for="criteria-declined">Declined - Does not meet criteria</label>
                        </div>
                        <div class="mt-3" id="denial-reason" style="display: ${step.output?.includes('Declined') ? 'block' : 'none'}">
                            <label class="form-label">Decline Reason</label>
                            <textarea class="form-control" placeholder="Specify the reason for decline..."></textarea>
                        </div>
                    </div>
                `;
            case 'profileUpdate':
                return `
                    <div class="mt-3">
                        <div class="mb-3">
                            <label class="form-label">Member Letter</label>
                            <textarea class="form-control" rows="5" readonly>${step.memberLetter || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Uploaded Documentation</label>
                            <ul class="list-group">
                                ${(step.documentation || []).map(file => `
                                    <li class="list-group-item">${file}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }

    // Update dashboard function
    function updateDashboard() {
        // Update summary cards
        const approvedCount = cases.filter(c => c.steps.criteria?.status === 'Approved').length;
        const deniedCount = cases.filter(c => c.steps.criteria?.status === 'Denied').length;
        const needsInfoCount = cases.filter(c => c.steps.eligibility?.status === 'Needs More Info').length;

        document.querySelector('.card.bg-success h2').textContent = approvedCount;
        document.querySelector('.card.bg-danger h2').textContent = deniedCount;
        document.querySelector('.card.bg-warning h2').textContent = needsInfoCount;

        // Update queue list
        updateQueueList();
    }

    // Update queue list function
    function updateQueueList() {
        const queueList = document.getElementById('queue-list');
        queueList.innerHTML = '';

        cases.forEach(patient => {
            const row = document.createElement('tr');

            // Determine current step and status
            let currentStep = 'Not Started';
            let status = 'Pending';
            let statusColor = 'secondary';

            // Check steps in order of workflow
            if (!patient.steps.paUpload?.status || patient.steps.paUpload.status === 'Not Started') {
                currentStep = 'PA Upload';
                status = 'Not Started';
                statusColor = 'secondary';
            } else if (patient.steps.paUpload.status === 'Complete' &&
                (!patient.steps.eligibility?.status || patient.steps.eligibility.status === 'Not Started')) {
                currentStep = 'Eligibility Check';
                status = patient.steps.eligibility?.status || 'Not Started';
                statusColor = patient.steps.eligibility?.status === 'Complete' ? 'success' :
                    patient.steps.eligibility?.status === 'Needs More Info' ? 'warning' : 'secondary';
            } else if (patient.steps.eligibility?.status === 'Complete' &&
                (!patient.steps.criteria?.status || patient.steps.criteria.status === 'Not Started')) {
                currentStep = 'Criteria Check';
                status = patient.steps.criteria?.status || 'Not Started';
                statusColor = patient.steps.criteria?.status === 'Approved' ? 'success' :
                    patient.steps.criteria?.status === 'Denied' ? 'danger' : 'secondary';
            } else if (patient.steps.criteria?.status &&
                (!patient.steps.profileUpdate?.status || patient.steps.profileUpdate.status === 'Not Started')) {
                currentStep = 'Profile Update';
                status = patient.steps.profileUpdate?.status || 'Not Started';
                statusColor = patient.steps.profileUpdate?.status === 'Complete' ? 'success' : 'secondary';
            } else if (patient.steps.profileUpdate?.status === 'Complete') {
                currentStep = 'Profile Update';
                status = 'Complete';
                statusColor = 'success';
            }

            row.innerHTML = `
                <td>${patient.patientName}</td>
                <td>${currentStep}</td>
                <td><span class="badge bg-${statusColor}">${status}</span></td>
                <td>${patient.steps[currentStep.toLowerCase().replace(' ', '')]?.lastUpdated || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showPatientDetails('${patient.id}')">
                        View Details
                    </button>
                </td>
            `;
            queueList.appendChild(row);
        });
    }
}); 