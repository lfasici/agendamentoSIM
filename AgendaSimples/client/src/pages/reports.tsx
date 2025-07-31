import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import type { Appointment } from "@shared/schema";

export default function Reports() {
  const [period, setPeriod] = useState("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const getDateRange = () => {
    const today = new Date();
    
    switch (period) {
      case "today":
        return {
          start: format(today, "yyyy-MM-dd"),
          end: format(today, "yyyy-MM-dd"),
        };
      case "week":
        return {
          start: format(startOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd"),
          end: format(endOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd"),
        };
      case "month":
        return {
          start: format(startOfMonth(today), "yyyy-MM-dd"),
          end: format(endOfMonth(today), "yyyy-MM-dd"),
        };
      case "custom":
        return { start: startDate, end: endDate };
      default:
        return { start: "", end: "" };
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.dataHora);
    const range = getDateRange();
    
    const dateInRange = !range.start || !range.end || 
      (appointmentDate >= new Date(range.start) && appointmentDate <= new Date(range.end + "T23:59:59"));
    
    const matchesService = !serviceFilter || serviceFilter === "all" || appointment.servico === serviceFilter;
    const matchesStatus = !statusFilter || statusFilter === "all" || appointment.status === statusFilter;
    
    return dateInRange && matchesService && matchesStatus;
  });

  const exportToXLSX = () => {
    const exportData = filteredAppointments.map(appointment => ({
      "Código": appointment.codigoConfirmacao,
      "Data/Hora": format(new Date(appointment.dataHora), "dd/MM/yyyy HH:mm"),
      "Cliente": appointment.nomeCliente,
      "Email": appointment.emailCliente,
      "Telefone": appointment.telefoneCliente || "",
      "Empresa": appointment.empresaCliente || "",
      "Serviço": appointment.servico,
      "Status": appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1),
      "Observações": appointment.observacoes || "",
      "Criado em": format(new Date(appointment.criadoEm), "dd/MM/yyyy HH:mm")
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // Código
      { wch: 18 }, // Data/Hora
      { wch: 25 }, // Cliente
      { wch: 30 }, // Email
      { wch: 15 }, // Telefone
      { wch: 25 }, // Empresa
      { wch: 15 }, // Serviço
      { wch: 12 }, // Status
      { wch: 30 }, // Observações
      { wch: 18 }, // Criado em
    ];
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Agendamentos");
    
    const fileName = `agendamentos_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

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

  // Calculate time distribution
  const timeDistribution = filteredAppointments.reduce((acc, appointment) => {
    const hour = new Date(appointment.dataHora).getHours();
    let timeSlot;
    
    if (hour >= 8 && hour < 10) timeSlot = "08:00 - 10:00";
    else if (hour >= 10 && hour < 12) timeSlot = "10:00 - 12:00";
    else if (hour >= 14 && hour < 16) timeSlot = "14:00 - 16:00";
    else if (hour >= 16 && hour < 18) timeSlot = "16:00 - 18:00";
    else timeSlot = "Outros";
    
    acc[timeSlot] = (acc[timeSlot] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(timeDistribution), 1);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Relatórios Felka</h2>
        <p className="text-gray-600">Visualize estatísticas e relatórios detalhados dos agendamentos.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats?.todayAppointments || 0}</div>
            <div className="text-sm text-gray-600">Agendamentos Hoje</div>
            <div className="text-xs text-green-600 mt-1">
              <i className="fas fa-arrow-up mr-1" />
              Ativo
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats?.weekAppointments || 0}</div>
            <div className="text-sm text-gray-600">Esta Semana</div>
            <div className="text-xs text-green-600 mt-1">
              <i className="fas fa-arrow-up mr-1" />
              Crescendo
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{stats?.totalCarregamentos || 0}</div>
            <div className="text-sm text-gray-600">Carregamentos</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats?.totalCarregamentos && stats?.totalDescarregamentos ? 
                `${Math.round((stats.totalCarregamentos / (stats.totalCarregamentos + stats.totalDescarregamentos)) * 100)}% do total` 
                : "0% do total"}
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-600 mb-2">{stats?.totalDescarregamentos || 0}</div>
            <div className="text-sm text-gray-600">Descarregamentos</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats?.totalCarregamentos && stats?.totalDescarregamentos ? 
                `${Math.round((stats.totalDescarregamentos / (stats.totalCarregamentos + stats.totalDescarregamentos)) * 100)}% do total` 
                : "0% do total"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Filters and Period Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros de Relatório</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="custom">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Serviço</label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os serviços" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os serviços</SelectItem>
                  <SelectItem value="Carregamento">Carregamento</SelectItem>
                  <SelectItem value="Descarregamento">Descarregamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Export Options and Time Distribution */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={exportToXLSX} className="w-full bg-green-600 hover:bg-green-700">
                <i className="fas fa-file-excel mr-2" />
                Exportar XLSX
              </Button>
              <div className="text-sm text-gray-600 text-center">
                {filteredAppointments.length} agendamentos no período selecionado
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Horário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(timeDistribution).map(([timeSlot, count]) => (
                  <div key={timeSlot} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{timeSlot}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(timeDistribution).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum dado disponível para o período selecionado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Reports Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Relatório Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum agendamento encontrado para os filtros selecionados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(appointment.dataHora), "dd/MM/yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(appointment.dataHora), "HH:mm")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.nomeCliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {appointment.empresaCliente || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.servico}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {appointment.codigoConfirmacao}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
