/**
 * Utility functions for 100% Microsoft Word table manipulations
 */

export function getSelectedTableContext(cellEl) {
  if (!cellEl) return null;
  const cell = cellEl.closest('td, th');
  if (!cell) return null;
  const row = cell.closest('tr');
  if (!row) return null;
  const table = row.closest('table');
  if (!table) return null;

  const rowIndex = Array.from(table.querySelectorAll('tr')).indexOf(row);
  const cellIndex = Array.from(row.children).indexOf(cell);

  return { table, row, cell, rowIndex, cellIndex };
}

export function insertRowAbove(table, rowIndex) {
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));
  const targetRow = rows[rowIndex] || rows[0];
  if (!targetRow) return;

  const colCount = Array.from(targetRow.children).reduce((acc, c) => acc + (parseInt(c.getAttribute('colspan') || '1', 10)), 0);
  const newRow = document.createElement('tr');
  for (let i = 0; i < colCount; i++) {
    const td = document.createElement('td');
    td.innerHTML = '&nbsp;';
    td.style.border = targetRow.children[0]?.style.border || '1px solid #cbd5e1';
    td.style.padding = '4pt 6pt';
    newRow.appendChild(td);
  }
  targetRow.parentNode.insertBefore(newRow, targetRow);
}

export function insertRowBelow(table, rowIndex) {
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));
  const targetRow = rows[rowIndex] || rows[rows.length - 1];
  if (!targetRow) return;

  const colCount = Array.from(targetRow.children).reduce((acc, c) => acc + (parseInt(c.getAttribute('colspan') || '1', 10)), 0);
  const newRow = document.createElement('tr');
  for (let i = 0; i < colCount; i++) {
    const td = document.createElement('td');
    td.innerHTML = '&nbsp;';
    td.style.border = targetRow.children[0]?.style.border || '1px solid #cbd5e1';
    td.style.padding = '4pt 6pt';
    newRow.appendChild(td);
  }
  if (targetRow.nextSibling) {
    targetRow.parentNode.insertBefore(newRow, targetRow.nextSibling);
  } else {
    targetRow.parentNode.appendChild(newRow);
  }
}

export function insertColumnLeft(table, cellIndex) {
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));
  rows.forEach((r, rIdx) => {
    const cells = Array.from(r.children);
    const targetCell = cells[cellIndex] || cells[0];
    const isHeader = rIdx === 0 || targetCell?.tagName === 'TH';
    const newCell = document.createElement(isHeader ? 'th' : 'td');
    newCell.innerHTML = isHeader ? 'Kolom Baru' : '&nbsp;';
    newCell.style.border = targetCell?.style.border || '1px solid #cbd5e1';
    newCell.style.padding = '4pt 6pt';
    if (isHeader) {
      newCell.style.fontWeight = 'bold';
      newCell.style.backgroundColor = targetCell?.style.backgroundColor || '#f1f5f9';
    }
    if (targetCell) {
      r.insertBefore(newCell, targetCell);
    } else {
      r.appendChild(newCell);
    }
  });
}

export function insertColumnRight(table, cellIndex) {
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));
  rows.forEach((r, rIdx) => {
    const cells = Array.from(r.children);
    const targetCell = cells[cellIndex] || cells[cells.length - 1];
    const isHeader = rIdx === 0 || targetCell?.tagName === 'TH';
    const newCell = document.createElement(isHeader ? 'th' : 'td');
    newCell.innerHTML = isHeader ? 'Kolom Baru' : '&nbsp;';
    newCell.style.border = targetCell?.style.border || '1px solid #cbd5e1';
    newCell.style.padding = '4pt 6pt';
    if (isHeader) {
      newCell.style.fontWeight = 'bold';
      newCell.style.backgroundColor = targetCell?.style.backgroundColor || '#f1f5f9';
    }
    if (targetCell && targetCell.nextSibling) {
      r.insertBefore(newCell, targetCell.nextSibling);
    } else {
      r.appendChild(newCell);
    }
  });
}

export function deleteRow(table, rowIndex) {
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length <= 1) {
    deleteTable(table);
    return;
  }
  const targetRow = rows[rowIndex];
  if (targetRow) targetRow.remove();
}

export function deleteColumn(table, cellIndex) {
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));
  const firstRowCells = Array.from(rows[0]?.children || []);
  if (firstRowCells.length <= 1) {
    deleteTable(table);
    return;
  }
  rows.forEach(r => {
    const cells = Array.from(r.children);
    if (cells[cellIndex]) cells[cellIndex].remove();
  });
}

export function deleteTable(table) {
  if (table) table.remove();
}

export function mergeCells(cell1, cell2) {
  if (!cell1 || !cell2 || cell1 === cell2) return;
  const row1 = cell1.closest('tr');
  const row2 = cell2.closest('tr');
  if (row1 === row2) {
    // Merge horizontally in same row
    const span1 = parseInt(cell1.getAttribute('colspan') || '1', 10);
    const span2 = parseInt(cell2.getAttribute('colspan') || '1', 10);
    cell1.setAttribute('colspan', span1 + span2);
    cell1.innerHTML = `${cell1.innerHTML} ${cell2.innerHTML}`.trim();
    cell2.remove();
  }
}

export function splitCell(cell, cols = 2) {
  if (!cell) return;
  const span = parseInt(cell.getAttribute('colspan') || '1', 10);
  if (span > 1) {
    cell.setAttribute('colspan', span - 1);
    const newCell = document.createElement(cell.tagName);
    newCell.innerHTML = '&nbsp;';
    newCell.style.border = cell.style.border;
    newCell.style.padding = cell.style.padding;
    cell.parentNode.insertBefore(newCell, cell.nextSibling);
  } else {
    // Add a cell with half width
    const newCell = document.createElement(cell.tagName);
    newCell.innerHTML = '&nbsp;';
    newCell.style.border = cell.style.border;
    newCell.style.padding = cell.style.padding;
    cell.parentNode.insertBefore(newCell, cell.nextSibling);
  }
}

export function setCellAlignment(cell, align = 'center', vAlign = 'middle') {
  if (!cell) return;
  cell.style.textAlign = align;
  cell.style.verticalAlign = vAlign;
}

export function setTableShading(target, color) {
  if (!target) return;
  if (color === 'none' || color === 'transparent') {
    target.style.backgroundColor = 'transparent';
  } else {
    target.style.backgroundColor = color;
  }
}

export function setTableBorder(table, borderType, color = '#cbd5e1', widthPt = 1, style = 'solid') {
  if (!table) return;
  const borderStr = `${widthPt * 1.33}px ${style} ${color}`;

  if (borderType === 'all') {
    table.style.border = borderStr;
    table.querySelectorAll('th, td').forEach(c => {
      c.style.border = borderStr;
    });
  } else if (borderType === 'none') {
    table.style.border = 'none';
    table.querySelectorAll('th, td').forEach(c => {
      c.style.border = 'none';
    });
  } else if (borderType === 'outside') {
    table.style.border = borderStr;
  } else if (borderType === 'inside') {
    table.querySelectorAll('th, td').forEach(c => {
      c.style.border = borderStr;
    });
  } else if (borderType === 'top') {
    table.style.borderTop = borderStr;
  } else if (borderType === 'bottom') {
    table.style.borderBottom = borderStr;
  } else if (borderType === 'left') {
    table.style.borderLeft = borderStr;
  } else if (borderType === 'right') {
    table.style.borderRight = borderStr;
  }
}

export function setAutoFit(table, mode) {
  if (!table) return;
  if (mode === 'contents') {
    table.style.width = 'auto';
    table.style.maxWidth = '100%';
    table.style.tableLayout = 'auto';
  } else if (mode === 'window') {
    table.style.width = '100%';
    table.style.maxWidth = '100%';
    table.style.tableLayout = 'auto';
  } else if (mode === 'fixed') {
    table.style.width = '100%';
    table.style.tableLayout = 'fixed';
  }
}

export function distributeColumns(table) {
  if (!table) return;
  const firstRow = table.querySelector('tr');
  if (!firstRow) return;
  const cells = Array.from(firstRow.children);
  const percent = +(100 / cells.length).toFixed(2);
  table.style.tableLayout = 'fixed';
  table.querySelectorAll('tr').forEach(r => {
    Array.from(r.children).forEach(c => {
      c.style.width = `${percent}%`;
    });
  });
}

export function distributeRows(table) {
  if (!table) return;
  const rows = table.querySelectorAll('tr');
  rows.forEach(r => {
    r.style.height = '24pt';
  });
}

export function toggleTableOption(table, option, checked) {
  if (!table) return;
  if (option === 'headerRow') {
    const firstRow = table.querySelector('tr');
    if (firstRow) {
      if (checked) {
        firstRow.style.backgroundColor = '#f1f5f9';
        firstRow.style.fontWeight = 'bold';
      } else {
        firstRow.style.backgroundColor = 'transparent';
        firstRow.style.fontWeight = 'normal';
      }
    }
  } else if (option === 'bandedRows') {
    const rows = Array.from(table.querySelectorAll('tr'));
    rows.forEach((r, idx) => {
      if (idx === 0) return;
      if (checked) {
        r.style.backgroundColor = idx % 2 === 1 ? '#ffffff' : '#f8fafc';
      } else {
        r.style.backgroundColor = '#ffffff';
      }
    });
  } else if (option === 'firstCol') {
    const rows = table.querySelectorAll('tr');
    rows.forEach(r => {
      const firstCell = r.children[0];
      if (firstCell) {
        firstCell.style.fontWeight = checked ? 'bold' : 'normal';
      }
    });
  } else if (option === 'totalRow') {
    const rows = Array.from(table.querySelectorAll('tr'));
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      if (checked) {
        lastRow.style.fontWeight = 'bold';
        lastRow.style.borderTop = '2px solid #0f172a';
        lastRow.style.borderBottom = '3px double #0f172a';
      } else {
        lastRow.style.fontWeight = 'normal';
        lastRow.style.borderTop = '1px solid #cbd5e1';
        lastRow.style.borderBottom = '1px solid #cbd5e1';
      }
    }
  }
}
