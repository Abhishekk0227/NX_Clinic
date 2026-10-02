const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replacement) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(searchRegex, replacement);
  fs.writeFileSync(fullPath, content);
}

// 1. Update HealthcareModels.js - EncounterSchema
replaceInFile(
  'server/src/models/HealthcareModels.js',
  /encounterType: \{ type: String, enum: \['consultation', 'procedure', 'follow_up', 'emergency'\], default: 'consultation' \},/g,
  `encounterType: { type: String, enum: ['consultation', 'procedure', 'follow_up', 'emergency'], default: 'consultation' },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'waived'], default: 'pending' },
  caseType: { type: String, enum: ['new', 'follow_up'], default: 'new' },
  previousEncounterId: { type: String, index: true },`
);

// 2. Update HealthcareModels.js - ClinicalRecordSchema
replaceInFile(
  'server/src/models/HealthcareModels.js',
  /complaint: \{ type: String, default: '' \},[\s\S]*?status: \{ type: String, enum: \['draft', 'finalized', 'amended'\], default: 'finalized' \},/g,
  `conditionAndSymptoms: { type: String, default: '' },
  prescriptionNotes: { type: String, default: '' },
  treatmentRemarks: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'finalized', 'amended'], default: 'finalized' },`
);

// 3. Update PatientList.jsx - Simplify Registration Form
const patientFormStateOld = `const [patientForm, setPatientForm] = useState({ 
    name: '', phone: '', email: '', age: '', gender: 'other', 
    bloodGroup: '', allergies: '', medicalHistory: '' 
  });`;
const patientFormStateNew = `const [patientForm, setPatientForm] = useState({ 
    name: '', phone: '', email: '', age: '', gender: 'other', address: ''
  });`;

replaceInFile('client/src/pages/Patients/PatientList.jsx', patientFormStateOld, patientFormStateNew);
replaceInFile('client/src/pages/Patients/PatientList.jsx', /bloodGroup: '', allergies: '', medicalHistory: ''/g, "address: ''");

replaceInFile(
  'client/src/pages/Patients/PatientList.jsx',
  /<div className="form-group">\s*<label className="form-label">Blood Group<\/label>[\s\S]*?<\/div>/g,
  `<div className="form-group">
              <label className="form-label">Address</label>
              <input type="text" className="form-input" value={patientForm.address} onChange={e => setPatientForm({ ...patientForm, address: e.target.value })} />
            </div>`
);

replaceInFile(
  'client/src/pages/Patients/PatientList.jsx',
  /<div className="form-group">\s*<label className="form-label">Allergies<\/label>[\s\S]*?<\/div>/g,
  ''
);
replaceInFile(
  'client/src/pages/Patients/PatientList.jsx',
  /<div className="form-group">\s*<label className="form-label">Medical History<\/label>[\s\S]*?<\/div>/g,
  ''
);

console.log('Schemas and Patient Registration Form updated successfully!');
