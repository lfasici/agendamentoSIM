import { type AvailableSlot, type InsertAvailableSlot, type Appointment, type InsertAppointment } from "@shared/schema";
import { randomUUID } from "crypto";
import { pool } from "./db";

export interface IStorage {
  // Available slots
  getAvailableSlots(): Promise<AvailableSlot[]>;
  getAvailableSlotsByDate(date: string): Promise<AvailableSlot[]>;
  createAvailableSlot(slot: InsertAvailableSlot): Promise<AvailableSlot>;
  updateAvailableSlot(id: string, updates: Partial<AvailableSlot>): Promise<AvailableSlot | undefined>;
  deleteAvailableSlot(id: string): Promise<boolean>;

  // Appointments
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByEmail(email: string): Promise<Appointment[]>;
  getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;
  getAppointmentByCode(code: string): Promise<Appointment | undefined>;
}

// Database storage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  async getAvailableSlots(): Promise<AvailableSlot[]> {
    const result = await pool.query(`
      SELECT id, data_hora as "dataHora", servico, disponivel, criado_em as "criadoEm"
      FROM available_slots
      ORDER BY data_hora ASC
    `);
    return result.rows.map((row: any) => ({
      ...row,
      dataHora: row.dataHora.toISOString(),
      criadoEm: row.criadoEm.toISOString()
    }));
  }

  async getAvailableSlotsByDate(date: string): Promise<AvailableSlot[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const result = await pool.query(`
      SELECT id, data_hora as "dataHora", servico, disponivel, criado_em as "criadoEm"
      FROM available_slots
      WHERE data_hora >= $1 AND data_hora <= $2
      ORDER BY data_hora ASC
    `, [startOfDay.toISOString(), endOfDay.toISOString()]);

    return result.rows.map((row: any) => ({
      ...row,
      dataHora: row.dataHora.toISOString(),
      criadoEm: row.criadoEm.toISOString()
    }));
  }

  async createAvailableSlot(slot: InsertAvailableSlot): Promise<AvailableSlot> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const result = await pool.query(`
      INSERT INTO available_slots (id, data_hora, servico, disponivel, criado_em)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, data_hora as "dataHora", servico, disponivel, criado_em as "criadoEm"
    `, [id, slot.dataHora, slot.servico, slot.disponivel, now]);

    const row = result.rows[0];
    return {
      ...row,
      dataHora: row.dataHora.toISOString(),
      criadoEm: row.criadoEm.toISOString()
    };
  }

  async updateAvailableSlot(id: string, updates: Partial<AvailableSlot>): Promise<AvailableSlot | undefined> {
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (updates.dataHora !== undefined) {
      setClauses.push(`data_hora = $${paramCount++}`);
      values.push(updates.dataHora);
    }
    if (updates.servico !== undefined) {
      setClauses.push(`servico = $${paramCount++}`);
      values.push(updates.servico);
    }
    if (updates.disponivel !== undefined) {
      setClauses.push(`disponivel = $${paramCount++}`);
      values.push(updates.disponivel);
    }

    if (setClauses.length === 0) return undefined;

    values.push(id);
    
    const result = await pool.query(`
      UPDATE available_slots 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, data_hora as "dataHora", servico, disponivel, criado_em as "criadoEm"
    `, values);

    if (result.rows.length === 0) return undefined;

    const row = result.rows[0];
    return {
      ...row,
      dataHora: row.dataHora.toISOString(),
      criadoEm: row.criadoEm.toISOString()
    };
  }

  async deleteAvailableSlot(id: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM available_slots WHERE id = $1`, [id]);
    return result.rowCount! > 0;
  }

  async getAppointments(): Promise<Appointment[]> {
    const result = await pool.query(`
      SELECT a.id, s.data_hora as "dataHora", s.servico, 
             a.nome as "nomeCliente", a.email as "emailCliente", 
             a.telefone as "telefoneCliente", a.empresa as "empresaCliente",
             a.observacoes, a.status, a.codigo_confirmacao as "codigoConfirmacao",
             a.criado_em as "criadoEm"
      FROM appointments a
      JOIN available_slots s ON a.slot_id = s.id
      ORDER BY s.data_hora ASC
    `);
    
    return result.rows.map((row: any) => ({
      ...row,
      dataHora: row.dataHora.toISOString(),
      criadoEm: row.criadoEm.toISOString()
    }));
  }

  async getAppointmentsByEmail(email: string): Promise<Appointment[]> {
    const result = await pool.query(`
      SELECT a.id, s.data_hora as "dataHora", s.servico, 
             a.nome as "nomeCliente", a.email as "emailCliente", 
             a.telefone as "telefoneCliente", a.empresa as "empresaCliente",
             a.observacoes, a.status, a.codigo_confirmacao as "codigoConfirmacao",
             a.criado_em as "criadoEm"
      FROM appointments a
      JOIN available_slots s ON a.slot_id = s.id
      WHERE a.email = $1
      ORDER BY s.data_hora ASC
    `, [email]);
    
    return result.rows.map((row: any) => ({
      ...row,
      dataHora: row.dataHora.toISOString(),
      criadoEm: row.criadoEm.toISOString()
    }));
  }

  async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    const result = await pool.query(`
      SELECT a.id, s.data_hora as "dataHora", s.servico, 
             a.nome as "nomeCliente", a.email as "emailCliente", 
             a.telefone as "telefoneCliente", a.empresa as "empresaCliente",
             a.observacoes, a.status, a.codigo_confirmacao as "codigoConfirmacao",
             a.criado_em as "criadoEm"
      FROM appointments a
      JOIN available_slots s ON a.slot_id = s.id
      WHERE s.data_hora >= $1 AND s.data_hora <= $2
      ORDER BY s.data_hora ASC
    `, [startDate, endDate]);
    
    return result.rows.map((row: any) => ({
      ...row,
      dataHora: row.dataHora.toISOString(),
      criadoEm: row.criadoEm.toISOString()
    }));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = new Date().toISOString();

    // Find the slot to book
    const slotResult = await pool.query(`
      SELECT id, data_hora as "dataHora", servico 
      FROM available_slots 
      WHERE data_hora = $1 AND servico = $2 AND disponivel = true
    `, [appointment.dataHora, appointment.servico]);

    if (slotResult.rows.length === 0) {
      throw new Error("Horário não disponível");
    }

    const slot = slotResult.rows[0];

    // Create appointment
    await pool.query(`
      INSERT INTO appointments (id, slot_id, nome, email, telefone, empresa, observacoes, codigo_confirmacao, status, criado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      id,
      slot.id,
      appointment.nomeCliente,
      appointment.emailCliente,
      appointment.telefoneCliente || null,
      appointment.empresaCliente || null,
      appointment.observacoes || null,
      confirmationCode,
      appointment.status || 'confirmado',
      now
    ]);

    // Mark slot as unavailable
    await pool.query(`UPDATE available_slots SET disponivel = false WHERE id = $1`, [slot.id]);

    return {
      id,
      dataHora: slot.dataHora.toISOString(),
      servico: slot.servico,
      nomeCliente: appointment.nomeCliente,
      emailCliente: appointment.emailCliente,
      telefoneCliente: appointment.telefoneCliente,
      empresaCliente: appointment.empresaCliente,
      observacoes: appointment.observacoes,
      status: appointment.status || 'confirmado',
      codigoConfirmacao: confirmationCode,
      criadoEm: now
    };
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.observacoes !== undefined) {
      setClauses.push(`observacoes = $${paramCount++}`);
      values.push(updates.observacoes);
    }

    if (setClauses.length === 0) return undefined;

    values.push(id);

    const result = await pool.query(`
      UPDATE appointments 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id
    `, values);

    if (result.rows.length === 0) return undefined;

    // Return the updated appointment
    const appointmentResult = await pool.query(`
      SELECT a.id, s.data_hora as "dataHora", s.servico, 
             a.nome as "nomeCliente", a.email as "emailCliente", 
             a.telefone as "telefoneCliente", a.empresa as "empresaCliente",
             a.observacoes, a.status, a.codigo_confirmacao as "codigoConfirmacao",
             a.criado_em as "criadoEm"
      FROM appointments a
      JOIN available_slots s ON a.slot_id = s.id
      WHERE a.id = $1
    `, [id]);

    const row = appointmentResult.rows[0];
    return {
      ...row,
      dataHora: row.dataHora.toISOString(),
      criadoEm: row.criadoEm.toISOString()
    };
  }

  async deleteAppointment(id: string): Promise<boolean> {
    // First get the slot_id to re-enable it
    const result = await pool.query(`SELECT slot_id FROM appointments WHERE id = $1`, [id]);
    if (result.rows.length === 0) return false;

    const slotId = result.rows[0].slot_id;

    // Delete appointment
    await pool.query(`DELETE FROM appointments WHERE id = $1`, [id]);

    // Re-enable the slot
    await pool.query(`UPDATE available_slots SET disponivel = true WHERE id = $1`, [slotId]);

    return true;
  }

  async getAppointmentByCode(code: string): Promise<Appointment | undefined> {
    const result = await pool.query(`
      SELECT a.id, s.data_hora as "dataHora", s.servico, 
             a.nome as "nomeCliente", a.email as "emailCliente", 
             a.telefone as "telefoneCliente", a.empresa as "empresaCliente",
             a.observacoes, a.status, a.codigo_confirmacao as "codigoConfirmacao",
             a.criado_em as "criadoEm"
      FROM appointments a
      JOIN available_slots s ON a.slot_id = s.id
      WHERE a.codigo_confirmacao = $1
    `, [code]);

    if (result.rows.length === 0) return undefined;

    const row = result.rows[0];
    return {
      ...row,
      dataHora: row.dataHora.toISOString(),
      criadoEm: row.criadoEm.toISOString()
    };
  }
}

export const storage = new DatabaseStorage();