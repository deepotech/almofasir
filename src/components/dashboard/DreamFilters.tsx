
'use client';

import { useState } from 'react';

interface DreamFiltersProps {
    onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
    search: string;
    dateRange: 'all' | 'week' | 'month' | 'year';
    type: 'all' | 'ai' | 'human';
    status: 'all' | 'completed' | 'pending' | 'reviewed';
    interpreter: string;
}

const dateRangeOptions = [
    { value: 'all', label: 'كل الأوقات' },
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' },
    { value: 'year', label: 'هذا العام' },
];

const typeOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'ai', label: '🤖 ذكاء اصطناعي' },
    { value: 'human', label: '👳‍♂️ مفسر بشري' },
];

const statusOptions = [
    { value: 'all', label: 'كل الحالات' },
    { value: 'completed', label: '✅ مكتمل' },
    { value: 'pending', label: '⏳ بانتظار المفسر' },
    { value: 'reviewed', label: '✓ تمت المراجعة' },
];

const interpreterOptions = [
    { value: 'all', label: 'كل المفسرين' },
    { value: 'ibn-sirin', label: 'ابن سيرين' },
    { value: 'nabulsi', label: 'النابلسي' },
    { value: 'ibn-shaheen', label: 'ابن شاهين' },
];

export default function DreamFilters({ onFilterChange }: DreamFiltersProps) {
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        dateRange: 'all',
        type: 'all',
        status: 'all',
        interpreter: 'all',
    });

    const [isExpanded, setIsExpanded] = useState(false);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const defaultFilters: FilterState = {
            search: '',
            dateRange: 'all',
            type: 'all',
            status: 'all',
            interpreter: 'all',
        };
        setFilters(defaultFilters);
        onFilterChange(defaultFilters);
    };

    const hasActiveFilters = filters.search ||
        filters.dateRange !== 'all' ||
        filters.type !== 'all' ||
        filters.status !== 'all' ||
        filters.interpreter !== 'all';

    return (
        <div className="filters-container">
            {/* Search Bar */}
            <div className="search-row">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="ابحث في أحلامك..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="search-input"
                    />
                </div>
                <button
                    className={`filter-toggle ${isExpanded ? 'active' : ''}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <span>⚙️</span>
                    تصفية
                    {hasActiveFilters && <span className="filter-badge"></span>}
                </button>
            </div>

            {/* Expandable Filters */}
            {isExpanded && (
                <div className="filters-row">
                    <div className="filter-group">
                        <label>التاريخ</label>
                        <select
                            value={filters.dateRange}
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                        >
                            {dateRangeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>نوع التفسير</label>
                        <select
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                        >
                            {typeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>الحالة</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>المفسر</label>
                        <select
                            value={filters.interpreter}
                            onChange={(e) => handleFilterChange('interpreter', e.target.value)}
                        >
                            {interpreterOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {hasActiveFilters && (
                        <button className="clear-filters" onClick={clearFilters}>
                            ✕ مسح الفلاتر
                        </button>
                    )}
                </div>
            )}

            <style jsx>{`
                .filters-container {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-md);
                    margin-bottom: var(--spacing-lg);
                }
                .search-row {
                    display: flex;
                    gap: var(--spacing-md);
                    align-items: center;
                }
                .search-input-wrapper {
                    flex: 1;
                    position: relative;
                }
                .search-icon {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 1rem;
                    pointer-events: none;
                }
                .search-input {
                    width: 100%;
                    padding: 0.75rem 2.5rem 0.75rem 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: var(--radius-md);
                    color: var(--color-text-primary);
                    font-family: var(--font-arabic);
                    font-size: 0.95rem;
                    transition: border-color 0.2s;
                }
                .search-input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                }
                .search-input::placeholder {
                    color: var(--color-text-muted);
                }
                .filter-toggle {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    padding: 0.75rem 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: var(--radius-md);
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: var(--font-arabic);
                    position: relative;
                }
                .filter-toggle:hover, .filter-toggle.active {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: var(--color-primary);
                    color: var(--color-text-primary);
                }
                .filter-badge {
                    position: absolute;
                    top: 6px;
                    left: 6px;
                    width: 8px;
                    height: 8px;
                    background: var(--color-primary);
                    border-radius: 50%;
                }
                .filters-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-md);
                    margin-top: var(--spacing-md);
                    padding-top: var(--spacing-md);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    align-items: flex-end;
                }
                .filter-group {
                    flex: 1;
                    min-width: 140px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .filter-group label {
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                }
                .filter-group select {
                    padding: 0.5rem 0.75rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: var(--radius-sm);
                    color: var(--color-text-primary);
                    font-family: var(--font-arabic);
                    font-size: 0.85rem;
                    cursor: pointer;
                }
                .filter-group select:focus {
                    outline: none;
                    border-color: var(--color-primary);
                }
                .clear-filters {
                    padding: 0.5rem 1rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: var(--radius-sm);
                    color: #ef4444;
                    font-family: var(--font-arabic);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .clear-filters:hover {
                    background: rgba(239, 68, 68, 0.2);
                }
            `}</style>
        </div>
    );
}
