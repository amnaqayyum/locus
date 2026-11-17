# LOCUS: Employee Attendance with Geofencing

A Firebase project for tracking employee attendance by location.

- **Employee location and status:** when a user's position is written to the Realtime Database, a Cloud Function checks whether they are inside the "Head Office" polygon and sets their status to Present or Away.
- **Clock and timesheet:** when status changes, a Cloud Function starts or stops the user's clock and writes a timesheet entry with the hours worked.
- **Admin page:** `public/admin/addEmp.html` lets an admin create employee logins (Firebase Auth) and their info.

## Layout

- `functions/`: Cloud Functions (TypeScript source in `src/index.ts`)
- `public/`: Firebase Hosting files (`admin/addEmp.html`, `404.html`)
- `firebase.json`: Hosting and Functions config

## Setup

```bash
cd functions
npm install
npm run build        # compile src/ to lib/
cd ..
firebase deploy      # deploys hosting and functions
```

The Realtime Database needs a `Polygon Coordinates/Head Office` node holding the fence coordinates. The project does not include the employee-facing pages that set the location, so those still need to be added.
