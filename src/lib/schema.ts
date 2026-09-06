import { z } from 'zod';
import { PRESET_ASSIGNEES, PRESET_COMPANIES } from './constants';

export const prioritySchema = z.enum(['high', 'medium', 'low']);

export const labelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

export const assigneeSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().optional(),
  role: z.enum(['admin', 'technician']).optional(),
  specialization: z.string().optional(),
  avatar: z.string().optional(),
});

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  branches: z.array(z.string()),
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  assignee: assigneeSchema.nullable(),
  labels: z.array(labelSchema),
  dueDate: z.string().nullable(),
  priority: prioritySchema,
  columnId: z.string(),
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),

  // Evermarch Bangladesh Printer specifics
  serialNumber: z.string().default(''),
  printerModel: z.string().default(''),
  companyName: z.string().default(''),
  branchName: z.string().default(''),
  receivedDate: z.string().default(() => new Date().toISOString()),
  reportedFault: z.string().optional().default(''),
  diagnosisNotes: z.string().optional().default(''),
  partsReplaced: z.string().optional().default(''),
  isViable: z.boolean().optional().default(true),
  repairCount: z.number().optional().default(1),
});

export const columnSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number(),
  color: z.string(),
});

export const boardSchema = z.object({
  columns: z.array(columnSchema),
  tasks: z.array(taskSchema),
  assignees: z.array(assigneeSchema).optional().default(PRESET_ASSIGNEES),
  companies: z.array(companySchema).optional().default(PRESET_COMPANIES),
});
