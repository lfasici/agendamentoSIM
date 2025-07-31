import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { createSlotSchema, type CreateSlotData, type Appointment, type AvailableSlot } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Admin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const form = useForm<CreateSlotData>({
    resolver: zodResolver(createSlotSchema),
    defaultValues: {
      dataHora: "",
      servico: undefined,
      disponivel: true,
    },
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: stats } = useQuery<{
    todayAppointments: number;
    weekAppointments: number;
    totalCarregamentos: number;
    totalDescarregamentos: number;
    availableSlots: number;
    occupiedSlots: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: availableSlots = [] } = useQuery<AvailableSlot[]>({
    queryKey: ["/api/slots"],
  });

  const createSlotMutation = useMutation({
    mutationFn: async (data: CreateSlotData) => {
      const response = await apiRequest("POST", "/api/slots", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Horário criado com sucesso!",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar horário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async () => {
      const startDate = new Date();
      const timeSlots = [
        { time: "08:00", service: "Carregamento" },
        { time: "10:00", service: "Descarregamento" },
        { time: "14:00", service: "Carregamento" },
        { time: "16:00", service: "Descarregamento" },
      ];

      const response = await apiRequest("POST", "/api/slots/bulk-week", {
        startDate: startDate.toISOString(),
        timeSlots,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: `${data.slots?.length || 0} horários criados para a próxima semana!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar horários em lote. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/appointments/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Agendamento cancelado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao cancelar agendamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const blockSlotsMutation = useMutation({
    mutationFn: async (slotIds: string[]) => {
      const response = await apiRequest("POST", "/api/slots/block", { slotIds });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: data.message,
      });
      setSelectedSlots([]);
      setShowBlockModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao bloquear horários. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateSlotData) => {
    // Convert date and time inputs to ISO datetime
    const [date, time] = [data.dataHora.split('T')[0], data.dataHora.split('T')[1] || "00:00"];
    const datetime = new Date(`${date}T${time}`);
    
    createSlotMutation.mutate({
      ...data,
      dataHora: datetime.toISOString(),
    });
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = 
      appointment.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.emailCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.codigoConfirmacao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === "all" || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Painel Administrativo Felka</h2>
        <p className="text-gray-600">Gerencie horários disponíveis e visualize todos os agendamentos do sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Available Times */}
        <Card>
          <CardHeader>
            <CardTitle>Criar Horários Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="dataHora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data e Hora</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="servico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Serviço</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Carregamento">Carregamento</SelectItem>
                          <SelectItem value="Descarregamento">Descarregamento</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createSlotMutation.isPending}
                >
                  <i className="fas fa-plus mr-2" />
                  {createSlotMutation.isPending ? "Criando..." : "Criar Horário"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-3">Criação em Lote</h4>
              <Button 
                onClick={() => bulkCreateMutation.mutate()}
                disabled={bulkCreateMutation.isPending}
                variant="outline"
                className="w-full mb-3"
              >
                <i className="fas fa-calendar-week mr-2" />
                {bulkCreateMutation.isPending ? "Criando..." : "Criar Semana Completa"}
              </Button>
              
              <Button 
                onClick={() => setShowBlockModal(true)}
                variant="outline"
                className="w-full"
              >
                <i className="fas fa-ban mr-2" />
                Bloquear Horários
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats?.todayAppointments || 0}</div>
                  <div className="text-sm text-gray-600">Hoje</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats?.weekAppointments || 0}</div>
                  <div className="text-sm text-gray-600">Esta Semana</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats?.availableSlots || 0}</div>
                  <div className="text-sm text-gray-600">Disponíveis</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats?.occupiedSlots || 0}</div>
                  <div className="text-sm text-gray-600">Ocupados</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All Appointments Table */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Todos os Agendamentos</CardTitle>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum agendamento encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {appointment.codigoConfirmacao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(appointment.dataHora), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.nomeCliente}</div>
                        <div className="text-sm text-gray-500">{appointment.emailCliente}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.servico}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelAppointmentMutation.mutate(appointment.id)}
                          disabled={cancelAppointmentMutation.isPending || appointment.status === "cancelado"}
                          className="text-red-600 hover:text-red-700"
                        >
                          <i className="fas fa-times" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Block Slots Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bloquear Horários Disponíveis</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecione os horários que deseja bloquear. Horários bloqueados não aparecerão para agendamento.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
              {availableSlots
                .filter(slot => slot.disponivel)
                .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
                .map((slot) => (
                  <div
                    key={slot.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedSlots.includes(slot.id)
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedSlots(prev =>
                        prev.includes(slot.id)
                          ? prev.filter(id => id !== slot.id)
                          : [...prev, slot.id]
                      );
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedSlots.includes(slot.id)}
                        onChange={() => {}}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {format(new Date(slot.dataHora), "dd/MM/yyyy - HH:mm", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {slot.servico}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            
            {selectedSlots.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  {selectedSlots.length} horário(s) selecionado(s) para bloqueio
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBlockModal(false);
                  setSelectedSlots([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => blockSlotsMutation.mutate(selectedSlots)}
                disabled={selectedSlots.length === 0 || blockSlotsMutation.isPending}
                variant="destructive"
              >
                <i className="fas fa-ban mr-2" />
                {blockSlotsMutation.isPending ? "Bloqueando..." : `Bloquear ${selectedSlots.length} horário(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
