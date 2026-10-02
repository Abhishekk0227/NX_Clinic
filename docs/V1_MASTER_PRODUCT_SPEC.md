Text To Word

# V1 MASTER PRODUCT SPECIFICATION

# Healthcare Business Management System — V1

Document Type: Master Product SpecificationVersion: V1Purpose: Product/UI/UX/business behavior source of truthTarget: Single Doctor → Clinic → Dental Clinic → Multi-doctor Clinic → Nursing Home → Diagnostic Centre → Specialty Centre → HospitalFuture Compatibility: V2 + V3 compatible by design

---

# 0. DOCUMENT RULE

This document defines WHAT V1 is, WHAT the user sees, WHAT the user can do, WHERE the user goes, WHAT each screen contains, WHAT forms exist, WHAT actions are available, HOW modules connect from the user's perspective, and HOW the product dynamically adapts to different organizations, roles, branches, services, forms and workflows.

This document does NOT define detailed MongoDB schema, backend implementation, code structure or development phases. Those belong to:

- 

V1_MASTER_PRODUCT_SPEC

- 

V1_TECHNICAL_ARCHITECTURE

- 

V1_IMPLEMENTATION_PLAN

Source-of-truth hierarchy:

`
MASTER PRODUCT SPEC
        ↓
TECHNICAL ARCHITECTURE
        ↓
IMPLEMENTATION PLAN
        ↓
CODE
        ↓
TESTS

`

If implementation conflicts with this specification, implementation must be corrected rather than silently changing the product behavior.

---

# 1. V1 PRODUCT GOAL

V1 must be a complete, usable healthcare business operating system.

V1 is NOT merely:

- 

patient register

- 

appointment software

- 

billing software

- 

doctor notes software

It is one connected system covering:

`
Business Setup
      ↓
Users / Roles / Permissions
      ↓
Patient
      ↓
Appointment / Walk-in
      ↓
Queue
      ↓
Encounter
      ↓
Consultation
      ↓
Dynamic Clinical Record
      ↓
Treatment / Prescription
      ↓
Billing
      ↓
Payment
      ↓
Receipt
      ↓
Documents
      ↓
Follow-up
      ↓
Notifications
      ↓
Reports / Audit

`

This is the core V1 business loop.

---

# 2. V1 TARGET USERS

The same V1 product must support:

`
1. Single Doctor / Small Clinic
2. General Clinic
3. Dental Clinic
4. 2–5 Doctor Clinic
5. 10–50 Doctor Clinic
6. Nursing Home
7. Diagnostic Centre
8. Specialty Centre
9. Specialty Hospital
10. Multi-branch Healthcare Organization

`

The product must NOT have a separate software architecture for each.

Instead:

`
Same Core
   +
Organization Configuration
   +
Module Configuration
   +
Feature Configuration
   +
Dynamic Forms
   +
Dynamic Workflows
   +
Services
   +
Roles / Permissions

`

The underlying architecture is intended to use the same organization model from a single doctor to a multi-branch hospital.

---

# 3. CORE PRODUCT PRINCIPLE

# 3.1 Do NOT build separate products

Never create:

`
Dental Software
Hospital Software
Clinic Software
Diagnostic Software

`

as separate systems.

Instead:

`
Healthcare Core
       ↓
Configuration
       ↓
Business-specific behavior

`

---

# 4. V1 MAIN NAVIGATION

The main sidebar must remain intentionally compact.

# Primary Sidebar

`
Dashboard

Patients

Appointments

Queue

Clinical

Billing & Payments

Documents & Follow-ups

Reports

────────────────────

Administration

Settings

`

Do NOT create separate main sidebar items for every small feature.

For example:

`
Treatment
Prescription
Invoices
Payments
Receipts
Users
Roles
Forms
Workflows
Services
Branches
Audit
Notifications

`

must NOT all become separate top-level sidebar modules.

They belong inside their appropriate parent sections.

---

# 5. SIDEBAR RULE

Navigation is dynamic.

A user sees a section only when:

`
User Permission
+
Organization Configuration
+
Branch Configuration
+
Feature Configuration

`

allow it.

The dashboard and visible modules are role + permission + configuration driven, not fixed.

---

# 6. DASHBOARD

# 6.1 Dashboard purpose

Dashboard is the user's operational starting point.

It must show only information relevant to the current:

`
Organization
Branch
Role
Permissions
Enabled Modules
Enabled Features

`

---

# 6.2 Dashboard structure

`
Dashboard
│
├── Summary / KPI Cards
├── Today's Appointments
├── Today's Queue
├── Pending Clinical Work
├── Pending Payments
├── Outstanding Bills
├── Follow-ups
├── Recent Patients
├── Recent Activity
└── Quick Actions

`

---

# 6.3 Dashboard KPI examples

Depending on role and configuration:

`
Today's Patients
Today's Appointments
Waiting Queue
Completed Consultations
Pending Bills
Today's Collection
Outstanding Amount
Pending Follow-ups

`

Not every KPI must appear for every role.

---

# 6.4 Quick Actions

Possible actions:

`
+ New Patient
+ Appointment
+ Walk-in
+ Check-in
+ New Encounter
+ Invoice
+ Payment
+ Upload Document
+ Follow-up

`

Only permitted actions appear.

---

# 6.5 Role-specific dashboard

# Doctor

`
My Appointments
My Patients
Today's Queue
Pending Consultations
Pending Follow-ups
Recent Clinical Records

`

# Reception

`
Today's Appointments
Patients
Queue
Pending Check-ins
Billing
Payments

`

# Billing Staff

`
Invoices
Pending Payments
Outstanding
Today's Collection
Receipts

`

# Admin

`
Revenue
Patients
Appointments
Users
Reports
Configuration
Activity

`

This role-driven behavior is part of the V1 source.

---

# 7. PATIENTS

Patients is a primary sidebar module.

`
Patients

`

---

# 7.1 Patient list

Screen:

`
Patients

[+ New Patient] [Walk-in]

Search
Filters

Patient ID
Name
Phone
Gender
Age
Branch
Provider
Status
Last Visit
Balance

`

---

# 7.2 Patient list actions

Each patient row supports:

`
View
Edit
More

`

More:

`
Book Appointment
Walk-in
New Encounter
Create Bill
Receive Payment
Upload Document
Add Follow-up
Archive
View History

`

Actions must be permission controlled.

---

# 8. NEW PATIENT FORM

New patient flow:

`
+ New Patient
      ↓
Person Details
      ↓
Patient Details
      ↓
Save
      ↓
Patient Profile

`

This Person → Patient separation is part of the existing master architecture.

---

# 8.1 Person Details

Core fields:

`
First Name
Middle Name
Last Name
Date of Birth
Gender
Phone
Alternate Phone
Email
Address
City
State
Country
Postal Code

`

Where configured:

`
Emergency Contact
Preferred Language
Identity Information

`

---

# 8.2 Patient Details

`
Patient Number
Patient Status
Registration Date
Preferred Branch
Preferred Provider
Patient Category
Referral Source
Notes

`

Patient number is system-generated.

---

# 9. PATIENT PROFILE

Patient Profile is the central patient hub.

It must NOT behave like ten disconnected systems.

The same patient record connects all relevant healthcare and financial information.

The source explicitly defines the patient profile as a central navigation containing appointments, encounters, clinical, treatment, prescriptions, documents, bills, payments and follow-ups, connected through patient_id.

---

# 9.1 Patient profile header

`
Patient Name
Patient ID
Age
Gender
Phone
Status
Branch

`

Actions:

`
Book Appointment
Walk-in
New Encounter
Create Bill
Receive Payment
Upload Document
Add Follow-up
Edit
More

`

---

# 9.2 Patient profile tabs

`
Overview
Appointments
Encounters
Clinical
Treatment
Prescriptions
Documents
Billing & Payments
Follow-ups
Timeline

`

---

# 10. PATIENT OVERVIEW

Show:

`
Patient Information
Current Status
Last Visit
Next Appointment
Outstanding Balance
Recent Encounter
Recent Treatment
Recent Prescription
Recent Documents
Upcoming Follow-up

`

Quick actions:

`
Appointment
Walk-in
Encounter
Bill
Payment
Document
Follow-up

`

---

# 11. PATIENT APPOINTMENTS

Inside Patient Profile:

`
Appointments

`

Show:

`
Date
Time
Provider
Service
Branch
Status

`

Actions:

`
View
Edit
Reschedule
Confirm
Cancel
Check-in
No-show

`

---

# 12. PATIENT ENCOUNTERS

Show:

`
Encounter ID
Date
Provider
Service
Type
Status

`

Actions:

`
View
Continue
Complete
View Clinical Record
View Treatment
View Prescription
View Billing

`

---

# 13. PATIENT CLINICAL

Clinical tab shows the patient's clinical history.

Possible sections:

`
Clinical Records
Diagnoses
Vitals
History
Examinations
Notes
Procedures
Attachments

`

Actual displayed fields depend on configured forms.

---

# 14. PATIENT TREATMENT

Show:

`
Treatment
Service
Provider
Date
Status
Price
Related Encounter

`

Actions:

`
View
Edit
Add
Cancel
View Bill

`

---

# 15. PATIENT PRESCRIPTIONS

Show:

`
Prescription ID
Date
Provider
Medicine
Dose
Frequency
Duration
Instructions
Status

`

Actions:

`
View
Edit
Print
Download

`

V1 must store prescriptions in a way that future V2 Pharmacy can consume them without rebuilding the prescription system. The source explicitly identifies prescription as a future pharmacy connection point.

---

# 16. PATIENT DOCUMENTS

Show:

`
Document Name
Type
Related Entity
Uploaded By
Date
Version
Status

`

Actions:

`
View
Upload New Version
Download
Archive
View History

`

Documents may be linked to:

`
Patient
Encounter
Treatment
Invoice

`

as defined in the existing document model.

---

# 17. PATIENT BILLING & PAYMENTS

Show:

`
Invoices
Payments
Receipts
Outstanding
Refunds / Adjustments

`

Actions:

`
Create Invoice
Receive Payment
View Invoice
View Receipt
Refund
Print
Download

`

---

# 18. PATIENT FOLLOW-UPS

Show:

`
Follow-up Date
Purpose
Provider
Related Encounter
Status
Notes

`

Actions:

`
View
Edit
Complete
Reschedule
Create Appointment

`

---

# 19. PATIENT TIMELINE

Timeline should combine important events:

`
Patient Registered
Appointment Booked
Appointment Confirmed
Checked-in
Encounter Created
Queue Entry
Consultation Started
Clinical Record Updated
Treatment Added
Prescription Created
Invoice Created
Payment Received
Receipt Generated
Document Uploaded
Follow-up Created
Appointment Completed

`

This is a business timeline, not a replacement for the formal audit log.

---

# 20. APPOINTMENTS

Top-level:

`
Appointments

`

---

# 20.1 Appointment views

`
Calendar
Day
Week
List
Provider
Branch

`

---

# 20.2 Appointment filters

`
Date
Branch
Provider
Department
Service
Status
Patient

`

---

# 20.3 New Appointment form

Fields:

`
Patient
Service
Provider
Branch
Department
Date
Time
Duration
Reason
Notes

`

Core appointment fields in the source include patient, service, provider, date/time, branch and notes.

---

# 20.4 Appointment actions

`
View
Edit
Confirm
Reschedule
Check-in
Cancel
No-show
Start Encounter

`

---

# 21. APPOINTMENT FLOW

`
Patient
 ↓
Book Appointment
 ↓
Select Service
 ↓
Select Provider
 ↓
Select Date/Time
 ↓
Save
 ↓
Appointment Created
 ↓
Notification Rules

`

Appointment creation generates an appointment event, after which configured notification channels can run.

Possible notification channels:

`
In-App
SMS
Email
WhatsApp

`

---

# 22. QUEUE

Queue is a separate primary operational section.

`
Queue

`

This is intentional because queue is a real-time working screen.

---

# 22.1 Queue filters

`
Branch
Department
Provider
Service
Date
Status

`

---

# 22.2 Queue states

Default example:

`
Waiting
 ↓
Called
 ↓
In Consultation
 ↓
Completed

`

Actual transitions must be workflow/configuration driven.

---

# 22.3 Queue actions

`
Call
Recall
Start Consultation
Transfer
Skip
Complete

`

Only permitted actions appear.

---

# 23. CHECK-IN

Appointment:

`
Today's Appointments
 ↓
Check-in

`

System:

`
Appointment
 ↓
Encounter
 ↓
Queue Entry

`

This is the defined V1 flow.

---

# 24. WALK-IN

Appointment is NOT mandatory.

Flow:

`
Patients
 ↓
New / Existing Patient
 ↓
Walk-in
 ↓
Select Service
 ↓
Create Encounter
 ↓
Queue

`

Appointment and Walk-in must both end at the same Encounter engine.

---

# 25. CLINICAL

Primary sidebar:

`
Clinical

`

Internal navigation:

`
Encounters
My Consultations
Clinical Records
Treatment
Prescriptions

`

These are logically grouped, not separate primary sidebar modules.

---

# 26. ENCOUNTER

Encounter is the common clinical working context.

It can originate from:

`
Appointment
OR
Walk-in

`

---

# 26.1 Encounter detail

Header:

`
Patient
Encounter ID
Provider
Service
Date
Status

`

Actions:

`
Start
Continue
Save Draft
Complete
Cancel
View History

`

---

# 27. CLINICAL WORKSPACE

The doctor selects:

`
Today's Queue
 ↓
Patient
 ↓
Start Consultation

`

System:

`
Queue
 ↓
Encounter
 ↓
Clinical Workspace

`

The workspace is dynamically configured.

---

# 28. GENERAL CLINICAL WORKSPACE

Possible sections:

`
Patient Header

Complaint
Vitals
History
Examination
Diagnosis
Treatment
Prescription
Documents
Notes

`

---

# 29. DENTAL CLINICAL WORKSPACE

Possible configuration:

`
Patient Header

Dental Examination
Tooth Chart
Diagnosis
Procedure
X-Ray
Treatment
Prescription
Documents
Notes

`

The same Clinical Engine supports different workspace configurations through dynamic forms.

---

# 30. DYNAMIC FORM ENGINE — PRODUCT BEHAVIOR

The admin/user must be able to create and modify forms without requiring a new software screen for every business.

Concept:

`
Form
 ↓
Sections
 ↓
Fields
 ↓
Options
 ↓
Validation
 ↓
Visibility Rules

`

Existing architecture explicitly defines:

`
Form
FormSection
FormField
FieldOption
FieldValidation

`

---

# 31. DYNAMIC FIELD TYPES

The V1 product should support configurable field types such as:

`
Text
Long Text
Number
Decimal
Date
Date + Time
Dropdown
Multi-select
Radio
Checkbox
Boolean
File / Attachment
Image
Email
Phone
Address
Reference / Lookup

`

Additional specialized field types can be added later without changing the overall form concept.

---

# 32. FORM FIELD CONFIGURATION

Each field can configure:

`
Label
Internal Key
Type
Required
Default Value
Placeholder
Help Text
Options
Validation
Min
Max
Pattern
Visibility Rule
Read-only Rule
Ordering
Section

`

---

# 33. DYNAMIC FORM EXAMPLE

Dental Examination:

`
Dental Examination
│
├── Tooth Number
│     Type: Dropdown
│
├── Diagnosis
│     Type: Multi-select
│
├── Notes
│     Type: Long Text
│
└── X-Ray
      Type: Attachment

`

If tomorrow the clinic needs:

`
Blood Pressure

`

admin can add:

`
Add Field
 ↓
Blood Pressure
 ↓
Number
 ↓
Save

`

without requiring a new hard-coded clinical page. This behavior is explicitly part of the source.

---

# 34. FORM MODES

Every reusable form supports:

`
Create
View
Edit

`

Where relevant:

`
Draft
Submit
Lock
Version
Archive

`

---

# 35. FORM VERSIONING — PRODUCT RULE

Published forms must be versioned.

Example:

`
Dental Examination v1
Dental Examination v2

`

Old clinical records must remain associated with the version used when they were created.

A new form version must NOT silently change old records.

The master architecture requires versioning for forms and other configurable objects.

---

# 36. TREATMENT

Treatment is created from the clinical process.

Example:

`
Diagnosis
 ↓
Treatment
 ↓
Service

`

Example:

`
Root Canal
₹5,000

`

Treatment can connect to the configured service.

---

# 37. TREATMENT → BILLING

When a billable treatment/service is recorded:

`
Treatment
 ↓
Billable Service
 ↓
Invoice Item

`

Clinical data and financial data must remain logically separate while remaining connected.

This separation is explicitly required by the V1 source.

---

# 38. PRESCRIPTION

Prescription fields:

`
Medicine
Dose
Frequency
Duration
Instructions

`

Possible actions:

`
Add Medicine
Edit
Remove
View
Print
Download

`

Prescription belongs to the Encounter/clinical context.

Future Pharmacy may consume the same prescription.

---

# 39. BILLING & PAYMENTS

This is one primary sidebar section.

`
Billing & Payments

`

Internal navigation:

`
Invoices
Payments
Receipts
Outstanding
Refunds / Adjustments

`

---

# 40. INVOICE

Invoice contains:

`
Patient
Encounter
Branch
Invoice Date
Items
Subtotal
Discount
Tax
Total
Paid
Balance
Status

`

Invoice items:

`
Service
Description
Quantity
Unit Price
Discount
Tax
Total

`

---

# 41. BILLING ACTIONS

`
Create
View
Edit
Add Item
Remove Item
Apply Discount
Receive Payment
Print
Download
Void
Refund
View History

`

Permission controls which actions are visible.

---

# 42. PAYMENT

Payment fields:

`
Patient
Invoice
Amount
Payment Method
Payment Date
Reference Number
Notes
Attachment
Status

`

Methods:

`
Cash
UPI
Card
Bank Transfer
Online Gateway
Other

`

---

# 43. ONLINE PAYMENT

Flow:

`
Invoice
 ↓
Pay Online
 ↓
Payment Gateway
 ↓
Callback / Webhook
 ↓
Payment Verification
 ↓
Payment
 ↓
Payment Allocation
 ↓
Invoice Balance Updated
 ↓
Receipt
 ↓
Notification

`

This is the defined V1 online payment flow.

If payment fails:

`
Payment = Failed / Pending

`

The original invoice must remain intact.

---

# 44. OFFLINE PAYMENT

Flow:

`
Invoice
 ↓
Manual Payment
 ↓
Reference / Screenshot
 ↓
Document
 ↓
Payment Pending Verification
 ↓
Authorized User Verifies
 ↓
Payment Confirmed
 ↓
Receipt

`

This supports real-world clinics where payment may happen outside the system.

---

# 45. RECEIPT

Receipt contains:

`
Receipt Number
Patient
Invoice
Payment
Amount
Payment Method
Date
Reference
Branch

`

Actions:

`
View
Print
Download
Send

`

---

# 46. DOCUMENTS & FOLLOW-UPS

Primary sidebar:

`
Documents & Follow-ups

`

Internal sections:

`
Documents
Follow-ups

`

---

# 47. DOCUMENTS

Document actions:

`
Upload
View
Download
Replace / New Version
Archive
View History

`

Documents can be associated with:

`
Patient
Encounter
Treatment
Invoice
Payment

`

---

# 48. FOLLOW-UP

Follow-up form:

`
Patient
Related Encounter
Date
Purpose
Provider
Notes
Status

`

Actions:

`
Create
View
Edit
Complete
Reschedule
Create Appointment

`

---

# 49. NOTIFICATIONS

Notifications are configuration-driven.

Possible events:

`
Appointment Created
Appointment Confirmed
Appointment Rescheduled
Appointment Cancelled
Payment Received
Receipt Generated
Follow-up Due
Document Available

`

Possible channels:

`
In-App
SMS
Email
WhatsApp

`

Which channel executes depends on configured notification rules/templates.

---

# 50. REPORTS

Primary sidebar:

`
Reports

`

Categories:

`
Operational
Patients
Appointments
Clinical
Treatment
Billing
Payments
Revenue
Outstanding

`

---

# 50.1 Report flow

`
Reports
 ↓
Select Report
 ↓
Filters
 ↓
Generate
 ↓
Table / Chart
 ↓
Export

`

Filters may include:

`
Date
Branch
Department
Provider
Service
Payment Status
Patient

`

Reports must respect user authorization.

---

# 51. IMPORT

Administration:

`
Import / Export

`

Import flow:

`
Import
 ↓
Select Entity
 ↓
Upload CSV / Excel
 ↓
Map Fields
 ↓
Validate
 ↓
Preview
 ↓
Confirm
 ↓
Import

`

Import must behave like a normal business operation from the user's perspective.

---

# 52. EXPORT

`
Export
 ↓
Select Data
 ↓
Filters
 ↓
Permission Check
 ↓
Generate
 ↓
Download

`

Export is auditable.

---

# 53. ADMINISTRATION

Administration contains configuration rather than daily patient operations.

`
Administration
│
├── Organization
├── Branches & Departments
├── Staff & Users
├── Roles & Permissions
├── Services
├── Forms
├── Workflows
├── Modules & Features
├── Notifications & Templates
├── Dashboard Configuration
├── Import / Export
├── Audit & Activity
└── System Configuration

`

---

# 54. ORGANIZATION

Hierarchy:

`
Organization
 ↓
Branch
 ↓
Department
 ↓
Unit
 ↓
Resource

`

Single doctor:

`
Organization
└── Main Location

`

Hospital:

`
Organization
├── Branch A
│   ├── OPD
│   ├── Dental
│   └── Lab
└── Branch B
    ├── OPD
    └── Dental

`

This same model supports both small and large organizations.

---

# 55. STAFF & USERS

Staff creation must support:

`
Person
 ↓
User Account
 ↓
Organization
 ↓
Branch
 ↓
Department
 ↓
Role
 ↓
Permissions

`

Staff types are not permanently hard-coded.

---

# 56. ROLES

Roles are configurable.

Examples:

`
Admin
Doctor
Receptionist
Billing Staff
Nurse
Manager
Custom Role

`

But the product must not assume these are the only roles.

---

# 57. PERMISSIONS

Permission examples:

`
patient.view
patient.create
patient.edit

appointment.view
appointment.create
appointment.edit
appointment.cancel

queue.view
queue.manage

clinical.view
clinical.create
clinical.edit

billing.view
billing.create
billing.edit
billing.refund

payment.view
payment.create
payment.verify

document.view
document.upload

report.view
report.export

`

The source explicitly requires granular database-driven permissions rather than fixed roles.

---

# 58. ROLE-BASED UI

Example:

Doctor:

`
Clinical = visible
Billing = limited
Administration = hidden

`

Receptionist:

`
Patients = visible
Appointments = visible
Queue = visible
Clinical = limited
Billing = visible

`

Billing staff:

`
Billing = visible
Payments = visible
Clinical = limited

`

Admin:

`
All permitted areas
Administration

`

The backend remains the final authority for permission.

---

# 59. SERVICES

Administration:

`
Services

`

Service fields:

`
Service ID
Name
Category
Department
Duration
Price
Tax
Required Workflow
Required Form
Required Role
Inventory Consumption
Billing Rules
Status

`

These attributes are explicitly part of the master V1 architecture.

---

# 60. SERVICE EXAMPLES

`
General Consultation
Dental Consultation
Dental Cleaning
Root Canal
X-Ray
CBC
Physiotherapy Session
Room Charge

`

The same service engine can support future V2 services without rebuilding the core.

---

# 61. SERVICE → FORM

A service can define:

`
Required Form

`

Example:

`
Root Canal
 ↓
Dental Examination Form

`

General Consultation:

`
General Consultation
 ↓
General Clinical Form

`

---

# 62. SERVICE → WORKFLOW

A service can define:

`
Required Workflow

`

Example:

`
Dental Cleaning
 ↓
Consultation
 ↓
Procedure
 ↓
Billing

`

---

# 63. WORKFLOW BUILDER

Administration:

`
Workflows

`

Internal:

`
Workflow List
Workflow Builder
Versions

`

Workflow consists conceptually of:

`
Workflow
Workflow Version
Steps
Transitions
Conditions
Actions

`

This is explicitly defined in the source.

---

# 64. WORKFLOW EXAMPLE

Default:

`
Patient Registration
 ↓
Appointment
 ↓
Check-in
 ↓
Consultation
 ↓
Billing
 ↓
Follow-up

`

A business can configure another flow:

`
Consultation
 ↓
Lab Test
 ↓
Doctor Review
 ↓
Billing

`

The flow should be configurable rather than hard-coded.

---

# 65. MODULES & FEATURES

Administration:

`
Modules & Features

`

Examples:

`
Queue = ON
Dental Chart = ON
IPD = OFF
Lab = OFF
Pharmacy = OFF

`

Hospital:

`
Queue = ON
Dental Chart = OFF
IPD = ON
Lab = ON
Pharmacy = ON
OT = ON

`

The system must never hard-code these ON/OFF decisions. Configuration is database-driven.

---

# 66. DYNAMIC DASHBOARD CONFIGURATION

Admin can configure:

`
Widget
Position
Visibility
Role
Branch
Module
Order

`

The dashboard therefore changes according to business configuration.

---

# 67. NOTIFICATION & TEMPLATE ADMINISTRATION

Admin can manage:

`
Templates
Notification Rules
Channels
Status

`

Templates can be associated with events such as:

`
Appointment Created
Payment Received
Follow-up Due
Receipt Generated

`

---

# 68. AUDIT & ACTIVITY

Administration:

`
Audit & Activity

`

Every important action should be traceable:

`
Who
What
When
Entity
Old Value
New Value
Reason

`

Example:

`
Invoice
₹5000 → ₹4500

Changed By:
User A

Time:
...

Reason:
Discount

`

This is the defined audit behavior.

---

# 69. SETTINGS

Settings is user/system preference territory.

User settings:

`
Profile
Password
Language
Theme
Notification Preferences
Default Branch
Preferences

`

Administrative business configuration remains inside Administration.

---

# 70. STANDARD DETAIL SCREEN

Every major entity detail page follows a common pattern:

`
← Back

Entity Name
Entity ID
Status

[Primary Action]
[Edit]
[More]

────────────────────

Overview
Related Data
History

`

---

# 71. BACK BUTTON RULE

Back must return the user to the logical previous context.

Example:

`
Patients
 ↓
Patient Profile
 ↓
Appointment

`

Back:

`
Appointment
 ↓
Patient Profile

`

Not automatically Dashboard.

If the user came from:

`
Appointments
 ↓
Appointment Detail

`

then:

`
Back → Appointments

`

Navigation must preserve context.

---

# 72. VIEW / EDIT RULE

Every major entity should support:

`
View
Edit
History

`

Where business rules allow:

`
Archive
Cancel
Void
Refund
Restore
Duplicate
Print
Export

`

---

# 73. DELETE RULE

Healthcare records should not normally use destructive hard delete.

Use:

`
Archive
Deactivate
Cancel
Void
Soft Delete

`

Sensitive records follow retention policies.

The source explicitly establishes soft-delete/archival behavior.

---

# 74. MORE MENU RULE

Do not fill the screen with buttons.

Primary actions stay visible.

Secondary actions go inside:

`
⋮ More

`

Possible:

`
Duplicate
Archive
Cancel
Void
History
Audit
Print
Export

`

Available actions depend on entity state and permission.

---

# 75. STATUS BEHAVIOR

Statuses are part of business workflows.

Common statuses:

`
Draft
Active
Pending
Approved
Rejected
Completed
Cancelled
Archived

`

Business-specific workflows can define their own states.

---

# 76. CORE CONNECTIVITY

The entire V1 must behave as one connected product.

`
Organization
      ↓
User / Role / Permission
      ↓
Patient
      ↓
Appointment
      ↓
Check-in
      ↓
Encounter
      ↓
Queue
      ↓
Clinical
      ↓
Treatment
      ↓
Prescription
      ↓
Service
      ↓
Invoice
      ↓
Payment
      ↓
Receipt
      ↓
Document
      ↓
Follow-up
      ↓
Notification
      ↓
Report / Audit

`

The source's master connectivity graph follows this same business sequence.

---

# 77. REAL-LIFE COMPLETE USER FLOW

Reception:

`
New Patient
 ↓
Person Created
 ↓
Patient Created
 ↓
Appointment
 ↓
Reminder
 ↓
Check-in
 ↓
Encounter Created
 ↓
Queue

`

Doctor:

`
Queue
 ↓
Open Patient
 ↓
Dynamic Clinical Form
 ↓
Clinical Record
 ↓
Treatment
 ↓
Prescription

`

Billing:

`
Treatment / Service
 ↓
Invoice
 ↓
Payment
 ↓
Receipt

`

Aftercare:

`
Follow-up
 ↓
Notification
 ↓
Appointment

`

System:

`
Audit
+
Reports

`

This is the complete V1 business loop.

---

# 78. SCREEN ≠ DATABASE ENTITY

The UI must be designed around the user's business journey, not around database tables.

For example:

`
Patient Profile

`

may display:

`
Person
Patient
Appointment
Encounter
Clinical Record
Treatment
Prescription
Invoice
Payment
Document
Follow-up

`

as one connected experience.

The source explicitly establishes this rule.

---

# 79. DYNAMICITY RULE

“Dynamic” does NOT mean putting the whole application into arbitrary JSON.

Core business entities remain structured:

`
Organization
User
Patient
Appointment
Encounter
Invoice
Payment

`

Dynamic configuration is used for:

`
Fields
Forms
Sections
Workflow
Rules
Services
Screens
Templates
Notifications
Configurations

`

This distinction is explicitly required by the V1 architecture.

---

# 80. ORGANIZATION CUSTOMIZATION

Each organization can configure:

`
Organization Name
Logo
Branches
Departments
Services
Providers
Roles
Permissions
Modules
Features
Forms
Workflows
Templates
Notifications
Dashboard

`

One organization must not affect another organization's configuration.

---

# 81. BRANCH CUSTOMIZATION

Different branches may have:

`
Different Services
Different Providers
Different Forms
Different Workflows
Different Prices
Different Queues
Different Dashboard Widgets
Different Notifications

`

while sharing the same organization.

---

# 82. ROLE CUSTOMIZATION

A business can create:

`
Custom Role

`

and choose:

`
Module Access
View
Create
Edit
Delete/Archive
Approve
Verify
Export

`

---

# 83. FORM CUSTOMIZATION

Organization-specific forms must not require source-code changes.

Example:

`
Clinic A
General Consultation v1

`

Dental clinic:

`
Clinic B
Dental Examination v1

`

Specialty centre:

`
Clinic C
Specialty Assessment v1

`

Same form engine.

---

# 84. WORKFLOW CUSTOMIZATION

Different organizations may use different workflows.

Example:

`
Clinic A:
Appointment → Consultation → Billing

Clinic B:
Appointment → Check-in → Queue → Consultation → Billing

Clinic C:
Appointment → Consultation → Lab → Review → Billing

`

The same product must support these through configuration.

---

# 85. SERVICE CUSTOMIZATION

Organization can define:

`
Service
Price
Duration
Department
Provider
Required Form
Required Workflow
Billing Rule

`

---

# 86. FUTURE V2 COMPATIBILITY FROM PRODUCT SIDE

V2 is not a replacement application.

V2 adds modules to the same core:

`
V1 Core
+
V2 Modules

`

Examples:

`
IPD
Pharmacy
Lab
Inventory
Insurance

`

These must use the existing:

`
Patient
Encounter
Service
Workflow
Transaction
Document
User
Organization

`

instead of creating duplicate systems.

This is explicitly the V1→V2 product rule.

---

# 87. FUTURE V3 COMPATIBILITY

V3 continues the same core:

`
CORE
 ├── V1
 ├── V2
 └── V3

`

Possible V3 additions:

`
AI
Advanced Analytics
Enterprise
Interoperability
Advanced Hospital Operations

`

Core business identity and records remain shared.

---

# 88. V1 MUST NOT INCLUDE THESE HEAVY MODULES

V1 should NOT become unnecessarily huge.

Not full V1 modules:

`
Full IPD
Full OT
Blood Bank
Ambulance
Advanced ICU
Full Insurance / TPA
Full Pharmacy
Advanced Procurement
Advanced Accounting
Advanced AI
Advanced Multi-branch Analytics

`

But their future extension points must not be blocked.

The source explicitly distinguishes “feature not in V1” from “architecture not ready for V2.”

---

# 89. V1 MUST INCLUDE

The V1 product must cover:

`
1. Business Setup
2. Branch / Location
3. Users
4. Roles
5. Permissions
6. Patients
7. Appointments
8. Queue
9. Encounter / Visit
10. Consultation
11. Dynamic Clinical Forms
12. Service Catalogue
13. Treatment
14. Prescription
15. Billing
16. Payment
17. Receipt
18. Documents
19. Follow-up
20. Notifications
21. Reports
22. Dashboard
23. Audit
24. Offline / Sync Foundation
25. Import / Export
26. API Foundation

`

This is the defined V1 mandatory product scope.

---

# 90. V1 USER EXPERIENCE PRINCIPLES

The product must feel:

`
Simple
Fast
Connected
Professional
Configurable
Role-aware
Business-oriented

`

It must NOT feel like:

`
Many disconnected CRUD screens
Database administration panel
Developer tool
Overloaded ERP

`

---

# 91. CONSISTENT CRUD EXPERIENCE

For every major entity:

`
List
 ↓
View
 ↓
Edit
 ↓
History

`

and where applicable:

`
Create
Archive
Cancel
Void
Restore
Print
Export

`

---

# 92. CONTEXTUAL ACTIONS

The product should show actions where they make sense.

Example Patient:

`
Book Appointment

`

Example Appointment:

`
Check-in

`

Example Queue:

`
Start Consultation

`

Example Encounter:

`
Add Treatment
Add Prescription
Complete

`

Example Invoice:

`
Receive Payment

`

Example Payment:

`
View Receipt

`

This keeps the workflow connected and reduces unnecessary navigation.

---

# 93. NO DEAD-END SCREENS

Every major screen must provide logical next actions.

Example:

`
Patient Created

`

should allow:

`
Book Appointment
Walk-in
View Patient

`

Appointment:

`
Check-in

`

Encounter:

`
Clinical
Treatment
Prescription

`

Invoice:

`
Payment

`

Payment:

`
Receipt

`

Follow-up:

`
Appointment

`

---

# 94. SEARCH

Search must be available where operationally useful.

Patient search:

`
Patient ID
Name
Phone
Email

`

Appointment search:

`
Patient
Provider
Date
Status

`

Invoice:

`
Invoice ID
Patient
Date
Status

`

Payment:

`
Payment ID
Patient
Invoice
Reference

`

---

# 95. FILTERING

All large lists should support:

`
Search
Filter
Sort
Pagination
Status Filter
Date Filter
Branch Filter
Provider Filter

`

Available filters depend on the entity.

---

# 96. EMPTY STATES

Every screen must have useful empty states.

Example:

`
No appointments today.

[Create Appointment]

`

Not just:

`
No Data

`

---

# 97. ERROR STATES

Errors must explain:

`
What happened
Why it happened
What the user can do next

`

Example:

`
Payment could not be completed.

The gateway did not confirm the transaction.

[Retry Payment]
[View Invoice]

`

---

# 98. SUCCESS STATES

After an action:

`
Patient Created
Appointment Confirmed
Payment Received
Receipt Generated

`

show confirmation and next useful actions.

---

# 99. ROLE-SAFE UI

If a user cannot perform an action:

Prefer hiding the action when appropriate.

If the action is visible but unauthorized:

`
You do not have permission to perform this action.

`

Backend authorization remains authoritative.

---

# 100. V1 PRODUCT COMPLETION CRITERIA

V1 is product-complete when a real small healthcare business can perform:

`
Business Setup
 ↓
Create Staff
 ↓
Assign Roles
 ↓
Configure Services
 ↓
Configure Form
 ↓
Configure Workflow
 ↓
Create Patient
 ↓
Appointment / Walk-in
 ↓
Check-in
 ↓
Queue
 ↓
Consultation
 ↓
Clinical Record
 ↓
Treatment / Prescription
 ↓
Invoice
 ↓
Online or Offline Payment
 ↓
Receipt
 ↓
Document
 ↓
Follow-up
 ↓
Notification
 ↓
Report
 ↓
Audit

`

and the complete process remains connected.

The source defines this complete cycle as the condition for V1 completion.

---

# 101. V1 PRODUCT NON-NEGOTIABLES

# Rule 1

Do not create separate software logic for:

`
Clinic
Dental
Hospital
Diagnostic

`

---

# Rule 2

Do not hard-code:

`
Roles
Forms
Workflows
Services
Dashboard
Modules
Features
Notifications

`

where configuration is intended.

---

# Rule 3

Do not create duplicate:

`
Patient
User
Billing
Document

`

systems for future modules.

---

# Rule 4

Do not design UI around database tables.

Design around user/business journeys.

---

# Rule 5

Do not silently change V1 product behavior for implementation convenience.

---

# 102. V1 → V2/V3 PRODUCT COMPATIBILITY CONTRACT

The following concepts must remain stable:

`
Identity
Organization
User
Role
Permission
Patient Identity
Service
Workflow
Form
Document
Transaction
Event
Audit
API conventions
Error conventions
Versioning
Time/Date behavior
Currency behavior
Localization
Security model

`

The source explicitly defines these as the common V1/V2/V3 compatibility foundation.

---

# 103. API / EVENT PRODUCT EXPECTATION

From the product perspective, future versions must be able to consume the same business events.

Example:

`
payment.received.v1

`

Future V2/V3 systems can subscribe without changing the original payment user journey.

APIs are versioned:

`
/api/v1/...

`

Future:

`
/api/v2/...

`

Old clients should not be immediately broken.

---

# 104. PRODUCT VERSIONING

Version-sensitive objects include:

`
Forms
Workflows
Services
Templates
Price Lists
Documents
Configurations

`

When a new version is published, old records remain tied to the version they were created under.

This prevents historical records from silently changing.

---

# 105. OFFLINE PRODUCT BEHAVIOR

V1 must have a basic offline/sync foundation.

Conceptually:

`
Local Data
 ↓
Sync Queue
 ↓
Server

`

Each mutation must be uniquely identifiable so that the same operation is not processed twice.

The source defines operation ID, entity ID/version, timestamp, device ID, user ID and operation type as the basic mutation information.

---

# 106. OFFLINE CONFLICT PRODUCT BEHAVIOR

When two devices change the same data:

`
Conflict Detected

`

Supported policy concepts:

`
Last Write
Server Wins
User Resolution
Field-level Merge

`

The policy can vary by entity.

---

# 107. V1 PRODUCT PHILOSOPHY

The purpose of V1 is NOT:

“Build every hospital feature now.”

The purpose is:

“Build the complete healthcare business core now, and make future modules attach to that core.”

Therefore:

`
V1 = Complete Core + Real Business
V2 = New Modules on Same Core
V3 = Advanced Capabilities on Same Core

`

---

# 108. FINAL V1 MASTER FLOW

`
                         ORGANIZATION
                              │
                              ▼
                     USER / ROLE / PERMISSION
                              │
                              ▼
                         DASHBOARD
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
          PATIENT        APPOINTMENT       BILLING
             │                │
             ▼                ▼
      PATIENT PROFILE       QUEUE
             │                │
             └────────┬───────┘
                      ▼
                  ENCOUNTER
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      CLINICAL      SERVICE     DOCUMENT
        FORM           │
          │            ▼
          │         TREATMENT
          │            │
          │            ▼
          │       PRESCRIPTION
          │            │
          └──────┬─────┘
                 ▼
               BILL
                 │
          ┌──────┴──────┐
          ▼             ▼
       PAYMENT       DOCUMENT
          │
          ▼
       RECEIPT
          │
          ▼
      FOLLOW-UP
          │
          ▼
    NOTIFICATION
          │
          ▼
   REPORT / AUDIT

`

---

# 109. FINAL SIDEBAR — FROZEN FOR V1

`
🏠 Dashboard

👤 Patients

📅 Appointments

⏱ Queue

🩺 Clinical

💰 Billing & Payments

📁 Documents & Follow-ups

📊 Reports

────────────────────

⚙ Administration

   ├── Organization
   ├── Branches & Departments
   ├── Staff & Users
   ├── Roles & Permissions
   ├── Services
   ├── Forms
   ├── Workflows
   ├── Modules & Features
   ├── Notifications & Templates
   ├── Dashboard Configuration
   ├── Import / Export
   ├── Audit & Activity
   └── System Configuration

⚙ Settings

`

Do not add unnecessary primary sidebar modules.

New functionality should normally be placed inside an existing primary section, Patient Profile, Administration, contextual action, or dynamic configuration layer.

---

# 110. FINAL PRODUCT RULE

V1 must feel like one software, not a collection of separate modules.

The user should be able to move naturally:

`
Patient
 ↓
Appointment
 ↓
Queue
 ↓
Encounter
 ↓
Clinical
 ↓
Treatment
 ↓
Bill
 ↓
Payment
 ↓
Receipt
 ↓
Follow-up

`

without manually reconnecting records.

At the same time:

`
Organization
Role
Permission
Service
Form
Workflow
Module
Feature
Template
Dashboard

`

must determine how that journey behaves for each business.

---

# 111. SOURCE-OF-TRUTH STATEMENT

This document defines the V1 PRODUCT behavior.

The next document must translate this specification into:

`
Frontend Architecture
Backend Architecture
MongoDB Data Model
Entity Relationships
API Contracts
Event Contracts
RBAC Implementation
Dynamic Form Engine
Workflow Engine
Audit
Offline / Sync
Security
Versioning
V2/V3 Extension Contracts

`

without changing the product behavior defined here.

Then Document 3 will convert that architecture into:

`
Development Phases
Dependencies
Tasks
Acceptance Criteria
Tests
E2E Scenarios
Seed Data
Definition of Done
Deployment

`

Final hierarchy:

`
V1_MASTER_PRODUCT_SPEC
          ↓
V1_TECHNICAL_ARCHITECTURE
          ↓
V1_IMPLEMENTATION_PLAN
          ↓
CODE
          ↓
TESTS

`

No silent architectural drift.

No duplicate core systems.

No hard-coded business-specific workflows where configuration is required.

No V2/V3 rewrite of the V1 core.

V1 must independently operate a real healthcare business while remaining extensible for V2 and V3.
