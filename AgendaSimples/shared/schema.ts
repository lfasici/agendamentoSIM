import { z } from "zod";

// Available time slots table
export const availableSlotSchema = z.object({
  id: z.string(),
  dataHora: z.string(), // ISO datetime string
  servico: z.enum(["Carregamento", "Descarregamento"]),
  disponivel: z.boolean().default(true),
  criadoEm: z.string(), // ISO datetime string
});

export const insertAvailableSlotSchema = availableSlotSchema.omit({
  id: true,
  criadoEm: true,
});

export type AvailableSlot = z.infer<typeof availableSlotSchema>;
export type InsertAvailableSlot = z.infer<typeof insertAvailableSlotSchema>;

// Appointments table
export const appointmentSchema = z.object({
  id: z.string(),
  dataHora: z.string(), // ISO datetime string
  servico: z.enum(["Carregamento", "Descarregamento"]),
  nomeCliente: z.string(),
  emailCliente: z.string().email(),
  telefoneCliente: z.string().optional(),
  empresaCliente: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(["confirmado", "cancelado", "pendente"]).default("confirmado"),
  codigoConfirmacao: z.string(),
  criadoEm: z.string(), // ISO datetime string
});

export const insertAppointmentSchema = appointmentSchema.omit({
  id: true,
  codigoConfirmacao: true,
  criadoEm: true,
});

export type Appointment = z.infer<typeof appointmentSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Booking form schema with validation
export const bookingFormSchema = insertAppointmentSchema.extend({
  nomeCliente: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  emailCliente: z.string().email("Email inválido"),
  telefoneCliente: z.string().optional(),
  empresaCliente: z.string().optional(),
  observacoes: z.string().optional(),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

// Time slot creation schema
export const createSlotSchema = insertAvailableSlotSchema.extend({
  dataHora: z.string().min(1, "Data e hora são obrigatórias"),
  servico: z.enum(["Carregamento", "Descarregamento"], {
    required_error: "Selecione o tipo de serviço",
  }),
});

export type CreateSlotData = z.infer<typeof createSlotSchema>;
