
'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            display: false,
        },
        title: {
            display: false,
        },
    },
    scales: {
        y: {
            display: false,
        },
        x: {
            grid: {
                color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
                color: '#888'
            }
        }
    },
    elements: {
        line: {
            tension: 0.4
        }
    }
};

const labels = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];

export default function MoodChart({ dataPoints }: { dataPoints?: number[] }) {

    // Mock data if none provided
    const data = {
        labels,
        datasets: [
            {
                fill: true,
                label: 'المزاج',
                data: dataPoints || [3, 2, 4, 3, 5, 4, 5],
                borderColor: '#DAA520', // Gold
                backgroundColor: 'rgba(218, 165, 32, 0.1)',
            },
        ],
    };

    return (
        <div className="chart-container glass-card">
            <h3 className="chart-title">مؤشر المزاج الأسبوعي 📈</h3>
            <div style={{ height: '250px' }}>
                <Line options={options} data={data} />
            </div>
            <style jsx>{`
                .chart-container {
                    padding: var(--spacing-xl);
                    margin-bottom: var(--spacing-2xl);
                }
                .chart-title {
                    margin-bottom: var(--spacing-lg);
                    font-size: 1.1rem;
                    color: var(--color-text-secondary);
                }
            `}</style>
        </div>
    );
}
