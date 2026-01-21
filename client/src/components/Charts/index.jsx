import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * Line Chart Component
 * Usage: Trends over time (complaints, attendance, etc.)
 */
export const LineChart = ({ data, title, height = 300 }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#fff',
                    font: { size: 12 }
                }
            },
            title: {
                display: !!title,
                text: title,
                color: '#fff',
                font: { size: 16, weight: 'bold' }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#667eea',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Line data={data} options={options} />
        </div>
    );
};

/**
 * Bar Chart Component
 * Usage: Comparisons (complaints by category, students by department)
 */
export const BarChart = ({ data, title, height = 300, horizontal = false }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#fff',
                    font: { size: 12 }
                }
            },
            title: {
                display: !!title,
                text: title,
                color: '#fff',
                font: { size: 16, weight: 'bold' }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#667eea',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Bar data={data} options={options} />
        </div>
    );
};

/**
 * Doughnut Chart Component
 * Usage: Proportions (status distribution, completion rates)
 */
export const DoughnutChart = ({ data, title, height = 300 }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#fff',
                    font: { size: 12 },
                    padding: 15,
                    usePointStyle: true
                }
            },
            title: {
                display: !!title,
                text: title,
                color: '#fff',
                font: { size: 16, weight: 'bold' }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#667eea',
                borderWidth: 1
            }
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Doughnut data={data} options={options} />
        </div>
    );
};

/**
 * Pie Chart Component
 * Usage: Simple proportions (binary choices, small categories)
 */
export const PieChart = ({ data, title, height = 300 }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#fff',
                    font: { size: 12 },
                    padding: 15,
                    usePointStyle: true
                }
            },
            title: {
                display: !!title,
                text: title,
                color: '#fff',
                font: { size: 16, weight: 'bold' }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#667eea',
                borderWidth: 1
            }
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Pie data={data} options={options} />
        </div>
    );
};

/**
 * Preset Color Schemes
 */
export const colorSchemes = {
    primary: [
        'rgba(102, 126, 234, 0.8)',
        'rgba(118, 75, 162, 0.8)',
        'rgba(237, 100, 166, 0.8)',
        'rgba(255, 154, 158, 0.8) ',
        'rgba(250, 208, 196, 0.8)'
    ],
    success: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(5, 150, 105, 0.8)',
        'rgba(4, 120, 87, 0.8)'
    ],
    warning: [
        'rgba(251, 191, 36, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(217, 119, 6, 0.8)'
    ],
    danger: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(220, 38, 38, 0.8)',
        'rgba(185, 28, 28, 0.8)'
    ],
    info: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(37, 99, 235, 0.8)',
        'rgba(29, 78, 216, 0.8)'
    ],
    rainbow: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)'
    ]
};

/**
 * Helper function to create gradient
 */
export const createGradient = (ctx, colors) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1] || colors[0]);
    return gradient;
};
