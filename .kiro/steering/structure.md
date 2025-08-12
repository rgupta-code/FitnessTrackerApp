# Project Structure

## Root Directory
```
FitnessTrackerApp/
├── public/                 # Frontend static files
│   ├── index.html         # Main application page
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   ├── js/
│   │   └── app.js         # Frontend JavaScript
│   └── assets/            # Images, icons, etc.
├── server/                # Backend Node.js application
│   ├── server.js          # Main server file
│   ├── routes/            # API route handlers
│   └── data/              # JSON data storage
├── package.json           # Node.js dependencies and scripts
└── README.md             # Project documentation
```

## Key Directories

### `/public`
Contains all frontend assets served to the browser. This includes the main HTML file, CSS stylesheets, client-side JavaScript, and static assets like images.

### `/server`
Houses the Node.js backend application including the main server file, API routes, and data storage files.

### `/server/routes`
API endpoint definitions organized by feature (workouts, exercises, users, etc.).

### `/server/data`
JSON files used for data persistence in development. In production, this would be replaced with a proper database.

## File Naming Conventions
- Use kebab-case for directories and files
- Use descriptive names that indicate purpose
- Group related functionality together
- Keep the structure flat where possible to avoid deep nesting