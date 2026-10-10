
#JanDrishti - "Public Projects, Public Visibility"

# CivicTech — Improving Transparency and Coordination in Public Works Projects

## Overview

CivicTech is a web-based platform designed to improve transparency, accountability, and coordination in public infrastructure projects. It connects residents, municipal authorities, utility departments, and contractors through a centralized platform that provides real-time visibility into public works.

From road repairs and drainage maintenance to pipeline installations, CivicTech allows users to explore ongoing projects, understand their timelines, identify responsible authorities, and report issues with photographic evidence.

The platform also uses AI-powered schedule conflict detection to identify potential overlaps between public works projects and AI-based photo verification to help assess reported construction progress.

**Problem Statement:** Information about public works projects is fragmented across departments, making it difficult for citizens to track progress, understand delays, or hold responsible authorities accountable. Poor interdepartmental coordination can also result in repeated excavation of the same roads and unnecessary public expenditure.

**Our Solution:** A centralized, interactive civic infrastructure platform that combines project tracking, geospatial visualization, AI-assisted conflict detection, and citizen feedback to promote transparent and coordinated public works.

## Features

- **Interactive Infrastructure Map:** Visualize ongoing public works projects using a map with color-coded markers, project locations, and relevant details.
- **Public Works Project Tracking:** View project descriptions, responsible departments, planned timelines, current status, and expected completion dates.
- **AI-Powered Schedule Conflict Detection:** Identify potentially overlapping projects based on their locations and timelines, helping departments coordinate work and avoid repeated road excavation.
- **Citizen Photo Verification:** Allow residents to upload photographs of construction sites and use AI-assisted image analysis to assess whether visible conditions are consistent with reported progress.
- **Citizen Issue Reporting:** Enable residents to report stalled construction, unsafe conditions, or discrepancies between reported and observed progress.
- **Transparency and Accountability:** Make project information and reported issues easier to access, understand, and follow up on.
- **Centralized Project Information:** Bring information about projects from different public utility departments into one unified interface.

*Note: Features depend on the functionality implemented and data available in the deployed version.*

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend and Framework | Next.js (App Router), React, TypeScript | Responsive interface, routing, and application logic |
| Styling and UI | Tailwind CSS, shadcn/ui | Responsive layouts and reusable UI components |
| Icons | Lucide Icons | Consistent interface icons |
| Interactive Maps | Leaflet.js, React-Leaflet | Geographic visualization of public works |
| Database | Supabase PostgreSQL | Storage and retrieval of project information, reports, and schedules |
| Image Storage | Supabase Storage | Storage of citizen-uploaded photographs |
| AI Integration | Google Gemini Flash API (`@google/genai`) | Schedule conflict analysis and image-based progress assessment |
| Backend | Next.js API Routes | Server-side processing and AI integration |
| Deployment | Vercel | Application hosting and deployment |

## Architecture / How It Works

CivicTech follows a full-stack web architecture in which the frontend, backend API routes, database, storage, and AI services work together.

### System Workflow

1. **Project Data:** Public works project information, including location, department, schedule, and status, is stored in Supabase.
2. **Map Visualization:** The frontend retrieves project data and displays projects on an interactive Leaflet map.
3. **Conflict Detection:** Project locations and timelines are analyzed to identify potential spatial and scheduling overlaps. Gemini can assist in explaining or evaluating detected conflicts.
4. **Photo Verification:** Residents upload photographs of project sites. The backend processes the images using the Gemini API to generate an assessment of visible construction progress.
5. **Issue Reporting:** Citizens submit reports and supporting evidence, which can be stored for review and follow-up.
6. **Deployment:** The application is hosted on Vercel and communicates with Supabase and the Gemini API through the appropriate client and server-side integrations.

### High-Level Architecture

```text
Citizens / Municipal Authorities
              |
              v
      Next.js Frontend
   React + TypeScript + Tailwind
              |
       +------+------+
       |             |
       v             v
 Interactive Map   API Routes
 Leaflet.js        Next.js Backend
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
          Supabase     Gemini AI    Supabase
          Database     Analysis     Storage
             |           |           |
             +-----------+-----------+
                         |
                         v
              Results and Project Updates
                         |
                         v
                 User Interface
```

## Project Structure

The project follows a modular Next.js App Router structure.

```text
civictech/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── detect-clash/
│   │   │   │   └── route.ts
│   │   │   └── verify-photo/
│   │   │       └── route.ts
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── map/
│   │   │   └── page.tsx
│   │   ├── report/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   ├── project-card.tsx
│   │   ├── project-map.tsx
│   │   ├── conflict-alert.tsx
│   │   └── photo-upload.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   └── types/
│       └── project.ts
├── .env.local.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

*The structure above is a reference. Actual paths may differ depending on the repository and implementation.*

## Installation

### Prerequisites

Ensure that the following are installed:

- Node.js (LTS version recommended)
- npm
- Git
- A Supabase account and project
- A Google Gemini API key

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd civictech
```

Replace the repository URL with your actual GitHub repository URL.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

Use the Supabase key format supported by your project. Keep the Gemini API key and any privileged Supabase secret keys on the server. Never expose them through `NEXT_PUBLIC_` variables or commit real credentials to GitHub.

### 4. Configure Supabase

1. Create a Supabase project.
2. Create the required PostgreSQL tables for public works projects and citizen reports.
3. Configure a Storage bucket for uploaded photographs.
4. Configure appropriate database permissions and Row Level Security (RLS) policies.
5. Add the project URL and required keys to `.env.local`.

The database schema and storage policies should match the application's actual implementation.

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm run start
```

## Usage

1. Open the CivicTech web application.
2. Explore the dashboard to view ongoing public infrastructure projects.
3. Open the interactive map to identify construction sites and understand their locations.
4. Select a project to inspect its department, purpose, status, and planned completion date.
5. Use the conflict detection feature to examine potential overlaps between projects.
6. Upload a photograph of a construction site to request an AI-assisted progress assessment.
7. Submit a report if you observe stalled work, unsafe conditions, or discrepancies.
8. Review the available project information and reports to understand the status of public works in your area.

Available actions depend on the features enabled in the deployed application.

## Example

### Scenario: Preventing Repeated Road Excavation

Suppose a municipal department schedules road resurfacing on Main Road from October 15 to October 20. A water utility department independently schedules pipeline repairs on the same road from October 17 to October 22.

Without coordination, the road may be resurfaced only to be excavated again days later.

**How CivicTech helps:**

1. Both projects are registered with their locations, timelines, and responsible departments.
2. The conflict detection system identifies a potential spatial and scheduling overlap.
3. The platform generates a conflict alert highlighting the affected area and overlapping dates.
4. Authorities can review the alert and coordinate the work before finalizing their schedules.
5. Residents can view the planned work and anticipate possible disruptions.

### Scenario: Verifying Construction Progress

A drainage repair project is marked as 80% complete, but a resident observes that the site appears inactive.

1. The resident uploads a photograph of the site.
2. The AI service analyzes visible conditions in the photograph.
3. The application presents an assessment of the visible progress and any apparent discrepancy.
4. The report can be reviewed by the responsible authority for further verification.

AI-generated assessments are advisory. A photograph alone cannot reliably establish the actual percentage of completion, prove that work has stalled, or determine responsibility.

## Design Decisions

- **Single Full-Stack Framework:** Next.js allows frontend pages and backend API routes to live in one repository, reducing development and deployment overhead during a time-constrained hackathon.
- **Open-Source Mapping:** Leaflet provides interactive maps without requiring a paid mapping subscription or credit card.
- **Managed Backend Services:** Supabase simplifies database management and image storage, allowing the team to focus on the application's core features.
- **AI-Assisted Analysis:** Gemini supports image understanding and natural-language analysis, enabling useful AI functionality without training a custom model.
- **Geospatial and Temporal Conflict Detection:** Location and date overlap are used as the basis for identifying potential project conflicts. More advanced geographic checks can be added as the application evolves.
- **Modular Components:** Reusable UI components and separate API routes make the application easier to maintain and extend.
- **Rapid Deployment:** Vercel integrates with GitHub to streamline hosting and provide a public demonstration URL.

## Challenges & Solutions

| Challenge | Solution |
|---|---|
| Scattered public works information | Centralize project details in a unified platform. |
| Repeated excavation caused by poor coordination | Detect potential conflicts using project locations and schedules. |
| Lack of visibility into project progress | Display project status, timelines, and relevant updates. |
| Difficulty validating reported progress | Use AI-assisted analysis of citizen-uploaded photographs. |
| Limited development time | Use Next.js, Supabase, reusable UI components, and managed AI services. |
| Unreliable or incomplete project data | Clearly identify missing information and support review by responsible authorities. |
| AI prediction errors | Present AI output as an advisory assessment and retain human review for consequential decisions. |

## Testing & Benchmarking

The application should be tested across its main workflows before deployment.

### Functional Testing

- Verify that project records load and display correctly.
- Test map markers, project details, and location selection.
- Test conflict detection using overlapping and non-overlapping project schedules.
- Verify that photo uploads work and invalid file types are rejected.
- Test AI responses for relevant images and malformed requests.
- Verify that issue reports are stored and can be retrieved as intended.
- Check error handling for missing API keys, database failures, and unsuccessful AI requests.

### Performance Testing

- Measure initial page load and map rendering time.
- Measure the response time of the conflict detection API.
- Measure the latency of AI-based photo assessment.
- Test how the interface behaves as the number of displayed projects increases.

### Conflict Detection Evaluation

Use sample projects with known outcomes to assess whether the system correctly identifies:

- Projects with overlapping dates and locations.
- Projects that overlap in time but are geographically separate.
- Projects that share a location but occur at different times.
- Projects with missing or incomplete schedules.

### AI Evaluation

Test the photo assessment feature on representative images and manually review the generated results. Evaluate whether the responses are relevant, consistent, and appropriately cautious.

Benchmark figures should be reported only after actual tests have been conducted. AI-generated assessments should not be treated as ground-truth verification.

## Future Improvements

- Integrate official municipal and utility department APIs for reliable, up-to-date project information.
- Add role-based dashboards for residents, contractors, and government officials.
- Implement notifications for schedule changes, delays, and nearby construction.
- Add project dependencies and shared road-segment analysis for more accurate coordination.
- Introduce historical project data and analytics to identify recurring delays and inefficient planning.
- Improve citizen reporting with geotagged images, timestamps, and duplicate-report detection.
- Add an authority response workflow with status tracking and resolution history.
- Implement stronger verification mechanisms, including human review and comparison with historical site images.
- Support multiple municipalities and regional languages.
- Add authentication, audit logs, access controls, and stronger abuse prevention.
- Develop a mobile-friendly progressive web application for easier access in the field.

## What I Learned

This project provides practical experience in:

- Building a full-stack web application using Next.js, React, and TypeScript.
- Designing REST-style backend endpoints using Next.js API Routes.
- Integrating PostgreSQL databases and cloud storage using Supabase.
- Implementing interactive geospatial visualization with Leaflet.
- Integrating a multimodal AI API for image analysis and decision support.
- Designing logic for schedule and location conflict detection.
- Managing environment variables, API security, and deployment configuration.
- Testing application workflows and handling failures across multiple services.
- Using Git and GitHub for collaborative development.
- Applying technology to a real-world civic problem involving transparency, public infrastructure, and citizen participation.

## Deployment

The application can be deployed on Vercel.

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables in the Vercel project settings.
4. Deploy the application.
5. Verify the production build, API routes, database connectivity, and AI integrations.
6. Share the deployment URL for demonstration.

**Live Demo:** Add your deployed Vercel URL here.

**GitHub Repository:** Add your repository URL here.

---

Built with the goal of making public infrastructure more transparent, coordinated, and accountable through accessible technology.
