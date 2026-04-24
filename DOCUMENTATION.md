# PowerAutomate — Technical Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Core Concepts](#4-core-concepts)
5. [Application Workflows](#5-application-workflows)
6. [API Reference](#6-api-reference)
7. [Server Actions](#7-server-actions)
8. [Component Architecture](#8-component-architecture)
9. [Data Models & Validation](#9-data-models--validation)
10. [Template System](#10-template-system)
11. [File Storage — UploadThing](#11-file-storage--uploadthing)
12. [Security & Input Validation](#12-security--input-validation)
13. [Configuration](#13-configuration)

---

## 1. Project Overview

PowerAutomate is a document automation platform built to streamline the generation of professional `.docx` documents from DOCX templates. It targets organizations that need to produce large volumes of structured documents — particularly onboarding and HR documents — in a consistent, repeatable way.

### The two primary use cases

**Standard Model Creator** — A user picks one or more template folders, fills in document metadata (version, author, company details), optionally excludes specific documents, and downloads a ZIP archive of the generated documents.

**Employee Automation** — A user registers one or more employees, assigns each a role and a set of appointments, chooses which documents to include per employee, and downloads a ZIP archive structured as `EmployeeName/Role/doc.docx` and `EmployeeName/Appointment/doc.docx`.

Both flows share the same underlying generation engine: templates stored in UploadThing cloud storage are fetched, have their placeholders substituted with live data, and are bundled into a ZIP file returned to the browser as a base64-encoded download.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                       Browser                        │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Model Creator│  │  Employee    │  │  Upload   │ │
│  │   /model-    │  │  Automation  │  │  Manager  │ │
│  │   creator    │  │  /employee-  │  │ /uploads  │ │
│  └──────┬───────┘  │  automation  │  └─────┬─────┘ │
│         │          └──────┬───────┘        │       │
└─────────┼─────────────────┼────────────────┼───────┘
          │                 │                │
          ▼                 ▼                ▼
┌─────────────────────────────────────────────────────┐
│                 Next.js Server Layer                 │
│                                                     │
│  Server Actions            API Routes               │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │send-model-entries│  │ GET  /api/templates       │ │
│  │generate-employee │  │ GET  /api/standard-models │ │
│  │       -docs      │  │ POST /api/uploads         │ │
│  └────────┬─────────┘  │ DEL  /api/uploads         │ │
│           │            │ POST /api/uploads/folder  │ │
│           │            │ POST /api/preview         │ │
│           │            │ GET  /api/preview         │ │
│           │            └──────────────┬────────────┘ │
└───────────┼───────────────────────────┼──────────────┘
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│     easy-template-x   │   │      UploadThing       │
│  (placeholder subst.) │   │  (cloud file storage)  │
└───────────────────────┘   └───────────────────────┘
            │
            ▼
┌───────────────────────┐
│        JSZip          │
│  (ZIP bundle output)  │
└───────────────────────┘
```

The application is a standard Next.js App Router project. Pages are React Client Components that communicate with the server either through **Next.js Server Actions** (for document generation) or through **API Routes** (for template listing and upload management). There is no separate backend service — everything runs inside the Next.js process.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | Routing, server actions, API routes |
| UI | React 19, Tailwind CSS 4 | Component rendering and styling |
| Forms | React Hook Form + Zod | Client-side form state and validation |
| Document generation | `easy-template-x` | DOCX template placeholder substitution |
| ZIP packaging | `jszip` | Bundling multiple DOCX files |
| Cloud storage | `uploadthing` | Storing and serving DOCX templates |
| Document preview | `docx-preview` | Client-side DOCX rendering in the browser |
| Image processing | `image-size` | Reading logo dimensions for scaling |
| Date formatting | `@formkit/tempo` | Consistent date display across the app |
| Icons | `lucide-react` | SVG icon components |
| Headless UI | `@headlessui/react` | Accessible dropdowns and comboboxes |
| HTTP client | `axios` | API requests from client components |

---

## 4. Core Concepts

### 4.1 Template Categories

All DOCX templates are organized into three top-level **categories**:

- **`roles`** — Documents that belong to a specific job role (e.g., "Security Guard onboarding package")
- **`appointments`** — Documents for specific appointments or overlays applied to an employee (e.g., "First-Aid Officer")
- **`standard-models`** — General-purpose document templates not tied to any employee

Within each category, templates are grouped into **folders**. A folder roughly corresponds to a document package — for example, a role might have a folder called "guard-level-1" that contains several DOCX files.

### 4.2 Placeholder System

Every template is a standard `.docx` file with `{PlaceholderName}` tokens embedded in the text. During generation, the server calls `easy-template-x` to replace each token with a runtime value. Images (logos) are handled via a special `easy-template-x` image descriptor object rather than a plain string.

The full set of supported placeholders is defined in the server actions and documented in [Section 10](#10-template-system).

### 4.3 UploadThing Custom ID Scheme

UploadThing, the cloud storage service used, normally assigns a random ID to each upload. PowerAutomate overrides this with a structured **custom ID** following the format:

```
{category}/{folderName}/{fileName}/{timestamp}
```

For example: `roles/guard-level-1/onboarding-checklist.docx/1714000000000`

This scheme means:
- The category, folder, and filename can be reconstructed from the ID alone — no separate database is needed.
- The timestamp suffix allows re-uploading the same file (new timestamp = new unique ID) while older versions can be cleaned up.
- The `/api/templates` and `/api/standard-models` routes filter and parse these IDs to reconstruct the folder/file hierarchy.

### 4.4 Document Generation Pipeline (High Level)

1. The client submits form data (employee list, metadata, excluded doc IDs) to a server action.
2. The server action queries UploadThing once to get all uploaded files in the relevant categories.
3. It deduplicates by filename within each folder (keeping the latest timestamp).
4. For each document to include, it fetches the template buffer from the UploadThing CDN URL and calls `easy-template-x` to substitute placeholders.
5. All generated DOCX files are added to a `JSZip` archive (with folder structure where applicable).
6. The ZIP is serialized as a `Uint8Array`, converted to a Node.js `Buffer`, then encoded as a base64 string and returned to the client.
7. The client decodes the base64 string into a `Blob` and triggers a browser download.


## 5. Application Workflows

### 5.1 Standard Model Creator (`/model-creator`)

```
1. Page loads → GET /api/standard-models → populates folder selector
2. User picks folders from dropdown → folders appear as pills
3. User expands a folder pill → document tree panel opens
4. User unchecks specific docs → excludedDocIds state updated
5. User fills metadata form (version, dates, creator, company info, logo)
6. Submit → generateDocument() server action
7. Server fetches templates, applies placeholders, zips docs
8. Client receives base64 ZIP → download triggered
```

### 5.2 Employee Automation (`/employee-automation`)

```
1. Page loads → GET /api/templates → populates role + appointment selectors
2. User fills EmployeeForm:
   a. Personal data (name, DOB, start date)
   b. Selects a role → role documents auto-selected
   c. Optionally selects appointments → appointment documents auto-selected
   d. Adjusts selected documents per section
3. "Add Employee" → employee appended to EmployeeTable
4. Repeat for all employees
5. Configure GlobalSidebar (company name, logo, address, footer metadata)
6. "Generate & Download" → generateEmployeeDocs() server action
7. Server builds nested folder structure per employee, applies all placeholders
8. Client receives base64 ZIP → download triggered
```

### 5.3 Template Management (`/uploads`)

```
1. Page loads → GET /api/templates + GET /api/standard-models
2. Templates rendered as category tabs (Roles / Appointments / Standard Models)
3. Create folder:
   a. User types folder name → POST /api/uploads/folder
   b. Server validates name → uploads placeholder file to UploadThing
   c. UI shows skeleton card → resolves to real card on success
4. Upload files:
   a. User drags DOCX into folder → POST /api/uploads (multipart)
   b. Client-side: magic byte + filename validation
   c. Server-side: same validation + UploadThing deduplication
   d. UI shows skeleton file rows → resolve on success
5. Delete file: DELETE /api/uploads?fileKey=<key>
6. Delete folder: DELETE /api/uploads?folderPrefix=<prefix>
   (fetches all files with that prefix, deletes each)
```

---

## 6. API Reference

All routes are under `app/api/`. They are standard Next.js Route Handlers (App Router).

### `GET /api/templates`

Lists all Role and Appointment folders with their documents.

**Response:**
```typescript
{
  roles: FolderWithDocs[],
  appointments: FolderWithDocs[]
}

type FolderWithDocs = {
  id: string          // e.g. "roles/guard-level-1"
  name: string        // e.g. "Guard Level 1"
  documents: {
    id: string        // UploadThing fileKey
    name: string      // e.g. "Onboarding Checklist"
    customId: string  // full custom ID string
    url: string       // UploadThing CDN URL
  }[]
}
```

Folders within each category are sorted alphabetically. Results from both categories are fetched in parallel.

---

### `GET /api/standard-models`

Same structure as `/api/templates` but only returns `standardModels: FolderWithDocs[]`.

---

### `POST /api/uploads`

Uploads one or more DOCX files to a specified category/folder.

**Request:** `multipart/form-data`
- `category` (string): `roles | appointments | standard-models`
- `folderName` (string): target folder slug
- `files` (File[]): one or more `.docx` files

**Server-side per file:**
1. Validates filename (sanitize.ts)
2. Validates DOCX magic bytes
3. Checks for existing file with same name in that folder; if found, deletes it first
4. Uploads buffer to UploadThing with customId `{category}/{folderName}/{fileName}/{Date.now()}`

**Response:**
```typescript
{
  results: Array<{
    fileName: string
    success: boolean
    error?: string
  }>
}
```

---

### `DELETE /api/uploads`

Deletes a single file or all files in a folder.

**Query parameters (one of):**
- `fileKey` — deletes a single file by its UploadThing key
- `folderPrefix` — deletes all files whose customId starts with this prefix

---

### `POST /api/uploads/folder`

Creates a new folder by uploading a `.gitkeep`-style placeholder file.

**Request body (JSON):**
```typescript
{ category: string, folderName: string }
```

**Behaviour:** validates the folder name, checks no folder with that slug already exists, then uploads a placeholder buffer with customId `{category}/{folderSlug}/.folder`.

---

### `POST /api/preview`

Temporarily stores a generated document for external viewers.

**Request body (JSON):**
```typescript
{ document: string }  // base64-encoded DOCX
```

**Response:** `{ id: string }` — a UUID used to retrieve the document.

Documents expire after 5 minutes. A cleanup loop runs on each POST to remove expired entries from the in-memory `Map`.

---

### `GET /api/preview?id=<id>`

Retrieves a previously stored document and returns it as `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

---

## 7. Server Actions

Server actions live in `app/actions/`. They are Next.js `"use server"` async functions called directly from client components.

### `generateDocument(formData)` — `send-model-entries.ts`

Generates a ZIP of documents for the Standard Model Creator workflow.

**Parameters:**
```typescript
{
  folders: string[]           // selected folder IDs
  excludedDocIds: string[]    // document IDs to skip
  // metadata fields:
  docVersion, createdBy, approvedBy, docDate,
  companyName, companyStreet, companyZip,
  companyCity, companyCountry, companyAddressLine,
  logoBase64?: string, logoMimeType?: string
}
```

**Process:**
1. Calls `listTemplateFiles()` to get all `standard-models/` files from UploadThing.
2. Groups files by folder, deduplicates by filename (latest timestamp wins).
3. Filters to only selected folders and non-excluded documents.
4. Processes logo (resizes to max 150×60px while preserving aspect ratio).
5. For each document: fetches buffer, calls `TemplateHandler.process()` with substitution data.
6. Adds each generated DOCX to a `JSZip` instance under a `documents/` root folder.
7. Returns `{ zipBase64: string }`.

---

### `generateEmployeeDocs(employees, globalProperties)` — `generate-employee-docs.ts`

Generates a ZIP containing a folder per employee, each with role and appointment sub-folders.

**Parameters:**
```typescript
employees: Employee[]
globalProperties: GlobalProperties
```

**Process:**
1. Fetches all role and appointment templates from UploadThing in one call.
2. Builds a lookup map: `customId → { url, fileKey }`.
3. For each employee:
   - Looks up the employee's role from `ROLES` config.
   - Generates selected role documents into `{FullName}/{RoleName}/`.
   - For each selected appointment, generates documents into `{FullName}/{AppointmentName}/`.
   - All placeholder substitution includes both employee-specific and global properties.
4. Returns `{ zipBase64: string }`.

---

## 8. Component Architecture

### 8.1 Page Components

| Page | Path | Description |
|---|---|---|
| Home | `app/page.tsx` | Marketing landing with links to the two tools |
| Model Creator | `app/model-creator/page.tsx` | Standard document generation workflow |
| Employee Automation | `app/employee-automation/page.tsx` | Batch employee document generation |
| Upload Manager | `app/uploads/page.tsx` | Template CRUD |

All page components are Client Components (`"use client"`). They fetch initial data via `axios` from the API routes on mount.

### 8.2 Document Components (`components/document/`)

**`DocumentForm`**

The primary form for the Standard Model Creator. Manages:
- A controlled list of selected folders (as dismissible pills)
- A document tree explorer panel (shown when a folder pill is clicked), where individual documents can be checked/unchecked
- Logo upload with client-side base64 conversion
- All document metadata fields
- Submission to `generateDocument()` server action

State shape:
```typescript
{
  selectedFolders: FolderWithDocs[]
  excludedDocIds: Set<string>      // docs the user unchecked
  activeFolder: FolderWithDocs | null  // drives the tree panel
  generatedDocs: GeneratedDoc[]    // returned from server action
  logoBase64: string | null
}
```


### 8.3 Employee Components (`components/employee/`)

**`EmployeeForm`**

Handles both **adding** and **editing** employees. Built on React Hook Form + Zod. Key behaviors:
- When a role is selected, all documents for that role are auto-selected.
- When an appointment is added, all its documents are auto-selected.
- When an appointment is removed, its documents are deselected.
- "Use Guard ID as Employee ID" checkbox syncs the two ID fields.
- Document selection panels show a toggle-all checkbox plus individual checkboxes per document.

**`EmployeeTable`**

Displays the queue of employees awaiting generation. Features client-side search by name and pagination (5 rows per page). Edit is triggered by a hover icon; delete requires a double-click confirmation to prevent accidental removal.

**`GlobalSidebar`**

A collapsible sticky panel that holds company-wide properties shared across all employees in the current batch: company name, email, address, logo, and document footer metadata (version, date, creator, approver). All state is lifted to the parent page component.

---

### 8.4 UI Primitives (`components/ui/`)

All primitives are plain React components with Tailwind utility classes. None use a third-party component library directly (Headless UI is used internally for `MultiSelect`).

| Component | Description |
|---|---|
| `Button` | Primary / outline / ghost variants, loading spinner state |
| `Input` | Text field with optional left icon and error message |
| `Select` | Single-option dropdown |
| `MultiSelect` | Searchable multi-option picker (uses `@headlessui/react` Combobox) |
| `DatePicker` | Date input backed by `@formkit/tempo` formatting |
| `FileDropzone` | Drag-and-drop zone with visual feedback |
| `FormField` | Label + description + error wrapper for any form control |
| `Card` | Layout container with header / content / footer slots |
| `Badge` | Small status tag with color variants |
| `Toast` | Dismissible success/error notification |

---

## 9. Data Models & Validation

### 9.1 Core Types (`lib/types/employee.ts`)

```typescript
interface Employee {
  id: string
  fullName: string
  birthday: string           // ISO date string YYYY-MM-DD
  startDate: string          // ISO date string YYYY-MM-DD
  roleId: string
  appointmentIds: string[]
  selectedRoleDocIds: string[]
  selectedAppointmentDocIds: string[]
  roleType?: string
  trainingHours?: string
  guardIDNumber?: string
  employeeIDNumber?: string
  useGuardAsEmployeeId?: boolean
}

interface Role {
  id: string
  name: string
  description?: string
  documents: RoleDocument[]
}

interface Appointment {
  id: string
  name: string
  description?: string
  documents: AppointmentDocument[]
}

interface GlobalProperties {
  companyName?: string
  companyEmail?: string
  companyAddress?: string
  companyLogo?: string        // base64
  documentVersion?: string
  documentDate?: string
  createdBy?: string
  approvedBy?: string
}
```

### 9.2 Zod Schemas

**`modelFormSchema`** (`lib/validations/model-form.ts`)

Validates the Standard Model Creator form submission. Required fields: `folders` (non-empty array), `docVersion`, `createdBy`, `approvedBy`, `docDate`, `companyName`. Date values are transformed to `YYYY.MM.DD` format before reaching the server action.

**`employeeFormSchema`** (`lib/validations/employee-form.ts`)

Validates employee registration. Required: `fullName` (2–100 chars), `birthday`, `startDate`, `roleId`. All other fields are optional strings.

### 9.3 Static Configuration (`lib/data/employee-config.ts`)

The `ROLES` and `APPOINTMENTS` arrays are the static registry that drives the role/appointment selectors in the UI. Each entry declares an `id`, a display `name`, and a `documents` array listing the document names within that folder. These document names must match the folder structure in UploadThing.

---

## 10. Template System

### 10.1 Placeholder Reference

All placeholders follow the `{PascalCase}` convention expected by `easy-template-x`.

**Company / Document Metadata**

| Placeholder | Source |
|---|---|
| `{CompanyName}` | Form field |
| `{CompanyEmail}` | Global properties |
| `{CompanyAddress}` | Concatenated address string |
| `{CompanyStreet}` | Individual field |
| `{CompanyZip}` | Individual field |
| `{CompanyCity}` | Individual field |
| `{CompanyCountry}` | Individual field |
| `{CompanyAddressLine}` | Optional second address line |
| `{Logo}` | Image object (see below) |
| `{DocVersion}` | Form field |
| `{DocDate}` | Form field |
| `{CreatedBy}` | Form field |
| `{ApprovedBy}` | Form field |
| `{currentDate}` | Auto-injected at generation time |

**Employee-Specific**

| Placeholder | Source |
|---|---|
| `{FullName}` | `employee.fullName` |
| `{Birthday}` | `employee.birthday` (formatted) |
| `{StartDate}` | `employee.startDate` (formatted) |
| `{RoleName}` | Resolved from `employee.roleId` |
| `{RoleType}` | `employee.roleType` |
| `{TrainingHours}` | `employee.trainingHours` |
| `{GuardIDNumber}` | `employee.guardIDNumber` |
| `{EmployeeIDNumber}` | `employee.employeeIDNumber` |

### 10.2 Logo Handling

The `{Logo}` placeholder expects an `easy-template-x` image descriptor:

```typescript
{
  _type: "image",
  source: Buffer,         // raw image bytes
  format: string,         // MIME type, e.g. "image/png"
  width: number,          // in EMUs (English Metric Units)
  height: number
}
```

Before constructing this descriptor, the server action:
1. Reads the original image dimensions via `image-size`.
2. Scales down proportionally so neither dimension exceeds 150×60 px.
3. Converts the pixel values to EMUs (1 px = 9144 EMUs).

### 10.3 Date Formatting

Dates stored as ISO strings (`YYYY-MM-DD`) are displayed to the end user in the format produced by `@formkit/tempo`. The `{DocDate}` placeholder uses dots as separators (`YYYY.MM.DD`). The auto-injected `{currentDate}` uses the long format (e.g., `"April 24, 2026"`).

---

## 11. File Storage — UploadThing

### 11.1 SDK Wrapper (`lib/uploadthing.ts`)

The wrapper exposes four functions used throughout the app:

| Function | Description |
|---|---|
| `listTemplateFiles()` | Returns all files with status `"Uploaded"` (excludes deletion-pending files) |
| `uploadTemplateFile(buffer, fileName, mimeType, customId)` | Uploads a buffer with a given custom ID |
| `deleteTemplateFile(fileKey)` | Deletes a file by its UploadThing key |
| `fetchTemplateBuffer(url)` | Fetches a template from its CDN URL and returns a `Buffer` |

### 11.2 Deduplication Logic

When a file is uploaded via `POST /api/uploads`, the server:
1. Constructs the expected customId prefix: `{category}/{folderSlug}/{sanitizedFileName}/`.
2. Searches existing files for a match on that prefix (ignoring the timestamp suffix).
3. If found, deletes the old version before uploading the new one.

This ensures that the latest version of a file is always returned when listing, without accumulating stale copies.

### 11.3 Parsing Custom IDs

The `parseCustomId()` utility (used in the API routes) parses a raw custom ID string into its constituent parts:

```typescript
// 4-segment (current format)
"roles/guard-level-1/checklist.docx/1714000000000"
→ { category: "roles", folderName: "guard-level-1", fileName: "checklist.docx" }

// 3-segment (legacy format — still supported)
"roles/guard-level-1/checklist.docx"
→ { category: "roles", folderName: "guard-level-1", fileName: "checklist.docx" }
```

---

## 12. Security & Input Validation

### 12.1 Filename Validation (`lib/sanitize.ts`)

`validateFileName(name)` is applied to every uploaded DOCX filename. It rejects:
- Path traversal sequences (`..`, multiple slashes, backslashes)
- Shell metacharacters (`;`, `|`, `&`, `$`, `` ` ``)
- Null bytes and control characters
- Angle brackets and quotes
- Any extension other than `.docx`

Accepted: Unicode letters and numbers, spaces, hyphens, underscores, dots.

`validateFolderName(name)` is similar but additionally:
- Converts to a URL-safe kebab-case slug
- Normalizes German umlauts: ä→ae, ö→oe, ü→ue, Ä→Ae, Ö→Oe, Ü→Ue, ß→ss
- Allows commas in display names (stripped in the slug)

### 12.2 DOCX Magic Byte Validation

`validateDocxMagic(buffer)` checks the first four bytes of the uploaded file against the PK ZIP header (`0x50 0x4B 0x03 0x04`). Since DOCX files are ZIP archives, this ensures that non-DOCX files (e.g., a renamed `.exe`) are rejected even if they pass the extension check.


## 13. Configuration

### 13.1 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `UPLOADTHING_TOKEN` | Yes | UploadThing API token (JWT) |

Stored in `.env` at the project root (not committed to version control).

### 13.2 `next.config.ts`

Minimal configuration. The `serverActions.bodySizeLimit` setting is present but commented out — it was removed to allow large DOCX uploads without a size cap.

### 13.3 `tsconfig.json`

- Target: `ES2017`
- Strict mode enabled
- Path alias: `@/*` maps to the project root, enabling imports like `import { cn } from "@/lib/utils"`

### 13.4 ESLint (`eslint.config.mjs`)

Extends `eslint-config-next/core-web-vitals` with TypeScript-aware rules. Run via `pnpm lint`.

### 13.5 Tailwind CSS

Tailwind CSS 4 configured through PostCSS (`postcss.config.mjs`). Custom utilities defined in `app/globals.css`:
- `.custom-scrollbar` — styled scrollbar for sidebars
- `@keyframes shimmer` — loading skeleton animation
- `@keyframes fade-in-up` — card entrance animation

---

## 14. Running the Project Locally

### 14.1 Prerequisites

- **Node.js** 18 or later
- **pnpm** — install with `npm install -g pnpm` if not already present
- An **UploadThing** account and API token

### 14.2 Installation

```bash
# Clone the repository
git clone <repository-url>
cd PowerAutomate

# Install dependencies
pnpm install
```

### 14.3 Environment Setup

Create a `.env` file at the project root:

```env
UPLOADTHING_TOKEN='your_uploadthing_token_here'
```

The `UPLOADTHING_TOKEN` is a JWT obtained from the UploadThing dashboard. Without it the app starts but all template listing and upload operations will fail.

### 14.4 Start the Development Server

**Web app only (Next.js):**

```bash
pnpm dev
```

The app is available at `http://localhost:3000`.

**Desktop app (Next.js + Electron):**

```bash
pnpm run electron:dev
```

This starts both the Next.js server and the Electron shell concurrently.

### 14.5 Build for Production

```bash
pnpm build
```

Builds the Next.js app and runs the Electron post-build script that copies the standalone output into `electron/standalone/`.

### 14.6 Package the Desktop App

```bash
pnpm run dist:linux   # AppImage + DEB
pnpm run dist:win     # Windows NSIS installer
pnpm run dist:mac     # macOS DMG
pnpm run dist:all     # All platforms
```

### 14.7 Linting

```bash
pnpm lint
```
