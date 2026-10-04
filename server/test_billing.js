require('dotenv').config();
const mongoose = require('mongoose');
const { Encounter, Invoice, Treatment, Patient } = require('./src/models');
const ClinicalController = require('./src/controllers/ClinicalController');
const { generateId } = require('./src/utils/idGenerator');

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nxclinic');
  console.log('Connected to DB');

  const orgId = 'org_001'; // Default
  const branchId = 'br_001';
  
  // 1. Create a dummy patient
  const patient = await Patient.create({
    patientId: generateId('patient'),
    organizationId: orgId,
    branchId: branchId,
    name: 'Test Patient Billing',
    phone: '9999999999'
  });

  // 2. Create a dummy encounter
  const encounter = await Encounter.create({
    encounterId: generateId('encounter'),
    organizationId: orgId,
    branchId: branchId,
    patientId: patient.patientId,
    providerId: 'staff_1',
    status: 'active'
  });

  console.log('Encounter created:', encounter.encounterId);

  // 3. Fake req/res for adding treatment
  const reqAdd = {
    organizationId: orgId,
    user: { userId: 'u1', name: 'Tester' },
    body: {
      encounterId: encounter.encounterId,
      name: 'Root Canal',
      cost: 5000
    }
  };
  
  let resData = null;
  const resAdd = {
    status: (s) => ({ json: (d) => { resData = d; } }),
    json: (d) => { resData = d; }
  };
  
  await ClinicalController.addTreatment(reqAdd, resAdd, console.error);
  console.log('Treatment added:', resData.success);

  // 4. Fake req/res for complete encounter (Waive fee = false)
  const reqComplete = {
    organizationId: orgId,
    user: { userId: 'u1', name: 'Tester' },
    params: { id: encounter.encounterId },
    body: { waiveConsultationFee: false }
  };

  let completeData = null;
  const resComplete = {
    status: (s) => ({ json: (d) => { completeData = d; } }),
    json: (d) => { completeData = d; }
  };

  await ClinicalController.completeEncounter(reqComplete, resComplete, console.error);
  console.log('Encounter completed. Status:', completeData.success);

  // 5. Check invoice
  const invoice = await Invoice.findOne({ encounterId: encounter.encounterId });
  console.log('\n--- INVOICE RESULTS ---');
  console.log('Items Count:', invoice.items.length);
  console.log('Subtotal:', invoice.subtotal);
  invoice.items.forEach(i => console.log(` - ${i.description}: ${i.total}`));
  
  process.exit(0);
}

runTest().catch(console.error);
