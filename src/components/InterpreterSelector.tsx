'use client';

import { classicInterpreters, Interpreter } from '@/data/interpreters';

interface InterpreterSelectorProps {
    selectedInterpreter: string | null;
    onSelectInterpreter: (interpreterId: string) => void;
}

export default function InterpreterSelector({
    selectedInterpreter,
    onSelectInterpreter,
}: InterpreterSelectorProps) {
    return (
        <div className="w-full py-8 text-center animate-fadeIn" suppressHydrationWarning>
            {/* Interpreter Selection */}
            <div className="max-w-6xl mx-auto px-4" suppressHydrationWarning>
                <div className="mb-10">
                    <h3 className="text-3xl font-bold mb-3 text-white">
                        📖 اختر المفسر الذي تفضله
                    </h3>
                    <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto">
                        احصل على تفسير مستند إلى منهج المفسر الذي تختاره لضمان دقة المعنى
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" suppressHydrationWarning>
                    {classicInterpreters.map((interpreter) => (
                        <button
                            key={interpreter.id}
                            className={`group relative flex flex-col items-center p-6 rounded-2xl border transition-all duration-300 overflow-hidden
                                ${selectedInterpreter === interpreter.id
                                    ? 'bg-[rgba(124,58,237,0.15)] border-[var(--color-primary)] shadow-glow ring-1 ring-[var(--color-primary)]'
                                    : 'bg-white/5 border-white/10 hover:border-[var(--color-primary)] hover:-translate-y-1 hover:shadow-lg'
                                }`}
                            onClick={() => onSelectInterpreter(interpreter.id)}
                            type="button"
                            suppressHydrationWarning
                        >
                            {/* Standard Content */}
                            <div className="z-10 flex flex-col items-center transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-4">
                                <div className="text-5xl mb-4 p-4 bg-white/5 rounded-full shadow-inner border border-white/5">
                                    {interpreter.icon}
                                </div>
                                <div className="font-bold text-lg mb-1 text-white">{interpreter.name}</div>
                                <div className="text-xs text-[var(--color-secondary)] font-medium mb-2">{interpreter.title}</div>
                                {interpreter.book && (
                                    <div className="text-[10px] text-[var(--color-text-muted)] bg-black/20 px-2 py-1 rounded-full">
                                        📚 {interpreter.book}
                                    </div>
                                )}
                            </div>

                            {/* Selection Checkmark */}
                            {selectedInterpreter === interpreter.id && (
                                <div className="absolute top-3 right-3 text-white bg-[var(--color-primary)] rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-20">
                                    ✓
                                </div>
                            )}

                            {/* Hover Reveal Content (Methodology) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] p-6 flex flex-col items-center justify-center text-center opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 z-20">
                                <div className="font-bold text-[var(--color-secondary)] mb-2 text-sm">منهجه في التفسير</div>
                                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] line-clamp-4">
                                    {interpreter.description}
                                </p>
                                <div className="mt-4 flex flex-wrap justify-center gap-1">
                                    {interpreter.specialty.slice(0, 2).map((s, i) => (
                                        <span key={i} className="text-[9px] bg-[var(--color-primary)]/20 text-[var(--color-primary-light)] px-2 py-1 rounded-full border border-[var(--color-primary)]/20">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
