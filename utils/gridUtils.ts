
export const getColumnName = (colIndex: number): string => {
    let name = '';
    let dividend = colIndex + 1;
    while (dividend > 0) {
        const modulo = (dividend - 1) % 26;
        name = String.fromCharCode(65 + modulo) + name;
        dividend = Math.floor((dividend - modulo) / 26);
    }
    return name;
};

export const coordsToCellId = (rowIndex: number, colIndex: number): string => {
    return `${getColumnName(colIndex)}${rowIndex + 1}`;
};

export const cellIdToCoords = (cellId: string): { row: number; col: number } | null => {
    const match = cellId.match(/^([A-Z]+)(\d+)$/i);
    if (!match) return null;

    const colStr = match[1].toUpperCase();
    const row = parseInt(match[2], 10) - 1;

    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1;

    return { row, col };
};

export const getRangeCoords = (startId: string, endId: string): { minRow: number, minCol: number, maxRow: number, maxCol: number } | null => {
    const startCoords = cellIdToCoords(startId);
    const endCoords = cellIdToCoords(endId);

    if (!startCoords || !endCoords) return null;

    return {
        minRow: Math.min(startCoords.row, endCoords.row),
        minCol: Math.min(startCoords.col, endCoords.col),
        maxRow: Math.max(startCoords.row, endCoords.row),
        maxCol: Math.max(startCoords.col, endCoords.col),
    };
};
