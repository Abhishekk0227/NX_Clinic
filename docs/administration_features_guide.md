# 🏥 HMS V1 — Administration Hub (Complete Hinglish Guide)

> **Document Version:** 1.0  
> **Location:** `/admin` (Left Sidebar me "Administration" button)  
> **Access Requirement:** Sirf `Administrator` role ya jinke paas `admin.manage` permission ho.

---

## 📌 Executive Summary (Admin Hub Kya Hai?)

**Administration Hub** aapke poore Healthcare Management System (HMS) ka **Main Control Room** hai. Yahan se aap clinic ki saari branches, doctors aur staff ke accounts, kis staff ko kya permission deni hai (RBAC), OPD aur ilaaj ke rates, custom clinical forms, workflows, aur security audit logs ko ek hi jagah se manage kar sakte hain.

---

## 📑 Admin Hub Ke 7 Main Modules (Key Tabs)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM ADMINISTRATION HUB                            │
├────────────┬────────────┬────────────┬────────────┬───────────┬──────────────┤
│ 1. Org &   │ 2. Staff & │ 3. Roles & │ 4. Service │ 5. Dynamic│ 6. Workflows │
│   Branches │   Users    │   RBAC     │   Catalog  │   Forms   │ 7. Audit Logs│
└────────────┴────────────┴────────────┴────────────┴───────────┴──────────────┘
```

---

## 🏢 1. Organization & Branches (Hospital & Clinic Branches Setup)

Is tab ke andar aapke main hospital/clinic aur uski alag-alag branches ki saari settings hoti hain.

### Isme kya-kya ho sakta hai:
1. **Organization Profile dekhna aur manage karna:**
   - **Clinic Name:** Jaise *Apex Multi-Specialty Dental & Health Care*.
   - **Organization Code:** System ka unique identifier code (jaise: `APEX`).
   - **Facility Type:** Clinic kis type ka hai (`dental_clinic`, `polyclinic`, `hospital`, `general_practice`).
   - **Tax/GSTIN Number:** Bills aur Invoices pe print hone wala tax number.
   - **Base Currency:** Billing ki default currency (jaise: `INR ₹`).
   - **Contact Details:** Email, official phone number, aur registered address.

2. **Multi-Branch Network:**
   - **Main Branch vs Other Branches:** Kaunsi branch main hospital hai aur kaunsi satellite branch/clinic hai.
   - **Branch Details:** Har branch ka unique `branchId`, naam, branch code, address, city aur phone number.
   - **"+ Add Branch" Button:** Ek click me nayi branch add kar sakte hain. Form fill karte hi naya branch database me instantly live ho jata hai.
   - **Branch-Level Isolation:** Har branch ka data (Patients, Appointments, Queue Tokens, Billing) independently filter hota hai. Top header se branch switch karte hi pura portal usi branch ke context me chalne lagta hai.

3. **Departments (Vibhag):**
   - Departments create aur link karna (jaise: Endodontics, Orthodontics, Oral Surgery, Reception, Cashier Desk).

---

## 👥 2. Staff & User Accounts (Doctors, Staff & Logins)

Is section me do layers ka setup hota hai: **Clinical Doctors/Staff Registry** aur **System Login Accounts**.

### A. Staff & Doctor Registry (Doctors aur Medical Staff):
- **Doctor ka Full Name:** Jaise *Dr. Vikramaditya Rao*.
- **Designation & Specialty:** Senior Consultant, Dental Surgeon, Orthodontist, Staff Nurse waghera.
- **Medical License Number:** State medical council ya dental council registration number.
- **Consultation Fee (OPD Fees):** Har doctor ki apni fees (jaise: ₹400, ₹800, ₹1500). Jab bhi koi patient is doctor ka appointment book karega ya walk-in token lega, to invoice me ye fees automatically calculate ho jayegi.
- **Status:** Active / Inactive / On-Leave.

### B. System User Accounts (Software Login Credentials):
- **New User Creation:** Naye staff ke liye login account banana (Name, Email, Phone, Password).
- **Password Hashing:** Passwords secure bcrypt hashing ke sath encrypted rehte hain.
- **Role Binding:** Staff ko role assign karna (Admin, Doctor, Receptionist, Cashier).
- **Branch Binding:** User kis branch me kaam karega (Main City Center ya Arera Branch).
- **Activity & Security:** User ka `lastLogin` timestamp track hota hai taaki pata chale kaunsa staff kab online tha.

---

## 🔐 3. Roles & RBAC Matrix (Permissions & Security)

Yahan se control hota hai ki software me **kaun kya dekh sakta hai aur kya edit kar sakta hai**. Isse data leak ya galat billing hone ka khatra khatam ho jata hai.

### A. Built-in Roles (Default Roles):
| Role Name | Key | Description | Kya-Kya Access Hai |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | Clinic Owner / Super Admin | Pura system, sabhi branches, settings, accounts, aur reports ka full control. |
| **Doctor / Specialist** | `doctor` | Consulting Doctor | Sirf OPD queue, patient clinical history, dental chart, aur prescription likhne ka access. |
| **Front Desk Receptionist**| `receptionist`| Counter Staff | Naye patient register karna, appointment schedule karna, aur queue token nikalna. |
| **Billing / Cashier** | `billing` | Accountant / Cashier | Invoices banana, payment lena (Cash/UPI/Card), aur receipt print karna. |

### B. Granular Permissions (Chhoti-Badi Saari Permissions):
- **Patients:** `patients.view`, `patients.create`, `patients.edit`, `patients.archive`
- **Appointments:** `appointments.view`, `appointments.create`, `appointments.edit`, `appointments.cancel`
- **Queue (OPD Tokens):** `queue.view`, `queue.manage` (Call next patient, start consultation, complete, skip)
- **Clinical (Doctor Desk):** `clinical.view`, `clinical.create`, `clinical.edit`
- **Billing & Money:** `billing.view`, `billing.create`, `billing.edit`, `payment.view`, `payment.create`, `payment.verify`, `payment.refund`
- **Documents:** `documents.view`, `documents.create`
- **Reports:** `reports.view`, `reports.export` (Revenue aur Clinical analytics download karna)
- **Admin Settings:** `admin.manage`, `settings.manage`

---

## 💊 4. Services Catalog & Pricing Engine (Ilaaj ke Rates & Duration)

Clinic ke andar jitne bhi treatments, procedures, x-rays ya tests hote hain, unki official rate-list yahan set hoti hai.

### Isme kya-kya ho sakta hai:
1. **Service Master Catalog:**
   - **Service Code:** Short code (jaise: `DENT-CONSULT`, `DENT-RCT`, `DENT-CLEAN`, `DENT-BRACES`).
   - **Service Name:** Full procedure name (jaise: *Root Canal Treatment (RCT - Rotary)*).
   - **Category:** Consultation, Dental, Procedure, Surgery, Diagnostics.
   - **Standard Duration (Minutes):** Us ilaaj me lagbhag kitna time lagta hai (jaise: 15 min, 30 min, 45 min). Jab appointment book karenge to calendar slot automatically utne time ka banega.
   - **Price (₹):** Standard fees (jaise: ₹3,500). Treatment plan aur invoice me yahi amount automatically fill ho jata hai.
   - **Status:** Active / Inactive.
2. **"+ Add Service" Button:**
   - Naya treatment package ya rate add karna jo instantly appointment dropdown, patient treatment sheet, aur billing invoice me available ho jata hai.

---

## 📋 5. Dynamic Forms Engine (Custom Clinical Forms)

Bina kisi developer ya code change ke, clinic ke alag-alag departments ke liye naye medical forms aur checklists taiyar karna.

### Isme kya-kya ho sakta hai:
- **Schema-Driven Engine:** Forms JSON format me save hote hain aur screen par sundar input form ban jate hain.
- **Supported Fields:** Text, Number, Multi-line notes, Dropdown selects, Date-pickers, Checkboxes, aur Radio buttons.
- **Multi-Section Forms:** Form ke alag-alag sections (jaise: *General Medical History*, *Oral Hygiene Status*, *Previous Surgeries*, *Allergies*).
- **Versioning (`v1`, `v2`...):** Agar aap 6 mahine baad form me koi naya sawal add karte hain, to purane patients ka data corrupt nahi hota aur naye patients ke liye naya version open hota hai.
- **Default Forms:**
  - Dental Examination & Odontogram Form (`dental_exam_v1`)
  - General Medical History Intake Form (`general_history_v1`)

---

## 🔄 6. Configurable Workflows (Patient Pipeline SOPs)

Patient ke clinic aane se lekar discharge hone tak ke steps ka digital workflow.

### Flow Example:
```
1. Patient Check-In (Aamad darj)
     ↓
2. Token Queue (Live Token issue hua)
     ↓
3. Doctor Consultation (Doctor ne check kiya & prescription likha)
     ↓
4. Treatment / Procedure (RCT / Cleaning / X-Ray kiya gaya)
     ↓
5. Billing & Payment (Cash / UPI payment receive hua)
     ↓
6. Discharge & Next Follow-Up (Follow-up date set hui)
```
- Har step ka status track hota hai (`pending` → `in_progress` → `completed`).

---

## 🛡️ 7. Security Audit Trail (Activity & Forensic Logs)

Clinic ke data ki safety ke liye system me hone wali **har single activity ka time-stamped proof** record hota hai. Is log ko koi bhi delete ya tamper nahi kar sakta.

### Isme kya record hota hai:
- **Timestamp:** Exact date aur time (jaise: `29/09/2026, 11:15 AM`).
- **Actor:** Kis doctor ya receptionist ne ye action kiya (jaise: *Dr. Vikramaditya Rao*).
- **Action Performed:** Action code (jaise: `APPOINTMENT_CREATE`, `PATIENT_REGISTER`, `PAYMENT_RECEIVED`, `STATUS_CHANGE`).
- **Entity Type & ID:** Kis patient ID, appointment ID ya invoice ID par kaam hua.
- **Reason / Details:** Action ka summary (jaise: *Checked-in appointment for patient Rajesh Kumar*).

---

## 🎯 Summary: Admin Kya-Kya Kar Sakta Hai?

| Feature | Admin Action | Faayda |
| :--- | :--- | :--- |
| **Nayi Branch Kholna** | `+ Add Branch` button click karein | Naye clinic ka pura setup bina software reinstall kiye ready |
| **Naye Doctor/Staff Add Karna** | Staff Registry me doctor profile & consultation fee set karein | OPD booking aur billing me doctor ka naam & fees auto-fill |
| **Receptionist/Cashier ko Login Dena** | User Accounts me jaakar email, password aur role dein | Staff apne-apne login se access kar sakega |
| **Rates Update Karna / Naya Ilaaj Jodna**| Service Catalog me price aur duration set karein | Invoicing aur appointments me nayi rates turant apply |
| **Security Track Karna** | Audit Logs me jaakar check karein kisne kya change kiya | Pura control aur zero fraud risk |

---
*Ye file aapke workspace me [administration_features_guide.md](file:///c:/Users/rajat/Desktop/hms/docs/administration_features_guide.md) pe save kar di gayi hai.*
