'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({
    rating,
    onRatingChange,
    readonly = false,
    size = 'md'
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizes = {
        sm: 16,
        md: 24,
        lg: 32
    };

    const starSize = sizes[size];

    const handleClick = (star: number) => {
        if (!readonly && onRatingChange) {
            onRatingChange(star);
        }
    };

    return (
        <div className="flex gap-1" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hoverRating || rating);
                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => !readonly && setHoverRating(star)}
                        onMouseLeave={() => !readonly && setHoverRating(0)}
                        disabled={readonly}
                        className={`
                            transition-all duration-200 
                            ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                            ${isActive ? 'text-amber-400' : 'text-gray-600'}
                        `}
                        aria-label={`${star} نجوم`}
                    >
                        <Star
                            size={starSize}
                            fill={isActive ? 'currentColor' : 'none'}
                            strokeWidth={1.5}
                        />
                    </button>
                );
            })}
        </div>
    );
}
