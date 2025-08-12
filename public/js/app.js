// FitnessTrackerApp - Main Frontend JavaScript
// Handles client-side interactivity and API communication

class FitnessTracker {
    constructor() {
        this.apiBase = '/api';
        this.currentUser = null;
        this.workouts = [];
        this.exercises = [];
        
        this.init();
    }

    async init() {
        await this.loadExercises();
        await this.loadWorkouts();
        this.setupEventListeners();
        this.renderDashboard();
    }

    // API Communication
    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    async loadExercises() {
        try {
            this.exercises = await this.apiCall('/exercises');
        } catch (error) {
            console.error('Failed to load exercises:', error);
            this.exercises = [];
        }
    }

    async loadWorkouts() {
        try {
            this.workouts = await this.apiCall('/workouts');
        } catch (error) {
            console.error('Failed to load workouts:', error);
            this.workouts = [];
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation - fix to match HTML structure
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-tab]')) {
                this.navigate(e.target.dataset.tab);
            }
        });

        // Workout form submission
        const workoutForm = document.getElementById('new-workout-form');
        if (workoutForm) {
            workoutForm.addEventListener('submit', (e) => this.handleWorkoutSubmit(e));
        }

        // Add workout button
        const addWorkoutBtn = document.getElementById('add-workout-btn');
        if (addWorkoutBtn) {
            addWorkoutBtn.addEventListener('click', () => this.showWorkoutForm());
        }

        // Cancel workout button
        const cancelWorkoutBtn = document.getElementById('cancel-workout');
        if (cancelWorkoutBtn) {
            cancelWorkoutBtn.addEventListener('click', () => this.hideWorkoutForm());
        }

        // Goal form handlers
        const addGoalBtn = document.getElementById('add-goal-btn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => this.showGoalForm());
        }

        const cancelGoalBtn = document.getElementById('cancel-goal');
        if (cancelGoalBtn) {
            cancelGoalBtn.addEventListener('click', () => this.hideGoalForm());
        }

        const goalForm = document.getElementById('new-goal-form');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => this.handleGoalSubmit(e));
        }
    }

    // Workout Management
    async handleWorkoutSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const workout = {
            date: formData.get('workout-date') || new Date().toISOString().split('T')[0],
            name: formData.get('workout-name'),
            duration: parseInt(formData.get('workout-duration')) || 0,
            calories: parseInt(formData.get('workout-calories')) || 0,
            notes: formData.get('workout-notes') || '',
            exercises: [] // For now, we'll add exercise tracking later
        };

        try {
            const savedWorkout = await this.apiCall('/workouts', 'POST', workout);
            this.workouts.push(savedWorkout);
            this.renderDashboard();
            this.renderAllWorkouts();
            this.hideWorkoutForm();
            event.target.reset();
            this.showNotification('Workout saved successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to save workout', 'error');
        }
    }



    // UI Rendering
    renderDashboard() {
        this.updateDashboardStats();
        this.renderRecentWorkouts();
        this.updateProgressCharts();
    }

    updateDashboardStats() {
        // Update dashboard statistics
        const totalWorkouts = document.getElementById('total-workouts');
        const weekWorkouts = document.getElementById('week-workouts');
        const currentStreak = document.getElementById('current-streak');
        const totalCalories = document.getElementById('total-calories');

        if (totalWorkouts) totalWorkouts.textContent = this.workouts.length;
        
        // Calculate this week's workouts
        const thisWeek = this.getThisWeekWorkouts();
        if (weekWorkouts) weekWorkouts.textContent = thisWeek.length;

        // Calculate total calories
        const calories = this.workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
        if (totalCalories) totalCalories.textContent = calories.toLocaleString();

        // Simple streak calculation (consecutive days with workouts)
        const streak = this.calculateStreak();
        if (currentStreak) currentStreak.textContent = streak;
    }

    renderRecentWorkouts() {
        const container = document.getElementById('recent-workouts-list');
        if (!container) return;

        if (this.workouts.length === 0) {
            container.innerHTML = '<p class="no-data">No workouts recorded yet. Start by logging your first workout!</p>';
            return;
        }

        const recentWorkouts = this.workouts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        const workoutHTML = recentWorkouts.map(workout => `
            <div class="workout-card">
                <div class="workout-header">
                    <h4>${workout.name || 'Workout'}</h4>
                    <span class="workout-date">${new Date(workout.date).toLocaleDateString()}</span>
                </div>
                <div class="workout-details">
                    <span>⏱️ ${workout.duration || 0} min</span>
                    <span>🔥 ${workout.calories || 0} cal</span>
                </div>
                ${workout.notes ? `<div class="workout-notes">${workout.notes}</div>` : ''}
            </div>
        `).join('');

        container.innerHTML = workoutHTML;
    }

    renderAllWorkouts() {
        const container = document.getElementById('all-workouts-list');
        if (!container) return;

        if (this.workouts.length === 0) {
            container.innerHTML = '<p class="no-data">No workouts recorded yet. Click "Add Workout" to get started!</p>';
            return;
        }

        const workoutHTML = this.workouts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(workout => `
                <div class="workout-card">
                    <div class="workout-header">
                        <h4>${workout.name || 'Workout'}</h4>
                        <span class="workout-date">${new Date(workout.date).toLocaleDateString()}</span>
                    </div>
                    <div class="workout-details">
                        <span>⏱️ ${workout.duration || 0} min</span>
                        <span>🔥 ${workout.calories || 0} cal</span>
                    </div>
                    ${workout.notes ? `<div class="workout-notes">${workout.notes}</div>` : ''}
                </div>
            `).join('');

        container.innerHTML = workoutHTML;
    }

    // Progress Charts
    updateProgressCharts() {
        this.renderProgressChart();
    }

    renderProgressChart() {
        const canvas = document.getElementById('progress-chart');
        if (!canvas) return;

        // Clear any existing chart
        if (this.progressChart) {
            this.progressChart.destroy();
        }

        const chartData = this.aggregateProgressData();
        
        this.progressChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Workouts per Week',
                        data: chartData.workouts,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Calories Burned',
                        data: chartData.calories,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Week'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Workouts'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Calories'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    // Data Processing
    aggregateProgressData() {
        if (this.workouts.length === 0) {
            return {
                labels: ['No data'],
                workouts: [0],
                calories: [0]
            };
        }

        const weeklyData = {};
        
        this.workouts.forEach(workout => {
            const week = this.getWeekKey(new Date(workout.date));
            if (!weeklyData[week]) {
                weeklyData[week] = { workouts: 0, calories: 0 };
            }
            weeklyData[week].workouts += 1;
            weeklyData[week].calories += workout.calories || 0;
        });

        const sortedWeeks = Object.keys(weeklyData).sort();
        return {
            labels: sortedWeeks.map(week => week.replace(/^\d{4}-W/, 'Week ')),
            workouts: sortedWeeks.map(week => weeklyData[week].workouts),
            calories: sortedWeeks.map(week => weeklyData[week].calories)
        };
    }

    getWeekKey(date) {
        const year = date.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    }

    // Navigation
    navigate(section) {
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation state
        document.querySelectorAll('[data-tab]').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector(`[data-tab="${section}"]`)?.classList.add('active');

        // Load section-specific data
        if (section === 'workouts') {
            this.renderAllWorkouts();
        } else if (section === 'progress') {
            this.updateProgressCharts();
        } else if (section === 'dashboard') {
            this.renderDashboard();
        }
    }

    // Form Management
    showWorkoutForm() {
        const form = document.getElementById('workout-form');
        if (form) {
            form.classList.remove('hidden');
            // Set today's date as default
            const dateInput = document.getElementById('workout-date');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }
    }

    hideWorkoutForm() {
        const form = document.getElementById('workout-form');
        if (form) {
            form.classList.add('hidden');
        }
    }

    showGoalForm() {
        const form = document.getElementById('goal-form');
        if (form) {
            form.classList.remove('hidden');
        }
    }

    hideGoalForm() {
        const form = document.getElementById('goal-form');
        if (form) {
            form.classList.add('hidden');
        }
    }

    async handleGoalSubmit(event) {
        event.preventDefault();
        // Goal functionality can be implemented later
        this.hideGoalForm();
        this.showNotification('Goal feature coming soon!', 'info');
    }

    // Helper Functions
    getThisWeekWorkouts() {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        
        return this.workouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= weekStart;
        });
    }

    calculateStreak() {
        if (this.workouts.length === 0) return 0;
        
        const sortedWorkouts = this.workouts
            .map(w => new Date(w.date).toDateString())
            .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
            .sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        let currentDate = new Date();
        
        for (let i = 0; i < sortedWorkouts.length; i++) {
            const workoutDate = new Date(sortedWorkouts[i]);
            const daysDiff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
                currentDate = workoutDate;
            } else if (daysDiff === streak + 1) {
                streak++;
                currentDate = workoutDate;
            } else {
                break;
            }
        }
        
        return streak;
    }

    // Utility Functions
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fitnessTracker = new FitnessTracker();
});