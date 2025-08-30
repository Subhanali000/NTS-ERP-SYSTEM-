# NTS ERP – Unified People & Project Suite

A modern, responsive ERP dashboard for internal company management, built with React, TypeScript, and Tailwind CSS.

## 🚀 Login Credentials (Demo)

### Director
- **Email:** devesh@example.com  
- **Password:** test123  

### Managers
- **Email:** subhan@gmail.com  
  **Password:** 123456789  

- **Email:** ejemplo@ejemplo.mxer  
  **Password:** koma20250806  


## Features

### 🏢 Organizational Hierarchy
- **Directors**: Global HR, Operations, Engineering, Tech Team, Business Development
- **Managers**: Talent Acquisition, Project/Tech, QA, Software Development, Systems Integration, Client Relations
- **Base Level**: Employees and Interns

### 🔐 Role-Based Access Control
- **Directors**: Approve manager leave requests, view division-wide dashboards
- **Managers**: Team management, project/task creation, employee leave approval
- **Employees/Interns**: Attendance tracking, leave requests, task progress reporting

### 📊 Core Modules

#### Dashboard
- Role-specific KPI cards and metrics
- Recent activity feed
- Weekly task progress charts
- Quick action buttons

#### Attendance Management
- Daily punch in/out functionality
- Real-time attendance tracking
- Weekly/monthly attendance reports
- Timesheet management

#### Leave Management
- Multi-level approval workflow
- Leave balance tracking
- Request status monitoring
- Email/notification alerts

#### Task & Project Management
- Kanban-style task boards
- Project creation and assignment
- Progress tracking with percentages
- Due date and priority management

#### Document Generator
- One-click PDF generation for:
  - Offer Letters
  - Experience Certificates
  - Letters of Recommendation
  - Internship Completion Certificates

#### Progress Tracking
- Employee progress submissions
- Manager review and approval
- Real-time status updates

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd nts-erp-dashboard
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Dashboard/      # Dashboard-specific components
│   └── Layout/         # Layout components (Sidebar, Header)
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── auth.ts         # Authentication helpers
│   ├── dateUtils.ts    # Date formatting utilities
│   └── documentGenerator.ts # PDF generation
├── data/               # Mock data for development
└── App.tsx             # Main application component
```

## Key Features Implementation

### Authentication & Authorization
- JWT-based authentication simulation
- Role-based route protection
- Permission-based UI rendering

### Leave Approval Workflow
```
Employee/Intern → Manager → Director
HR Manager → Global HR Director
Operations Manager → Global Operations Director
Engineering Manager → Engineering Director
Tech Manager → Director – Tech Team
BizDev Manager → Director – Business Development
```

### Responsive Design
- Mobile-first approach
- Collapsible sidebar navigation
- Responsive grid layouts
- Touch-friendly interactions

## Development Notes

### Mock Data
The application uses comprehensive mock data located in `src/data/mockData.ts`. This includes:
- User profiles with realistic organizational hierarchy
- Projects and tasks with various statuses
- Attendance records
- Leave requests with approval chains
- Notifications and progress reports

### TODO: Backend Integration
The following areas are marked for backend integration:

1. **Authentication**: Replace mock auth with real JWT implementation
2. **API Endpoints**: 
   - User management
   - Attendance tracking
   - Leave request processing
   - Task and project management
   - Document storage
   - Real-time notifications

3. **Database Models**: Implement the data models defined in `src/types/index.ts`

### Customization

#### Role-Based Themes
Each department can have custom accent colors by modifying the `getDepartmentColor` function in `src/utils/auth.ts`.

#### Document Templates
PDF templates can be customized in `src/utils/documentGenerator.ts` to match company branding and requirements.

## Production Deployment

### Build for Production
```bash
npm run build
```



## ⚙️ Environment Variables

Create a `.env` file in the root of the project and add the following keys:

```env
# nts nihon global official dbms access keys
SUPABASE_URL=https://vizgnumsjzdrqbqmdrgz.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpemdudW1zanpkcnFicW1kcmd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ4ODIzOSwiZXhwIjoyMDY3MDY0MjM5fQ.hWlIHDpJosCZ5Oa4c2eDBJ73V9dTK9za3pukYE0Q9xg
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpemdudW1zanpkcnFicW1kcmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0ODgyMzksImV4cCI6MjA2NzA2NDIzOX0.8qD06wWHiyiH1pRZtF9glViOSoVM5-c83M3ySbnIiPE

JWT_SECRET=nts_nihon_global
