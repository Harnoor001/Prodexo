import React from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  query,
  where,
  getDocs,
  writeBatch,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';

// --- !!! IMPORTANT !!! ---
// This is your personal Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyBYImRNT0ywh3RBVPRfCnplboTIYvfP7yQ",
  authDomain: "project-84d5e.firebaseapp.com",
  projectId: "project-84d5e",
  storageBucket: "project-84d5e.firebasestorage.app",
  messagingSenderId: "694881274435",
  appId: "1:694881274435:web:f79e94322dc4fe3ac062f6",
  measurementId: "G-J3994L0CR1"
};


// --- !!! ADMIN CONFIGURATION !!! ---
// After your girlfriend signs up, get her User ID (you can find it in Firebase Authentication)
// and paste it here. This will give her access to the Admin panel.
const ADMIN_UID = "REPLACE_WITH_YOUR_GIRLFRIEND_USER_ID";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Components & Icons ---

const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
  </div>
);

const Alert = ({ message, type = 'success' }) => {
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  if (!message) return null;
  return (
    <div className={`fixed top-5 right-5 ${bgColor} text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-down`}>
      {message}
    </div>
  );
};

const UserIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ShoppingBagIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

const ClockIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);


// --- Main App Context ---
const AppContext = React.createContext();

// --- Main App Component ---
function App() {
  const [user, setUser] = React.useState(null);
  const [userData, setUserData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState('landing'); // landing, signup, login, home, shop, checkout, orders, admin
  const [cart, setCart] = React.useState({});
  const [alert, setAlert] = React.useState({ message: '', type: 'success' });

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUser(currentUser);
          setUserData(userDoc.data());
          setPage('home');
        } else {
            // This might happen if user doc creation failed after signup
            signOut(auth);
        }
      } else {
        setUser(null);
        setUserData(null);
        setPage('landing');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type }), 3000);
  };

  const addToCart = (product) => {
      setCart(prevCart => {
          const newCart = {...prevCart};
          if(newCart[product.id]) {
              if (newCart[product.id].quantity < product.stock) {
                 newCart[product.id].quantity++;
              } else {
                  showAlert(`Cannot add more. Only ${product.stock} in stock.`, 'error');
              }
          } else {
              if (product.stock > 0) {
                newCart[product.id] = {...product, quantity: 1};
              } else {
                  showAlert('Item is out of stock.', 'error');
              }
          }
          return newCart;
      });
  };

  const updateCartQuantity = (productId, quantity) => {
      setCart(prevCart => {
          const newCart = {...prevCart};
          const product = newCart[productId];
          if (product) {
              if (quantity > 0 && quantity <= product.stock) {
                  product.quantity = quantity;
              } else if (quantity > product.stock) {
                  showAlert(`Only ${product.stock} items in stock.`, 'error');
                  product.quantity = product.stock;
              } else {
                  delete newCart[productId];
              }
          }
          return newCart;
      });
  };

  const clearCart = () => {
    setCart({});
  };

  const contextValue = {
    user,
    userData,
    page,
    setPage,
    cart,
    addToCart,
    updateCartQuantity,
    clearCart,
    showAlert,
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'signup':
        return <SignUpPage />;
      case 'login':
        return <LoginPage />;
      case 'home':
        return <HomePage />;
      case 'shop':
        return <ShopPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'orders':
        return <OrdersPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="font-sans bg-gray-50 min-h-screen">
        <Alert message={alert.message} type={alert.type} />
        {renderPage()}
      </div>
    </AppContext.Provider>
  );
}

// --- Page Components ---

const LandingPage = () => {
  const { setPage } = React.useContext(AppContext);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-50 p-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-indigo-600">Prodexo</h1>
        <p className="mt-4 text-lg md:text-xl text-gray-600">Late-night cravings delivered to your hostel room.</p>
      </div>
      <div className="mt-12 space-y-4 md:space-y-0 md:space-x-6 flex flex-col md:flex-row">
        <button onClick={() => setPage('login')} className="w-48 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300">
          Login
        </button>
        <button onClick={() => setPage('signup')} className="w-48 bg-white text-indigo-600 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 border border-indigo-200">
          Sign Up
        </button>
      </div>
    </div>
  );
};

const AuthForm = ({ isSignUp }) => {
  const { setPage, showAlert } = React.useContext(AppContext);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [room, setRoom] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp && (!fullName || !phone || !room)) {
        showAlert('Please fill all fields', 'error');
        setLoading(false);
        return;
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          fullName,
          email,
          phone,
          room,
        });
        showAlert('Account created successfully!', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert('Logged in successfully!', 'success');
      }
      // The onAuthStateChanged listener in App.js will handle page navigation
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">{isSignUp ? 'Create Account' : 'Welcome Back!'}</h2>
        <p className="text-center text-gray-500 mb-8">{isSignUp ? 'Join the late-night snack club.' : 'Login to continue.'}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              <input type="text" placeholder="Room Number" value={room} onChange={(e) => setRoom(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </>
          )}
          <input type="email" placeholder="Email ID" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-400">
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => setPage(isSignUp ? 'login' : 'signup')} className="text-indigo-600 font-semibold hover:underline">
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

const SignUpPage = () => <AuthForm isSignUp />;
const LoginPage = () => <AuthForm isSignUp={false} />;

const HomePage = () => {
    const { userData, setPage } = React.useContext(AppContext);

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <MainHeader />
            <div className="max-w-4xl mx-auto mt-10 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Welcome back, {userData?.fullName.split(' ')[0]}!</h1>
                <p className="mt-3 text-lg text-gray-600">What will you like to order today?</p>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div onClick={() => setPage('shop')} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer text-center flex flex-col items-center justify-center">
                        <ShoppingBagIcon className="w-16 h-16 text-indigo-500 mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-800">Start Shopping</h2>
                        <p className="text-gray-500 mt-2">Browse our collection of snacks and drinks.</p>
                    </div>
                    <div onClick={() => setPage('orders')} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer text-center flex flex-col items-center justify-center">
                        <ClockIcon className="w-16 h-16 text-indigo-500 mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-800">My Orders</h2>
                        <p className="text-gray-500 mt-2">View your past and current orders.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShopPage = () => {
    const { addToCart, cart } = React.useContext(AppContext);
    const [products, setProducts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [categories, setCategories] = React.useState({});
    const [selectedCategory, setSelectedCategory] = React.useState('All');
    
    // This effect seeds the database with products if it's empty.
    // In a real app, you'd manage this via an admin panel.
    React.useEffect(() => {
        const seedProducts = async () => {
            const productsCollection = collection(db, 'products');
            const q = query(productsCollection, limit(1));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                console.log("No products found, seeding database...");
                const defaultProducts = [
                    { name: "Lays India's Magic Masala", price: 20, stock: 50, category: 'Chips', image: 'https://placehold.co/300x300/e2e8f0/4a5568?text=Lays' },
                    { name: 'Kurkure Masala Munch', price: 20, stock: 45, category: 'Chips', image: 'https://placehold.co/300x300/e2e8f0/4a5568?text=Kurkure' },
                    { name: 'Dark Fantasy Choco Fills', price: 30, stock: 30, category: 'Biscuits', image: 'https://placehold.co/300x300/e2e8f0/4a5568?text=Dark+Fantasy' },
                    { name: 'Oreo Chocolate Cookies', price: 30, stock: 40, category: 'Biscuits', image: 'https://placehold.co/300x300/e2e8f0/4a5568?text=Oreo' },
                    { name: 'Dairy Milk Chocolate', price: 40, stock: 25, category: 'Chocolates', image: 'https://placehold.co/300x300/e2e8f0/4a5568?text=Dairy+Milk' },
                    { name: 'KitKat', price: 25, stock: 35, category: 'Chocolates', image: 'https://placehold.co/300x300/e2e8f0/4a5568?text=KitKat' },
                    { name: 'Coca-Cola Can', price: 40, stock: 50, category: 'Beverages', image: 'https://placehold.co/300x300/e2e8f0/4a5568?text=Coke' },
                    { name: 'Sting Energy Drink', price: 20, stock: 60, category: 'Beverages', image: 'https://placehold.co/300x300/e2e8f0/4a5568?text=Sting' },
                    { name: 'Maggi Noodles', price: 14, stock: 100, category: 'Noodles', image: 'https://placehold.co/300x300/e2e8f0/4a5568?text=Maggi' },
                    { name: 'Cornetto Ice Cream', price: 50, stock: 20, category: 'Ice Cream', image: 'https://placehold.co/300x300/e2e8f0/4a5568?text=Cornetto' },
                ];
                const batch = writeBatch(db);
                defaultProducts.forEach(p => {
                    const docRef = doc(collection(db, 'products'));
                    batch.set(docRef, p);
                });
                await batch.commit();
                console.log("Database seeded.");
            }
        };
        seedProducts();
    }, []);


    React.useEffect(() => {
        const q = collection(db, 'products');
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const productsData = [];
            const categoriesCount = { All: 0 };
            querySnapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                productsData.push(product);
                if (product.stock > 0) {
                    categoriesCount[product.category] = (categoriesCount[product.category] || 0) + 1;
                    categoriesCount['All']++;
                }
            });
            setProducts(productsData);
            setCategories(categoriesCount);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredProducts = products.filter(p => (selectedCategory === 'All' || p.category === selectedCategory) && p.stock > 0);
    const cartItemCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    const { setPage } = React.useContext(AppContext);

    return (
        <div className="min-h-screen bg-gray-50">
            <MainHeader />
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Categories Sidebar */}
                    <aside className="w-full md:w-1/4">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                           <h3 className="text-xl font-semibold mb-4 text-gray-800">Categories</h3>
                            <ul className="space-y-2">
                                {Object.keys(categories).map(cat => (
                                    <li key={cat}>
                                        <button 
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`w-full text-left px-4 py-2 rounded-md transition duration-200 ${selectedCategory === cat ? 'bg-indigo-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                                        >
                                            {cat} ({categories[cat]})
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <main className="w-full md:w-3/4">
                        <div className="mb-4">
                            <h2 className="text-3xl font-bold text-gray-800">Shop</h2>
                            <p className="text-gray-500">{filteredProducts.length} products found</p>
                        </div>
                        {loading ? <Spinner /> : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} addToCart={addToCart} />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
            {cartItemCount > 0 && (
                <div className="fixed bottom-5 right-5">
                    <button onClick={() => setPage('checkout')} className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105 flex items-center gap-2">
                        <ShoppingBagIcon className="w-6 h-6"/>
                        View Cart ({cartItemCount})
                    </button>
                </div>
            )}
        </div>
    );
};

const ProductCard = ({ product, addToCart }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover"/>
            <div className="p-4">
                <p className="text-xs text-gray-500 uppercase">{product.category}</p>
                <h3 className="font-semibold text-lg text-gray-800 truncate">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-xl font-bold text-indigo-600">₹{product.price}</p>
                    <p className={`text-sm font-medium ${product.stock < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                        {product.stock} left
                    </p>
                </div>
                 {product.stock < 10 && product.stock > 0 && <p className="text-xs text-yellow-600 mt-1">▲ Low stock - order soon!</p>}
                <button 
                    onClick={() => addToCart(product)} 
                    disabled={product.stock === 0}
                    className="w-full mt-4 bg-indigo-500 text-white font-semibold py-2 rounded-lg hover:bg-indigo-600 transition duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed">
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
};

const CheckoutPage = () => {
    const { cart, setPage, updateCartQuantity, clearCart, user, userData, showAlert } = React.useContext(AppContext);
    const [delivery, setDelivery] = React.useState('takeaway'); // 'takeaway' or 'delivery'
    const [transactionId, setTransactionId] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    
    const deliveryFee = delivery === 'delivery' ? 20 : 0;
    const subtotal = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + deliveryFee;
    
    const upiLink = `upi://pay?pa=YOUR_UPI_ID@okhdfcbank&pn=Prodexo&am=${total}.00&cu=INR&tn=OrderPayment`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
    
    if (Object.keys(cart).length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <MainHeader />
                <div className="text-center mt-20">
                    <h2 className="text-2xl font-semibold">Your Cart is Empty</h2>
                    <button onClick={() => setPage('shop')} className="mt-4 bg-indigo-600 text-white py-2 px-6 rounded-lg">
                        Go Shopping
                    </button>
                </div>
            </div>
        );
    }
    
    const handlePlaceOrder = async () => {
        if (transactionId.length < 4) {
            showAlert('Please enter the last 4 digits of the transaction ID.', 'error');
            return;
        }
        setLoading(true);
        
        const order = {
            userId: user.uid,
            userName: userData.fullName,
            userRoom: userData.room,
            items: cart,
            subtotal,
            deliveryFee,
            total,
            deliveryMethod: delivery,
            transactionId,
            status: 'Pending',
            createdAt: new Date(),
        };
        
        try {
            // Add order to database
            await addDoc(collection(db, "orders"), order);

            // Update product stock
            const batch = writeBatch(db);
            Object.values(cart).forEach(item => {
                const productRef = doc(db, 'products', item.id);
                const newStock = item.stock - item.quantity;
                batch.update(productRef, { stock: newStock });
            });
            await batch.commit();

            showAlert('Order placed successfully!', 'success');
            clearCart();
            setPage('orders');
            
        } catch (error) {
            showAlert('Failed to place order. ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <MainHeader />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items & Delivery */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">Your Order</h2>
                            {Object.values(cart).map(item => (
                                <div key={item.id} className="flex items-center justify-between py-3 border-b">
                                    <div className="flex items-center gap-4">
                                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover"/>
                                        <div>
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-gray-500">₹{item.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                          type="number" 
                                          value={item.quantity} 
                                          onChange={e => updateCartQuantity(item.id, parseInt(e.target.value))}
                                          className="w-16 p-1 border rounded-md text-center"
                                          min="0"
                                          max={item.stock}
                                        />
                                    </div>
                                </div>
                            ))}

                            <h3 className="text-lg font-semibold mt-6 mb-3">Delivery Option</h3>
                            <div className="flex gap-4">
                                <button onClick={() => setDelivery('takeaway')} className={`flex-1 p-4 border rounded-lg text-left ${delivery === 'takeaway' ? 'border-indigo-500 ring-2 ring-indigo-500' : ''}`}>
                                    <p className="font-semibold">Takeaway</p>
                                    <p className="text-sm text-gray-500">Pick up from the room (Free)</p>
                                </button>
                                <button onClick={() => setDelivery('delivery')} className={`flex-1 p-4 border rounded-lg text-left ${delivery === 'delivery' ? 'border-indigo-500 ring-2 ring-indigo-500' : ''}`}>
                                    <p className="font-semibold">Room Delivery</p>
                                    <p className="text-sm text-gray-500">Extra ₹20 charge</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payment & Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">Payment</h2>
                            <p className="text-center text-gray-600 mb-2">Scan the QR code to pay a total of <span className="font-bold">₹{total}</span></p>
                            <div className="flex justify-center p-2 border rounded-lg">
                               <img src={qrCodeUrl} alt="UPI QR Code" />
                            </div>
                            <a href={qrCodeUrl} download="prodexo-payment-qr.png" className="w-full text-center mt-2 inline-block text-sm text-indigo-600 hover:underline">Download Scanner</a>

                            <div className="mt-4">
                               <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700">Enter last 4 digits of Transaction ID</label>
                               <input 
                                   type="text" 
                                   id="transactionId"
                                   value={transactionId}
                                   onChange={e => setTransactionId(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                   className="mt-1 w-full p-2 border rounded-md"
                                   placeholder="1234"
                                   maxLength="4"
                                   required
                                />
                            </div>

                            <div className="mt-6 pt-4 border-t space-y-2">
                                <div className="flex justify-between"><p>Subtotal:</p> <p>₹{subtotal}</p></div>
                                <div className="flex justify-between"><p>Delivery Fee:</p> <p>₹{deliveryFee}</p></div>
                                <div className="flex justify-between text-lg font-bold"><p>Total:</p> <p>₹{total}</p></div>
                            </div>
                            
                            <button 
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full mt-6 bg-indigo-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-400">
                               {loading ? 'Placing Order...' : 'Confirm Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OrdersPage = () => {
    const { user } = React.useContext(AppContext);
    const [orders, setOrders] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        // Note: For reliable sorting, you would need to create a composite index in Firestore.
        // For this example, we will sort client-side.
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ordersData = [];
            querySnapshot.forEach((doc) => {
                ordersData.push({ id: doc.id, ...doc.data() });
            });
            // Sort by creation date, newest first
            ordersData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            setOrders(ordersData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-50">
            <MainHeader />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">My Orders</h1>
                {loading ? <Spinner/> : (
                    <div className="space-y-6">
                        {orders.length === 0 ? (
                            <p className="text-gray-600 bg-white p-6 rounded-lg shadow-sm">You haven't placed any orders yet.</p>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold text-lg">Order ID: #{order.id.slice(0, 6)}</p>
                                            <p className="text-sm text-gray-500">Placed on: {order.createdAt.toDate().toLocaleString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="border-t border-b py-2 my-2">
                                        {Object.values(order.items).map(item => (
                                            <div key={item.id} className="flex justify-between text-gray-700">
                                                <span>{item.name} x {item.quantity}</span>
                                                <span>₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end font-bold text-xl mt-4">
                                        Total: ₹{order.total}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


const AdminPage = () => {
    const { user, setPage, showAlert } = React.useContext(AppContext);
    const [view, setView] = React.useState('orders'); // orders, stock
    const [orders, setOrders] = React.useState([]);
    const [products, setProducts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const [newStock, setNewStock] = React.useState('');

    // Authentication check
    React.useEffect(() => {
        if (user?.uid !== ADMIN_UID) {
            setPage('home');
            showAlert('Access denied.', 'error');
        }
    }, [user, setPage, showAlert]);

    // Fetch Orders
    React.useEffect(() => {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(ordersData);
            setLoading(false);
        });
        return unsubscribe;
    }, []);
    
    // Fetch Products
    React.useEffect(() => {
        const q = collection(db, 'products');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);
        });
        return unsubscribe;
    }, []);
    
    const handleUpdateStock = async (e) => {
        e.preventDefault();
        if (!selectedProduct || newStock === '' || parseInt(newStock) < 0) {
            showAlert('Invalid stock value.', 'error');
            return;
        }
        try {
            const productRef = doc(db, 'products', selectedProduct.id);
            await setDoc(productRef, { stock: parseInt(newStock) }, { merge: true });
            showAlert('Stock updated successfully!', 'success');
            setSelectedProduct(null);
            setNewStock('');
        } catch (error) {
            showAlert('Error updating stock: ' + error.message, 'error');
        }
    };
    
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await setDoc(orderRef, { status: newStatus }, { merge: true });
            showAlert(`Order marked as ${newStatus}`, 'success');
        } catch (error) {
             showAlert('Error updating order status: ' + error.message, 'error');
        }
    };

    if (user?.uid !== ADMIN_UID) return null; // Render nothing if not admin

    return (
        <div className="min-h-screen bg-gray-50">
            <MainHeader />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
                <div className="flex border-b mb-6">
                    <button onClick={() => setView('orders')} className={`px-4 py-2 ${view === 'orders' ? 'border-b-2 border-indigo-500 font-semibold text-indigo-600' : 'text-gray-500'}`}>Orders</button>
                    <button onClick={() => setView('stock')} className={`px-4 py-2 ${view === 'stock' ? 'border-b-2 border-indigo-500 font-semibold text-indigo-600' : 'text-gray-500'}`}>Manage Stock</button>
                </div>

                {loading ? <Spinner /> : (
                    <>
                    {view === 'orders' && (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-center">
                                       <p className="font-bold">{order.userName} - Room {order.userRoom}</p>
                                       <p className="text-sm text-gray-500">{order.createdAt.toDate().toLocaleTimeString()}</p>
                                    </div>
                                    <ul className="list-disc list-inside my-2">
                                    {Object.values(order.items).map(item => <li key={item.id}>{item.name} x {item.quantity}</li>)}
                                    </ul>
                                    <p className="text-right font-bold">Total: ₹{order.total}</p>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {order.status}
                                        </span>
                                        {order.status === 'Pending' && 
                                            <button onClick={() => updateOrderStatus(order.id, 'Completed')} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm">Mark Completed</button>
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {view === 'stock' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                           <table className="w-full text-left">
                                <thead>
                                    <tr><th className="p-2">Product</th><th className="p-2">Current Stock</th><th className="p-2">Actions</th></tr>
                                </thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id} className="border-t">
                                            <td className="p-2">{p.name}</td>
                                            <td className="p-2">{p.stock}</td>
                                            <td className="p-2"><button onClick={() => {setSelectedProduct(p); setNewStock(p.stock)}} className="bg-indigo-500 text-white px-3 py-1 rounded-md text-sm">Update</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                           </table>
                        </div>
                    )}
                    </>
                )}
            </div>
            
            {/* Stock Update Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-xl font-semibold mb-4">Update Stock for {selectedProduct.name}</h3>
                        <form onSubmit={handleUpdateStock}>
                            <input 
                                type="number" 
                                value={newStock} 
                                onChange={e => setNewStock(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            />
                            <div className="flex justify-end gap-4 mt-4">
                               <button type="button" onClick={() => setSelectedProduct(null)} className="bg-gray-200 px-4 py-2 rounded-md">Cancel</button>
                               <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};



// --- Common Components ---

const MainHeader = () => {
    const { setPage, user } = React.useContext(AppContext);

    const handleSignOut = () => {
        signOut(auth);
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-10">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={() => setPage('home')}>
                    Prodexo
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setPage('shop')} className="text-gray-600 hover:text-indigo-600">Shop</button>
                    <button onClick={() => setPage('orders')} className="text-gray-600 hover:text-indigo-600">My Orders</button>
                    {user?.uid === ADMIN_UID && (
                       <button onClick={() => setPage('admin')} className="text-gray-600 hover:text-indigo-600">Admin</button>
                    )}
                    <button onClick={handleSignOut} className="bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-600 transition duration-300">
                        Sign Out
                    </button>
                </div>
            </nav>
        </header>
    );
}

export default App;

