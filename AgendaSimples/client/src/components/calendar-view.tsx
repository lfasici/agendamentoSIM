import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AvailableSlot } from "@shared/schema";

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  availableSlots: AvailableSlot[];
  onSlotClick: (slot: AvailableSlot) => void;
  isLoading: boolean;
}

export default function CalendarView({
  selectedDate,
  onDateChange,
  availableSlots,
  onSlotClick,
  isLoading,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  };

  const hasAvailableSlots = (date: Date) => {
    return availableSlots.some(slot => {
      const slotDate = new Date(slot.dataHora);
      return isSameDay(slotDate, date) && slot.disponivel;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário</CardTitle>
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={previousMonth}>
            <i className="fas fa-chevron-left" />
          </Button>
          <h4 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h4>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <i className="fas fa-chevron-right" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const hasSlots = hasAvailableSlots(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateChange(day)}
                disabled={!isCurrentMonth}
                className={`p-3 text-sm transition-colors rounded-lg ${
                  !isCurrentMonth
                    ? "text-gray-400"
                    : isSelected
                    ? "bg-blue-600 text-white font-medium"
                    : hasSlots
                    ? "text-gray-900 hover:bg-blue-50"
                    : "text-gray-900 hover:bg-gray-50"
                } ${hasSlots && !isSelected ? "bg-green-50" : ""}`}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-600 rounded mr-2" />
            <span className="text-sm text-gray-600">Data Selecionada</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded mr-2" />
            <span className="text-sm text-gray-600">Horários Disponíveis</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


