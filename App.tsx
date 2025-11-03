
import React, { useState, useEffect, useCallback } from 'react';
import { CellData, Selection } from './types';
import Grid from './components/Grid';
import Toolbar from './components/Toolbar';
import FormulaBar from './components/FormulaBar';
import { coordsToCellId, getColumnName, cellIdToCoords, getRangeCoords } from './utils/gridUtils';
import { evaluateFormula } from './services/formulaParser';

// The SheetJS library (XLSX) is loaded from a CDN in index.html
declare const XLSX: any;

const INITIAL_ROWS = 20;
const INITIAL_COLS = 10; // A-J

const App: React.FC = () => {
    const [gridData, setGridData] = useState<Record<string, CellData>>(() => {
        const initialData: Record<string, CellData> = {};
        for (let row = 0; row < INITIAL_ROWS; row++) {
            for (let col = 0; col < INITIAL_COLS; col++) {
                const cellId = coordsToCellId(row, col);
                initialData[cellId] = { rawValue: '', calculatedValue: '' };
            }
        }
        return initialData;
    });

    const [rowCount, setRowCount] = useState(INITIAL_ROWS);
    const [colCount, setColCount] = useState(INITIAL_COLS);
    const [selection, setSelection] = useState<Selection>({ type: 'cell', id: 'A1' });
    const [lastClickedHeader, setLastClickedHeader] = useState<{ type: 'row' | 'col', index: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const recalculateSheet = useCallback(() => {
        setGridData(currentGrid => {
            const newGrid = JSON.parse(JSON.stringify(currentGrid));
            let changedInPass;
            const maxPasses = 10; // To handle dependencies and prevent infinite loops
            
            for (let pass = 0; pass < maxPasses; pass++) {
                changedInPass = false;
                for (let row = 0; row < rowCount; row++) {
                    for (let col = 0; col < colCount; col++) {
                        const cellId = coordsToCellId(row, col);
                        const cell = newGrid[cellId];
                        if (cell && cell.rawValue.startsWith('=')) {
                            const { value, error } = evaluateFormula(cell.rawValue, newGrid, rowCount, colCount);
                            const newCalculatedValue = error || value.toString();
                            if (newCalculatedValue !== cell.calculatedValue) {
                                cell.calculatedValue = newCalculatedValue;
                                changedInPass = true;
                            }
                        }
                    }
                }
                if (!changedInPass) break;
            }
            return newGrid;
        });
    }, [rowCount, colCount]);

    useEffect(() => {
        recalculateSheet();
    }, [recalculateSheet]);

    const handleCellChange = useCallback((cellId: string, rawValue: string) => {
        const calculatedValue = rawValue.startsWith('=') ? '...' : rawValue;
        setGridData(prev => ({
            ...prev,
            [cellId]: { ...prev[cellId], rawValue, calculatedValue }
        }));
    }, []);
    
    const handleClearSelection = useCallback(() => {
        if (selection.type !== 'range') return;

        const rangeCoords = getRangeCoords(selection.startId, selection.endId);
        if (!rangeCoords) return;

        const { minRow, minCol, maxRow, maxCol } = rangeCoords;
        
        setGridData(prev => {
            const newGrid = {...prev};
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    const cellId = coordsToCellId(r, c);
                    newGrid[cellId] = { rawValue: '', calculatedValue: '' };
                }
            }
            return newGrid;
        });
    }, [selection]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            if (activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) {
                return;
            }

            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                if (selection.type === 'cell') {
                    handleCellChange(selection.id, '');
                } else if (selection.type === 'range') {
                    handleClearSelection();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selection, handleCellChange, handleClearSelection]);
    
    useEffect(() => {
        const handleMouseUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const handleSetSelection = (newSelection: Selection) => {
        setSelection(newSelection);
        if (newSelection.type !== 'row' && newSelection.type !== 'col') {
             setLastClickedHeader(null);
        }
    };
    
    const handleHeaderClick = (type: 'row' | 'col', index: number, e: React.MouseEvent) => {
        const { shiftKey, metaKey, ctrlKey } = e;
    
        if (shiftKey && lastClickedHeader && lastClickedHeader.type === type) {
            const start = Math.min(lastClickedHeader.index, index);
            const end = Math.max(lastClickedHeader.index, index);
            const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
            setSelection({ type, indices });
        } else if (metaKey || ctrlKey) {
            let currentIndices: number[] = [];
            if (selection.type === type) {
                currentIndices = selection.indices;
            }
            
            const newIndices = currentIndices.includes(index)
                ? currentIndices.filter(i => i !== index)
                : [...currentIndices, index];

            setSelection({ type, indices: newIndices.sort((a,b) => a - b) });
            setLastClickedHeader({ type, index });
        } else {
            setSelection({ type, indices: [index] });
            setLastClickedHeader({ type, index });
        }
    };
    
    const handleCellMouseDown = (cellId: string) => {
        setIsDragging(true);
        handleSetSelection({ type: 'range', startId: cellId, endId: cellId });
    };

    const handleCellMouseOver = (cellId: string) => {
        if (isDragging) {
            setSelection(prevSelection => {
                if (prevSelection.type === 'range') {
                    return { ...prevSelection, endId: cellId };
                }
                return prevSelection;
            });
        }
    };

    const addRow = () => {
        const newRowCount = rowCount + 1;
        const newGrid = {...gridData};
        for(let col = 0; col < colCount; col++) {
            const cellId = coordsToCellId(newRowCount - 1, col);
            newGrid[cellId] = { rawValue: '', calculatedValue: '' };
        }
        setGridData(newGrid);
        setRowCount(newRowCount);
    };

    const addCol = () => {
        const newColCount = colCount + 1;
        const newGrid = {...gridData};
        for(let row = 0; row < rowCount; row++) {
            const cellId = coordsToCellId(row, newColCount - 1);
            newGrid[cellId] = { rawValue: '', calculatedValue: '' };
        }
        setGridData(newGrid);
        setColCount(newColCount);
    };

    const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
                const newGrid: Record<string, CellData> = {};
                const newRowCount = jsonData.length;
                const newColCount = newRowCount > 0 ? jsonData.reduce((max, row) => Math.max(max, row.length), 0) : 0;
    
                for (let r = 0; r < newRowCount; r++) {
                    for (let c = 0; c < newColCount; c++) {
                        const cellId = coordsToCellId(r, c);
                        const rawValue = jsonData[r]?.[c]?.toString() || '';
                        newGrid[cellId] = {
                            rawValue,
                            calculatedValue: rawValue.startsWith('=') ? '...' : rawValue
                        };
                    }
                }
                setGridData(newGrid);
                setRowCount(newRowCount);
                setColCount(newColCount);
                setSelection({ type: 'cell', id: 'A1' });
            } catch (error) {
                console.error("Error processing file:", error);
                alert("Failed to load the file. It might be corrupted or in an unsupported format.");
            }
        };
        reader.readAsBinaryString(file);
    
        e.target.value = ''; // Reset file input
    };
    
    const handleFileSave = useCallback(() => {
        const sheetData: (string | number)[][] = [];
        for (let r = 0; r < rowCount; r++) {
            const row: (string | number)[] = [];
            for (let c = 0; c < colCount; c++) {
                const cellId = coordsToCellId(r, c);
                row.push(gridData[cellId]?.rawValue || '');
            }
            sheetData.push(row);
        }
    
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, 'lite-excel.xlsx');
    }, [gridData, rowCount, colCount]);
    
    const handleDeleteRow = useCallback(() => {
        let rowsToDelete: number[] = [];
        if (selection.type === 'row') {
            rowsToDelete = selection.indices;
        } else if (selection.type === 'cell') {
            const coords = cellIdToCoords(selection.id);
            if (coords) rowsToDelete = [coords.row];
        }
        if (rowsToDelete.length === 0) return;
    
        const deleteSet = new Set(rowsToDelete);
        const newGrid: Record<string, CellData> = {};
        let newRowIndex = 0;
        for (let r = 0; r < rowCount; r++) {
            if (!deleteSet.has(r)) {
                for (let c = 0; c < colCount; c++) {
                    const oldId = coordsToCellId(r, c);
                    if (gridData[oldId]) {
                        const newId = coordsToCellId(newRowIndex, c);
                        newGrid[newId] = gridData[oldId];
                    }
                }
                newRowIndex++;
            }
        }
        setGridData(newGrid);
        setRowCount(prev => prev - rowsToDelete.length);
        setSelection({ type: 'none' });
    }, [selection, gridData, rowCount, colCount]);

    const handleDeleteCol = useCallback(() => {
        let colsToDelete: number[] = [];
        if (selection.type === 'col') {
            colsToDelete = selection.indices;
        } else if (selection.type === 'cell') {
            const coords = cellIdToCoords(selection.id);
            if (coords) colsToDelete = [coords.col];
        }
        if (colsToDelete.length === 0) return;
    
        const deleteSet = new Set(colsToDelete);
        const newGrid: Record<string, CellData> = {};
        let newColIndex = 0;
        for (let c = 0; c < colCount; c++) {
            if (!deleteSet.has(c)) {
                for (let r = 0; r < rowCount; r++) {
                    const oldId = coordsToCellId(r, c);
                    if (gridData[oldId]) {
                        const newId = coordsToCellId(r, newColIndex);
                        newGrid[newId] = gridData[oldId];
                    }
                }
                newColIndex++;
            }
        }
        setGridData(newGrid);
        setColCount(prev => prev - colsToDelete.length);
        setSelection({ type: 'none' });
    }, [selection, gridData, rowCount, colCount]);

    const handleInsertRow = useCallback(() => {
        let rowIndex: number | null = null;
        if (selection.type === 'row' && selection.indices.length > 0) {
            rowIndex = Math.min(...selection.indices);
        } else if (selection.type === 'cell') {
            const coords = cellIdToCoords(selection.id);
            if (coords) rowIndex = coords.row;
        }
        if (rowIndex === null) return;


        const newGrid: Record<string, CellData> = {};
        for (let r = 0; r < rowIndex; r++) {
            for (let c = 0; c < colCount; c++) {
                const id = coordsToCellId(r, c);
                if (gridData[id]) newGrid[id] = gridData[id];
            }
        }
        for (let c = 0; c < colCount; c++) {
            newGrid[coordsToCellId(rowIndex, c)] = { rawValue: '', calculatedValue: '' };
        }
        for (let r = rowIndex; r < rowCount; r++) {
            for (let c = 0; c < colCount; c++) {
                const oldId = coordsToCellId(r, c);
                const newId = coordsToCellId(r + 1, c);
                if (gridData[oldId]) newGrid[newId] = gridData[oldId];
            }
        }
        setGridData(newGrid);
        setRowCount(prev => prev + 1);
    }, [selection, gridData, rowCount, colCount]);

    const handleInsertCol = useCallback(() => {
        let colIndex: number | null = null;
        if (selection.type === 'col' && selection.indices.length > 0) {
            colIndex = Math.min(...selection.indices);
        } else if (selection.type === 'cell') {
            const coords = cellIdToCoords(selection.id);
            if (coords) colIndex = coords.col;
        }
        if (colIndex === null) return;

        const newGrid: Record<string, CellData> = {};
        for (let r = 0; r < rowCount; r++) {
            for (let c = 0; c < colIndex; c++) {
                const id = coordsToCellId(r, c);
                if (gridData[id]) newGrid[id] = gridData[id];
            }
            newGrid[coordsToCellId(r, colIndex)] = { rawValue: '', calculatedValue: '' };
            for (let c = colIndex; c < colCount; c++) {
                const oldId = coordsToCellId(r, c);
                const newId = coordsToCellId(r, c + 1);
                if (gridData[oldId]) newGrid[newId] = gridData[oldId];
            }
        }
        setGridData(newGrid);
        setColCount(prev => prev + 1);
    }, [selection, gridData, rowCount, colCount]);

    const handleDuplicateRow = useCallback(() => {
        let rowsToDuplicate: number[] = [];
        if (selection.type === 'row') {
            rowsToDuplicate = selection.indices;
        } else if (selection.type === 'cell') {
            const coords = cellIdToCoords(selection.id);
            if (coords) rowsToDuplicate = [coords.row];
        }
        if (rowsToDuplicate.length === 0) return;
    
        rowsToDuplicate.sort((a, b) => a - b);
        const numToDuplicate = rowsToDuplicate.length;
        const insertionPoint = rowsToDuplicate[rowsToDuplicate.length - 1] + 1;
    
        const copiedRowsData = rowsToDuplicate.map(rIndex => {
            const rowData: CellData[] = [];
            for (let c = 0; c < colCount; c++) {
                const id = coordsToCellId(rIndex, c);
                rowData.push(gridData[id] ? { ...gridData[id] } : { rawValue: '', calculatedValue: '' });
            }
            return rowData;
        });
    
        const newGrid: Record<string, CellData> = {};
        // 1. Copy and shift rows that come after the insertion point
        for (let r = rowCount - 1; r >= insertionPoint; r--) {
            for (let c = 0; c < colCount; c++) {
                const oldId = coordsToCellId(r, c);
                if (gridData[oldId]) {
                    const newId = coordsToCellId(r + numToDuplicate, c);
                    newGrid[newId] = gridData[oldId];
                }
            }
        }
        // 2. Insert the copied rows
        copiedRowsData.forEach((rowData, index) => {
            const newRowIndex = insertionPoint + index;
            rowData.forEach((cell, c) => {
                const newId = coordsToCellId(newRowIndex, c);
                newGrid[newId] = cell;
            });
        });
        // 3. Copy rows that are before the insertion point (unchanged)
        for (let r = 0; r < insertionPoint; r++) {
            for (let c = 0; c < colCount; c++) {
                const id = coordsToCellId(r, c);
                if (gridData[id]) {
                    newGrid[id] = gridData[id];
                }
            }
        }
    
        setGridData(newGrid);
        setRowCount(prev => prev + numToDuplicate);
    }, [selection, gridData, rowCount, colCount]);
    
    const handleDuplicateCol = useCallback(() => {
        let colsToDuplicate: number[] = [];
        if (selection.type === 'col') {
            colsToDuplicate = selection.indices;
        } else if (selection.type === 'cell') {
            const coords = cellIdToCoords(selection.id);
            if (coords) colsToDuplicate = [coords.col];
        }
        if (colsToDuplicate.length === 0) return;

        colsToDuplicate.sort((a, b) => a - b);
        const numToDuplicate = colsToDuplicate.length;
        const insertionPoint = colsToDuplicate[colsToDuplicate.length - 1] + 1;

        const copiedColsData = colsToDuplicate.map(cIndex => {
            const colData: CellData[] = [];
            for (let r = 0; r < rowCount; r++) {
                const id = coordsToCellId(r, cIndex);
                colData.push(gridData[id] ? { ...gridData[id] } : { rawValue: '', calculatedValue: '' });
            }
            return colData;
        });

        const newGrid: Record<string, CellData> = {};

        for(let r = 0; r < rowCount; r++){
            // Copy and shift cols after insertion
            for (let c = colCount - 1; c >= insertionPoint; c--) {
                const oldId = coordsToCellId(r, c);
                 if (gridData[oldId]) {
                    const newId = coordsToCellId(r, c + numToDuplicate);
                    newGrid[newId] = gridData[oldId];
                }
            }
            // Insert duplicated cols
            copiedColsData.forEach((colData, index) => {
                const newColIndex = insertionPoint + index;
                const newId = coordsToCellId(r, newColIndex);
                newGrid[newId] = colData[r];
            });
            // Copy cols before insertion
            for (let c = 0; c < insertionPoint; c++) {
                const id = coordsToCellId(r, c);
                if (gridData[id]) {
                    newGrid[id] = gridData[id];
                }
            }
        }
        
        setGridData(newGrid);
        setColCount(prev => prev + numToDuplicate);
    }, [selection, gridData, rowCount, colCount]);

    const getActiveCellId = () => {
        if (selection.type === 'cell') return selection.id;
        if (selection.type === 'range') return selection.startId;
        return null;
    }
    const activeCellId = getActiveCellId();
    const activeCellData = activeCellId ? gridData[activeCellId] : null;

    return (
        <div className="flex flex-col h-screen font-sans text-gray-800">
            <header className="bg-white shadow-md p-2 flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-700">Lite Excel</h1>
            </header>
            <Toolbar
                onAddRow={addRow}
                onAddCol={addCol}
                onSave={handleFileSave}
                onLoad={handleFileLoad}
                selection={selection}
                onDeleteRow={handleDeleteRow}
                onDeleteCol={handleDeleteCol}
                onInsertRow={handleInsertRow}
                onInsertCol={handleInsertCol}
                onDuplicateRow={handleDuplicateRow}
                onDuplicateCol={handleDuplicateCol}
            />
            <FormulaBar
                selectedCellId={activeCellId}
                value={activeCellData?.rawValue || ''}
                onChange={(val) => activeCellId && handleCellChange(activeCellId, val)}
            />
            <div className="flex-grow overflow-auto p-2">
                <Grid
                    gridData={gridData}
                    rowCount={rowCount}
                    colCount={colCount}
                    selection={selection}
                    onCellChange={handleCellChange}
                    onHeaderClick={handleHeaderClick}
                    onCellMouseDown={handleCellMouseDown}
                    onCellMouseOver={handleCellMouseOver}
                />
            </div>
        </div>
    );
};

export default App;
