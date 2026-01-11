import GenericElement, { GenericElementProps } from "../GenericElement";

export interface DynamicTextProps extends GenericElementProps {
    value: string;
    placeholder?: string;
    setValue: (value: string) => void;
    size?: 'sm' | 'md' | 'lg';
    isTextarea?: boolean;
    type?: 'text' | 'password' | 'email' | 'url' | 'number' | 'tel';
    disabled?: boolean;
    rows?: number;
}


const DynamicText: React.FC<DynamicTextProps> = ({
    label,
    placeholder,
    className = "",
    value,
    setValue,
    size = 'md',
    isTextarea = false,
    type = 'text',
    disabled = false,
    rows = 3,
}) => {
    const sizeClass =
        size === 'sm' ? 'input-sm' :
            size === 'lg' ? 'input-lg' :
                'input-md';

    return (
        <GenericElement label={label} className={className}>
            {isTextarea ? (
                <textarea
                    className={`textarea ${sizeClass} w-full`}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={disabled}
                    rows={rows}
                />
            ) : (
                <input
                    type={type}
                    className={`input ${sizeClass} w-full`}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={disabled}
                />
            )}
        </GenericElement>
    );
};

export default DynamicText;
