import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CalendarView from "@/components/calendar-view";
import BookingModal from "@/components/booking-modal";
import ConfirmationModal from "@/components/confirmation-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AvailableSlot, Appointment } from "@shared/schema";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [searchEmail, setSearchEmail] = useState("");

  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery<AvailableSlot[]>({
    queryKey: ["/api/slots/date", selectedDate.toISOString().split('T')[0]],
  });

  const { data: userAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      if (!searchEmail.trim()) return [];
      const response = await fetch(`/api/appointments?email=${encodeURIComponent(searchEmail)}`);
      if (!response.ok) throw new Error("Erro ao buscar agendamentos");
      return response.json();
    },
    enabled: !!searchEmail.trim(),
  });

  const handleSlotClick = (slot: AvailableSlot) => {
    if (slot.disponivel) {
      setSelectedSlot(slot);
      setShowBookingModal(true);
    }
  };

  const handleBookingSuccess = (appointment: Appointment) => {
    setConfirmedAppointment(appointment);
    setShowBookingModal(false);
    setShowConfirmationModal(true);
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

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento de Serviços Felka</h2>
        <p className="text-gray-600">Selecione uma data no calendário e escolha um horário disponível para agendar seu serviço.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CalendarView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            availableSlots={availableSlots}
            onSlotClick={handleSlotClick}
            isLoading={slotsLoading}
          />
        </div>

        <div className="space-y-6">
          {/* Available Times */}
          <Card>
            <CardHeader>
              <CardTitle>Horários Disponíveis</CardTitle>
              <p className="text-sm text-gray-600">
                {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </p>
            </CardHeader>
            <CardContent>
              {slotsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhum horário disponível para esta data
                </p>
              ) : (
                <div className="space-y-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      disabled={!slot.disponivel}
                      className={`w-full p-4 border rounded-lg text-left transition-colors ${
                        slot.disponivel
                          ? "border-green-300 bg-green-50 hover:bg-green-100"
                          : "border-gray-200 bg-gray-50 opacity-75 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            {format(new Date(slot.dataHora), "HH:mm")}
                          </div>
                          <div className="text-sm text-gray-600">{slot.servico}</div>
                        </div>
                        <div className={`flex items-center ${slot.disponivel ? "text-green-600" : "text-gray-400"}`}>
                          <i className={`fas ${slot.disponivel ? "fa-check-circle" : "fa-times-circle"} mr-1`} />
                          <span className="text-sm font-medium">
                            {slot.disponivel ? "Disponível" : "Ocupado"}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Meus Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  type="email"
                  placeholder="Digite seu e-mail para buscar"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>

              {userAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {searchEmail ? "Nenhum agendamento encontrado" : "Digite seu e-mail para ver seus agendamentos"}
                </p>
              ) : (
                <div className="space-y-3">
                  {userAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {format(new Date(appointment.dataHora), "dd/MM/yyyy - HH:mm")}
                          </div>
                          <div className="text-sm text-gray-600">{appointment.servico}</div>
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            Código: {appointment.codigoConfirmacao}
                          </div>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {selectedSlot && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          slot={selectedSlot}
          onSuccess={handleBookingSuccess}
        />
      )}

      {confirmedAppointment && (
        <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          appointment={confirmedAppointment}
        />
      )}
    </div>
  );
}
