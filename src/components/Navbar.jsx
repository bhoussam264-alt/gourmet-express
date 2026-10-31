import React from "react";
import { Utensils, ShieldAlert, ShoppingBag } from "lucide-react";

function Navbar({ activeView, setActiveView, cartCount, toggleCart, tableNum }) {
  return (
    <nav className="sticky top-0 z-40 w-full glass-panel shadow-sm border-b border-slate-200/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveView("client")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold font-serif bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight leading-none">
                Gourmet<span className="text-orange-500">Express</span>
              </span>
              {tableNum && (
                <span className="mt-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full leading-none">
                  {tableNum}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Switches */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveView("client")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5 ${
                activeView === "client"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/10"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Utensils className="h-4 w-4" />
              <span>Menu</span>
            </button>

            <button
              onClick={() => setActiveView("admin")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5 ${
                activeView === "admin"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Admin</span>
            </button>

            {/* Cart Button (Only shown in client view) */}
            {activeView === "client" && (
              <button
                onClick={toggleCart}
                className="relative p-2 text-slate-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all duration-200"
                aria-label="Panier"
              >
                <ShoppingBag className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
