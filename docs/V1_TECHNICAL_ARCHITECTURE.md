Text To Word

# V1 TECHNICAL ARCHITECTURE

# Healthcare Business Management System

# MERN Stack + Dynamic Core + V2/V3 Compatible Architecture

Version: V1Status: Technical Architecture Source of TruthDepends On: V1_MASTER_PRODUCT_SPECTarget: Production-ready V1 with V2/V3 extension compatibility

---

# 1. ARCHITECTURE OBJECTIVE

V1 ko aise build karna hai ki:

`
V1 = independently usable production system

AND

V2/V3 = existing V1 core ke upar modules/extensions

`

V2 ya V3 ke liye:

`
Patient system rewrite
Billing rewrite
User rewrite
Form rewrite
Workflow rewrite

`

nahi hona chahiye.

Source architecture ka fundamental principle bhi yahi hai: V1 future features ko implement nahi karta, lekin future ke connection points, IDs, schemas, events, permissions, workflows aur APIs ko pehle se ready rakhta hai.

---

# 2. TECHNOLOGY STACK

# Frontend

`
React
TypeScript
React Router
State Management
Form Rendering Engine
API Client
Offline Store

`

Recommended frontend layering:

`
React UI
   ↓
Page / Feature Components
   ↓
Application Hooks
   ↓
API / Query Layer
   ↓
Local Cache / Offline Layer

`

---

# 3. BACKEND

`
Node.js
Express.js
TypeScript
MongoDB
Mongoose

`

Backend layering:

`
HTTP / Express
      ↓
Middleware
      ↓
Controllers
      ↓
Application Services
      ↓
Domain Services
      ↓
Repositories
      ↓
MongoDB

`

Frontend must NEVER directly access MongoDB.

Source architecture explicitly requires:

`
Web / Mobile
      ↓
API
      ↓
Application Services
      ↓
Domain/Core
      ↓
Database

`

---

# 4. HIGH-LEVEL SYSTEM ARCHITECTURE

`
                         ┌───────────────────┐
                         │   React Frontend  │
                         └─────────┬─────────┘
                                   │
                              HTTPS / API
                                   │
                         ┌─────────▼─────────┐
                         │   Express API     │
                         └─────────┬─────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
                  ▼                ▼                ▼
             Auth/RBAC       Application       Event System
                               Services
                  │                │                │
                  └────────────────┼────────────────┘
                                   │
                         ┌─────────▼─────────┐
                         │   Domain Layer    │
                         └─────────┬─────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 ▼                 ▼                 ▼
              MongoDB          File Storage       Queue/Jobs

`

---

# 5. MONOREPO STRUCTURE

Use a single repository so V1/V2/V3 contracts remain coordinated.

`
healthcare-platform/
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── shared-types/
│   ├── api-contracts/
│   ├── validation/
│   ├── permissions/
│   ├── events/
│   ├── form-engine/
│   ├── workflow-engine/
│   └── common/
│
├── docs/
│   ├── V1_MASTER_PRODUCT_SPEC
│   ├── V1_TECHNICAL_ARCHITECTURE
│   └── V1_IMPLEMENTATION_PLAN
│
└── tests/

`

Future:

`
packages/
├── ipd/
├── pharmacy/
├── lab/
├── inventory/
├── insurance/

`

V2 modules must consume existing core packages instead of recreating them.

---

# 6. BACKEND MODULE STRUCTURE

`
src/
│
├── config/
├── middleware/
├── common/
├── auth/
├── organization/
├── users/
├── roles/
├── permissions/
├── configuration/
├── modules/
├── forms/
├── workflows/
├── services/
├── patients/
├── appointments/
├── queue/
├── encounters/
├── clinical/
├── treatments/
├── prescriptions/
├── billing/
├── payments/
├── receipts/
├── documents/
├── followups/
├── notifications/
├── reports/
├── audit/
├── events/
├── sync/
├── imports/
├── exports/
└── health/

`

Each module should internally follow:

`
module/
├── controller
├── service
├── repository
├── model
├── validator
├── routes
├── mapper
└── tests

`

---

# 7. CORE ARCHITECTURE LAYERS

# Layer 1 — API

Responsible for:

`
Authentication
Validation
Request parsing
Response formatting
HTTP errors
Rate limits

`

# Layer 2 — Application

Responsible for:

`
Use cases
Transactions
Orchestration
Permission checks
Workflow invocation
Event publishing

`

# Layer 3 — Domain

Responsible for:

`
Business rules
State transitions
Financial rules
Clinical rules
Workflow rules

`

# Layer 4 — Persistence

Responsible for:

`
MongoDB queries
Repositories
Indexes
Transactions

`

This separation prevents controllers from becoming business-logic containers.

---

# 8. CORE ENTITY MODEL

The architecture must use generic core entities rather than separate Dental/Hospital tables.

Core:

`
Organization
Location / Branch
Department
Unit
Resource
Person
User
Role
Permission
Provider
Patient
Service
Record
Appointment
QueueEntry
Encounter
ClinicalRecord
Treatment
Prescription
Form
Workflow
Transaction
Invoice
Payment
Receipt
Document
Notification
AuditLog

`

The source explicitly defines the core around these reusable entities.

---

# 9. ID STRATEGY

Every entity receives a permanent immutable identifier.

Examples:

`
organizationId
branchId
departmentId
unitId
resourceId
personId
userId
roleId
permissionId
providerId
patientId
serviceId
appointmentId
queueEntryId
encounterId
clinicalRecordId
treatmentId
prescriptionId
invoiceId
paymentId
receiptId
documentId
workflowId
formId
auditLogId
eventId

`

Rules:

`
ID never changes.
ID never reused.
ID must not encode business meaning.
ID must not depend on branch/name/date.

`

This is explicitly required for future V2/V3 continuity.

---

# 10. MULTI-TENANCY MODEL

Every organization is a tenant.

Concept:

`
Organization A
     │
     ├── Branch A
     ├── Users
     ├── Patients
     └── Transactions

Organization B
     │
     ├── Branch B
     ├── Users
     ├── Patients
     └── Transactions

`

Never allow:

`
Organization A → Organization B data

`

---

# 11. TENANT ISOLATION RULE

All tenant-owned collections must contain:

`
organizationId

`

Branch-sensitive entities should contain:

`
branchId

`

Department-sensitive entities may contain:

`
departmentId

`

Every repository query must apply tenant scope.

Example conceptual rule:

`
findPatient(patientId)

`

is NOT enough.

It must behave conceptually like:

`
findPatient({
    patientId,
    organizationId
})

`

The architecture source explicitly requires logical tenant isolation and branch-level permissions.

---

# 12. ORGANIZATION HIERARCHY

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
└── Main Branch

`

Hospital:

`
Organization
├── Bhopal
│   ├── OPD
│   ├── Dental
│   └── Lab
│
└── Indore
    ├── OPD
    └── Dental

`

Same schema.

---

# 13. USER IDENTITY MODEL

Separate:

`
Person
User
Provider
Patient
Staff

`

A person can have multiple roles.

Example:

`
Person
 ├── User
 ├── Provider
 └── Patient

`

The source explicitly separates generic Person from Patient and allows the same person to represent patient, doctor, staff, guardian or emergency contact.

---

# 14. USER / ROLE / PERMISSION

Collections:

`
users
roles
permissions
userRoles
rolePermissions

`

Do NOT encode permissions directly into a hard-coded frontend role check.

---

# 15. PERMISSION FORMAT

Use granular stable keys:

`
patient.view
patient.create
patient.edit
patient.archive

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

payment.view
payment.create
payment.verify
payment.refund

report.view
report.export

`

Future V2:

`
inventory.approve
pharmacy.dispense
lab.verify
ipd.admit

`

Existing permission system remains unchanged.

The source specifically uses this granular permission approach.

---

# 16. RBAC + SCOPE

Authorization is two-dimensional:

`
Permission
+
Scope

`

Example:

`
billing.view

`

plus:

`
branch = current branch

`

A user may have:

`
billing.view

`

but only for:

`
Branch A

`

Another admin may have:

`
billing.view

`

for:

`
Organization-wide

`

---

# 17. AUTHENTICATION

Authentication layer must support:

`
Login
Logout
Password hashing
Session/token management
Refresh mechanism
Password reset
Account status

`

Never store plain passwords.

---

# 18. AUTHORIZATION PIPELINE

Every protected API request:

`
Request
 ↓
Authenticate User
 ↓
Resolve Organization
 ↓
Resolve Branch Scope
 ↓
Load Permissions
 ↓
Check Permission
 ↓
Check Entity Scope
 ↓
Execute Use Case

`

Never rely only on frontend hiding buttons.

---

# 19. CONFIGURATION ENGINE

Configuration hierarchy:

`
System
 ↓
Organization
 ↓
Branch
 ↓
Department
 ↓
User / Role

`

Configuration categories:

`
Module Configuration
Feature Configuration
Form Configuration
Workflow Configuration
Service Configuration
Dashboard Configuration
Notification Configuration
Template Configuration

`

Code must not hard-code:

`
Dental ON
IPD OFF
Queue ON

`

These must be database/configuration driven.

---

# 20. FEATURE FLAGS

Feature configuration supports:

`
organization
branch
environment

`

Example:

`
pharmacy = false

`

Testing:

`
pharmacy = true

`

Branch-level:

`
Bhopal = true
Indore = false

`

Source explicitly requires this capability for future controlled rollout.

---

# 21. DYNAMIC FORM ENGINE

Collections:

`
forms
formSections
formFields
fieldOptions
fieldValidations
formVersions
formSubmissions / formValues

`

Required architecture:

`
Form
 ↓
FormVersion
 ↓
Sections
 ↓
Fields
 ↓
Options
 ↓
Validation

`

Source defines the base entities as Form, FormSection, FormField, FieldOption and FieldValidation.

---

# 22. FORM DEFINITION

A form should conceptually contain:

`
id
organizationId
name
key
description
entityType
status
currentVersionId
createdAt
updatedAt

`

Example:

`
key = dental-examination
entityType = clinical-record

`

---

# 23. FORM VERSION

`
formVersionId
formId
versionNumber
status
publishedAt
publishedBy
schemaSnapshot

`

A published version is immutable.

If changed:

`
Dental Examination v1
        ↓
Dental Examination v2

`

Old clinical records continue referencing v1.

---

# 24. FORM FIELD

Field definition:

`
id
formVersionId
sectionId
key
label
type
required
defaultValue
placeholder
helpText
order
visibleWhen
readOnlyWhen
validationConfig
referenceConfig

`

Supported types:

`
text
textarea
number
decimal
date
datetime
boolean
checkbox
radio
select
multiSelect
file
image
phone
email
reference

`

---

# 25. DYNAMIC VALUE STORAGE

Do NOT put the entire patient record into an uncontrolled JSON blob.

Core fields remain structured.

Dynamic form values use a controlled architecture:

`
FormSubmission
   ↓
FormValue

`

Concept:

`
formSubmissionId
entityType
entityId
formVersionId
fieldKey
value
valueType

`

The source explicitly says core searchable fields must remain proper structured fields and dynamic fields use controlled form/value architecture.

---

# 26. FORM VALIDATION

Validation must happen:

`
Frontend
+
Backend

`

Never trust frontend validation alone.

Examples:

`
required
min
max
pattern
allowedOptions
dateRange
referenceExists

`

---

# 27. CONDITIONAL FORM LOGIC

Example:

`
Has Allergy = Yes
       ↓
Show Allergy Details

`

Another:

`
Procedure = Root Canal
       ↓
Show Tooth Number

`

The rules are stored as configuration, not hard-coded per specialty.

---

# 28. FORM RENDERING FLOW

`
Screen
 ↓
Request Form
 ↓
Resolve Organization
 ↓
Resolve Branch
 ↓
Resolve Service
 ↓
Resolve Form Version
 ↓
Resolve Permissions
 ↓
Resolve Conditional Rules
 ↓
Render Form
 ↓
Validate
 ↓
Save Submission
 ↓
Audit
 ↓
Publish Event

`

---

# 29. WORKFLOW ENGINE

Collections:

`
workflows
workflowVersions
workflowSteps
workflowTransitions
workflowConditions
workflowActions
workflowInstances
workflowInstanceSteps

`

The source explicitly defines these workflow concepts.

---

# 30. WORKFLOW DEFINITION

Conceptual:

`
Workflow
 ├── name
 ├── key
 ├── entityType
 ├── status
 └── currentVersion

`

Example:

`
key = outpatient-visit
entityType = encounter

`

---

# 31. WORKFLOW VERSION

`
workflowId
versionNumber
status
publishedAt
publishedBy

`

Once used in a business record, the workflow version must remain historically identifiable.

---

# 32. WORKFLOW STEP

Example:

`
registration
appointment
checkin
queue
consultation
billing
followup

`

Each step has:

`
stepKey
name
type
order
requiredPermissions
formReference
serviceReference

`

---

# 33. WORKFLOW TRANSITION

A transition defines:

`
fromStep
toStep
action
conditions
permissions

`

Example:

`
Waiting
   ↓ Start
In Consultation

`

---

# 34. WORKFLOW CONDITIONS

Example:

`
payment.status == "paid"

`

or:

`
service.category == "lab"

`

or:

`
user.permission == "clinical.complete"

`

Conditions must be evaluated by a controlled rule engine.

Never execute arbitrary JavaScript from database configuration.

---

# 35. WORKFLOW ACTIONS

Allowed action types should be controlled.

Examples:

`
createRecord
updateRecord
createTask
createNotification
createInvoice
publishEvent
changeStatus

`

Do not allow unrestricted code execution through workflow configuration.

---

# 36. WORKFLOW INSTANCE

Every actual patient/business workflow gets an instance:

`
workflowInstanceId
workflowId
workflowVersionId
entityType
entityId
currentStep
status
startedAt
completedAt

`

Example:

`
workflow = outpatient-visit
entity = encounterId
currentStep = consultation

`

---

# 37. SERVICE ENGINE

Service collection:

`
services
serviceVersions
servicePrices
serviceRules

`

Core fields:

`
serviceId
name
category
departmentId
duration
price
tax
workflowId
formId
requiredRole
billingRules
status

`

These attributes are explicitly defined in the source architecture.

---

# 38. SERVICE VERSIONING

Prices and service rules can change.

Do not overwrite historical pricing blindly.

Example:

`
Root Canal
Price v1 = ₹5000
Price v2 = ₹6000

`

Old invoice remains ₹5000.

---

# 39. PERSON / PATIENT DATA MODEL

Core:

`
persons
patients
providers

`

Person:

`
personId
name
DOB
gender
contact
address

`

Patient:

`
patientId
personId
patientNumber
organizationId
branchId
status
registrationDate

`

This prevents duplicated identity records.

---

# 40. APPOINTMENT DATA MODEL

`
appointmentId
organizationId
branchId
patientId
providerId
serviceId
departmentId
scheduledStart
scheduledEnd
status
reason
notes

`

References:

`
Patient
Provider
Service
Branch

`

---

# 41. QUEUE DATA MODEL

`
queueEntryId
organizationId
branchId
patientId
appointmentId
encounterId
providerId
serviceId
queueType
position
status
calledAt
startedAt
completedAt

`

Queue is operational state, not the permanent clinical record.

---

# 42. ENCOUNTER DATA MODEL

`
encounterId
organizationId
branchId
patientId
providerId
serviceId
appointmentId
encounterType
status
workflowInstanceId
startedAt
completedAt

`

Encounter is the generic healthcare interaction.

Supported V1-compatible types:

`
consultation
procedure
lab
follow-up
emergency
admission

`

The source explicitly requires a generic encounter engine for future IPD/emergency/OT expansion.

---

# 43. CLINICAL RECORD

Core clinical record:

`
clinicalRecordId
encounterId
patientId
providerId
complaint
observation
diagnosis
treatment
prescription
notes

`

Specialty-specific information:

`
dynamic form submission

`

Therefore:

`
Dental
Eye
Skin
General
Specialty

`

do not require separate core clinical architectures.

Source explicitly requires this generic clinical structure.

---

# 44. TREATMENT

`
treatmentId
encounterId
patientId
serviceId
providerId
status
notes
formSubmissionId

`

Treatment may reference billable service.

---

# 45. PRESCRIPTION

`
prescriptionId
encounterId
patientId
providerId
status
items[]

`

Each item:

`
medicineReference
dose
frequency
duration
instructions

`

V2 Pharmacy can later consume this prescription without creating a second prescription system.

---

# 46. TRANSACTION ENGINE

Financial system remains separate from clinical system.

Core collections:

`
invoices
invoiceItems
payments
paymentAllocations
refunds
adjustments
ledgerEntries
receipts

`

Source explicitly requires this separation.

---

# 47. INVOICE

`
invoiceId
organizationId
branchId
patientId
encounterId
currency
status
subtotal
discount
tax
total
paidAmount
balance
issuedAt

`

---

# 48. INVOICE ITEM

`
invoiceItemId
invoiceId
serviceId
description
quantity
unitPrice
discount
tax
total
sourceEntityType
sourceEntityId

`

This allows:

`
Treatment → Invoice Item
Service → Invoice Item
Future Lab → Invoice Item
Future IPD → Invoice Item

`

without changing invoice architecture.

---

# 49. PAYMENT

`
paymentId
organizationId
branchId
patientId
invoiceId
amount
currency
method
status
reference
receivedAt
verifiedAt
verifiedBy

`

Methods:

`
cash
upi
card
bank_transfer
online_gateway
other

`

---

# 50. PAYMENT ALLOCATION

Do not assume:

`
1 Payment = 1 Invoice

`

Instead:

`
Payment
   ↓
PaymentAllocation
   ↓
Invoice

`

This supports:

`
partial payment
multiple invoices
advance payment
split allocation

`

and future corporate/insurance payments.

---

# 51. RECEIPT

`
receiptId
paymentId
invoiceId
patientId
receiptNumber
amount
method
issuedAt

`

Receipt should be generated from confirmed payment.

---

# 52. REFUND

Refund must reference original payment:

`
refundId
paymentId
amount
reason
status
approvedBy
processedAt

`

Never edit the original payment amount to simulate a refund.

---

# 53. LEDGER FOUNDATION

V1 does not become a full accounting system.

But financial movements should have a ledger foundation:

`
ledgerEntryId
organizationId
branchId
transactionType
referenceType
referenceId
amount
currency
direction
createdAt

`

Future accounting can consume it.

---

# 54. DOCUMENT ENGINE

Collections:

`
documents
documentVersions
documentLinks
documentPermissions

`

Source defines this generic structure.

---

# 55. DOCUMENT LINK

A document can attach to:

`
Patient
Encounter
Treatment
Invoice
Payment
Consent
Future Lab Result
Future IPD Record

`

Use generic:

`
entityType
entityId

`

plus tenant scope.

---

# 56. DOCUMENT VERSIONING

Never replace a historical document invisibly.

`
Document
 ↓
Version 1
Version 2
Version 3

`

Each version records:

`
uploadedBy
uploadedAt
storageReference
checksum

`

---

# 57. NOTIFICATION ENGINE

Collections:

`
notifications
notificationTemplates
notificationChannels
notificationEvents

`

Channels:

`
inApp
sms
email
whatsapp

`

Source requires this generic architecture so future channels do not require a new notification core.

---

# 58. EVENT-DRIVEN ARCHITECTURE

Every important business action publishes an event.

Examples:

`
patient.created.v1
appointment.created.v1
appointment.completed.v1
encounter.created.v1
encounter.completed.v1
invoice.created.v1
payment.received.v1
payment.verified.v1
document.uploaded.v1
workflow.completed.v1

`

Source explicitly requires an event system for V1.

---

# 59. EVENT ENVELOPE

Every event should contain a standard envelope:

`
eventId
eventType
eventVersion
occurredAt
organizationId
branchId
actorUserId
entityType
entityId
correlationId
causationId
payload

`

Example:

`
eventType:
payment.received.v1

entityType:
payment

entityId:
payment_123

correlationId:
encounter_123

`

---

# 60. EVENT VERSIONING

Never silently change the meaning of an existing event.

`
payment.received.v1

`

If breaking change is needed:

`
payment.received.v2

`

Old consumers continue working.

This is explicitly required by the source.

---

# 61. DOMAIN EVENT FLOW

Example payment:

`
Payment Service
      ↓
Payment Saved
      ↓
payment.received.v1
      │
      ├── Update Invoice
      ├── Generate Receipt
      ├── Notification
      ├── Audit
      └── Reporting Projection

`

Future:

`
      ├── Accounting
      ├── Insurance
      └── Corporate Billing

`

can subscribe without changing Payment core.

---

# 62. EVENT RELIABILITY

Business transaction and event publication must not create inconsistent state.

Use an event/outbox mechanism conceptually:

`
Business Change
      +
Event Record
      ↓
Committed
      ↓
Event Dispatcher
      ↓
Consumers

`

This prevents:

`
Payment saved
but
payment event lost

`

---

# 63. AUDIT ENGINE

All important entities include:

`
createdAt
createdBy
updatedAt
updatedBy
version

`

Separate:

`
auditLogs

`

Source explicitly defines these audit fields and separate AuditLog.

---

# 64. AUDIT LOG

`
auditLogId
organizationId
branchId
actorUserId
action
entityType
entityId
before
after
reason
timestamp
ip
deviceId
correlationId

`

Examples:

`
invoice.updated
payment.verified
patient.archived
role.permission.changed
form.published
workflow.published

`

---

# 65. AUDIT IMMUTABILITY

Audit logs must not be editable through normal application APIs.

No:

`
Edit Audit
Delete Audit

`

except controlled retention processes.

---

# 66. OPTIMISTIC CONCURRENCY

Every mutable core record contains:

`
version

`

Update concept:

`
Update where:
id = X
AND
version = 4

then:

version = 5

`

If current version is already 5:

`
409 Conflict

`

This prevents silent overwrites.

---

# 67. STATUS ENGINE

Do not hard-code status strings only in React.

Generic status support:

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

Business-specific workflows may define additional states.

---

# 68. SOFT DELETE / ARCHIVE

Healthcare records should not be physically deleted casually.

Use:

`
status
deletedAt
deletedBy
archiveReason

`

or equivalent archival fields.

Source specifically defines active/archived/deleted metadata and policy-based retention.

---

# 69. DATABASE DESIGN PRINCIPLE

Every major tenant-owned entity should have appropriate versions of:

`
id
organizationId
branchId
status
createdAt
createdBy
updatedAt
updatedBy
version
metadata

`

BUT:

Do not blindly duplicate every field into every collection.

Entity-specific design remains proper and structured.

metadata is only limited extensibility.

The source explicitly rejects making the entire system an uncontrolled JSON dump.

---

# 70. MONGODB COLLECTION GROUPS

# Identity

`
organizations
branches
departments
units
resources
persons
users
providers

`

# Authorization

`
roles
permissions
userRoles
rolePermissions

`

# Configuration

`
configurations
moduleConfigs
featureFlags

`

# Dynamic Engine

`
forms
formVersions
formSections
formFields
fieldOptions
fieldValidations
formSubmissions
formValues

workflows
workflowVersions
workflowSteps
workflowTransitions
workflowConditions
workflowActions
workflowInstances

`

# Healthcare

`
patients
appointments
queueEntries
encounters
clinicalRecords
treatments
prescriptions
followups

`

# Financial

`
services
serviceVersions
invoices
invoiceItems
payments
paymentAllocations
receipts
refunds
adjustments
ledgerEntries

`

# Documents

`
documents
documentVersions
documentLinks
documentPermissions

`

# Communication

`
notifications
notificationTemplates
notificationChannels

`

# Platform

`
auditLogs
events
outboxEvents
syncOperations
importJobs
exportJobs

`

---

# 71. INDEXING STRATEGY

Critical indexes must include tenant scope.

Examples:

`
patients:
organizationId + patientNumber

patients:
organizationId + phone

appointments:
organizationId + branchId + scheduledStart

appointments:
organizationId + providerId + scheduledStart

encounters:
organizationId + patientId + createdAt

invoices:
organizationId + patientId + status

payments:
organizationId + invoiceId + status

auditLogs:
organizationId + entityType + entityId

`

Unique indexes must be scoped appropriately.

---

# 72. DATA RELATIONSHIP GRAPH

`
Organization
   │
   ├── Branch
   │
   ├── Users
   │
   ├── Services
   │
   └── Patients
          │
          ├── Appointments
          │       │
          │       └── Encounter
          │
          └── Encounters
                  │
                  ├── Clinical Records
                  ├── Treatment
                  ├── Prescription
                  ├── Documents
                  └── Invoice
                           │
                           └── Payment
                                  │
                                  └── Receipt

`

---

# 73. APPOINTMENT → ENCOUNTER

When check-in happens:

`
Appointment
      ↓
Encounter created
      ↓
Queue Entry created

`

Appointment remains appointment history.

Encounter is separate clinical interaction.

---

# 74. WALK-IN → ENCOUNTER

`
Patient
 ↓
Walk-in
 ↓
Service
 ↓
Encounter
 ↓
Queue

`

No fake appointment is required.

---

# 75. QUEUE → CLINICAL

`
Queue Entry
 ↓
Start Consultation
 ↓
Encounter
 ↓
Clinical Workspace

`

Queue state and clinical state remain distinct.

---

# 76. CLINICAL → BILLING

`
Encounter
 ↓
Treatment
 ↓
Service
 ↓
Invoice Item
 ↓
Invoice

`

Clinical update must not mutate an already-settled financial transaction automatically.

---

# 77. PAYMENT → RECEIPT

`
Payment
 ↓
Verification
 ↓
Allocation
 ↓
Receipt
 ↓
Event
 ↓
Notification

`

---

# 78. ONLINE PAYMENT

`
Frontend
 ↓
Create Payment Intent
 ↓
Gateway
 ↓
Gateway Callback/Webhook
 ↓
Verify
 ↓
Payment
 ↓
Allocation
 ↓
Receipt

`

Do not mark payment as successful based solely on frontend callback.

---

# 79. OFFLINE PAYMENT

`
Manual Payment
 ↓
Reference / Screenshot
 ↓
Pending Verification
 ↓
Authorized User
 ↓
Verify
 ↓
Payment Confirmed
 ↓
Receipt

`

---

# 80. OFFLINE-FIRST FOUNDATION

V1 must have local persistence and synchronization foundation.

`
React App
   ↓
Local Store
   ↓
Sync Queue
   ↓
API
   ↓
Server

`

Source explicitly defines this local database → sync queue → server architecture.

---

# 81. SYNC OPERATION

Every mutation gets:

`
operationId
entityId
entityVersion
timestamp
deviceId
userId
operationType

`

as required by the source.

Additional recommended context:

`
organizationId
branchId
payload
correlationId

`

---

# 82. IDEMPOTENCY

If:

`
operationId = OP123

`

is received twice:

`
First request → process
Second request → return existing result

`

Never create:

`
2 payments
2 invoices
2 patients

`

from the same operation.

---

# 83. SYNC STATES

Local operation:

`
pending

`

Then:

`
syncing

`

Then:

`
synced

`

or:

`
conflict
failed

`

---

# 84. CONFLICT ENGINE

Possible policies:

`
last-write
server-wins
user-resolution
field-level-merge

`

Policy is entity-specific.

The source explicitly identifies these conflict strategies.

---

# 85. SYNC CONFLICT EXAMPLE

Device A:

`
Patient address = A
version = 4

`

Device B:

`
Patient address = B
version = 4

`

Server receives A:

`
version 4 → 5

`

Then B:

`
expected version = 4
server version = 5

`

Result:

`
Conflict

`

Do not silently overwrite.

---

# 86. API ARCHITECTURE

Base:

`
/api/v1

`

Modules:

`
/api/v1/auth
/api/v1/organizations
/api/v1/users
/api/v1/roles
/api/v1/permissions
/api/v1/patients
/api/v1/appointments
/api/v1/queue
/api/v1/encounters
/api/v1/clinical
/api/v1/services
/api/v1/billing
/api/v1/payments
/api/v1/documents
/api/v1/followups
/api/v1/notifications
/api/v1/reports
/api/v1/forms
/api/v1/workflows
/api/v1/audit
/api/v1/sync

`

---

# 87. API VERSIONING

V1:

`
/api/v1/...

`

Future:

`
/api/v2/...

`

Old APIs must not suddenly break.

Lifecycle:

`
Active
 ↓
Deprecated
 ↓
Retired

`

This is explicitly part of the V1/V2 compatibility architecture.

---

# 88. STANDARD API RESPONSE

Success:

`
{
  "success": true,
  "data": {},
  "meta": {}
}

`

Error:

`
{
  "success": false,
  "error": {
    "code": "...",
    "message": "...",
    "details": {}
  }
}

`

Never expose internal stack traces to users.

---

# 89. STANDARD ERROR CODES

Examples:

`
AUTH_REQUIRED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
CONFLICT
DUPLICATE_OPERATION
INVALID_STATE_TRANSITION
FEATURE_DISABLED
TENANT_SCOPE_ERROR
VERSION_CONFLICT
PAYMENT_VERIFICATION_REQUIRED

`

V2/V3 should reuse these conventions.

---

# 90. CONTROLLER RULE

Controllers should NOT contain:

`
billing calculations
workflow rules
permission business rules
patient logic
payment allocation logic

`

Controller:

`
Request
 ↓
Validate
 ↓
Call Application Service
 ↓
Return Response

`

---

# 91. APPLICATION SERVICE RULE

Example:

`
CreateAppointmentService

`

does:

`
permission
validation
availability
appointment creation
workflow start
event publish
audit

`

but does not contain raw HTTP details.

---

# 92. REPOSITORY RULE

Repository handles:

`
MongoDB persistence
queries
indexes
pagination
transactions

`

It does not decide:

`
whether a patient may be archived

`

That belongs to domain/application logic.

---

# 93. TRANSACTION BOUNDARIES

MongoDB transaction should be used where multiple writes must be atomic.

Example payment confirmation:

`
Payment
+
Allocation
+
Invoice balance
+
Receipt
+
Outbox event

`

should have a carefully defined consistency boundary.

Do not use database transactions for every read/write unnecessarily.

---

# 94. EVENT VS DIRECT CALL

Use direct service call when:

`
operation must immediately complete

`

Use event when:

`
other modules need to react

`

Example:

`
Payment Service

`

directly updates invoice.

Then publishes:

`
payment.received.v1

`

Notifications/reporting/integrations react asynchronously.

---

# 95. DYNAMIC DASHBOARD ARCHITECTURE

Dashboard configuration:

`
dashboardConfigs
dashboardWidgets
dashboardLayouts

`

Widget:

`
widgetKey
title
queryKey
permission
visibilityRule
position

`

Example:

`
todayAppointments
todayQueue
pendingPayments
revenue

`

No hard-coded dashboard layout per role.

---

# 96. REPORT ARCHITECTURE

Reports should consume controlled query services.

Do not allow arbitrary MongoDB queries from frontend.

`
Report Definition
 ↓
Permission
 ↓
Filters
 ↓
Query Service
 ↓
Result

`

---

# 97. IMPORT ARCHITECTURE

`
Upload
 ↓
Create Import Job
 ↓
Parse
 ↓
Map Fields
 ↓
Validate
 ↓
Preview
 ↓
Confirm
 ↓
Process
 ↓
Audit

`

Import jobs should be resumable/retriable.

---

# 98. EXPORT ARCHITECTURE

`
Export Request
 ↓
Permission
 ↓
Filters
 ↓
Export Job
 ↓
Generate
 ↓
Store File
 ↓
Audit
 ↓
Download

`

Large exports should not block API requests.

---

# 99. FILE STORAGE

Files should NOT be stored directly as giant binary data inside normal MongoDB business documents.

Use:

`
Document Metadata
+
Object/File Storage

`

MongoDB stores:

`
documentId
storageKey
mimeType
size
checksum

`

The application uses the document engine to control access.

---

# 100. SECURITY

Minimum architecture:

`
HTTPS
Password hashing
Authentication
RBAC
Tenant isolation
Branch scope
Input validation
Output filtering
Rate limiting
Secure headers
Audit logging
File access control
Secret management

`

---

# 101. HEALTHCARE DATA SECURITY RULE

Sensitive clinical data must not accidentally appear in:

`
logs
analytics
error messages
frontend debug logs
URLs

`

Use controlled logging.

---

# 102. LOGGING

Application logs:

`
requestId
correlationId
organizationId
userId
route
duration
status
errorCode

`

Do NOT log:

`
password
tokens
full clinical notes
payment secrets
private document contents

`

---

# 103. OBSERVABILITY

V1 must have:

`
Application logs
API logs
Audit logs
Sync logs
Error tracking
Performance metrics
Health checks

`

This is explicitly required from V1 so future debugging does not become difficult.

---

# 104. HEALTH CHECKS

At minimum:

`
/api/health
/api/ready

`

Check:

`
API
Database
Required dependencies

`

---

# 105. CORRELATION ID

Every important request gets:

`
correlationId

`

That ID should travel through:

`
API
Application Service
Database/audit context
Event
Notification
Logs

`

This makes an entire patient/payment operation traceable.

---

# 106. VERSIONING ARCHITECTURE

Version:

`
API
Events
Forms
Workflows
Configurations
Services
Price Lists
Documents

`

Source explicitly requires configuration and workflow versioning so changes do not corrupt historical records.

---

# 107. HISTORICAL IMMUTABILITY

If:

`
Workflow v1

`

was used for:

`
Encounter 100

`

and later:

`
Workflow v2

`

is published:

`
Encounter 100 → still v1
New Encounter → v2

`

Same rule for forms and price configurations.

---

# 108. V2 MODULE CONTRACT

V2 modules must consume:

`
Organization
User
Role
Permission
Patient
Provider
Encounter
Service
Workflow
Form
Transaction
Document
Event
Audit

`

V2 must NOT create:

`
V2Patient
V2User
V2Billing
V2Document

`

---

# 109. V2 EXAMPLE

Future IPD:

`
IPD
 ↓
Patient
 ↓
Encounter
 ↓
Admission
 ↓
Room/Bed
 ↓
Services
 ↓
Transactions
 ↓
Documents
 ↓
Events

`

Patient remains the V1 patient.

Billing remains the same transaction engine.

---

# 110. V2 PHARMACY

Future Pharmacy:

`
Prescription
 ↓
Pharmacy
 ↓
Inventory
 ↓
Dispense
 ↓
Transaction

`

Prescription already exists in V1.

No duplicate prescription architecture.

---

# 111. V2 LAB

Future Lab:

`
Service
 ↓
Encounter
 ↓
Lab Order
 ↓
Lab Result
 ↓
Document
 ↓
Notification

`

The Lab module references existing patient, encounter, service and document systems.

---

# 112. V3 INTEGRATION

Future V3:

`
AI
Analytics
Enterprise
Accounting
Interoperability

`

must consume:

`
Events
APIs
Core Entities
Audit
Reports

`

rather than modifying V1 core logic unnecessarily.

---

# 113. API CONTRACT RULE FOR FUTURE MODULES

Every new module must expose:

`
Routes
Application Services
Domain Models
Events
Permissions
Audit Actions
Configuration
Feature Flag

`

Example V2:

`
inventory.view
inventory.create
inventory.adjust
inventory.approve

`

No core permission rewrite.

---

# 114. MIGRATION CONTRACT

Never upgrade production by manually changing database structure.

Every future upgrade must have:

`
V1 → V2 migration
V2 → V3 migration

`

with:

`
forward migration
validation
rollback strategy where feasible
data compatibility checks
migration tests

`

Source explicitly requires defined migration scripts rather than manual database modification.

---

# 115. FEATURE DEPLOYMENT CONTRACT

A future module can be deployed disabled:

`
module = deployed
featureFlag = false

`

Then:

`
organization A = ON
organization B = OFF

`

This allows staged rollout.

---

# 116. TESTING ARCHITECTURE

V1 must include:

`
Unit Tests
Integration Tests
API Tests
Workflow Tests
Permission Tests
Sync Tests
Migration Tests

`

This exact testing direction is part of the source architecture.

---

# 117. UNIT TESTS

Test:

`
Permission rules
Invoice calculations
Payment allocation
Status transitions
Workflow conditions
Form validation
Version handling
Conflict rules

`

---

# 118. INTEGRATION TESTS

Test:

`
Patient → Appointment
Appointment → Encounter
Encounter → Queue
Encounter → Clinical
Treatment → Invoice
Payment → Receipt
Document → Patient
Follow-up → Appointment

`

---

# 119. API TESTS

Every public API must test:

`
Authorized
Unauthorized
Wrong tenant
Wrong branch
Invalid payload
Duplicate request
Version conflict
Feature disabled

`

---

# 120. WORKFLOW TESTS

Test:

`
valid transition
invalid transition
permission failure
condition failure
workflow version
workflow completion
workflow cancellation

`

---

# 121. PERMISSION TESTS

Example:

`
Doctor cannot refund payment
Receptionist cannot edit clinical record
Billing staff cannot modify diagnosis
Branch user cannot access another branch
Organization A user cannot access Organization B

`

---

# 122. SYNC TESTS

Test:

`
offline create
offline update
online sync
duplicate operation
failed sync
retry
conflict
server version mismatch

`

---

# 123. MIGRATION TESTS

Before V2:

`
V1 production dataset
       ↓
V2 migration
       ↓
Validate
       ↓
Run V2 compatibility tests

`

No migration should be considered complete merely because the script executed successfully.

---

# 124. DATABASE BACKUP

Production must have:

`
scheduled backups
retention policy
restore testing
backup monitoring

`

A backup that has never been restored/tested is not considered verified.

---

# 125. PERFORMANCE ARCHITECTURE

Avoid:

`
large unbounded queries
N+1 queries
full collection scans
giant patient payloads
giant dashboard payloads

`

Use:

`
pagination
indexes
projections
aggregation
caching where appropriate
background jobs

`

---

# 126. PAGINATION CONTRACT

List APIs should return:

`
items
page
pageSize
total
hasNext

`

or an equivalent cursor-based contract where appropriate.

Frontend must never load unlimited patient records.

---

# 127. SEARCH ARCHITECTURE

Search services should be entity-specific:

`
PatientSearchService
AppointmentSearchService
InvoiceSearchService

`

Search must respect:

`
tenant
branch
permission
status

`

---

# 128. CACHE RULE

Cache only data that is safe to cache.

Do not allow stale cache to incorrectly determine:

`
payment success
permission
clinical authorization
financial balance

`

Critical state comes from authoritative storage.

---

# 129. BACKGROUND JOBS

Use background processing for:

`
Notifications
Reports
Exports
Imports
Document processing
Event consumers
Sync processing

`

Do not block the user's HTTP request unnecessarily.

---

# 130. SCHEDULER

Scheduled jobs may handle:

`
Follow-up reminders
Appointment reminders
Notification retries
Pending payment checks
Report generation
Cleanup according to retention policy

`

---

# 131. FRONTEND ARCHITECTURE

React structure:

`
src/
├── app/
├── routes/
├── layouts/
├── components/
├── features/
│   ├── patients/
│   ├── appointments/
│   ├── queue/
│   ├── clinical/
│   ├── billing/
│   ├── documents/
│   ├── reports/
│   └── administration/
├── forms/
├── workflow/
├── permissions/
├── api/
├── offline/
├── state/
├── hooks/
├── utils/
└── types/

`

---

# 132. FRONTEND ROUTING

Routes must map to business screens from Document 1.

Example:

`
/dashboard

/patients
/patients/:patientId

/appointments
/appointments/:appointmentId

/queue

/clinical/encounters
/clinical/encounters/:encounterId

/billing/invoices
/billing/invoices/:invoiceId

/billing/payments

/documents
/followups

/reports

/admin/organization
/admin/users
/admin/roles
/admin/services
/admin/forms
/admin/workflows

`

---

# 133. ROUTE GUARDS

Every protected route evaluates:

`
Authentication
+
Permission
+
Feature Flag
+
Organization Scope

`

---

# 134. DYNAMIC UI

Frontend must consume configuration APIs.

For example:

`
GET /api/v1/forms/dental-examination

`

returns the published form definition.

React renders it.

Do not create:

`
DentalForm.tsx
EyeForm.tsx
SkinForm.tsx

`

for every configurable specialty unless a truly specialized interaction requires custom UI.

---

# 135. CUSTOM UI EXTENSION

Dynamic form engine handles standard fields.

Some highly specialized UI may use registered components.

Example:

`
fieldType = tooth-chart
renderer = ToothChartRenderer

`

The renderer is registered in code, while its presence/configuration is database-driven.

This keeps the system dynamic without making the entire application arbitrary JSON.

---

# 136. FRONTEND STATE

Separate:

`
Server State
UI State
Form State
Offline State
Authentication State

`

Do not put the entire application into one global store.

---

# 137. SERVER STATE

Use query/cache layer for:

`
Patients
Appointments
Queue
Invoices
Reports
Configuration
Forms
Workflows

`

Invalidate/refetch based on events/mutations.

---

# 138. OFFLINE FRONTEND

Offline-capable operations use:

`
Local Store
 ↓
Optimistic UI where safe
 ↓
Sync Queue
 ↓
Server

`

Critical financial actions should not be falsely shown as confirmed until authoritative confirmation exists.

---

# 139. API → FRONTEND ERROR MAPPING

Backend:

`
VERSION_CONFLICT

`

Frontend:

`
This record was changed elsewhere.
[Refresh]
[Review Changes]

`

Backend:

`
FORBIDDEN

`

Frontend:

`
You do not have permission to perform this action.

`

---

# 140. END-TO-END TECHNICAL FLOW

# Patient Creation

`
React
 ↓
POST /patients
 ↓
Auth
 ↓
Tenant Scope
 ↓
Permission
 ↓
Patient Service
 ↓
Person Repository
 ↓
Patient Repository
 ↓
Audit
 ↓
patient.created.v1
 ↓
Response

`

---

# 141. APPOINTMENT CREATION

`
React
 ↓
POST /appointments
 ↓
Auth
 ↓
Permission
 ↓
Validate Patient
 ↓
Validate Provider
 ↓
Validate Service
 ↓
Validate Schedule
 ↓
Create Appointment
 ↓
Start Workflow
 ↓
Audit
 ↓
appointment.created.v1
 ↓
Notification Consumer

`

---

# 142. CHECK-IN

`
POST /appointments/:id/check-in
 ↓
Permission
 ↓
Validate Appointment
 ↓
Create Encounter
 ↓
Create Queue Entry
 ↓
Update Appointment Status
 ↓
Audit
 ↓
encounter.created.v1

`

---

# 143. CONSULTATION

`
Queue
 ↓
Start
 ↓
Encounter
 ↓
Resolve Workflow
 ↓
Resolve Service
 ↓
Resolve Form Version
 ↓
Render Clinical Form
 ↓
Submit
 ↓
Clinical Record
 ↓
Treatment
 ↓
Prescription
 ↓
Audit
 ↓
Events

`

---

# 144. BILLING

`
Treatment
 ↓
Resolve Service
 ↓
Resolve Price Version
 ↓
Create Invoice
 ↓
Invoice Items
 ↓
Audit
 ↓
invoice.created.v1

`

---

# 145. PAYMENT

`
Invoice
 ↓
Payment Request
 ↓
Online / Offline
 ↓
Verification
 ↓
Payment
 ↓
Payment Allocation
 ↓
Invoice Balance
 ↓
Receipt
 ↓
payment.received.v1
 ↓
Notification
 ↓
Audit

`

---

# 146. FUTURE V2 CONNECTION EXAMPLE

Today:

`
Payment
 ↓
Transaction Engine

`

V2:

`
Payment
 ↓
Transaction Engine
 ↓
Insurance Allocation

`

V3:

`
Payment
 ↓
Transaction Engine
 ↓
Corporate Billing
 ↓
Accounting

`

Core payment does not change.

---

# 147. ARCHITECTURE FREEZE

Before development begins, these must be frozen:

`
1. Entity / ID strategy
2. Organization hierarchy
3. Multi-tenancy
4. User / Role / Permission
5. Core domain model
6. Dynamic Form Model
7. Dynamic Workflow Model
8. Service Model
9. Transaction Model
10. Document Model
11. Event Model
12. Audit Model
13. Versioning
14. Offline / Sync
15. API Contract

`

These are explicitly identified as the architecture freeze points.

---

# 148. V1 DEVELOPMENT DEPENDENCY GRAPH

`
Identity
   ↓
Organization
   ↓
User / Role / Permission
   ↓
Configuration
   ↓
Form Engine
   ↓
Workflow Engine
   ↓
Service Engine
   ↓
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
Treatment / Prescription
   ↓
Billing
   ↓
Payment
   ↓
Receipt
   ↓
Documents / Follow-up
   ↓
Notifications
   ↓
Reports

`

Offline, Audit and Events operate across the entire graph.

---

# 149. V1 MODULE BOUNDARIES

# Core Platform

`
Identity
Organization
RBAC
Configuration
Forms
Workflows
Services
Events
Audit
Documents
Notifications

`

# Healthcare

`
Patient
Appointment
Queue
Encounter
Clinical
Treatment
Prescription
Follow-up

`

# Finance

`
Invoice
Payment
Receipt
Refund
Ledger Foundation

`

# Platform

`
Offline
Sync
Import
Export
Reports
Monitoring

`

---

# 150. WHAT V1 MUST NOT DO

Do not build full:

`
IPD
OT
Blood Bank
Ambulance
Advanced ICU
Full Insurance/TPA
Full Pharmacy
Advanced Procurement
Advanced Accounting
Advanced AI
Advanced Enterprise Analytics

`

But leave extension contracts.

This distinction is explicitly defined in the source.

---

# 151. V2/V3 GOLDEN RULE

Same:

`
ID Strategy
Organization
User
Permission
Patient Identity
Service
Workflow
Form
Document
Events
Audit
API
Errors
Versioning
Time/Date
Currency
Localization
Security

`

This is the compatibility contract.

---

# 152. V2/V3 MUST BE ADDITIVE

Preferred:

`
V1 Core
   +
New Module
   +
New Permissions
   +
New Forms
   +
New Workflows
   +
New Events
   +
New Collections only where genuinely required

`

Avoid:

`
Rewrite V1
Rename core IDs
Duplicate patient
Duplicate billing
Duplicate user
Duplicate document

`

---

# 153. TECHNICAL SOURCE-OF-TRUTH RULE

If there is a conflict:

`
V1_MASTER_PRODUCT_SPEC
          ↓
V1_TECHNICAL_ARCHITECTURE
          ↓
V1_IMPLEMENTATION_PLAN
          ↓
CODE

`

Implementation must not silently change product behavior.

If technical impossibility is discovered:

`
STOP
 ↓
Document conflict
 ↓
Resolve architecture decision
 ↓
Update authoritative document
 ↓
Implement

`

Do not silently improvise.

---

# 154. FINAL ARCHITECTURE

`
                         V1 PLATFORM
                              │
        ┌─────────────────────┼──────────────────────┐
        │                     │                      │
        ▼                     ▼                      ▼
   IDENTITY/RBAC       CONFIGURATION           EVENT/AUDIT
        │                     │                      │
        ├──────────────┬──────┴──────┬───────────────┤
        ▼              ▼             ▼               ▼
      FORMS         WORKFLOWS      SERVICES       DOCUMENTS
        │              │             │               │
        └──────────────┼─────────────┼───────────────┘
                       ▼
                HEALTHCARE CORE
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     PATIENT      APPOINTMENT       ENCOUNTER
                       │              │
                       ▼              ▼
                     QUEUE         CLINICAL
                                      │
                             ┌────────┼────────┐
                             ▼        ▼        ▼
                         TREATMENT PRESCRIPTION
                             │
                             ▼
                         TRANSACTION
                             │
                 ┌───────────┼───────────┐
                 ▼           ▼           ▼
              INVOICE     PAYMENT      RECEIPT
                 │           │
                 └───────────┘
                       │
                       ▼
                   FOLLOW-UP
                       │
                       ▼
                 NOTIFICATIONS
                       │
                       ▼
                    REPORTS

                       │
                       ▼
                OFFLINE / SYNC

`

---

# 155. FINAL V2/V3 ARCHITECTURE

`
                         SHARED CORE
                             │
      ┌──────────────┬───────┼────────┬──────────────┐
      │              │       │        │              │
      ▼              ▼       ▼        ▼              ▼
     V1             V2      V3     Integrations    External Apps
      │              │       │
      │              │       │
Clinic Core       IPD      AI
Dental            Pharmacy Analytics
Appointment       Lab      Enterprise
Queue             Inventory Interop
Clinical          Insurance
Billing

`

No core rewrite.

---

# 156. FINAL ENGINEERING DEFINITION

V1 technical architecture is complete when the implementation has:

`
✓ Stable IDs
✓ Tenant isolation
✓ Organization hierarchy
✓ RBAC
✓ Configuration engine
✓ Feature flags
✓ Dynamic forms
✓ Form versioning
✓ Dynamic workflows
✓ Workflow versioning
✓ Service engine
✓ Patient/person model
✓ Appointment
✓ Queue
✓ Encounter
✓ Clinical records
✓ Treatment
✓ Prescription
✓ Transaction engine
✓ Invoice
✓ Payment
✓ Receipt
✓ Refund foundation
✓ Document engine
✓ Notifications
✓ Event system
✓ Audit
✓ Optimistic concurrency
✓ Soft delete
✓ Offline sync foundation
✓ Idempotency
✓ Conflict handling
✓ API versioning
✓ Event versioning
✓ Configuration versioning
✓ Import/export foundation
✓ Reports foundation
✓ Observability
✓ Migration framework
✓ Automated testing architecture
✓ V2/V3 extension contracts

`

---

# 157. DEVELOPMENT ORDER

Technical implementation follows this dependency order:

`
PHASE 1
Core Architecture
Database
IDs
Organization
Users
Roles
Permissions
Audit
API
Security

        ↓

PHASE 2
Module Configuration
Dynamic Forms
Workflow Engine
Service Engine
Dashboard Configuration
Templates
Events

        ↓

PHASE 3
Patients
Appointments
Queue
Encounter
Consultation
Clinical
Treatment
Prescription
Documents

        ↓

PHASE 4
Billing
Invoice
Payment
Receipt
Refund
Ledger Foundation

        ↓

PHASE 5
Notifications
SMS/Email Foundation
WhatsApp Architecture

        ↓

PHASE 6
Offline
Sync
Idempotency
Conflict Handling
Sync Dashboard

        ↓

PHASE 7
Reports
Import/Export
Backup
Monitoring
Security Hardening
Performance
Testing
Deployment

`

This sequence matches the source's defined V1 development order.

---

# 158. FINAL V1 TECHNICAL CONTRACT

The finished V1 must satisfy:

`
Frontend
      ↓
API
      ↓
Application Services
      ↓
Domain Services
      ↓
Repositories
      ↓
MongoDB

`

with cross-cutting:

`
Authentication
Authorization
Tenant Isolation
Audit
Events
Versioning
Offline Sync
Observability

`

and dynamic engines:

`
Configuration
Forms
Workflows
Services
Dashboard
Notifications

`

---

# 159. FINAL STATEMENT

The V1 is NOT a small temporary system.

It is:

`
Dynamic Healthcare Core
        +
Real Clinic Operations
        +
Financial Core
        +
Offline Foundation
        +
Extension Architecture

`

The source defines exactly this as the final V1 technical direction.

The objective is:

`
V1 → Production Business
V2 → New Healthcare Modules
V3 → Advanced Platform Capabilities

`

while keeping:

`
same identity
same organization
same patient
same permissions
same service engine
same workflow engine
same form engine
same transaction engine
same document engine
same events
same audit
same API conventions

`

so future versions are module additions, not software rewrites.
