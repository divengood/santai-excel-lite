
import { CellData } from '../types';
import { cellIdToCoords } from '../utils/gridUtils';

const CELL_REF_REGEX = /[A-Z]+\d+/g;
const SUM_REGEX = /SUM\((([A-Z]+\d+):([A-Z]+\d+))\)/i;

const parseValue = (value: string | undefined): number => {
    if (value === undefined || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

const evaluateSimpleExpression = (expr: string, grid: Record<string, CellData>): { value: number, error: string | null } => {
    try {
        const sanitizedExpr = expr.replace(CELL_REF_REGEX, (match) => {
            const cell = grid[match];
            if (!cell) throw new Error(`#REF! Invalid cell reference: ${match}`);
            if (cell.error) throw new Error(cell.error);
            if(cell.calculatedValue.startsWith('#')) throw new Error(cell.calculatedValue);
            return `(${cell.calculatedValue || '0'})`;
        });
        
        // Basic safety check
        if (/[^0-9\+\-\*\/\(\)\.\s]/.test(sanitizedExpr)) {
            return { value: 0, error: '#NAME?' };
        }
        
        // Using Function constructor for safer evaluation than eval()
        const result = new Function(`return ${sanitizedExpr}`)();
        if (typeof result !== 'number' || !isFinite(result)) {
            return { value: 0, error: '#VALUE!' };
        }
        return { value: result, error: null };

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '#ERROR!';
        return { value: 0, error: errorMessage.split(' ')[0] }; // Return only the error code
    }
};

const evaluateSum = (rangeStr: string, grid: Record<string, CellData>, rowCount: number, colCount: number): { value: number, error: string | null } => {
    const [startCell, endCell] = rangeStr.split(':');
    const startCoords = cellIdToCoords(startCell);
    const endCoords = cellIdToCoords(endCell);

    if (!startCoords || !endCoords) return { value: 0, error: '#REF!' };

    const r1 = Math.min(startCoords.row, endCoords.row);
    const r2 = Math.max(startCoords.row, endCoords.row);
    const c1 = Math.min(startCoords.col, endCoords.col);
    const c2 = Math.max(startCoords.col, endCoords.col);

    if (r2 >= rowCount || c2 >= colCount) return { value: 0, error: '#REF!' };

    let sum = 0;
    for (let row = r1; row <= r2; row++) {
        for (let col = c1; col <= c2; col++) {
            const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
            const cell = grid[cellId];
            if (cell) {
                if(cell.error) return { value: 0, error: cell.error };
                if(cell.calculatedValue.startsWith('#')) return { value: 0, error: cell.calculatedValue };
                sum += parseValue(cell.calculatedValue);
            }
        }
    }
    return { value: sum, error: null };
};

export const evaluateFormula = (
    formula: string,
    grid: Record<string, CellData>,
    rowCount: number,
    colCount: number
): { value: number | string; error: string | null } => {
    const expr = formula.substring(1);

    const sumMatch = expr.match(SUM_REGEX);
    if (sumMatch) {
        return evaluateSum(sumMatch[1], grid, rowCount, colCount);
    }

    if (CELL_REF_REGEX.test(expr)) {
        return evaluateSimpleExpression(expr, grid);
    }
    
    const num = parseFloat(expr);
    if (!isNaN(num)) {
        return { value: num, error: null };
    }

    return { value: 0, error: '#NAME?' };
};
