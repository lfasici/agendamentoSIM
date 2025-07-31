import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Appointment } from "@shared/schema";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
}

export default function ConfirmationModal({ isOpen, onClose, appointment }: ConfirmationModalProps) {
  const handlePrint = () => {
    const printContent = `
      COMPROVANTE DE AGENDAMENTO
      ========================
      
      Código: ${appointment.codigoConfirmacao}
      Data/Hora: ${format(new Date(appointment.dataHora), "dd/MM/yyyy - HH:mm")}
      Serviço: ${appointment.servico}
      Cliente: ${appointment.nomeCliente}
      Email: ${appointment.emailCliente}
      ${appointment.telefoneCliente ? `Telefone: ${appointment.telefoneCliente}` : ''}
      ${appointment.empresaCliente ? `Empresa: ${appointment.empresaCliente}` : ''}
      ${appointment.observacoes ? `Observações: ${appointment.observacoes}` : ''}
      
      Status: ${appointment.status.toUpperCase()}
      Criado em: ${format(new Date(appointment.criadoEm), "dd/MM/yyyy HH:mm")}
      
      ========================
      Sistema de Agendamento Felka
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprovante - ${appointment.codigoConfirmacao}</title>
            <style>
              body { 
                font-family: monospace; 
                padding: 20px; 
                line-height: 1.6;
                max-width: 600px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .content {
                white-space: pre-line;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>COMPROVANTE DE AGENDAMENTO</h2>
              <p>Sistema de Agendamento Felka</p>
            </div>
            <div class="content">${printContent}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-white text-2xl" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">Agendamento Confirmado!</h3>
          <p className="text-gray-600 mb-6">
            Seu agendamento foi realizado com sucesso. Você receberá um e-mail de confirmação em breve.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 mb-1">Código de Confirmação:</div>
            <div className="text-2xl font-bold text-blue-600">{appointment.codigoConfirmacao}</div>
          </div>

          <div className="space-y-2 text-sm text-left mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Data/Hora:</span>
              <span className="font-medium">
                {format(new Date(appointment.dataHora), "dd/MM/yyyy - HH:mm")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Serviço:</span>
              <span className="font-medium">{appointment.servico}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">{appointment.nomeCliente}</span>
            </div>
            {appointment.empresaCliente && (
              <div className="flex justify-between">
                <span className="text-gray-600">Empresa:</span>
                <span className="font-medium">{appointment.empresaCliente}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <i className="fas fa-print mr-2" />
              Imprimir
            </Button>
            <Button onClick={onClose} className="flex-1">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
