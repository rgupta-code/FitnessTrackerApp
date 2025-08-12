const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const WORKOUTS_FILE = path.join(DATA_DIR, 'workouts.json');
const EXERCISES_FILE = path.join(DATA_DIR, 'exercises.json');

// Initialize data files
async function initializeData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Initialize workouts file
        try {
            await fs.access(WORKOUTS_FILE);
        } catch {
            await fs.writeFile(WORKOUTS_FILE, JSON.stringify([]));
        }
        
        // Initialize exercises file with common exercises
        try {
            await fs.access(EXERCISES_FILE);
        } catch {
            const defaultExercises = [
                { id: 1, name: 'Push-ups', category: 'chest', equipment: 'bodyweight' },
                { id: 2, name: 'Squats', category: 'legs', equipment: 'bodyweight' },
                { id: 3, name: 'Pull-ups', category: 'back', equipment: 'pull-up bar' },
                { id: 4, name: 'Bench Press', category: 'chest', equipment: 'barbell' },
                { id: 5, name: 'Deadlift', category: 'back', equipment: 'barbell' },
                { id: 6, name: 'Shoulder Press', category: 'shoulders', equipment: 'dumbbells' },
                { id: 7, name: 'Bicep Curls', category: 'arms', equipment: 'dumbbells' },
                { id: 8, name: 'Tricep Dips', category: 'arms', equipment: 'bodyweight' },
                { id: 9, name: 'Lunges', category: 'legs', equipment: 'bodyweight' },
                { id: 10, name: 'Plank', category: 'core', equipment: 'bodyweight' }
            ];
            await fs.writeFile(EXERCISES_FILE, JSON.stringify(defaultExercises, null, 2));
        }
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// Helper functions
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        throw error;
    }
}

// API Routes

// Get all exercises
app.get('/api/exercises', async (req, res) => {
    try {
        const exercises = await readJsonFile(EXERCISES_FILE);
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exercises' });
    }
});

// Add new exercise
app.post('/api/exercises', async (req, res) => {
    try {
        const { name, category, equipment } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Exercise name is required' });
        }
        
        const exercises = await readJsonFile(EXERCISES_FILE);
        const newExercise = {
            id: exercises.length > 0 ? Math.max(...exercises.map(e => e.id)) + 1 : 1,
            name,
            category: category || 'other',
            equipment: equipment || 'unknown'
        };
        
        exercises.push(newExercise);
        await writeJsonFile(EXERCISES_FILE, exercises);
        
        res.status(201).json(newExercise);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add exercise' });
    }
});

// Get all workouts
app.get('/api/workouts', async (req, res) => {
    try {
        const workouts = await readJsonFile(WORKOUTS_FILE);
        res.json(workouts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

// Add new workout
app.post('/api/workouts', async (req, res) => {
    try {
        const { date, exercises, notes } = req.body;
        
        if (!date || !exercises || !Array.isArray(exercises)) {
            return res.status(400).json({ error: 'Date and exercises array are required' });
        }
        
        const workouts = await readJsonFile(WORKOUTS_FILE);
        const newWorkout = {
            id: workouts.length > 0 ? Math.max(...workouts.map(w => w.id)) + 1 : 1,
            date,
            exercises,
            notes: notes || '',
            createdAt: new Date().toISOString()
        };
        
        workouts.push(newWorkout);
        await writeJsonFile(WORKOUTS_FILE, workouts);
        
        res.status(201).json(newWorkout);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add workout' });
    }
});

// Get workout by ID
app.get('/api/workouts/:id', async (req, res) => {
    try {
        const workouts = await readJsonFile(WORKOUTS_FILE);
        const workout = workouts.find(w => w.id === parseInt(req.params.id));
        
        if (!workout) {
            return res.status(404).json({ error: 'Workout not found' });
        }
        
        res.json(workout);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch workout' });
    }
});

// Update workout
app.put('/api/workouts/:id', async (req, res) => {
    try {
        const workouts = await readJsonFile(WORKOUTS_FILE);
        const workoutIndex = workouts.findIndex(w => w.id === parseInt(req.params.id));
        
        if (workoutIndex === -1) {
            return res.status(404).json({ error: 'Workout not found' });
        }
        
        const { date, exercises, notes } = req.body;
        workouts[workoutIndex] = {
            ...workouts[workoutIndex],
            date: date || workouts[workoutIndex].date,
            exercises: exercises || workouts[workoutIndex].exercises,
            notes: notes !== undefined ? notes : workouts[workoutIndex].notes,
            updatedAt: new Date().toISOString()
        };
        
        await writeJsonFile(WORKOUTS_FILE, workouts);
        res.json(workouts[workoutIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update workout' });
    }
});

// Delete workout
app.delete('/api/workouts/:id', async (req, res) => {
    try {
        const workouts = await readJsonFile(WORKOUTS_FILE);
        const workoutIndex = workouts.findIndex(w => w.id === parseInt(req.params.id));
        
        if (workoutIndex === -1) {
            return res.status(404).json({ error: 'Workout not found' });
        }
        
        const deletedWorkout = workouts.splice(workoutIndex, 1)[0];
        await writeJsonFile(WORKOUTS_FILE, workouts);
        
        res.json({ message: 'Workout deleted successfully', workout: deletedWorkout });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete workout' });
    }
});

// Get workout statistics
app.get('/api/stats', async (req, res) => {
    try {
        const workouts = await readJsonFile(WORKOUTS_FILE);
        
        const stats = {
            totalWorkouts: workouts.length,
            totalExercises: workouts.reduce((sum, w) => sum + w.exercises.length, 0),
            totalWeight: workouts.reduce((sum, w) => 
                sum + w.exercises.reduce((exerciseSum, e) => 
                    exerciseSum + (e.sets * e.reps * e.weight), 0), 0),
            averageWorkoutsPerWeek: calculateAverageWorkoutsPerWeek(workouts),
            mostFrequentExercise: getMostFrequentExercise(workouts)
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Helper functions for statistics
function calculateAverageWorkoutsPerWeek(workouts) {
    if (workouts.length === 0) return 0;
    
    const dates = workouts.map(w => new Date(w.date)).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const weeksDiff = Math.ceil((lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000)) || 1;
    
    return Math.round((workouts.length / weeksDiff) * 100) / 100;
}

function getMostFrequentExercise(workouts) {
    const exerciseCount = {};
    
    workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
            exerciseCount[exercise.name] = (exerciseCount[exercise.name] || 0) + 1;
        });
    });
    
    const mostFrequent = Object.entries(exerciseCount)
        .sort(([,a], [,b]) => b - a)[0];
    
    return mostFrequent ? { name: mostFrequent[0], count: mostFrequent[1] } : null;
}

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
    await initializeData();
    app.listen(PORT, () => {
        console.log(`🏃‍♂️ Fitness Tracker Server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    });
}

startServer().catch(console.error);