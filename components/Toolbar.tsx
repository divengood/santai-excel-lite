
import React, { useRef } from 'react';
import { Selection } from '../types';

interface ToolbarProps {
    onAddRow: () => void;
    onAddCol: () => void;
    onSave: () => void;
    onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onInsertRow: () => void;
    onInsertCol: () => void;
    onDeleteRow: () => void;
    onDeleteCol: () => void;
    onDuplicateRow: () => void;
    onDuplicateCol: () => void;
    selection: Selection;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
    onAddRow, onAddCol, onSave, onLoad, selection,
    onDeleteRow, onDeleteCol, onInsertRow, onInsertCol,
    onDuplicateRow, onDuplicateCol
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleLoadClick = () => fileInputRef.current?.click();
    
    const rowActionsDisabled = selection.type === 'col' || selection.type === 'none' || selection.type === 'range' || (selection.type === 'row' && selection.indices.length === 0);
    const colActionsDisabled = selection.type === 'row' || selection.type === 'none' || selection.type === 'range' || (selection.type === 'col' && selection.indices.length === 0);


    const baseButtonClass = "px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500";
    const enabledButtonClass = "hover:bg-gray-50";
    const disabledButtonClass = "opacity-50 cursor-not-allowed";

    const getButtonClass = (disabled: boolean = false) => {
        return `${baseButtonClass} ${disabled ? disabledButtonClass : enabledButtonClass}`;
    }

    return (
        <div className="bg-gray-100 p-2 flex items-center space-x-4 flex-shrink-0 border-b border-gray-300 flex-wrap gap-y-2">
            {/* File Group */}
            <div className="flex items-center space-x-2 border-r border-gray-300 pr-4">
                <button onClick={handleLoadClick} className={getButtonClass()}>Load File</button>
                <input type="file" ref={fileInputRef} onChange={onLoad} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
                <button onClick={onSave} className={getButtonClass()}>Save File</button>
            </div>

            {/* Edit Group */}
            <div className="flex items-center space-x-2 border-r border-gray-300 pr-4">
                <button title="Insert Row" onClick={onInsertRow} disabled={rowActionsDisabled} className={getButtonClass(rowActionsDisabled)}>Insert Row</button>
                <button title="Insert Column" onClick={onInsertCol} disabled={colActionsDisabled} className={getButtonClass(colActionsDisabled)}>Insert Col</button>
                <button title="Delete Row(s)" onClick={onDeleteRow} disabled={rowActionsDisabled} className={getButtonClass(rowActionsDisabled)}>Delete Row(s)</button>
                <button title="Delete Column(s)" onClick={onDeleteCol} disabled={colActionsDisabled} className={getButtonClass(colActionsDisabled)}>Delete Col(s)</button>
                <button title="Duplicate Row(s)" onClick={onDuplicateRow} disabled={rowActionsDisabled} className={getButtonClass(rowActionsDisabled)}>Duplicate Row(s)</button>
                <button title="Duplicate Column(s)" onClick={onDuplicateCol} disabled={colActionsDisabled} className={getButtonClass(colActionsDisabled)}>Duplicate Col(s)</button>
            </div>
            
            {/* Add Group */}
            <div className="flex items-center space-x-2">
                <button title="Add a new row at the end of the sheet" onClick={onAddRow} className={getButtonClass()}>Add Row (End)</button>
                <button title="Add a new column at the end of the sheet" onClick={onAddCol} className={getButtonClass()}>Add Col (End)</button>
            </div>
        </div>
    );
};

export default Toolbar;
