import { useState, KeyboardEvent } from "react";
import GenericElement, { GenericElementProps } from "../GenericElement";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export interface DynamicCommaSeperatedTextProps extends GenericElementProps {
    values: string[];
    setValues: (values: string[]) => void;
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
}

const DynamicCommaSeperatedText: React.FC<DynamicCommaSeperatedTextProps> = ({
    label,
    className = "",
    values,
    setValues,
    placeholder = "Yazın ve virgül veya Enter ile ekleyin...",
    size = 'md',
    disabled = false,
}) => {
    const [inputValue, setInputValue] = useState("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");

    const sizeClass =
        size === 'sm' ? 'input-sm' :
            size === 'lg' ? 'input-lg' :
                'input-md';

    const badgeSizeClass =
        size === 'sm' ? 'badge-sm' :
            size === 'lg' ? 'badge-lg' :
                'badge-md';

    const addValue = (value: string) => {
        const trimmed = value.trim();
        if (trimmed && !values.includes(trimmed)) {
            setValues([...values, trimmed]);
        }
        setInputValue("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            addValue(inputValue);
        } else if (e.key === 'Backspace' && inputValue === "" && values.length > 0) {
            removeValue(values.length - 1);
        }
    };

    const handleInputChange = (value: string) => {
        if (value.includes(',')) {
            const parts = value.split(',');
            parts.forEach((part, index) => {
                if (index < parts.length - 1) {
                    addValue(part);
                } else {
                    setInputValue(part);
                }
            });
        } else {
            setInputValue(value);
        }
    };

    const removeValue = (index: number) => {
        setValues(values.filter((_, i) => i !== index));
    };

    const startEditing = (index: number) => {
        if (disabled) return;
        setEditingIndex(index);
        setEditValue(values[index]);
    };

    const finishEditing = () => {
        if (editingIndex === null) return;

        const trimmed = editValue.trim();
        if (trimmed && trimmed !== values[editingIndex]) {
            const newValues = [...values];
            if (!values.includes(trimmed) || values[editingIndex] === trimmed) {
                newValues[editingIndex] = trimmed;
                setValues(newValues);
            }
        }
        setEditingIndex(null);
        setEditValue("");
    };

    const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditing();
        } else if (e.key === 'Escape') {
            setEditingIndex(null);
            setEditValue("");
        }
    };

    return (
        <GenericElement label={label} className={className}>
            <div className={`input ${sizeClass} w-full h-auto min-h-12 flex flex-wrap gap-2 items-center py-2`}>
                {values.map((value, index) => (
                    editingIndex === index ? (
                        <input
                            key={index}
                            type="text"
                            className="input input-xs input-bordered w-auto min-w-20"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={finishEditing}
                            onKeyDown={handleEditKeyDown}
                            autoFocus
                        />
                    ) : (
                        <span
                            key={index}
                            className={`badge ${badgeSizeClass} badge-primary gap-1 cursor-pointer hover:badge-secondary transition-colors`}
                            onDoubleClick={() => startEditing(index)}
                        >
                            {value}
                            {!disabled && (
                                <button
                                    type="button"
                                    className="hover:text-error"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeValue(index);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                                </button>
                            )}
                        </span>
                    )
                ))}
                {!disabled && (
                    <input
                        type="text"
                        className="flex-1 min-w-32 bg-transparent outline-none border-none"
                        placeholder={values.length === 0 ? placeholder : ""}
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => inputValue && addValue(inputValue)}
                    />
                )}
            </div>
            <p className="text-xs text-base-content/60 mt-1">
                Düzenlemek için çift tıklayın
            </p>
        </GenericElement>
    );
};

export default DynamicCommaSeperatedText;
