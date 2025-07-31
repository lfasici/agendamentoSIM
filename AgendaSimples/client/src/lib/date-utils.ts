import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "Data inválida";
    return format(date, "dd/MM/yyyy HH:mm");
  } catch {
    return "Data inválida";
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "Data inválida";
    return format(date, "dd/MM/yyyy");
  } catch {
    return "Data inválida";
  }
}

export function formatTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "Hora inválida";
    return format(date, "HH:mm");
  } catch {
    return "Hora inválida";
  }
}

export function formatDateLong(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "Data inválida";
    return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
  } catch {
    return "Data inválida";
  }
}

export function isToday(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

export function isPast(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return date < new Date();
  } catch {
    return false;
  }
}
