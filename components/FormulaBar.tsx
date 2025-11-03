
import React from 'react';

interface FormulaBarProps {
    selectedCellId: string | null;
    value: string;
    onChange: (value: string) => void;
}

const FormulaBar: React.FC<FormulaBarProps> = ({ selectedCellId, value, onChange }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="flex items-center p-2 bg-gray-100 flex-shrink-0 border-b border-gray-300">
            <div className="w-16 text-center font-mono text-gray-500 border-r border-gray-300 mr-2">{selectedCellId || ''}</div>
            <div className="flex-grow flex items-center">
                <span className="italic text-gray-500 font-mono text-lg mr-2">fx</span>
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder="Enter value or formula..."
                    className="w-full px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 rounded bg-white border border-gray-300"
                    disabled={!selectedCellId}
                />
            </div>
        </div>
    );
};

export default FormulaBar;
