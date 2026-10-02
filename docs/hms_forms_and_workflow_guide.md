# 🏥 HMS V1 — All Forms & Step-by-Step Transition Guide (Hinglish)

> **Document Version:** 1.0  
> **Notice:** Is document me Login form ko include **nahi** kiya gaya hai (jaisa user ne request kiya tha).

---

## 📌 Executive Summary (Total Forms Kitne Hain?)

Aapke pure Healthcare Management System (HMS) me total **13 operational forms** hain. Inhe 5 alag-alag modules me divide kiya gaya hai:

1. **Front-Desk & Registration Forms (3 Forms):** Patient Registration, Appointment Booking, Walk-In Queue Token.
2. **Clinical & Doctor Desk Forms (4 Forms):** Clinical SOAP Notes & Vitals, Dynamic Clinical Exam (Dental Form), Treatment / Procedure Add, Medicine / Rx Add.
3. **Billing & Cashier Forms (2 Forms):** Create Invoice, Receive Payment & Receipt.
4. **Patient Records & Follow-Up Forms (2 Forms):** Upload Medical Document, Schedule Follow-Up.
5. **Administration & Settings Forms (2 Forms):** Add New Branch, Add Service / Rate Catalog.

---

## 🔄 End-to-End Patient Journey Pipeline (Ek Form ke baad Next kisme jata hai?)

Ye diagram dikhata hai ki patient ke clinic me aane se lekar discharge hone tak data ek form se dusre form me kaise aage badhta hai:

```
[Form 1: Patient Registration]
               │
               ▼ (Patient ID ban gaya)
       ┌───────┴────────────────────────┐
       ▼                                ▼
[Form 2: Appointment Form]    [Form 3: Walk-In Queue Form]
       │                                │
       ▼ (Check-In Button dabaya)       ▼ (Token nikla)
┌───────────────────────────────────────────────┐
│        Live OPD Queue (Waiting Room)          │
└──────────────────────┬────────────────────────┘
                       │ (Doctor ne Call kiya → "Start Consultation")
                       ▼
[Form 4: Clinical SOAP Notes & Vitals Form]
                       │
                       ▼
[Form 5: Dynamic Dental Exam Form (Tooth/Gum/Pain)]
                       │
                       ▼
[Form 6: Add Treatment / Procedure Form]
                       │
                       ▼
[Form 7: Add Medicine / Prescription Form]
                       │
                       ▼ (Doctor ne dabaya "Complete Encounter")
┌───────────────────────────────────────────────┐
│          Encounter Finalized / Complete       │
└──────────────────────┬────────────────────────┘
                       │ (Automatic data gaya Billing Counter pe)
                       ▼
[Form 8: Create Invoice Form]
                       │
                       ▼ (Invoice generate hua)
[Form 9: Receive Payment Form (Cash / UPI / Card)]
                       │
                       ▼ (Payment complete & Receipt Print)
       ┌───────────────┴────────────────┐
       ▼                                ▼
[Form 10: Upload Document Form]   [Form 11: Schedule Follow-Up Form]
(X-Ray / Scan attach)             (Agli visit ki date set)
```

---

## 📑 1. Front-Desk & Patient Entry Forms

---

### Form 1: Patient Registration Form
* **Kahan milega:** Patients page par `+ New Patient` button dabane par.
* **Fields kya-kya hain:**
  * Full Name, Phone Number, Age, Gender
  * Blood Group (`A+`, `B+`, `O+`, `AB+`, etc.)
  * Address (Street, City, State, Pincode)
  * Emergency Contact Name & Phone
  * Medical History & Known Allergies (e.g. Penicillin allergy, Diabetes, BP)
* **Submit hone ke baad data next kahan jata hai?**
  * Naya patient ID generate hota hai (e.g. `pat_8353...` with patient number `P0017`).
  * Modal par **3 Quick Actions** aate hain:
    1. **"Book Appointment"** → Turant **Form 2 (Appointment Form)** khol deta hai patient ka naam pre-selected rakhkar.
    2. **"Walk-in Token / Queue"** → Turant **Form 3 (Queue Token Form)** khol deta hai.
    3. **"View Patient 360 Profile"** → Patient ke complete medical record page par le jata hai.

---

### Form 2: Schedule Appointment Form
* **Kahan milega:** Appointments page par `+ Book Appointment` button par, ya Patient Profile page se.
* **Fields kya-kya hain:**
  * Select Patient (Searchable dropdown)
  * Select Doctor / Provider (Available doctors list)
  * Select Service (Consultation, RCT, Cleaning, etc.)
  * Branch Location (Main Branch ya Satellite Branch)
  * Scheduled Date & Time (`datetime-local`)
  * Duration (15, 30, 45, ya 60 minutes)
  * Chief Complaint / Purpose of Visit (e.g. Tooth sensitivity, regular checkup)
* **Submit hone ke baad data next kahan jata hai?**
  * Appointment `scheduled` status ke sath book ho jati hai aur Appointments table me sabse upar **"✨ Just Booked"** badge ke sath dikhti hai.
  * **Agla Action:** Jab patient clinic me physical entry karta hai, receptionist table par maujood **`Check In`** button dabata hai.
  * `Check In` dabate hi background me ek naya **Encounter** banta hai aur patient automatically **Live Queue (Waiting Room)** me chala jata hai!

---

### Form 3: Direct Walk-In Queue Token Form
* **Kahan milega:** Queue page par `+ Walk-In Registration` button par.
* **Fields kya-kya hain:**
  * Select Registered Patient
  * Doctor Assignment
  * Service
  * Priority Level (`Normal`, `Urgent`, `Emergency`)
  * Chief Complaint
* **Submit hone ke baad data next kahan jata hai?**
  * Naya live token number generate hota hai (e.g. `T-101`, `T-102`).
  * Patient live **OPD Queue Board** me `waiting` status ke sath add ho jata hai.
  * **Agla Action:** Doctor apne cabin se patient ko **"Call Patient"** karega aur fir **"Start Consultation"** dabayega, jisse seedha **Clinical Workspace (Doctor Desk)** open ho jata hai.

---

## 🩺 2. Clinical & Doctor Desk Forms (Consultation Room)

Jab doctor patient ko cabin me bulata hai (`Start Consultation`), tab ye forms use hote hain:

---

### Form 4: Clinical SOAP Notes & Vitals Form
* **Kahan milega:** Clinical Workspace (`/clinical/encounters/:id`).
* **Fields kya-kya hain:**
  * **Vitals:** Blood Pressure (BP), Pulse Rate, Temperature (°F), SpO2 (Oxygen %), Weight (Kg).
  * **Subjective:** Patient ki zubani takleef (Chief Complaint, Symptoms).
  * **Objective:** Doctor ka physical examination aur clinical findings.
  * **Assessment:** Doctor ka provisional diagnosis (e.g. Acute Pulpitis, Dental Caries).
  * **Plan:** Aage ka ilaj aur treatment schedule.
* **Submit hone ke baad data next kahan jata hai?**
  * Ye data `ClinicalRecord` me draft ya finalized form me save hota hai. Iske turant baad doctor niche maujood **Dynamic Dental Form (Form 5)** aur **Treatment Form (Form 6)** fill karta hai.

---

### Form 5: Dynamic Dental Clinical Examination Form
* **Kahan milega:** Clinical Workspace me "Specialty Dynamic Forms" section ke andar.
* **Fields kya-kya hain (Configurable Schema):**
  * Involved Tooth Number (FDI Notation: e.g. 16, 21, 36, 46)
  * Pain Severity Level (Mild, Moderate, Severe Throbbing, No Pain)
  * Sensitivity Trigger (Cold, Hot, Sweet, Chewing Pressure)
  * Cavities / Caries Detected? (Yes/No switch)
  * Gingival / Gum Condition (Healthy & Pink, Mild Gingivitis, Moderate Periodontitis, Severe Pockets)
  * Tooth Mobility (Grade 0, Grade I, Grade II, Grade III)
* **Submit hone ke baad data next kahan jata hai?**
  * `FormSubmission` table me save hota hai aur patient ke clinical history card me permanently jud jata hai.

---

### Form 6: Add Treatment / Procedure Form
* **Kahan milega:** Clinical Workspace me "Treatments & Procedures" card ke andar `+ Add Treatment` button.
* **Fields kya-kya hain:**
  * Select Procedure / Service (e.g. Single Sitting RCT, Composite Filling, Scaling)
  * Tooth / Site (e.g. Tooth #36)
  * Unit Price / Fees (Catalog se auto-fill hoti hai, doctor change bhi kar sakta hai)
  * Discount % (Agar doctor discount dena chahe)
  * Clinical Notes
* **Submit hone ke baad data next kahan jata hai?**
  * Treatment list me save hota hai.
  * **Khas Baat:** Ye record system me **Pending Charges** ke roop me record ho jata hai taaki jab patient counter par jaye to cashier ko pata ho ki doctor ne kya-kya ilaj kiya hai!

---

### Form 7: Add Medicine / Prescription Form
* **Kahan milega:** Clinical Workspace me "Prescription & Medications" card me `+ Add Medicine` button.
* **Fields kya-kya hain:**
  * Medicine Name (e.g. Amoxicillin 500mg, Ketorol DT, Zerodol-SP)
  * Dosage (e.g. 1 Tablet)
  * Frequency (1-0-1, 1-1-1, BD, TDS, Once Daily)
  * Duration in Days (e.g. 3 Days, 5 Days)
  * Timing & Instructions (After Food / Empty Stomach, Warm Water Gargle)
* **Submit hone ke baad data next kahan jata hai?**
  * Prescription table me medicine jud jati hai.
  * **Next Transition (Encounter Finish):** Doctor **"Complete Encounter & Finalize"** button dabata hai.
  * Jaise hi ye click hota hai:
    1. Patient ka Queue token `completed` ho jata hai.
    2. Consultation session lock ho jata hai.
    3. Patient ka data seedha **Billing Counter (Accounts Desk)** par transfer ho jata hai!

---

## 💰 3. Billing & Cashier Forms (Accounts Counter)

---

### Form 8: Create Invoice Form
* **Kahan milega:** Billing page par `+ Create Invoice` button dabane par.
* **Fields kya-kya hain:**
  * Select Patient
  * Doctor / Attending Provider
  * Line Items (Services, Doctor Consultation Fee, Treatment charges, Medicine charges)
  * Item Price & Quantity
  * Discount (₹ Amount ya %)
  * Tax / GST %
  * Due Date
  * Billing Notes
* **Submit hone ke baad data next kahan jata hai?**
  * Official Invoice banta hai (e.g. `INV-2026-0045`) status `unpaid` ke sath.
  * **Next Transition:** Invoice create hote hi screen par turant **Form 9 (Receive Payment Modal)** automatically pop-up ho jata hai taaki cashier ko alag se dhundna na pade!

---

### Form 9: Receive Payment & Receipt Form
* **Kahan milega:** Invoice create hone par automatically, ya kisi bhi invoice ke samne `Receive Payment` dabane par.
* **Fields kya-kya hain:**
  * Invoice Number (Pre-selected)
  * Total Outstanding Amount vs Paying Amount (Partial payment ka support hai)
  * Payment Method (`Cash`, `UPI / QR Code`, `Debit/Credit Card`, `Bank Transfer`, `Cheque`)
  * Transaction / UTR Reference Number (UPI ya card swipe ke liye)
  * Notes / Remarks
* **Submit hone ke baad data next kahan jata hai?**
  * Payment successfully record hoti hai.
  * Invoice status `paid` me badal jata hai.
  * System automatically **Official Receipt (`REC-...`)** generate karta hai.
  * Screen par **"Print Receipt / Thermal Print"** ka button aa jata hai jo patient ko dene ke liye print ho sakta hai.

---

## 📁 4. Documents & Follow-Up Forms

---

### Form 10: Upload Medical Document Form
* **Kahan milega:** Documents page par `+ Upload Document` button par.
* **Fields kya-kya hain:**
  * Select Patient
  * Document Title (e.g. OPG X-Ray Pre-Op, Blood Sugar Test Report)
  * Category (`X-Ray Scan`, `Lab Report`, `Prescription Scan`, `Insurance / ID Card`, `Consent Form`)
  * File / Document URL
  * Doctor/Staff Remarks
* **Submit hone ke baad data next kahan jata hai?**
  * Document patient ke digital locker me save ho jata hai aur **Patient 360 Profile** me hamesha ke liye link ho jata hai. Doctor consultation ke waqt ise kabhi bhi zoom karke dekh sakta hai.

---

### Form 11: Schedule Follow-Up Form
* **Kahan milega:** Documents & Follow-ups page par `+ Schedule Follow-up` button par.
* **Fields kya-kya hain:**
  * Select Patient
  * Follow-up Target Date
  * Assigned Doctor
  * Reason / Follow-up Purpose (e.g. Cap fitting, Suture removal, Check healing)
  * Priority (`Normal`, `Medium`, `High`)
* **Submit hone ke baad data next kahan jata hai?**
  * Follow-up list me save hota hai.
  * **Next Transition:** Jab follow-up ki date aati hai, staff follow-up list me maujood **"Book Appointment"** button daba sakta hai, jo wapas **Form 2 (Appointment Form)** ko saari purani details ke sath auto-fill karke open kar deta hai!

---

## ⚙️ 5. Administration Forms (Clinic Setup)

---

### Form 12: Add Hospital Branch Form
* **Kahan milega:** Administration Hub (`/admin`) me `Organization & Branches` tab ke andar `+ Add Branch` button.
* **Fields kya-kya hain:** Branch Name, Branch Code, Phone, Email, Street Address, City.
* **Submit hone ke baad data next kahan jata hai?**
  * Nayi branch database me save hoti hai aur pure software ke top header branch-switcher me live reflect hone lagti hai.

---

### Form 13: Add Service & Price Catalog Form
* **Kahan milega:** Administration Hub (`/admin`) me `Services Catalog` tab me `+ Add Service` button.
* **Fields kya-kya hain:** Service Name, Service Code, Category, Standard Duration (Minutes), Price (₹).
* **Submit hone ke baad data next kahan jata hai?**
  * Nayi service catalog me add hoti hai aur turant **Appointment Booking (Form 2)** ke dropdown me aur **Doctor Treatment Desk (Form 6)** me select karne ke liye available ho jati hai.

---

## 📊 Summary Table: Kisme Kya Bharna Hai & Kahan Jana Hai

| # | Form Ka Naam | Kahan Khulta Hai? | Submit Ke Baad Kahan Jata Hai? |
| :---: | :--- | :--- | :--- |
| **1** | **Patient Registration** | Patients List (`+ New Patient`) | Patient ID generate hota hai → Option deta hai Appointment ya Walk-in token lene ka. |
| **2** | **Book Appointment** | Appointments (`+ Book Appointment`) | Appointment calendar me aati hai → `Check In` dabate hi Live Queue me chali jati hai. |
| **3** | **Walk-In Queue** | Queue (`+ Walk-In Registration`) | Token generate hota hai → Patient Waiting Queue me add ho jata hai. |
| **4** | **SOAP Notes & Vitals** | Doctor Cabin (`Clinical Workspace`) | Clinical Record me save hota hai → Doctor niche Exam form bharta hai. |
| **5** | **Dynamic Dental Exam** | Doctor Cabin (`Clinical Workspace`) | Tooth & Gum diagnosis save hota hai → Treatment section me jata hai. |
| **6** | **Add Treatment** | Doctor Cabin (`+ Add Treatment`) | Treatment procedure record hota hai → Billing counter par unbilled charge banta hai. |
| **7** | **Add Medicine (Rx)** | Doctor Cabin (`+ Add Medicine`) | Prescription me add hota hai → Doctor "Complete" dabate hi case Billing me transfer hota hai. |
| **8** | **Create Invoice** | Billing Counter (`+ Create Invoice`) | Invoice banta hai → Automatically Receive Payment (Form 9) open ho jata hai. |
| **9** | **Receive Payment** | Billing Counter (`Receive Payment`) | Payment confirm hoti hai → Official Receipt print karne ka option aata hai. |
| **10**| **Upload Document** | Documents Page (`+ Upload Document`) | Patient ke 360 profile locker me file permanently jud jati hai. |
| **11**| **Schedule Follow-Up** | Documents Page (`+ Schedule Follow-up`)| Follow-up diary me add hota hai → Date aane par Appointment me convert hota hai. |
| **12**| **Add Branch** | Admin Hub (`+ Add Branch`) | Nayi branch live ho jati hai aur top header switch me aa jati hai. |
| **13**| **Add Service Catalog**| Admin Hub (`+ Add Service`) | Naya ilaaj aur fees set hoti hai → Booking aur billing me turant dikhne lagti hai. |

---
*Ye complete guide aapke workspace me [hms_forms_and_workflow_guide.md](file:///c:/Users/rajat/Desktop/hms/docs/hms_forms_and_workflow_guide.md) pe save kar di gayi hai.*
