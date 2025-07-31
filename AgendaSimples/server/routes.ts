import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAvailableSlotSchema, insertAppointmentSchema, bookingFormSchema, createSlotSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Available slots routes
  app.get("/api/slots", async (req, res) => {
    try {
      const slots = await storage.getAvailableSlots();
      res.json(slots);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar horários disponíveis" });
    }
  });

  app.get("/api/slots/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const slots = await storage.getAvailableSlotsByDate(date);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar horários para a data especificada" });
    }
  });

  app.post("/api/slots", async (req, res) => {
    try {
      const validatedData = createSlotSchema.parse(req.body);
      const slot = await storage.createAvailableSlot(validatedData);
      res.status(201).json(slot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar horário" });
      }
    }
  });

  app.put("/api/slots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const slot = await storage.updateAvailableSlot(id, updates);
      
      if (!slot) {
        return res.status(404).json({ message: "Horário não encontrado" });
      }
      
      res.json(slot);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar horário" });
    }
  });

  app.delete("/api/slots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAvailableSlot(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Horário não encontrado" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir horário" });
    }
  });

  // Block multiple slots endpoint
  app.post("/api/slots/block", async (req, res) => {
    try {
      const { slotIds } = req.body;
      
      if (!Array.isArray(slotIds) || slotIds.length === 0) {
        return res.status(400).json({ message: "IDs dos horários são obrigatórios" });
      }

      let blockedCount = 0;
      for (const id of slotIds) {
        const updated = await storage.updateAvailableSlot(id, { disponivel: false });
        if (updated) blockedCount++;
      }

      res.json({ 
        message: `${blockedCount} horários bloqueados com sucesso`,
        blockedCount 
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao bloquear horários" });
    }
  });

  // Appointments routes
  app.get("/api/appointments", async (req, res) => {
    try {
      const { email, startDate, endDate } = req.query;

      let appointments;
      if (email) {
        appointments = await storage.getAppointmentsByEmail(email as string);
      } else if (startDate && endDate) {
        appointments = await storage.getAppointmentsByDateRange(
          startDate as string,
          endDate as string
        );
      } else {
        appointments = await storage.getAppointments();
      }

      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = bookingFormSchema.parse(req.body);
      
      // Check if slot is still available
      const slots = await storage.getAvailableSlotsByDate(validatedData.dataHora);
      const targetSlot = slots.find(slot => 
        slot.dataHora === validatedData.dataHora && 
        slot.servico === validatedData.servico &&
        slot.disponivel
      );

      if (!targetSlot) {
        return res.status(400).json({ message: "Horário não está mais disponível" });
      }

      // Create appointment
      const appointment = await storage.createAppointment(validatedData);
      
      // Mark slot as unavailable
      await storage.updateAvailableSlot(targetSlot.id, { disponivel: false });

      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar agendamento" });
      }
    }
  });

  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const appointment = await storage.updateAppointment(id, updates);
      
      if (!appointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar agendamento" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.getAppointments();
      const toDelete = appointment.find(a => a.id === id);
      
      if (!toDelete) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }

      // Make slot available again
      const slots = await storage.getAvailableSlots();
      const relatedSlot = slots.find(slot => 
        slot.dataHora === toDelete.dataHora && 
        slot.servico === toDelete.servico
      );

      if (relatedSlot) {
        await storage.updateAvailableSlot(relatedSlot.id, { disponivel: true });
      }

      const deleted = await storage.deleteAppointment(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao cancelar agendamento" });
    }
  });

  app.get("/api/appointments/code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const appointment = await storage.getAppointmentByCode(code);
      
      if (!appointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar agendamento" });
    }
  });

  // Bulk create slots for a week
  app.post("/api/slots/bulk-week", async (req, res) => {
    try {
      const { startDate, timeSlots } = req.body;
      const slots = [];
      
      const start = new Date(startDate);
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(start);
        date.setDate(start.getDate() + day);
        
        for (const timeSlot of timeSlots) {
          const [hours, minutes] = timeSlot.time.split(':');
          const slotDate = new Date(date);
          slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          const slotData = {
            dataHora: slotDate.toISOString(),
            servico: timeSlot.service,
            disponivel: true,
          };
          
          const slot = await storage.createAvailableSlot(slotData);
          slots.push(slot);
        }
      }
      
      res.status(201).json({ message: `${slots.length} horários criados com sucesso`, slots });
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar horários em lote" });
    }
  });

  // Statistics endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      const slots = await storage.getAvailableSlots();
      
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      const todayAppointments = appointments.filter(a => {
        const appointmentDate = new Date(a.dataHora);
        return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
      });

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const weekAppointments = appointments.filter(a => {
        const appointmentDate = new Date(a.dataHora);
        return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
      });

      const carregamentos = appointments.filter(a => a.servico === "Carregamento");
      const descarregamentos = appointments.filter(a => a.servico === "Descarregamento");
      const availableSlots = slots.filter(s => s.disponivel);
      const occupiedSlots = slots.filter(s => !s.disponivel);

      res.json({
        todayAppointments: todayAppointments.length,
        weekAppointments: weekAppointments.length,
        totalCarregamentos: carregamentos.length,
        totalDescarregamentos: descarregamentos.length,
        availableSlots: availableSlots.length,
        occupiedSlots: occupiedSlots.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
