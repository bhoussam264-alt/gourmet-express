import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ClientMenu from "./components/ClientMenu";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [activeView, setActiveView] = useState("client"); // client or admin
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNum, setTableNum] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get("table");
    if (table) {
      setTableNum(table);
      setActiveView("client");
    }
  }, []);

  // Sum of quantities in cart
  const cartCount = cart.reduce((sum, item) => sum + item.quantite, 0);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-800 antialiased">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        cartCount={cartCount}
        toggleCart={toggleCart}
        tableNum={tableNum}
      />

      {/* Main Page Layout Switcher */}
      <main className="flex-grow">
        {activeView === "client" ? (
          <ClientMenu
            cart={cart}
            setCart={setCart}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
            tableNum={tableNum}
          />
        ) : (
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/60 py-6 text-center text-xs font-semibold text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} GourmetExpress. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
