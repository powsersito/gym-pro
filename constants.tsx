
import React from 'react';
import { Plan, Member, Product, Employee, Payment } from './types';

export const INITIAL_PLANS: Plan[] = [
  { id: '1', name: 'Mensual Básico', price: 40, durationMonths: 1 },
  { id: '2', name: 'Trimestral Pro', price: 100, durationMonths: 3 },
  { id: '3', name: 'Anual Premium', price: 350, durationMonths: 12 },
];

export const INITIAL_MEMBERS: Member[] = [
  { id: '101', name: 'Juan Pérez', email: 'juan@example.com', phone: '521234567890', status: 'Activo', planId: '1', joinDate: '2023-10-01' },
  { id: '102', name: 'María García', email: 'maria@example.com', phone: '521098765432', status: 'Activo', planId: '2', joinDate: '2023-11-15' },
  { id: '103', name: 'Carlos López', email: 'carlos@example.com', phone: '521122334455', status: 'Vencido', planId: '1', joinDate: '2023-08-20' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Proteína Whey 1kg', price: 55, stock: 15 },
  { id: 'p2', name: 'Creatina 300g', price: 30, stock: 20 },
  { id: 'p3', name: 'Bebida Isotónica', price: 2.5, stock: 50 },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Roberto Entrenador', role: 'Instructor', phone: '521998877665' },
  { id: 'e2', name: 'Ana Admin', role: 'Admin', phone: '521554433221' },
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'pay1', memberId: '101', amount: 40, date: '2024-05-01', concept: 'Mensualidad Mayo' },
  { id: 'pay2', memberId: '102', amount: 100, date: '2024-04-15', concept: 'Plan Trimestral' },
];
