# CivicSync
### Improving Transparency and Coordination in Public Works Projects

## Overview

CivicSync is a civic technology platform designed to improve transparency, accountability, and coordination in public infrastructure projects. It connects citizens and municipal authorities through a centralized platform where residents can discover public works in their neighbourhood, track construction progress, report issues, and verify on-site activity.

Public works such as road resurfacing, drainage construction, underground cable installation, and pipeline replacement are often managed by different departments with limited coordination. This can result in repeated road excavation, construction delays, traffic disruptions, and a lack of public accountability.

CivicSync addresses these challenges by bringing project information, citizen feedback, progress reports, and coordination insights into one accessible platform.

## Video

https://drive.google.com/drive/folders/1YeAJCUOmSVNbsE-G4WbIe5_DQpSmC1Bt?usp=sharing

## Features

### 1. Public Works Discovery and Tracking
- Browse planned, ongoing, and delayed infrastructure projects.
- View project details, including department, location, contractor, budget, start date, and expected completion date.
- Search and filter projects by name, department, and status.
- Sort projects by proximity to the citizen's location.
- View estimated remaining project duration and reported disruptions.

### 2. Interactive Neighborhood Map
- Visualize public works across Chennai using an interactive map.
- Display color-coded markers for planned, ongoing, delayed, and reported projects.
- Explore nearby construction activity and identify potential disruptions.
- View project details through map interactions.

### 3. Citizen Complaints and Issue Reporting
- Submit complaints related to public infrastructure and municipal services.
- Associate complaints with relevant departments and locations.
- Track complaint statuses, including Submitted, Under Review, and Resolved.
- Allow authorities to update complaint statuses and keep citizens informed.

### 4. Citizen Site Progress Reports
- Upload photographs showing the current state of construction sites.
- Associate reports with specific public works projects.
- Categorize reported conditions, such as active work, stalled construction, or restored roads.
- Display community-submitted reports and their verification status.
- Use community feedback to highlight potentially stalled or abandoned projects.

### 5. Visual Site Verification
- Provide a workflow for inspecting construction-site photographs.
- Evaluate reported site conditions to help identify discrepancies between expected and observed progress.
- Present inspection results through the authority dashboard.

### 6. Coordination Clash Detection
- Identify overlapping or conflicting public works scheduled on the same street.
- Display affected projects, departments, severity, and detection timestamps.
- Generate actionable recommendations to improve coordination between departments.
- Help authorities avoid repeated excavation and unnecessary disruption.

### 7. Municipal Authority Dashboard
- View and manage registered public works projects.
- Monitor complaints and citizen-submitted site reports.
- Review coordination clashes and their severity.
- Update complaint statuses and refresh project information.
- Use citizen feedback to improve project monitoring and accountability.

### 8. Citizen and Authority Views
- Provide separate interfaces for citizens and municipal authorities.
- Give citizens visibility into infrastructure activity and a way to report concerns.
- Equip authorities with tools for monitoring projects, resolving complaints, and coordinating work.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js (App Router) | Application framework, routing, frontend rendering, and backend API routes |
| TypeScript | Type-safe application development |
| Tailwind CSS | Responsive styling and layout |
| shadcn/ui | Reusable UI components and interface elements |
| Leaflet.js | Interactive map rendering |
| React-Leaflet | React integration for map components |
| Supabase | PostgreSQL database and image storage |
| Next.js API Routes | Server-side operations, including clash detection and photo verification |
| OpenStreetMap | Map tiles and geographic visualization |

## Architecture / How It Works

CivicSync follows a full-stack web architecture in which the Next.js application handles the user interface, navigation, and server-side API operations.

```text
                    CivicSync
                        |
          +-------------+-------------+
          |                           |
     Citizen View                Authority View
          |                           |
          +-------------+-------------+
                        |
              Next.js Application
          (App Router + TypeScript)
                        |
          +-------------+-------------+
          |             |             |
     Project Data   Complaints    Site Reports
          |             |             |
          +-------------+-------------+
                        |
                 API Routes
          +-------------+-------------+
          |                           |
    Clash Detection             Photo Verification
          |                           |
          +-------------+-------------+
                        |
              Supabase PostgreSQL
                 + Storage
                        |
             Interactive Map View
             (Leaflet + OSM)
```

### Core Workflows

**Project tracking:** Citizens browse projects, filter by status or department, and inspect information about planned and ongoing infrastructure work.

**Complaint management:** Citizens submit infrastructure complaints. Authorities review the submissions and update their statuses so that progress is visible to residents.

**Site progress verification:** Citizens submit site photographs associated with a project. The verification workflow evaluates the reported condition and presents the result to authorities.

**Coordination clash detection:** The application compares public works schedules and locations to identify potential conflicts. Detected clashes are presented with severity information and recommendations for coordinating the affected projects.

**Data management:** Supabase provides persistent storage for structured project information and, where configured, citizen-submitted photographs.

## Project Structure

```text
civic/
├── .vscode/
│   └── launch.json
├── app/
│   ├── conversations/
│   │   └── page.tsx
│   ├── projects/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── authority/
│   │   ├── AddProjectModal.tsx
│   │   ├── AuthorityMap.tsx
│   │   ├── AuthorityProjects.tsx
│   │   ├── check_complaints.sql
│   │   ├── ComplaintsPanel.tsx
│   │   ├── CoordinationClashesPanel.tsx
│   │   ├── LocationPicker.tsx
│   │   ├── ProposalForm.tsx
│   │   └── ReportsPanel.tsx
│   ├── citizen/
│   │   ├── CappedList.tsx
│   │   ├── ComplaintLog.tsx
│   │   ├── ComplaintModal.tsx
│   │   ├── PhotoUploadModal.tsx
│   │   └── ProjectCombobox.tsx
│   ├── layout/
│   │   ├── DisruptionBanner.tsx
│   │   ├── Navbar.tsx
│   │   └── ViewProvider.tsx
│   └── map/
│       ├── ProjectDrawer.tsx
│       └── PublicWorksMap.tsx
├── data/
│   ├── mockDepartments.json
│   └── mockProjects.json
├── lib/
│   ├── data.ts
│   ├── email.ts
│   ├── gemini.ts
│   ├── projectUtils.ts
│   ├── supabase.ts
│   ├── timeAgo.ts
│   └── useNow.ts
├── types/
│   └── index.ts
├── .env.local
├── .gitignore
├── AGENTS.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

### Directory Overview

- **`app/`** — Next.js App Router pages, global styles, and application layout.
- **`components/authority/`** — Municipal authority dashboard, project management, complaint handling, coordination clash detection, and report management.
- **`components/citizen/`** — Citizen-facing complaint submission, project selection, and site photo upload components.
- **`components/layout/`** — Shared navigation, disruption alerts, and view management.
- **`components/map/`** — Interactive public works map and project detail drawer.
- **`data/`** — Mock project and department data used by the application.
- **`lib/`** — Data access, Supabase integration, email utilities, Gemini integration, project helpers, and time utilities.
- **`types/`** — Shared TypeScript type definitions.
- **`public/`** — Static assets, if present in the repository.
- **Configuration files** — Next.js, TypeScript, ESLint, npm, and Git configuration.

## Installation

### Prerequisites

- Node.js (a current LTS release is recommended)
- npm
- Git
- A Supabase project if persistent database and storage features are enabled

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd civicsync
```

Replace the repository URL with the actual GitHub URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root.

Add the environment variables required by the application. For example, if the application uses the Supabase JavaScript client:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Use the actual variable names expected by your code and your Supabase project credentials. Never expose a Supabase service-role key in client-side code or commit secrets to Git.

If the application currently uses mock data, configure Supabase only when required by the implemented features.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

Run the build command to check whether the application compiles successfully before deployment.

## Usage

### For Citizens

1. Open CivicSync and navigate to the public works section.
2. Explore projects using the interactive map or project listings.
3. Search for nearby projects and filter them by status or department.
4. Review project schedules, contractors, budgets, and reported disruptions.
5. Submit a complaint when an infrastructure issue needs attention.
6. Upload a site photograph to report the observed state of a construction project.
7. Follow complaint updates and review reports submitted by other citizens.

### For Municipal Authorities

1. Switch to the authority interface.
2. Review registered projects and their current statuses.
3. Inspect citizen complaints and update their statuses.
4. Review submitted site reports and verification results.
5. Examine detected coordination clashes.
6. Use the recommendations to coordinate project schedules and reduce repeated excavation.

## Example

Consider a road in Chennai where drainage construction and water-main replacement are scheduled close together.

Without a shared coordination platform, one department might restore the road after completing its work, only for another department to excavate the same road shortly afterward.

With CivicSync:

1. Both public works projects are registered with their respective departments, locations, and schedules.
2. The coordination engine identifies a potential overlap between the projects.
3. The authority dashboard displays the affected projects, severity, and a recommendation to coordinate the work.
4. Residents can view the projects and understand the reason for construction-related disruptions.
5. Citizens submit photographs and reports to highlight stalled work or discrepancies at the site.
6. Authorities use the information to coordinate schedules and improve accountability.

This workflow demonstrates how shared project information and citizen participation can help reduce avoidable disruption.

## Design Decisions

### Unified Application Architecture
Next.js combines the frontend, routing, and server-side API endpoints in a single repository, reducing deployment complexity and avoiding the need for a separate backend service.

### TypeScript
TypeScript helps identify type errors and maintain consistent data structures across project records, complaints, reports, and API responses.

### Tailwind CSS and shadcn/ui
These technologies enable consistent styling, reusable components, and responsive interfaces while reducing the amount of custom CSS required.

### Leaflet and OpenStreetMap
An open-source mapping stack provides geographic visualization without requiring a paid mapping API by default. Tile-provider terms and usage limits still apply.

### Supabase
PostgreSQL supports structured data such as projects, complaints, and reports. Supabase Storage can be used to store photographs and associate them with the relevant records.

### Coordination-Focused Design
The platform goes beyond displaying projects by identifying potential conflicts and presenting recommendations that can help municipal authorities coordinate infrastructure work.

### Citizen Participation
Citizen-submitted reports provide an additional source of information about on-site conditions, complementing official project records.

## Challenges & Solutions

### Fragmented Public Works Information
**Challenge:** Project details are often spread across departments, making it difficult to understand the full scope of construction in a neighborhood.

**Solution:** CivicSync presents project information through a centralized listing and interactive map.

### Overlapping Construction Schedules
**Challenge:** Different departments may schedule work on the same street during overlapping periods.

**Solution:** A clash-detection workflow highlights potential conflicts and provides recommendations for coordination.

### Limited Visibility into On-Site Progress
**Challenge:** Official project status may not always reflect the actual conditions at a construction site.

**Solution:** Citizen-submitted photographs and site reports provide additional information for review and verification.

### Complaint Follow-Up
**Challenge:** Residents may not know whether their complaints have been reviewed or resolved.

**Solution:** Status tracking makes complaint progress visible through the citizen interface.

### Deployment and Integration Constraints
**Challenge:** A full-stack civic platform needs mapping, persistent storage, server-side processing, and a deployable frontend.

**Solution:** Next.js, Supabase, and Leaflet provide an integrated development stack with relatively little infrastructure overhead.

## Testing & Benchmarking

The following areas should be tested to validate the implementation:

- **Project listings:** Verify search, filtering, sorting, project details, and status display.
- **Interactive map:** Check marker rendering, project selection, map navigation, and location-related behavior.
- **Complaint management:** Test complaint submission, validation, status transitions, and persistence.
- **Site reports:** Verify image upload, project association, report display, and supported verification outcomes.
- **Clash detection:** Test projects with overlapping schedules and locations, projects without conflicts, and boundary cases.
- **API routes:** Validate request payloads, response formats, error handling, and invalid inputs.
- **Database integration:** Confirm that projects, complaints, and reports persist correctly when Supabase is enabled.
- **Responsive design:** Test layouts on desktop, tablet, and mobile screens.
- **Production build:** Run `npm run build` and resolve compilation or type errors before deployment.

### Suggested Performance Metrics

| Area | Metric |
|---|---|
| Project discovery | Search and filter response time |
| Clash detection | Detection latency and conflict precision |
| Site verification | Verification accuracy against reviewed examples |
| API reliability | Success rate and error rate |
| User experience | Task completion time and responsive usability |

Actual performance results should be measured and documented after running the tests. Detection accuracy should be evaluated against labeled examples rather than inferred from successful demonstrations.

## Future Improvements

- Integrate verified municipal project records and official department data.
- Add role-based authentication and permissions for citizens, officials, and administrators.
- Improve clash detection using geographic proximity, project categories, and construction schedules.
- Add notifications for nearby disruptions, schedule changes, and complaint updates.
- Introduce project timelines and historical progress tracking.
- Enhance site verification with a trained computer vision model to classify construction-site conditions.
- Add audit logs to improve accountability for status changes and official actions.
- Develop analytics for project delays, repeated excavation, budget utilization, and complaint resolution.
- Add multilingual support for broader accessibility.
- Improve accessibility and mobile usability.
- Evaluate the system using realistic datasets, representative workloads, and documented performance benchmarks.

---

**CivicSync — Better coordination. Better communities.**

Making public works more transparent, improving coordination between departments, and giving citizens a meaningful role in infrastructure accountability.
