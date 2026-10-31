import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingBag, Plus, Minus, Trash2, X, MapPin, Phone, User, CheckCircle, Clock } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `http://127.0.0.1:8000/storage/${imagePath}`;
};

function ClientMenu({ cart, setCart, isCartOpen, setIsCartOpen, tableNum }) {
  const [categories, setCategories] = useState([]);
  const [plats, setPlats] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState("cart"); // cart, form, success
  const [formData, setFormData] = useState({
    client_nom: "",
    telephone: "",
    adresse: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccessDetails, setOrderSuccessDetails] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, platsRes] = await Promise.all([
        axios.get(`${API_BASE}/categories`),
        axios.get(`${API_BASE}/plats`),
      ]);
      setCategories(catsRes.data);
      setPlats(platsRes.data);
    } catch (error) {
      console.error("Error fetching menu data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (plat) => {
    const existing = cart.find((item) => item.id === plat.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === plat.id ? { ...item, quantite: item.quantite + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...plat, quantite: 1 }]);
    }
  };

  const updateQuantity = (platId, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === platId) {
            const newQty = item.quantite + delta;
            return { ...item, quantite: newQty };
          }
          return item;
        })
        .filter((item) => item.quantite > 0)
    );
  };

  const removeFromCart = (platId) => {
    setCart(cart.filter((item) => item.id !== platId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.prix * item.quantite, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setSubmitting(true);
    const total = getCartTotal();

    const clientName = formData.client_nom.trim() || (tableNum ? `Client ${tableNum}` : "Client Anonyme");

    const orderPayload = {
      client_nom: clientName,
      telephone: tableNum ? null : formData.telephone,
      adresse: tableNum ? `Commande sur place (${tableNum})` : formData.adresse,
      total: total,
      statut: "En attente",
      table_numero: tableNum,
      plats: cart.map((item) => ({
        plat_id: item.id,
        quantite: item.quantite,
        prix: item.prix,
      })),
    };

    try {
      const response = await axios.post(`${API_BASE}/commandes`, orderPayload);
      setOrderSuccessDetails(response.data.Commande);
      setCart([]);
      setFormData({ client_nom: "", telephone: "", adresse: "" });
      setCheckoutStep("success");
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Une erreur s'est produite lors de la validation de votre commande. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlats =
    selectedCategory === "all"
      ? plats
      : plats.filter((p) => p.categorie_id === parseInt(selectedCategory));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-12 shadow-xl shadow-orange-500/5">
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600"
          alt="Delicious Food Header"
          className="w-full h-80 object-cover transform hover:scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-16 text-white">
          <span className="bg-orange-500/90 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full w-fit mb-4">
            Expérience Gastronomique
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-serif text-white leading-tight max-w-2xl my-2">
            {tableNum ? "Vos plats préférés servis à table." : "Des saveurs authentiques livrées chez vous."}
          </h1>
          <p className="text-slate-200 max-w-md font-light text-sm md:text-base mt-2">
            {tableNum ? (
              <>Commandez en direct depuis la <span className="font-extrabold text-orange-400">{tableNum}</span>. Vos plats arrivent tout de suite !</>
            ) : (
              "Commandez en quelques clics et dégustez des plats fraîchement préparés par nos chefs."
            )}
          </p>
        </div>
      </div>

      {/* Categories Switcher */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-slate-900 font-serif mb-6 flex items-center space-x-2">
          <span>Découvrez nos Catégories</span>
          <span className="h-1.5 w-1.5 bg-orange-500 rounded-full"></span>
        </h2>
        <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              selectedCategory === "all"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            Tous les plats
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id.toString())}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id.toString()
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {cat.nom}
            </button>
          ))}
        </div>
      </div>

      {/* Plates Grid */}
      <div>
        <div className="flex justify-between items-baseline mb-6">
          <h2 className="text-2xl font-bold text-slate-900 font-serif">
            Notre Carte
          </h2>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {filteredPlats.length} {filteredPlats.length > 1 ? "Plats disponibles" : "Plat disponible"}
          </span>
        </div>
        
        {filteredPlats.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <p className="text-slate-400 font-medium">Aucun plat n'est disponible dans cette catégorie pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlats.map((plat) => (
              <div
                key={plat.id}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                {/* Image Container */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={getImageUrl(plat.image)}
                    alt={plat.nom}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";
                    }}
                  />
                  {plat.categorie && (
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                      {plat.categorie.nom}
                    </span>
                  )}
                </div>

                {/* Details Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-950 line-clamp-1 group-hover:text-orange-500 transition-colors">
                      {plat.nom}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      Préparé avec des ingrédients frais du jour.
                    </p>
                  </div>
                  
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-slate-950">
                      {parseFloat(plat.prix).toFixed(2)} DH
                    </span>
                    <button
                      onClick={() => addToCart(plat)}
                      className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shopping Cart Slider Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2 text-slate-900">
                  <ShoppingBag className="h-5 w-5 text-orange-500" />
                  <span className="font-bold text-lg font-serif">Votre Commande</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-200/50 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart View State Manager */}
              {checkoutStep === "cart" && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <ShoppingBag className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Votre panier est vide</p>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition"
                      >
                        Retourner à la carte
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Cart Items List */}
                      <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
                        {cart.map((item) => (
                          <div key={item.id} className="py-4 flex items-center">
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.nom}
                              className="w-16 h-16 object-cover rounded-xl border border-slate-100"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";
                              }}
                            />
                            <div className="ml-4 flex-1">
                              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                {item.nom}
                              </h4>
                              <p className="text-xs text-slate-400 mt-1">
                                Unit: {parseFloat(item.prix).toFixed(2)} DH
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center border border-slate-200 rounded-lg">
                                  <button
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="p-1 hover:bg-slate-50 text-slate-500"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="px-2.5 text-xs font-bold text-slate-800">
                                    {item.quantite}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="p-1 hover:bg-slate-50 text-slate-500"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-slate-400 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <span className="ml-4 text-sm font-bold text-slate-900">
                              {(item.prix * item.quantite).toFixed(2)} DH
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Summary & Action */}
                      <div className="border-t border-slate-100 p-6 bg-slate-50">
                        <div className="flex justify-between items-baseline mb-4">
                          <span className="text-sm font-semibold text-slate-500">Total de votre commande:</span>
                          <span className="text-2xl font-black text-slate-950">
                            {getCartTotal().toFixed(2)} DH
                          </span>
                        </div>
                        <button
                          onClick={() => setCheckoutStep("form")}
                          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-md shadow-orange-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <span>Passer au Paiement</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Checkout Form Step */}
              {checkoutStep === "form" && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                      <div className="flex items-center space-x-2 text-slate-500 mb-2 cursor-pointer" onClick={() => setCheckoutStep("cart")}>
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-500">&larr; Retour au panier</span>
                      </div>
                      
                      <h3 className="text-lg font-bold font-serif text-slate-900">
                        {tableNum ? `Commande pour la ${tableNum}` : "Vos Informations de Livraison"}
                      </h3>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {tableNum ? "Votre Nom (Optionnel)" : "Nom Complet"}
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            name="client_nom"
                            required={!tableNum}
                            value={formData.client_nom}
                            onChange={handleInputChange}
                            placeholder={tableNum ? "Ahmed (ou vide pour anonyme)" : "Ex: Jean Dupont"}
                            className="pl-10 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {!tableNum && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Numéro de Téléphone</label>
                            <div className="relative">
                              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                              <input
                                type="tel"
                                name="telephone"
                                required
                                value={formData.telephone}
                                onChange={handleInputChange}
                                placeholder="Ex: 0612345678"
                                className="pl-10 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Adresse de Livraison</label>
                            <div className="relative">
                              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                              <textarea
                                name="adresse"
                                required
                                value={formData.adresse}
                                onChange={handleInputChange}
                                placeholder="Ex: Appt 4, Immeuble A, Rue des Oliviers, Casablanca"
                                rows="3"
                                className="pl-10 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-100 p-6 bg-slate-50">
                      <div className="flex justify-between items-baseline mb-4">
                        <span className="text-sm font-semibold text-slate-500">Total à payer:</span>
                        <span className="text-xl font-extrabold text-slate-950">
                          {getCartTotal().toFixed(2)} DH
                        </span>
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-md shadow-orange-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Traitement de la commande...</span>
                          </>
                        ) : (
                          <span>Confirmer ma Commande</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Order Success Screen */}
              {checkoutStep === "success" && orderSuccessDetails && (
                <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col justify-between">
                  <div className="text-center py-6 flex-1 flex flex-col justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-200">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold font-serif text-slate-900 mb-2">Commande Enregistrée !</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                      Merci pour votre commande. Notre équipe prépare actuellement vos délicieux plats.
                    </p>

                    {/* Receipt Card */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-3.5">
                      <div className="flex justify-between text-xs border-b border-slate-200/50 pb-2">
                        <span className="font-semibold text-slate-400 uppercase tracking-wide">Numéro de Commande</span>
                        <span className="font-black text-slate-950">#{orderSuccessDetails.id}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Client:</span>
                        <span className="font-semibold text-slate-800">{orderSuccessDetails.client_nom}</span>
                      </div>
                      {orderSuccessDetails.table_numero ? (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Table:</span>
                          <span className="font-bold text-orange-600 uppercase">{orderSuccessDetails.table_numero}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Téléphone:</span>
                            <span className="font-semibold text-slate-800">{orderSuccessDetails.telephone}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Adresse:</span>
                            <span className="font-semibold text-slate-800 line-clamp-1">{orderSuccessDetails.adresse}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-slate-500 flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> Statut:</span>
                        <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          {orderSuccessDetails.statut}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-slate-200/50 pt-2.5">
                        <span className="text-slate-900">Montant Total:</span>
                        <span className="text-orange-600">{parseFloat(orderSuccessDetails.total).toFixed(2)} DH</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutStep("cart");
                      setIsCartOpen(false);
                    }}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-md shadow-slate-900/10 transition-all flex items-center justify-center space-x-2 mt-4 cursor-pointer"
                  >
                    <span>Continuer mes achats</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientMenu;
