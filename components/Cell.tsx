
import React, { useState, useEffect, useRef } from 'react';
import { CellData } from '../types';

interface CellProps {
    cellId: string;
    data: CellData;
    isSelected: boolean;
    isHighlighted: boolean;
    onMouseDown: () => void;
    onMouseOver: () => void;
    onCommit: (cellId: string, value: string) => void;
}

const Cell: React.FC<CellProps> = ({ cellId, data, isSelected, isHighlighted, onMouseDown, onMouseOver, onCommit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        // If another cell is selected, exit edit mode without committing
        if (!isSelected && isEditing) {
            handleBlur();
        }
    }, [isSelected, isEditing]);

    const handleDoubleClick = () => {
        onMouseDown();
        setIsEditing(true);
        setEditValue(data.rawValue);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
    };

    const handleBlur = () => {
        if (isEditing) {
            onCommit(cellId, editValue);
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onCommit(cellId, editValue);
            setIsEditing(false);
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(data.rawValue);
        }
    };
    
    const isError = data.calculatedValue.startsWith('#');

    const cellClasses = `p-2 border border-gray-300 min-w-[100px] overflow-hidden whitespace-nowrap overflow-ellipsis text-gray-900
        ${isHighlighted ? 'bg-blue-100' : ''}
        ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10 relative' : ''}
        ${isError ? 'text-red-600' : ''}
    `;

    if (isEditing) {
        return (
            <td className={`${cellClasses} p-0`}>
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full p-2 outline-none border-none text-gray-900 bg-gray-50"
                />
            </td>
        );
    }

    return (
        <td
            className={cellClasses}
            onDoubleClick={handleDoubleClick}
            onMouseDown={onMouseDown}
            onMouseOver={onMouseOver}
        >
            {data.calculatedValue}
        </td>
    );
};

export default Cell;
