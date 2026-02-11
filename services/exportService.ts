
import { PartCard, Operation } from '../types';

const formatOp = (op: Operation, depth: number): string => {
  const opIndent = '   '.repeat(depth + 1);
  let result = `${opIndent}${op.index}. `;
  
  const typeNames: Record<string, string> = {
    preparation: 'Заготовительная',
    turning_cnc: 'Токарная с ЧПУ',
    milling_cnc: 'Фрезерная с ЧПУ',
    turning_manual: 'Токарно-универсальная',
    external_service: 'Услуги сторонних организаций',
    heat_treatment: 'Услуги сторонних организаций Т.О.',
    grinding: 'Шлифовальная операция',
    benchwork: `Слесарная${op.benchworkType ? ' (' + op.benchworkType + ')' : ''}`,
    washing: 'Мойка',
    ultrasonic: 'Ультразвуковая мойка',
    control: 'Контроль ОТК',
    final: 'Завершающая операция'
  };

  result += typeNames[op.type] || 'Операция';
  
  if (op.machines && op.machines.length > 0) {
    result += ` (${op.machines.join(' / ')})`;
  }
  result += '\n';

  const detailsIndent = opIndent + '    ';

  // Вывод кода соответствия если есть
  if (op.correspondenceCode) {
    result += `${detailsIndent}Код соответствия: ${op.correspondenceCode}\n`;
  }

  // Информация по УП
  if (op.type === 'turning_cnc' || op.type === 'milling_cnc') {
    const statusLabel: Record<string, string> = {
      none: 'Нет',
      yes: 'Да',
      revision: 'Пересмотр'
    };
    result += `${detailsIndent}УП: ${statusLabel[op.ncStatus || 'none']}`;
    if (op.ncStatus === 'none' && op.ncTime) result += ` (Время: ${op.ncTime})`;
    if ((op.ncStatus === 'yes' || op.ncStatus === 'revision') && op.ncComment) result += ` [${op.ncComment}]`;
    result += '\n';
  }

  if (op.type === 'preparation') {
    let blankSpec = '';
    const size = (op.blankSize || '').trim();
    const length = (op.blankLength || '').trim();
    const thick = (op.blankThickness || '').trim();
    const width = (op.blankWidth || '').trim();
    const wall = (op.blankWall || '').trim();

    if (op.blankType === 'circle') {
      if (size && length) blankSpec = `ф${size}x${length}`;
      else if (size) blankSpec = `ф${size}`;
      else if (length) blankSpec = `L=${length}`;
    } else if (op.blankType === 'plate') {
      const parts = [];
      if (thick) parts.push(`#${thick}`);
      if (width) parts.push(width);
      if (length) parts.push(length);
      blankSpec = parts.join('x');
    } else if (op.blankType === 'hex') {
      if (size && length) blankSpec = `S${size}x${length}`;
      else if (size) blankSpec = `S${size}`;
      else if (length) blankSpec = `L=${length}`;
    } else if (op.blankType === 'pipe') {
      const parts = [];
      if (size) parts.push(`ф${size}`);
      if (wall) parts.push(`x${wall}`);
      if (length) parts.push(`L=${length}`);
      blankSpec = parts.join('');
    }
    
    let firstPart = `${op.material || ''} ${blankSpec ? blankSpec + ' мм' : ''}`.trim();
    let secondPart = op.materialConsumption ? `Расход: ${op.materialConsumption}` : '';
    let thirdPart = '';
    
    if (op.pcsPerBlank) {
      thirdPart = `${op.pcsPerBlank} дет/заг`;
      if (op.setupPcs) thirdPart += ` (+${op.setupPcs}н)`;
    } else if (op.setupPcs) {
      thirdPart = `(+${op.setupPcs}н)`;
    }

    const segments = [firstPart, secondPart, thirdPart].filter(Boolean);
    if (segments.length > 0) {
        result += `${detailsIndent}${segments.join(' / ')}\n`;
    }
  }

  if (op.tn || op.t_pcs) {
    const times = [];
    if (op.tn) times.push(`Тнал = ${op.tn}'`);
    if (op.t_pcs) times.push(`Тшт = ${op.t_pcs}'`);
    result += `${detailsIndent}${times.join(', ')}\n`;
  }

  if (op.comment) {
    result += `${detailsIndent}${op.comment}\n`;
  }

  if (op.tooling && op.tooling.length > 0) {
    op.tooling.forEach(t => {
      const setupTimeStr = t.setupTime ? ` (Тосн = ${t.setupTime}')` : '';
      result += `${detailsIndent}Оснастка: ${t.type === 'special' ? '(С)' : '(У)'} ${t.name}${setupTimeStr}\n`;
    });
  }

  if (op.specialTools && op.specialTools.length > 0) {
    op.specialTools.forEach(st => {
      const setupTimeStr = st.setupTime ? ` (Тинс = ${st.setupTime}')` : '';
      result += `${detailsIndent}Инструмент: ${st.type === 'special' ? '(С)' : '(У)'} ${st.name}${setupTimeStr}\n`;
    });
  }

  return result;
};

export const formatPart = (part: PartCard, depth: number = 0): string => {
  const indent = '   '.repeat(depth);
  const partHeader = `${part.name || 'БЕЗ НАЗВАНИЯ'} ${part.number || ''}`.trim();
  let result = `${indent}${partHeader}:\n\n`;
  
  part.operations.forEach(op => {
    result += formatOp(op, depth);
  });

  if (part.subParts.length > 0) {
    result += `\n${indent}   ____\n\n`;
    part.subParts.forEach(sub => {
      result += formatPart(sub, depth + 1);
    });
  }

  return result;
};

export const exportToTxt = (rootPart: PartCard) => {
  const content = formatPart(rootPart);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `TechProcess_${rootPart.number || 'NoNumber'}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};
