import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { sendConfirmationEmail } from "@/lib/email";
import { bookingFormSchema, type BookingFormData, type AvailableSlot, type Appointment } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: AvailableSlot;
  onSuccess: (appointment: Appointment) => void;
}

export default function BookingModal({ isOpen, onClose, slot, onSuccess }: BookingModalProps) {
  const { toast } = useToast();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      dataHora: slot.dataHora,
      servico: slot.servico,
      nomeCliente: "",
      emailCliente: "",
      telefoneCliente: "",
      empresaCliente: "",
      observacoes: "",
      status: "confirmado",
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return response.json();
    },
    onSuccess: async (appointment: Appointment) => {
      // Send confirmation email
      try {
        await sendConfirmationEmail({
          to_email: appointment.emailCliente,
          cliente_nome: appointment.nomeCliente,
          data_hora: format(new Date(appointment.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
          servico: appointment.servico,
          codigo: appointment.codigoConfirmacao,
          empresa: appointment.empresaCliente || "Não informado",
          observacoes: appointment.observacoes || "Nenhuma observação",
        });
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError);
        // Continue even if email fails
      }

      toast({
        title: "Agendamento confirmado!",
        description: `Seu código de confirmação é: ${appointment.codigoConfirmacao}`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      onSuccess(appointment);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao agendar",
        description: error.message || "Erro ao confirmar agendamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    bookingMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Serviço</DialogTitle>
        </DialogHeader>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-medium text-gray-900">
            {format(new Date(slot.dataHora), "dd 'de' MMMM, yyyy - HH:mm", { locale: ptBR })}
          </div>
          <div className="text-sm text-gray-600">{slot.servico}</div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomeCliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailCliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefoneCliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="empresaCliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais (opcional)" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={bookingMutation.isPending}
                  className="flex-1"
                >
                  <i className="fas fa-check mr-2" />
                  {bookingMutation.isPending ? "Confirmando..." : "Confirmar Agendamento"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
