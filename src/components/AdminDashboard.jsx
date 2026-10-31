import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  TrendingUp,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  ListCollapse,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  Truck,
  Clock,
  ChevronRight,
  Sparkles,
  QrCode,
  Printer,
  Download,
  Bell,
  Coins,
  X,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `http://127.0.0.1:8000/storage/${imagePath}`;
};

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("orders"); // orders, dishes, categories, tables
  const [categories, setCategories] = useState([]);
  const [plats, setPlats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);

  // Form states
  const [catName, setCatName] = useState("");
  const [editingCat, setEditingCat] = useState(null);

  const [platForm, setPlatForm] = useState({
    nom: "",
    prix: "",
    categorie_id: "",
    image: null,
  });
  const [editingPlat, setEditingPlat] = useState(null);

  // Tables form states
  const [tableForm, setTableForm] = useState({
    numero: "",
    statut: "Libre",
  });
  const [editingTable, setEditingTable] = useState(null);
  const [activeQrCode, setActiveQrCode] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  // General Loading States
  const [loading, setLoading] = useState(true);

  // Keep a ref of orders to compare for new order sounds without stale state closure
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    fetchData();
  }, []);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.12);
      
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.22);
      }, 130);
    } catch (e) {
      console.log("Audio failed to play", e);
    }
  };

  // Real-time polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const ordersRes = await axios.get(`${API_BASE}/commandes`);
        const polledOrders = ordersRes.data.data || ordersRes.data;
        const currentOrders = ordersRef.current;

        if (currentOrders.length > 0 && polledOrders.length > currentOrders.length) {
          const existingIds = new Set(currentOrders.map(o => o.id));
          const hasNewOrder = polledOrders.some(o => !existingIds.has(o.id));
          
          if (hasNewOrder) {
            playNotificationSound();
            setNewOrderAlert(true);
            setTimeout(() => setNewOrderAlert(false), 6000);
          }
        }
        setOrders(polledOrders);
      } catch (error) {
        console.error("Error polling orders:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, platsRes, ordersRes, tablesRes, usersRes, reservationsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/categories`),
        axios.get(`${API_BASE}/plats`),
        axios.get(`${API_BASE}/commandes`),
        axios.get(`${API_BASE}/tables`),
        axios.get(`${API_BASE}/users`),
        axios.get(`${API_BASE}/reservations`),
        axios.get(`${API_BASE}/statistiques`),
      ]);
      setCategories(catsRes.data);
      setPlats(platsRes.data);
      setOrders(ordersRes.data.data || ordersRes.data);
      setTables(tablesRes.data);
      setUsers(usersRes.data);
      setReservations(reservationsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // CATEGORIES CRUD operations
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      if (editingCat) {
        await axios.put(`${API_BASE}/categories/${editingCat.id}`, { nom: catName });
      } else {
        await axios.post(`${API_BASE}/categories`, { nom: catName });
      }
      setCatName("");
      setEditingCat(null);
      fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCat(cat);
    setCatName(cat.nom);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette catégorie ?")) return;
    try {
      await axios.delete(`${API_BASE}/categories/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  // PLATS CRUD operations
  const handlePlatFormChange = (e) => {
    const { name, value } = e.target;
    setPlatForm({ ...platForm, [name]: value });
  };

  const handlePlatFileChange = (e) => {
    setPlatForm({ ...platForm, image: e.target.files[0] });
  };

  const handleCreateOrUpdatePlat = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("nom", platForm.nom);
    data.append("prix", platForm.prix);
    data.append("categorie_id", platForm.categorie_id);
    if (platForm.image) {
      data.append("image", platForm.image);
    }

    try {
      if (editingPlat) {
        // Laravel PUT method workaround for multipart form-data
        data.append("_method", "PUT");
        await axios.post(`${API_BASE}/plats/${editingPlat.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${API_BASE}/plats`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setPlatForm({ nom: "", prix: "", categorie_id: "", image: null });
      // Reset file input value
      const fileInput = document.getElementById("plat-image-input");
      if (fileInput) fileInput.value = "";
      setEditingPlat(null);
      fetchData();
    } catch (error) {
      console.error("Error saving plat:", error);
      alert("Une erreur s'est produite lors de la sauvegarde du plat.");
    }
  };

  const handleEditPlat = (plat) => {
    setEditingPlat(plat);
    setPlatForm({
      nom: plat.nom,
      prix: plat.prix,
      categorie_id: plat.categorie_id,
      image: null,
    });
  };

  const handleDeletePlat = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce plat ?")) return;
    try {
      await axios.delete(`${API_BASE}/plats/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting plat:", error);
    }
  };

  // ORDERS operations
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      
      await axios.put(`${API_BASE}/commandes/${orderId}`, {
        client_nom: order.client_nom,
        telephone: order.telephone,
        adresse: order.adresse,
        total: order.total,
        statut: newStatus,
      });
      fetchData();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette commande ?")) return;
    try {
      await axios.delete(`${API_BASE}/commandes/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  // TABLES CRUD operations
  const handleTableFormChange = (e) => {
    const { name, value } = e.target;
    setTableForm({ ...tableForm, [name]: value });
  };

  const handleCreateOrUpdateTable = async (e) => {
    e.preventDefault();
    if (!tableForm.numero.trim()) return;
    try {
      if (editingTable) {
        await axios.put(`${API_BASE}/tables/${editingTable.id}`, tableForm);
      } else {
        await axios.post(`${API_BASE}/tables`, tableForm);
      }
      setTableForm({ numero: "", statut: "Libre" });
      setEditingTable(null);
      fetchData();
    } catch (error) {
      console.error("Error saving table:", error);
      alert("Une erreur s'est produite lors de la sauvegarde de la table.");
    }
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setTableForm({ numero: table.numero, statut: table.statut });
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette table ?")) return;
    try {
      await axios.delete(`${API_BASE}/tables/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting table:", error);
    }
  };

  const handleTableStatusChange = async (tableId, newStatus) => {
    try {
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;
      await axios.put(`${API_BASE}/tables/${tableId}`, {
        numero: table.numero,
        statut: newStatus,
      });
      fetchData();
    } catch (error) {
      console.error("Error changing table status:", error);
    }
  };

  const getTableStatusBadgeClass = (status) => {
    switch (status) {
      case "Libre":
        return "bg-green-50 text-green-700 border-green-200/50";
      case "Occupée":
        return "bg-red-50 text-red-700 border-red-200/50";
      case "Réservée":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const handlePrintQrCode = () => {
    const printWindow = window.open("", "_blank");
    const qrUrl = `${window.location.origin}/?table=${encodeURIComponent(activeQrCode.numero)}`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimer QR Code - ${activeQrCode.numero}</title>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .card {
              border: 3px solid #f97316;
              border-radius: 24px;
              padding: 40px;
              max-width: 400px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #0f172a;
              margin-bottom: 5px;
              font-size: 28px;
            }
            p {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 25px;
            }
            img {
              margin: 20px 0;
            }
            .footer-text {
              margin-top: 20px;
              font-weight: bold;
              color: #f97316;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>GourmetExpress</h1>
            <p>Scannez pour commander directement depuis votre table</p>
            <img src="${qrImgUrl}" width="250" height="250" alt="QR Code" />
            <h2 class="footer-text">${activeQrCode.numero}</h2>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Calculations for stats dashboard
  const getTotalSales = () => {
    return orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
  };

  const getActiveOrdersCount = () => {
    return orders.filter((o) => o.statut !== "Livré").length;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "En attente":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "En préparation":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "Prête":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/50";
      case "Servie":
        return "bg-teal-50 text-teal-700 border-teal-200/50";
      case "Payée":
        return "bg-green-50 text-green-700 border-green-200/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // USERS CRUD
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "client" });
  const [editingUser, setEditingUser] = useState(null);

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm({ ...userForm, [name]: value });
  };

  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) return;
    try {
      if (editingUser) {
        await axios.put(`${API_BASE}/users/${editingUser.id}`, userForm);
      } else {
        await axios.post(`${API_BASE}/users`, userForm);
      }
      setUserForm({ name: "", email: "", password: "", role: "client" });
      setEditingUser(null);
      fetchData();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, password: "", role: user.role });
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      await axios.delete(`${API_BASE}/users/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // RESERVATIONS CRUD
  const [reservationForm, setReservationForm] = useState({ nom_client: "", telephone: "", date_reservation: "", heure_reservation: "", nombre_personnes: 1, statut: "En attente" });
  const [editingReservation, setEditingReservation] = useState(null);

  const handleReservationFormChange = (e) => {
    const { name, value } = e.target;
    setReservationForm({ ...reservationForm, [name]: value });
  };

  const handleCreateOrUpdateReservation = async (e) => {
    e.preventDefault();
    if (!reservationForm.nom_client.trim() || !reservationForm.date_reservation) return;
    try {
      if (editingReservation) {
        await axios.put(`${API_BASE}/reservations/${editingReservation.id}`, reservationForm);
      } else {
        await axios.post(`${API_BASE}/reservations`, reservationForm);
      }
      setReservationForm({ nom_client: "", telephone: "", date_reservation: "", heure_reservation: "", nombre_personnes: 1, statut: "En attente" });
      setEditingReservation(null);
      fetchData();
    } catch (error) {
      console.error("Error saving reservation:", error);
    }
  };

  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
    setReservationForm({
      nom_client: reservation.nom_client,
      telephone: reservation.telephone || "",
      date_reservation: reservation.date_reservation,
      heure_reservation: reservation.heure_reservation,
      nombre_personnes: reservation.nombre_personnes,
      statut: reservation.statut
    });
  };

  const handleDeleteReservation = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette réservation ?")) return;
    try {
      await axios.delete(`${API_BASE}/reservations/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting reservation:", error);
    }
  };

  const handleReservationStatusChange = async (resId, newStatus) => {
    try {
      const reservation = reservations.find((r) => r.id === resId);
      if (!reservation) return;
      await axios.put(`${API_BASE}/reservations/${resId}`, {
        ...reservation,
        statut: newStatus,
      });
      fetchData();
    } catch (error) {
      console.error("Error changing reservation status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative">
      {/* Toast Alert for New Orders */}
      {newOrderAlert && (
        <div className="fixed top-20 right-6 z-50 flex items-center p-4 mb-4 text-emerald-800 border border-emerald-200 rounded-2xl bg-emerald-50 shadow-lg animate-bounce max-w-sm">
          <Bell className="h-5 w-5 mr-3 text-emerald-600 animate-pulse animate-infinite" />
          <div className="text-left">
            <span className="font-extrabold block text-sm">Nouvelle commande reçue !</span>
            <span className="text-xs font-semibold text-emerald-600">Le tableau de bord a été mis à jour en direct.</span>
          </div>
          <button onClick={() => setNewOrderAlert(false)} className="ml-4 text-emerald-400 hover:text-emerald-700 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-3xl font-extrabold font-serif text-slate-900 my-0">
            Tableau de Bord Admin
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gérez vos catégories, vos plats et suivez les commandes en temps réel.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 border border-green-100">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Chiffre d'Affaires</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{getTotalSales().toFixed(2)} DH</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Commandes Actives</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{getActiveOrdersCount()}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Nombre de Plats</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{plats.length}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 border border-purple-100">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Catégories</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{categories.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 mb-8 space-x-6 overflow-x-auto whitespace-nowrap pb-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-4 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === "dashboard"
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Statistiques
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-4 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === "orders"
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Suivi des Commandes ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("reservations")}
          className={`pb-4 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === "reservations"
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Réservations ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-4 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === "users"
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Utilisateurs ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("dishes")}
          className={`pb-4 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === "dishes"
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Gestion des Plats ({plats.length})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`pb-4 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === "categories"
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Gestion des Catégories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("tables")}
          className={`pb-4 text-sm font-bold border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === "tables"
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Gestion des Tables ({tables.length})
        </button>
      </div>

      {/* TAB CONTENT: DASHBOARD */}
      {activeTab === "dashboard" && stats && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Aperçu Général</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-sm font-semibold text-slate-500 block">Commandes du Jour</span>
                <span className="text-2xl font-black text-slate-900">{stats.commandes_today_count}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-sm font-semibold text-slate-500 block">Recettes du Jour</span>
                <span className="text-2xl font-black text-slate-900">{stats.chiffre_affaires_today} DH</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-sm font-semibold text-slate-500 block">Réservations Actives</span>
                <span className="text-2xl font-black text-slate-900">{stats.reservations_active_count}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-sm font-semibold text-slate-500 block">Total Clients</span>
                <span className="text-2xl font-black text-slate-900">{stats.clients_count}</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Évolution des 7 derniers jours (Commandes)</h2>
            <div className="space-y-3">
              {stats.chart_data && stats.chart_data.length > 0 ? (
                stats.chart_data.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-600 font-medium">{item.date}</span>
                    <span className="text-slate-900 font-bold">{item.total} DH</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">Pas de données récentes.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RESERVATIONS */}
      {activeTab === "reservations" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <form onSubmit={handleCreateOrUpdateReservation} className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom du client</label>
              <input type="text" name="nom_client" value={reservationForm.nom_client} onChange={handleReservationFormChange} required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone</label>
              <input type="text" name="telephone" value={reservationForm.telephone} onChange={handleReservationFormChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input type="date" name="date_reservation" value={reservationForm.date_reservation} onChange={handleReservationFormChange} required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Heure</label>
              <input type="time" name="heure_reservation" value={reservationForm.heure_reservation} onChange={handleReservationFormChange} required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Personnes</label>
              <input type="number" name="nombre_personnes" value={reservationForm.nombre_personnes} onChange={handleReservationFormChange} required min="1" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2" />
            </div>
            <div className="lg:col-span-3 flex items-end">
              <button type="submit" className="bg-slate-900 text-white font-bold py-2 px-6 rounded-xl hover:bg-slate-800 transition">
                {editingReservation ? "Modifier la réservation" : "Ajouter la réservation"}
              </button>
              {editingReservation && (
                <button type="button" onClick={() => { setEditingReservation(null); setReservationForm({ nom_client: "", telephone: "", date_reservation: "", heure_reservation: "", nombre_personnes: 1, statut: "En attente" }); }} className="ml-4 text-slate-500 hover:text-slate-700 font-bold py-2 px-4 rounded-xl">
                  Annuler
                </button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Client</th>
                  <th className="py-4 px-6">Date & Heure</th>
                  <th className="py-4 px-6">Personnes</th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold text-slate-900">{res.nom_client}<br/><span className="text-xs font-normal text-slate-500">{res.telephone}</span></td>
                    <td className="py-4 px-6">{res.date_reservation} à {res.heure_reservation}</td>
                    <td className="py-4 px-6">{res.nombre_personnes} pers.</td>
                    <td className="py-4 px-6">
                      <select value={res.statut} onChange={(e) => handleReservationStatusChange(res.id, e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold">
                        <option value="En attente">En attente</option>
                        <option value="Confirmée">Confirmée</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => handleEditReservation(res)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteReservation(res.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-slate-400">Aucune réservation trouvée.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USERS */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <form onSubmit={handleCreateOrUpdateUser} className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom d'utilisateur</label>
              <input type="text" name="name" value={userForm.name} onChange={handleUserFormChange} required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input type="email" name="email" value={userForm.email} onChange={handleUserFormChange} required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{editingUser ? "Mot de passe (laisser vide pour ne pas modifier)" : "Mot de passe"}</label>
              <input type="password" name="password" value={userForm.password} onChange={handleUserFormChange} required={!editingUser} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rôle</label>
              <select name="role" value={userForm.role} onChange={handleUserFormChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2">
                <option value="client">Client</option>
                <option value="serveur">Serveur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <div className="lg:col-span-4 flex justify-end">
              {editingUser && (
                <button type="button" onClick={() => { setEditingUser(null); setUserForm({ name: "", email: "", password: "", role: "client" }); }} className="mr-4 text-slate-500 hover:text-slate-700 font-bold py-2 px-4 rounded-xl">
                  Annuler
                </button>
              )}
              <button type="submit" className="bg-slate-900 text-white font-bold py-2 px-6 rounded-xl hover:bg-slate-800 transition">
                {editingUser ? "Modifier l'utilisateur" : "Ajouter l'utilisateur"}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Nom</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Rôle</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold text-slate-500">#{user.id}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{user.name}</td>
                    <td className="py-4 px-6">{user.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-red-100 text-red-700' : user.role === 'serveur' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => handleEditUser(user)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-slate-400">Aucun utilisateur trouvé.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ORDERS */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Aucune commande enregistrée.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Client</th>
                    <th className="py-4 px-6">Détails de Commande</th>
                    <th className="py-4 px-6">Adresse & Tel</th>
                    <th className="py-4 px-6">Total</th>
                    <th className="py-4 px-6">Statut</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-bold text-slate-950">#{order.id}</td>
                      <td className="py-4 px-6 font-semibold text-slate-900">{order.client_nom}</td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {order.commande_items &&
                            order.commande_items.map((item) => (
                              <div key={item.id} className="text-slate-600 text-xs">
                                <span className="font-bold text-slate-800">{item.quantite}x</span>{" "}
                                {item.plat ? item.plat.nom : "Plat inconnu"}{" "}
                                <span className="text-slate-400">({parseFloat(item.prix).toFixed(2)} DH)</span>
                              </div>
                            ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {order.table_numero ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200/50">
                            Sur place : {order.table_numero}
                          </span>
                        ) : (
                          <>
                            <div className="font-medium text-slate-700">{order.telephone}</div>
                            <div className="mt-0.5 line-clamp-1">{order.adresse}</div>
                          </>
                        )}
                      </td>
                      <td className="py-4 px-6 font-black text-slate-900">{parseFloat(order.total).toFixed(2)} DH</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(order.statut)}`}>
                          {order.statut}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                        {order.statut === "En attente" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "En préparation")}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition cursor-pointer"
                            title="Mettre en préparation"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}
                        {order.statut === "En préparation" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "Prête")}
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white rounded-lg transition cursor-pointer"
                            title="Marquer comme prête"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {order.statut === "Prête" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "Servie")}
                            className="p-1.5 bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white rounded-lg transition cursor-pointer"
                            title="Marquer comme servie"
                          >
                            <Truck className="h-4 w-4" />
                          </button>
                        )}
                        {order.statut === "Servie" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "Payée")}
                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition cursor-pointer"
                            title="Marquer comme payée (Finalisé)"
                          >
                            <Coins className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition cursor-pointer"
                          title="Supprimer la commande"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DISHES */}
      {activeTab === "dishes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create/Edit Plat Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
            <h2 className="text-xl font-bold font-serif text-slate-900 mb-6 flex items-center space-x-2">
              <span>{editingPlat ? "Modifier le Plat" : "Ajouter un Plat"}</span>
            </h2>
            <form onSubmit={handleCreateOrUpdatePlat} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nom du Plat</label>
                <input
                  type="text"
                  name="nom"
                  required
                  value={platForm.nom}
                  onChange={handlePlatFormChange}
                  placeholder="Ex: Tacos Poulet Double"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prix (DH)</label>
                <input
                  type="number"
                  step="0.01"
                  name="prix"
                  required
                  value={platForm.prix}
                  onChange={handlePlatFormChange}
                  placeholder="Ex: 45.00"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Catégorie</label>
                <select
                  name="categorie_id"
                  required
                  value={platForm.categorie_id}
                  onChange={handlePlatFormChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 bg-white"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Image du Plat
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    id="plat-image-input"
                    accept="image/*"
                    required={!editingPlat}
                    onChange={handlePlatFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <ImageIcon className="h-6 w-6 text-slate-400 mb-2" />
                  <span className="text-xs text-slate-500 font-medium">
                    {platForm.image ? platForm.image.name : "Cliquez pour uploader (Max 2MB)"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  {editingPlat ? "Enregistrer" : "Créer"}
                </button>
                {editingPlat && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlat(null);
                      setPlatForm({ nom: "", prix: "", categorie_id: "", image: null });
                    }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Plats List Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold font-serif text-slate-900 mb-6">Liste des Plats</h2>
            {plats.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Aucun plat dans la base.</div>
            ) : (
              <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-100 pr-1">
                {plats.map((plat) => (
                  <div key={plat.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={getImageUrl(plat.image)}
                        alt={plat.nom}
                        className="w-12 h-12 object-cover rounded-xl border border-slate-100"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-slate-950">{plat.nom}</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-500 mt-1 inline-block">
                          {plat.categorie ? plat.categorie.nom : "Non classé"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className="font-extrabold text-slate-950">{parseFloat(plat.prix).toFixed(2)} DH</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditPlat(plat)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlat(plat.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create/Edit Category Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
            <h2 className="text-xl font-bold font-serif text-slate-900 mb-6">
              {editingCat ? "Modifier la Catégorie" : "Ajouter une Catégorie"}
            </h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nom de Catégorie</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ex: Tacos, Salades, Boissons"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  {editingCat ? "Enregistrer" : "Créer"}
                </button>
                {editingCat && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null);
                      setCatName("");
                    }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold font-serif text-slate-900 mb-6">Liste des Catégories</h2>
            {categories.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Aucune catégorie enregistrée.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <div key={cat.id} className="py-3 flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{cat.nom}</span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TABLES */}
      {activeTab === "tables" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create/Edit Table Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
            <h2 className="text-xl font-bold font-serif text-slate-900 mb-6">
              {editingTable ? "Modifier la Table" : "Ajouter une Table"}
            </h2>
            <form onSubmit={handleCreateOrUpdateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Numéro de Table</label>
                <input
                  type="text"
                  name="numero"
                  required
                  value={tableForm.numero}
                  onChange={handleTableFormChange}
                  placeholder="Ex: Table 5"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 animate-fade-in"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Statut de la Table</label>
                <select
                  name="statut"
                  required
                  value={tableForm.statut}
                  onChange={handleTableFormChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900 bg-white"
                >
                  <option value="Libre">Libre</option>
                  <option value="Occupée">Occupée</option>
                  <option value="Réservée">Réservée</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  {editingTable ? "Enregistrer" : "Créer"}
                </button>
                {editingTable && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTable(null);
                      setTableForm({ numero: "", statut: "Libre" });
                    }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tables List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold font-serif text-slate-900 mb-6">Liste des Tables</h2>
            {tables.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Aucune table configurée.</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                {tables.map((table) => (
                  <div key={table.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-base">{table.numero}</span>
                      <div className="mt-1 flex items-center space-x-2">
                        <select
                          value={table.statut}
                          onChange={(e) => handleTableStatusChange(table.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white font-medium text-slate-600 focus:outline-none cursor-pointer"
                        >
                          <option value="Libre">Libre</option>
                          <option value="Occupée">Occupée</option>
                          <option value="Réservée">Réservée</option>
                        </select>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getTableStatusBadgeClass(table.statut)}`}>
                          {table.statut}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveQrCode(table)}
                        className="p-1.5 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg transition flex items-center space-x-1 text-xs font-bold cursor-pointer"
                        title="Générer QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                        <span className="hidden sm:inline">QR Code</span>
                      </button>
                      <button
                        onClick={() => handleEditTable(table)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR CODE OVERLAY MODAL */}
      {activeQrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-slate-100 flex flex-col items-center relative animate-fade-in">
            <button
              onClick={() => setActiveQrCode(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-bold font-serif text-slate-900 text-center mb-1">
              QR Code - {activeQrCode.numero}
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6">
              Scannez pour accéder directement au menu
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  `${window.location.origin}/?table=${encodeURIComponent(activeQrCode.numero)}`
                )}`}
                alt={`QR Code ${activeQrCode.numero}`}
                className="w-48 h-48 rounded-lg shadow-sm"
              />
            </div>

            <div className="w-full text-center mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Lien de la Table</span>
              <span className="text-xs font-semibold text-slate-600 break-all select-all bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/50 block">
                {`${window.location.origin}/?table=${encodeURIComponent(activeQrCode.numero)}`}
              </span>
            </div>

            <div className="flex w-full space-x-3">
              <button
                onClick={handlePrintQrCode}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimer</span>
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                  `${window.location.origin}/?table=${encodeURIComponent(activeQrCode.numero)}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 text-center cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
