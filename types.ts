
export type MemberStatus = 'Activo' | 'Inactivo' | 'Vencido';

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: MemberStatus;
  planId: string;
  lastCheckIn?: string;
  joinDate: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Employee {
  id: string;
  name: string;
  role: 'Admin' | 'Instructor' | 'Recepcionista';
  phone: string;
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  concept: string;
}

export interface Expense {
  id: string;
  concept: string;
  amount: number;
  date: string;
  category: 'Mantenimiento' | 'Servicios' | 'Sueldos' | 'Limpieza' | 'Otros';
}

export interface CashSession {
  id: string;
  employeeId: string;
  openingDate: string;
  closingDate?: string;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  status: 'Abierta' | 'Cerrada';
}

export type View = 'Dashboard' | 'Members' | 'CheckIn' | 'Payments' | 'Products' | 'Employees' | 'Plans' | 'AI' | 'Settings' | 'Analytics' | 'Workouts';
