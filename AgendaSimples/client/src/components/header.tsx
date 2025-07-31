import { Link, useLocation } from "wouter";
import logoFelka from "@assets/logo felka _1753807974163.png";

export default function Header() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Agendamento", icon: "fas fa-calendar-alt" },
    { path: "/admin", label: "Admin", icon: "fas fa-cogs" },
    { path: "/relatorios", label: "Relatórios", icon: "fas fa-chart-line" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src={logoFelka} 
              alt="Felka Logo" 
              className="h-10 w-auto mr-3"
            />
            <h1 className="text-xl font-semibold text-gray-900">Sistema de Agendamento Felka</h1>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <i className={`${item.icon} mr-2`} />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </nav>
          
          <div className="md:hidden">
            <button className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-bars text-xl" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
