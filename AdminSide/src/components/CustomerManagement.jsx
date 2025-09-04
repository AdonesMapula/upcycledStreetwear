import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Users, 
  Search, 
  Filter,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  Star,
  Eye,
  Edit,
  X,
  Send,
  Package,
  Trash
} from 'lucide-react';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [customerOrders, setCustomerOrders] = useState([]);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to fetch users from Firebase...');
      
      // Check if db is properly initialized
      if (!db) {
        throw new Error('Firebase database not initialized');
      }
      
      // Fetch from users collection instead of customers
      const usersRef = collection(db, 'users');
      console.log('Users collection reference created');
      
      const usersSnapshot = await getDocs(usersRef);
      console.log('Firebase response received:', usersSnapshot);
      
      if (!usersSnapshot.empty) {
        const usersData = usersSnapshot.docs.map(doc => {
          const userData = doc.data();
          return {
            id: doc.id,
            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User',
            email: userData.email || 'No email',
            phone: userData.phone || userData.contactNumber || 'No phone',
            address: userData.location || 'No address',
            status: 'active', // Default status since users collection might not have this
            totalOrders: 0, // Default values - you might want to calculate these
            totalSpent: 0,
            lastOrder: 'Never',
            preferences: ['Streetwear'], // Default preferences
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
            photoURL: userData.photoURL || '',
            uid: userData.uid || doc.id
          };
        });
        console.log('Users fetched from Firebase:', usersData);
        setCustomers(usersData);
      } else {
        console.log('No users found in Firebase');
        setCustomers([]);
        setError('No users found in database.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Failed to load users from Firebase: ${error.message}`);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerOrders = async (customerId) => {
    try {
      console.log('Fetching orders for user:', customerId);
      
      // Check if db is properly initialized
      if (!db) {
        throw new Error('Firebase database not initialized');
      }
      
      // Fetch from Firebase - you might need to adjust this based on your orders structure
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', customerId)); // Changed from customerId to userId
      const ordersSnapshot = await getDocs(q);
      
      if (!ordersSnapshot.empty) {
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Orders fetched from Firebase:', ordersData);
        return ordersData;
      } else {
        console.log('No orders found in Firebase');
        return [];
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatPrice = (price) => {
    return `₱${price.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'new':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'mine':
        return 'bg-blue-100 text-blue-800';
      case 'grab':
        return 'bg-yellow-100 text-yellow-800';
      case 'steal':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerValue = (totalSpent) => {
    if (totalSpent >= 10000) return { level: 'VIP', color: 'text-purple-600' };
    if (totalSpent >= 5000) return { level: 'Regular', color: 'text-green-600' };
    if (totalSpent >= 2000) return { level: 'Casual', color: 'text-blue-600' };
    return { level: 'New', color: 'text-gray-600' };
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleViewOrders = async (customer) => {
    setSelectedCustomer(customer);
    setShowOrdersModal(true);
    
    // Fetch orders for this customer
    const orders = await getCustomerOrders(customer.id);
    setCustomerOrders(orders);
  };

  const handleEditProfile = (customer) => {
    setEditingCustomer({ ...customer });
    setShowEditModal(true);
  };

  const handleSendEmail = (customer) => {
    setSelectedCustomer(customer);
    setEmailData({ subject: '', message: '' });
    setShowEmailModal(true);
  };

  const handleSaveEdit = async () => {
    if (editingCustomer) {
      try {
        console.log('Updating user in Firebase:', editingCustomer.id);
        const userRef = doc(db, 'users', editingCustomer.id);
        
        // Split name back to firstName and lastName
        const nameParts = editingCustomer.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await updateDoc(userRef, {
          firstName: firstName,
          lastName: lastName,
          email: editingCustomer.email,
          phone: editingCustomer.phone,
          contactNumber: editingCustomer.phone, // Update both phone fields if they exist
          location: editingCustomer.address,
          updatedAt: new Date().toISOString()
        });
        console.log('User updated in Firebase successfully');
        
        // Update local state
        setCustomers(prev => prev.map(c => 
          c.id === editingCustomer.id ? editingCustomer : c
        ));
        
        setShowEditModal(false);
        setEditingCustomer(null);
        setModalTitle('Success');
        setModalMessage('User profile updated successfully!');
        setShowSuccessModal(true);
      } catch (error) {
        console.error('Error updating user:', error);
        setModalTitle('Error');
        setModalMessage(`Failed to update user: ${error.message}`);
        setShowErrorModal(true);
      }
    }
  };

  const handleSendEmailSubmit = () => {
    if (emailData.subject && emailData.message) {
      setShowEmailModal(false);
      setEmailData({ subject: '', message: '' });
      setModalTitle('Email Sent');
      setModalMessage(`Email sent to ${selectedCustomer.email} successfully!`);
      setShowSuccessModal(true);
    } else {
      setModalTitle('Validation Error');
      setModalMessage('Please fill in both subject and message.');
      setShowErrorModal(true);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

const handleDeleteCustomer = async () => {
  if (deletingCustomer) {
    try {
      console.log('Deleting user from Firebase:', deletingCustomer.id);
      const userRef = doc(db, 'users', deletingCustomer.id);
      
      await deleteDoc(userRef);
      console.log('User deleted from Firebase successfully');
      
      // Update local state - remove the deleted customer
      setCustomers(prev => prev.filter(c => c.id !== deletingCustomer.id));
      
      // Close modals and reset state
      setShowDeleteModal(false);
      setDeletingCustomer(null);
      setShowCustomerModal(false); // Close detail modal if open
      
      // Show success message
      setModalTitle('Success');
      setModalMessage(`User "${deletingCustomer.name}" has been deleted successfully!`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting user:', error);
      setModalTitle('Error');
      setModalMessage(`Failed to delete user: ${error.message}`);
      setShowErrorModal(true);
    }
  }
};

const confirmDeleteCustomer = (customer) => {
  setDeletingCustomer(customer);
  setShowDeleteModal(true);
};

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">User Management</h1>
          <p className="text-gray-600">Manage your user profiles and track their activity</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="new">New</option>
          </select>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-secondary">{customers.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-secondary">
                {customers.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-secondary">
                {customers.filter(c => c.status === 'new').length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-secondary">
                {customers.length > 0 ? formatPrice(Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length)) : formatPrice(0)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => {
          const customerValue = getCustomerValue(customer.totalSpent);
          return (
            <div key={customer.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                    {customer.photoURL ? (
                      <img 
                        src={customer.photoURL} 
                        alt={customer.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-semibold text-lg">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary">{customer.name}</h3>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                  {customer.status.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{customer.address}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Orders:</span>
                  <span className="font-medium">{customer.totalOrders}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="font-medium text-primary">{formatPrice(customer.totalSpent)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Customer Level:</span>
                  <span className={`font-medium ${customerValue.color}`}>{customerValue.level}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Order:</span>
                  <span className="font-medium">{customer.lastOrder}</span>
                </div>
                
                <div className="pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Preferences:</span>
                    <div className="flex space-x-1">
                      {customer.preferences.slice(0, 2).map((pref, index) => (
                        <span key={index} className="px-2 py-1 bg-primary-light text-primary text-xs rounded">
                          {pref}
                        </span>
                      ))}
                      {customer.preferences.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{customer.preferences.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleViewCustomer(customer)}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 mt-4"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Detail Modal */}
      {showCustomerModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-secondary">User Details</h2>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center">
                    {selectedCustomer.photoURL ? (
                      <img 
                        src={selectedCustomer.photoURL} 
                        alt={selectedCustomer.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-semibold text-xl">
                        {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-secondary">{selectedCustomer.name}</h3>
                    <p className="text-gray-600">{selectedCustomer.email}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCustomer.status)}`}>
                      {selectedCustomer.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-secondary">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-secondary">{selectedCustomer.address}</p>
                  </div>
                </div>
                
                {/* Order History */}
                <div>
                  <h4 className="text-lg font-semibold text-secondary mb-3">Order History</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-secondary">{selectedCustomer.totalOrders}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(selectedCustomer.totalSpent)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Last Order</p>
                      <p className="text-2xl font-bold text-secondary">{selectedCustomer.lastOrder}</p>
                    </div>
                  </div>
                </div>
                
                {/* Preferences */}
                <div>
                  <h4 className="text-lg font-semibold text-secondary mb-3">Preferences</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.preferences.map((pref, index) => (
                      <span key={index} className="px-3 py-1 bg-primary-light text-primary rounded-full text-sm">
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button 
                    onClick={() => handleSendEmail(selectedCustomer)}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Email</span>
                  </button>
                  <button 
                    onClick={() => handleViewOrders(selectedCustomer)}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Package className="h-4 w-4" />
                    <span>View Orders</span>
                  </button>
                  <button 
                    onClick={() => handleEditProfile(selectedCustomer)}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                  <button 
                      onClick={() => confirmDeleteCustomer(selectedCustomer)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Trash className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {showOrdersModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-secondary">
                  Order History - {selectedCustomer.name}
                </h2>
                <button
                  onClick={() => setShowOrdersModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {customerOrders.length > 0 ? (
                  customerOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-secondary">{order.product || 'Product Name'}</h4>
                          <p className="text-sm text-gray-600">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">Date: {order.date || 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{formatPrice(order.price || 0)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status || 'pending')}`}>
                            {(order.status || 'pending').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders found for this user</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-secondary">Edit User Profile</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editingCustomer.address}
                    onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingCustomer.status}
                    onChange={(e) => setEditingCustomer({...editingCustomer, status: e.target.value})}
                    className="input-field"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="new">New</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 btn-primary font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-secondary">Send Email to {selectedCustomer.name}</h2>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="email"
                    value={selectedCustomer.email}
                    disabled
                    className="input-field bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                    className="input-field"
                    placeholder="Enter email subject..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={emailData.message}
                    onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                    className="input-field h-32 resize-none"
                    placeholder="Enter your message..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmailSubmit}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2 font-medium"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-green-600">{modalTitle}</h2>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">{modalMessage}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-red-600">{modalTitle}</h2>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">{modalMessage}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingCustomer && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-red-600">Confirm Delete</h2>
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-gray-700">
                        Are you sure you want to delete user <strong>"{deletingCustomer.name}"</strong>? 
                        This action cannot be undone.
                      </p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteCustomer}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        <Trash className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
};

export default CustomerManagement;