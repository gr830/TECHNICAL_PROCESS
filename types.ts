
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
  // Для заготовительной
  material?: string;
  blankType?: BlankType;
  blankSize?: string; // Diameter or Hex size
  blankWidth?: string; // For plate
  blankThickness?: string; // For plate
  blankLength?: string;
  blankWall?: string; // For pipe
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
