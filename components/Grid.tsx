
import React from 'react';
import { CellData, Selection } from '../types';
import { coordsToCellId, getColumnName, getRangeCoords } from '../utils/gridUtils';
import Cell from './Cell';

interface GridProps {
    gridData: Record<string, CellData>;
    rowCount: number;
    colCount: number;
    selection: Selection;
    onCellChange: (cellId: string, rawValue: string) => void;
    onHeaderClick: (type: 'row' | 'col', index: number, e: React.MouseEvent) => void;
    onCellMouseDown: (cellId: string) => void;
    onCellMouseOver: (cellId: string) => void;
}

const Grid: React.FC<GridProps> = ({ gridData, rowCount, colCount, selection, onCellChange, onHeaderClick, onCellMouseDown, onCellMouseOver }) => {
    const handleCellCommit = (cellId: string, value: string) => {
        onCellChange(cellId, value);
    };

    const rangeCoords = selection.type === 'range' ? getRangeCoords(selection.startId, selection.endId) : null;

    return (
        <table className="table-fixed border-collapse border-2 border-gray-300">
            <thead>
                <tr>
                    <th className="sticky top-0 left-0 z-20 w-16 bg-gray-200 border border-gray-300"></th>
                    {Array.from({ length: colCount }).map((_, colIndex) => {
                        const isColSelected = selection.type === 'col' && selection.indices.includes(colIndex);
                        return (
                            <th 
                                key={colIndex} 
                                className={`sticky top-0 z-10 p-2 min-w-[100px] font-semibold bg-gray-200 border border-gray-300 text-center cursor-pointer text-gray-900 ${isColSelected ? 'bg-blue-200' : 'hover:bg-gray-300'}`}
                                onClick={(e) => onHeaderClick('col', colIndex, e)}
                            >
                                {getColumnName(colIndex)}
                            </th>
                        )
                    })}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rowCount }).map((_, rowIndex) => {
                    const isRowSelected = selection.type === 'row' && selection.indices.includes(rowIndex);
                    return (
                        <tr key={rowIndex}>
                            <th 
                                className={`sticky left-0 z-10 p-2 w-16 bg-gray-200 border border-gray-300 text-center font-semibold cursor-pointer text-gray-900 ${isRowSelected ? 'bg-blue-200' : 'hover:bg-gray-300'}`}
                                onClick={(e) => onHeaderClick('row', rowIndex, e)}
                            >
                                {rowIndex + 1}
                            </th>
                            {Array.from({ length: colCount }).map((_, colIndex) => {
                                const cellId = coordsToCellId(rowIndex, colIndex);
                                
                                let isSelected = false;
                                let isHighlighted = false;

                                if (selection.type === 'range' && rangeCoords) {
                                    const { minRow, minCol, maxRow, maxCol } = rangeCoords;
                                    const isInRange = rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
                                    if(isInRange) {
                                        isSelected = cellId === selection.startId;
                                        isHighlighted = cellId !== selection.startId;
                                    }
                                } else if (selection.type === 'cell') {
                                    isSelected = selection.id === cellId;
                                } else {
                                     isHighlighted = isRowSelected || (selection.type === 'col' && selection.indices.includes(colIndex));
                                }

                                return (
                                    <Cell
                                        key={cellId}
                                        cellId={cellId}
                                        data={gridData[cellId] || { rawValue: '', calculatedValue: '' }}
                                        isSelected={isSelected}
                                        isHighlighted={isHighlighted}
                                        onMouseDown={() => onCellMouseDown(cellId)}
                                        onMouseOver={() => onCellMouseOver(cellId)}
                                        onCommit={handleCellCommit}
                                    />
                                );
                            })}
                        </tr>
                    )
                })}
            </tbody>
        </table>
    );
};

export default Grid;
