
export type Machine = string;

export interface Tooling {
  id: string;
  type: 'special' | 'universal';
  name: string;
  setupTime?: string;
}

export interface Tool {
  id: string;
  name: string;
  type: 'special' | 'universal';
  setupTime?: string;
}

export type OpType = 
  | 'preparation' 
  | 'turning_cnc' 
  | 'milling_cnc' 
  | 'turning_manual' 
  | 'external_service' 
  | 'heat_treatment' 
  | 'grinding' 
  | 'benchwork' 
  | 'washing' 
  | 'ultrasonic' 
  | 'control' 
  | 'final';

export type BlankType = 'circle' | 'plate' | 'hex' | 'pipe';

export interface Operation {
  id: string;
  index: number;
  type: OpType;
  machines?: Machine[];
  tn?: string;
  t_pcs?: string;
  comment?: string;
  tooling?: Tooling[];
  specialTools?: Tool[];
  correspondenceCode?: string; // Код соответствия (маркер)
  // Для заготовительной
  material?: string;
  blankType?: BlankType;
  blankSize?: string;
  blankWidth?: string;
  blankThickness?: string;
  blankLength?: string;
  blankWall?: string;
  pcsPerBlank?: string;
  setupPcs?: string;
  // Для слесарной
  benchworkType?: string;
}

export interface PartCard {
  id: string;
  number: string;
  name: string;
  operations: Operation[];
  subParts: PartCard[];
}

export interface MillingMachineData {
  "Станок": string;
  "Ост (A)": string;
  "Инстр. (T)": string;
  "Точность (GA)": string;
  "Круг. инт. (CI)": string;
  "Оснастка": string;
  "Renishaw (R)": string;
  "Отриц. ось (NA)": string;
  "Шпиндель (S)": string;
  "СОЖ (C)": string;
  "Пов. гол. (AH)": string;
  "Расточка (BB)": string;
  "Габариты (AxBxC / DxL)": string;
  "Сложность (G)": string;
}

export interface TurningMachineData {
  "Станок": string;
  "Приводной инстр. (DT)": string;
  "Кол-во инстр. (T)": string;
  "Точность по X (GAX)": string;
  "Точность по Z (GAZ)": string;
  "Группа оснастки": string;
  "Обороты шпинделя (S)": string;
  "Задняя бабка (TT)": string;
  "Габариты (DxL)": string;
  "Группа сложн. (G)": string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
}

export interface ProductivityData {
  day: string;
  tasks: number;
  creativity: number;
}
