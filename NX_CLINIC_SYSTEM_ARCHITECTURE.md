# NX Clinic OS — System Architecture, Business Logic & End-to-End Workflow

> **Document Type:** Complete Technical & Functional Architecture Specification  
> **Platform Name:** NX Clinic (Dynamic Multi-Branch Healthcare & OPD Operating System)  
> **Tech Stack:** React (Vite, Vanilla CSS Design System), Node.js, Express, MongoDB (Mongoose), IndexedDB/Service Worker (Offline Sync Engine)

---

## 1. Executive Summary & Core Philosophy

**NX Clinic** is an enterprise-grade, multi-tenant, multi-branch Clinic & Healthcare Management Operating System built specifically for Single & Multi-Specialty OPDs, Dental Clinics, Diagnostics, and Hospital Branches.

### Key Architectural Pillars:
1. **Single Organization, Multiple Autonomous Branches:**
   - One parent organization can manage multiple physical branches (e.g., *Main City Centre*, *Arera Colony*, etc.).
   - Strict data isolation per branch when operating inside a branch, with a unified **Overall (All Branches)** view for Organization Owners / Head Admins.
   - Each branch can customize its own clinic name, letterhead tagline, registration number, GST/Tax numbers, and address on bills and prescriptions.
2. **Unified Patient Identity & Longitudinal Medical Record (LMR):**
   - Patients registered at any branch share a single organization-level profile (`P0001`, `P0002`...).
   - When a patient visits after 10 days, 6 months, or at another branch, the doctor sees their entire historical timeline: past vitals, chief complaints, prescriptions (Rx), treatments done, previous bills, and follow-ups.
3. **Real-time Live Token & Queue Automation:**
   - Reception can register a Walk-In and generate an instant token, or Schedule an Appointment.
   - Live doctor calling, status synchronization (`waiting` → `called` → `in_consultation` → `completed`), and automatic transition into Billing.
4. **Dynamic Clinical Configuration:**
   - Fully customizable **Clinical Vitals & Triage Parameters** (BP, Pulse, Temp, SpO2, RBS, Custom units/thresholds) with realtime binding in doctor workspace.
   - Dynamic Form schema engine for specialty assessments (Dental FDI notation charts, etc.).
5. **Modern Minimal UI Design System:**
   - Built on the sleek **NX Palette** (Primary Black `#000000`, Dark Surface `#0A0A0A`, Page Background `#F8F9FB`, Card Background `#FFFFFF`, Input BG `#F1F5F9`, Status Accents: `#22A05A`, `#E58A45`, `#8B5CF6`, `#3B82F6`).
   - Collapsible **Sidebar Shutter** with preference persistence (`localStorage`).

---

## 2. Complete End-to-End Patient Flow

Below is the linear, step-by-step patient lifecycle in NX Clinic:

```
[1. LOGIN / AUTH]
       ↓
[2. PATIENT SEARCH / REGISTRATION] (Duplicate Mobile Check TC-06)
       ↓
[3. ROUTING: APPOINTMENT vs. WALK-IN] (Doctor Slot Conflict Check TC-12)
       ↓
[4. CHECK-IN & LIVE QUEUE TOKEN GENERATION]
       ↓
[5. LIVE QUEUE / CALLING]
       ↓
[6. DOCTOR CONSULTATION WORKSPACE]
   ├─ View Longitudinal Previous Visit History (Multi-Visit Navigator)
   ├─ Capture Patient Symptoms & Chief Complaint
   ├─ Record Configurable Live Clinical Vitals (BP, Pulse, Temp, SpO2, Weight)
   ├─ Document Primary Diagnosis & Clinical Examination Notes
   ├─ Add Procedures / Treatments (Auto-fee calculation)
   ├─ Prescribe Medicines (Rx: Dosage, Frequency, Duration, Instructions)
   └─ Schedule Follow-Up Date & Reason
       ↓
[7. COMPLETE ENCOUNTER & VISIT]
       ↓
[8. AUTO-BILLING & INVOICE GENERATION]
       ↓
[9. PAYMENT COLLECTION & RECEIPT] (Cash / UPI / Card / Split / Advance)
       ↓
[10. SUBSEQUENT VISIT (10 Days / Future)]
   ├─ Search Patient by Phone / ID
   ├─ Instant New Visit Initialization
   └─ Complete Past Clinical Records Visible to Doctor
```

---

## 3. Detailed Stage-by-Stage Business Logic

### Stage 1: Role-Based Authentication & Branch Switching
- **Roles in System:**
  - `admin` (Organization Admin / Super Admin)
  - `branch_admin` (Branch Incharge / Manager)
  - `doctor` (Consultant Physician / Surgeon)
  - `receptionist` (Front Desk / Registration / Appointment Desk)
  - `billing_staff` (Cashier / Accounts)
- **Branch Scope:**
  - Active branch is stored in JWT / request headers (`x-branch-id`).
  - Switching branch dynamically reloads all live queues, appointment filters, services catalog, and staff lists without logging out.

### Stage 2: Patient Registration & Existing Patient Detection (TC-06)
- **Search-First Pattern:** Front desk searches by 10-digit mobile number, patient name, or Patient ID (`P0001`).
- **Duplicate Prevention:**
  - If a patient with the same mobile number already exists in the organization, server rejects duplicate creation with HTTP `409` (`PATIENT_ALREADY_EXISTS`).
  - UI triggers an alert modal: **"⚠️ Existing Patient Found"** showing full profile details and providing a direct 1-click button: **"Open Patient Profile"** to begin a visit instead of creating redundant records.

### Stage 3: Appointments & Doctor Slot Scheduling (TC-12)
- **Overlapping Slot Conflict Engine:**
  - When scheduling or rescheduling an appointment for Doctor $X$ at time $T$, the system validates against existing active appointments (`scheduled`, `confirmed`, `checked_in`, `in_consultation`).
  - If occupied, returns HTTP `409` (`DOCTOR_SLOT_CONFLICT`) preventing double-booking.
- **Reschedule / Postpone Feature:**
  - Provides date + time-slot picker with quick postponement presets (+1 Day, +3 Days, Next Week).
- **Cancellation Reason Logging:**
  - Cancelling requires a reason (presets: *Patient request*, *Doctor unavailable*, *Emergency*, *Duplicate* + custom notes) stored permanently on the appointment record.

### Stage 4: Live Queue & Token Dispensation
- Generates sequential daily tokens (e.g. `T-01`, `T-02`, `W-01`).
- Allows priority routing (`Normal`, `Urgent / Acute Pain`, `Senior Citizen / Priority`).
- Supports Walk-In advance billing (advance fee collection at reception) or pay-after-consultation mode.

### Stage 5: Doctor Clinical Workspace
The Doctor Workspace is built as a high-density, 2-column split interface:
1. **Left Column (Longitudinal Medical History):**
   - Past visits navigator (`Visit #1`, `Visit #2`, `Visit #3...`).
   - Shows past consulting doctor, date, previous chief complaints, old vitals, past procedures, previous Rx prescription items, past bills, and follow-up notes.
2. **Right Column (Active Consultation Entry):**
   - **Chief Complaint / Symptoms:** Pre-filled from reception triage or edited by doctor.
   - **Patient Vitals Examination:** Rendered dynamically from the database (`VitalParam` collection) with unit labels and normal reference ranges.
   - **Diagnosis & Clinical Notes:** Primary diagnosis and detailed examination observations.
   - **Procedures / Treatments:** Catalog selection with auto pricing or custom procedure pricing.
   - **Prescription (Rx):** Structured medicine items (`medicineName`, `dosage`, `frequency`, `duration`, `timing`, `instructions`) with 1-click additions.
   - **Follow-Up Planner:** Target follow-up date and clinical reason.
   - **Real-Time Auto-Save:** Debounced background draft saving (800ms) ensuring zero data loss if browser is refreshed.

### Stage 6: Billing, Invoicing & Payments
- Automatically compiles:
  $$\text{Total Invoice} = \text{Doctor Consultation Fee} + \sum \text{Procedures/Services} - \text{Discount}$$
- Tracks payment modes (`cash`, `upi`, `card`, `bank_transfer`) with transaction/UTR references.
- Supports Partial Payments (`balance` tracked on patient ledger) and Advance Adjustments.
- Generates Printable Official Medical Receipts and Prescriptions with dynamic branch letterheads.

---

## 4. Database Schema Matrix (Core MongoDB Models)

| Model Name | Key Fields | Purpose |
| :--- | :--- | :--- |
| **`Organization`** | `organizationId`, `name`, `code`, `type`, `settings` | Root multi-tenant entity. |
| **`Branch`** | `branchId`, `organizationId`, `name`, `code`, `tagline`, `phone`, `address`, `clinicHeaderNote`, `clinicFooterNote` | Physical clinic location & letterhead identity. |
| **`User` / `Role`** | `userId`, `email`, `password`, `roleIds`, `branchId`, `permissions` | RBAC security & authentication matrix. |
| **`Patient`** | `patientId`, `patientNumber`, `name`, `phone`, `age`, `gender`, `allergies`, `balance`, `lastVisitAt` | Unified longitudinal patient repository. |
| **`Appointment`** | `appointmentId`, `patientId`, `providerId`, `scheduledStart`, `scheduledEnd`, `status`, `cancellationReason` | Scheduled visits & doctor calendar slots. |
| **`QueueEntry`** | `queueEntryId`, `tokenNumber`, `patientId`, `providerId`, `priority`, `status`, `calledAt` | Live OPD reception token queue. |
| **`Encounter`** | `encounterId`, `patientId`, `providerId`, `status`, `paymentStatus`, `caseType` | Single clinical visit session container. |
| **`ClinicalRecord`** | `clinicalRecordId`, `encounterId`, `patientId`, `vitals` (Map/Object), `complaint`, `diagnosis`, `notes` | Doctor clinical consultation findings. |
| **`VitalParam`** | `vitalParamId`, `name`, `key`, `unit`, `normalRange`, `minVal`, `maxVal`, `inputType`, `isMandatory`, `category`, `status` | Configurable physiological vitals catalog. |
| **`Prescription`** | `prescriptionId`, `encounterId`, `items`: `[{ medicineName, dosage, frequency, duration, timing, instructions }]` | Medical prescription record. |
| **`Invoice` / `Payment`** | `invoiceId`, `patientId`, `items`, `subtotal`, `discount`, `total`, `paidAmount`, `balance`, `status` | Financial billing & cashiering ledger. |
| **`FollowUp`** | `followUpId`, `patientId`, `providerId`, `scheduledDate`, `reason`, `status`, `cancellationReason` | Post-visit patient follow-up tracker. |

---

## 5. UI / UX Design Specifications

- **Color Tokens (NX Palette):**
  - Brand Black: `#000000` | Dark Surface: `#0A0A0A` | Dark Gray: `#1F1F1F` | Brand Gray: `#6B7280`
  - Page Background: `#F8F9FB` | Card Surface: `#FFFFFF` | Border: `#E5E7EB` | Input BG: `#F1F5F9`
  - Status Accents: Success `#22A05A`, Warning `#E58A45`, Pending `#8B5CF6`, Info `#3B82F6`
- **Responsive Layout:**
  - Sidebar with shutter button (`PanelLeftClose` / `PanelLeftOpen`) toggles between 260px expanded mode and 72px icon-only compact mode.
  - Tables equipped with custom horizontal scrollbars for zero text-wrap degradation on compact screens.

---

## 6. Summary for AI / Developers

NX Clinic is structured as an **Event-Driven, Multi-Tenant Healthcare Enterprise Monorepo**:
- **Backend Entry:** `server/src/index.js` → `server/src/routes/index.js`
- **Controllers:** `server/src/controllers/` (REST API with RBAC & tenant middleware)
- **Frontend Entry:** `client/src/App.jsx` → `client/src/components/Layout.jsx`
- **State & Context:** `AuthContext.jsx`, `ToastContext.jsx`, `OfflineSyncContext.jsx`
- **Design Tokens:** `client/src/index.css`
