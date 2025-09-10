import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Upload,
  Package,
  X,
  Eye,
  DollarSign,
  Tag,
  Shirt,
  Star,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Gavel,
  Timer,
  TrendingUp
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedBidProduct, setSelectedBidProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    size: '',
    length: '', // Add length field
    width: '', // Add width field
    condition: '',
    status: 'available',
    imageUrls: [],
    biddingEnabled: false,
    minimumBid: '',
    currentBid: '',
    bidEndTime: '',
    bids: [],
    highestBidder: null,
    orderId: ''
  });

  useEffect(() => {
    fetchProducts();
    // Set up interval to check for expired auctions
    const interval = setInterval(checkExpiredAuctions, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const productsCollection = collection(db, "products");
      const snapshot = await getDocs(productsCollection);
  
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        bidEndTime: doc.data().bidEndTime?.toDate?.() || doc.data().bidEndTime
      }));
  
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Error fetching products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkExpiredAuctions = () => {
    const now = new Date();
    setProducts(prevProducts => 
      prevProducts.map(product => {
        if (product.biddingEnabled && 
            product.bidEndTime && 
            new Date(product.bidEndTime) <= now && 
            product.status !== 'sold' &&
            product.status !== 'expired') {
          
          // Auto-update expired products
          updateProductStatus(product.id, 'expired');
          
          return {
            ...product,
            status: 'expired',
            biddingEnabled: false
          };
        }
        return product;
      })
    );
  };

  const updateProductStatus = async (productId, newStatus) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'expired' && { biddingEnabled: false })
      });
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const uploadImageToFirebase = async (file) => {
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${randomString}_${cleanFileName}`;
      
      const storageRef = ref(storage, `products/${fileName}`);
      
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name
        }
      };
      
      console.log('Uploading file:', fileName);
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      if (error.code === 'storage/unauthorized') {
        throw new Error('Upload failed: Please check Firebase Storage security rules and ensure you are logged in');
      } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('Upload failed: Network error. Please try again.');
      } else {
        throw new Error(`Failed to upload image: ${error.message}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }
    
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    if (formData.biddingEnabled) {
      if (!formData.minimumBid || isNaN(formData.minimumBid) || parseFloat(formData.minimumBid) <= 0) {
        alert('Please enter a valid minimum bid amount');
        return;
      }
      
      if (!formData.bidEndTime) {
        alert('Please select an end time for bidding');
        return;
      }
      
      const endTime = new Date(formData.bidEndTime);
      if (endTime <= new Date()) {
        alert('Bid end time must be in the future');
        return;
      }
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      let imageUrls = [...(formData.imageUrls || [])];

      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          
          if (!file.type.startsWith('image/')) {
            throw new Error(`File ${file.name} is not an image`);
          }
          
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`File ${file.name} is too large. Maximum size is 5MB`);
          }
          
          const downloadURL = await uploadImageToFirebase(file);
          imageUrls.push(downloadURL);
          
          setUploadProgress(((i + 1) / imageFiles.length) * 100);
        }
      }

      // Determine sequential numericId for products (Id 1, Id 2, ...)
      let nextNumericId = editingProduct?.numericId || null;
      if (!editingProduct) {
        try {
          const allSnap = await getDocs(collection(db, 'products'));
          const existingIds = allSnap.docs
            .map(d => d.data()?.numericId)
            .filter(n => typeof n === 'number');
          const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
          nextNumericId = maxId + 1;
        } catch (e) {
          console.warn('Could not compute next numericId, defaulting to 1');
          nextNumericId = 1;
        }
      }

      const productPayload = {
        ...formData,
        price: parseFloat(formData.price),
        minimumBid: formData.biddingEnabled ? parseFloat(formData.minimumBid) : null,
        currentBid: formData.biddingEnabled ? (parseFloat(formData.minimumBid) || 0) : null,
        bidEndTime: formData.biddingEnabled ? new Date(formData.bidEndTime) : null,
        imageUrls,
        bids: formData.bids || [],
        numericId: nextNumericId,
        orderId: formData.orderId?.trim() || null,
        createdAt: editingProduct ? formData.createdAt : new Date(),
        updatedAt: new Date()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productPayload);
        setProducts(products.map(p => 
          p.id === editingProduct.id ? { ...p, ...productPayload } : p
        ));
        alert('Product updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'products'), productPayload);
        setProducts([...products, { id: docRef.id, ...productPayload }]);
        alert('Product added successfully!');
      }

      resetForm();
      setShowModal(false);

    } catch (error) {
      console.error('Error saving product:', error);
      alert(`Failed to save product: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAcceptBid = async (productId, bidIndex) => {
    try {
      const product = products.find(p => p.id === productId);
      const acceptedBid = product.bids[bidIndex];
      // Try to fetch user profile details
      let userProfile = null;
      try {
        if (acceptedBid.bidderId) {
          const userRef = doc(db, 'users', acceptedBid.bidderId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            userProfile = userSnap.data();
          }
        }
      } catch (e) {
        console.warn('Could not fetch user profile for order creation:', e);
      }
      
      await updateDoc(doc(db, 'products', productId), {
        status: 'sold',
        biddingEnabled: false,
        highestBidder: acceptedBid.bidderName,
        finalPrice: acceptedBid.amount,
        soldAt: new Date(),
        updatedAt: new Date()
      });

      setProducts(products.map(p => 
        p.id === productId ? {
          ...p, 
          status: 'sold',
          biddingEnabled: false,
          highestBidder: acceptedBid.bidderName,
          finalPrice: acceptedBid.amount
        } : p
      ));

      // Create order document for admin and user tracking
      try {
        const ordersRef = collection(db, 'orders');
        await addDoc(ordersRef, {
          customerId: acceptedBid.bidderId || null,
          customerName: userProfile?.name || acceptedBid.bidderName || null,
          customerEmail: acceptedBid.bidderEmail || null,
          contactNumber: userProfile?.contactNumber || null,
          address: userProfile?.address || null,
          productId: productId,
          product: product.name,
          productImage: product.imageUrls?.[0] || null,
          category: product.category || null,
          price: acceptedBid.amount,
          status: 'pending',
          date: new Date(),
        });
      } catch (orderErr) {
        console.error('Failed to create order document:', orderErr);
      }

      alert(`Bid accepted! Product sold to ${acceptedBid.bidderName} for ₱${acceptedBid.amount.toLocaleString()}`);
      setShowBidModal(false);
      
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Failed to accept bid. Please try again.');
    }
  };

  const handleRejectBid = async (productId, bidIndex) => {
    try {
      const product = products.find(p => p.id === productId);
      const updatedBids = product.bids.filter((_, index) => index !== bidIndex);
      
      await updateDoc(doc(db, 'products', productId), {
        bids: updatedBids,
        updatedAt: new Date()
      });

      setProducts(products.map(p => 
        p.id === productId ? { ...p, bids: updatedBids } : p
      ));

      alert('Bid rejected successfully');
      
    } catch (error) {
      console.error('Error rejecting bid:', error);
      alert('Failed to reject bid. Please try again.');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      price: product.price?.toString() || '',
      minimumBid: product.minimumBid?.toString() || '',
      bidEndTime: product.bidEndTime ? 
        new Date(product.bidEndTime).toISOString().slice(0, 16) : '',
      orderId: product.orderId || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        setProducts(products.filter(p => p.id !== productId));
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleViewBids = (product) => {
    setSelectedBidProduct(product);
    setShowBidModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      size: '',
      length: '', // Add length field
      width: '', // Add width field
      condition: '',
      status: 'available',
      imageUrls: [],
      biddingEnabled: false,
      minimumBid: '',
      currentBid: '',
      bidEndTime: '',
      bids: [],
      highestBidder: null,
      orderId: ''
    });
    setEditingProduct(null);
    setImageFiles([]);
    setUploadProgress(0);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });
    
    setImageFiles([...imageFiles, ...validFiles]);
  };

  const removeImageFile = (indexToRemove) => {
    setImageFiles(imageFiles.filter((_, index) => index !== indexToRemove));
  };

  const removeImageUrl = (indexToRemove) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, index) => index !== indexToRemove)
    });
  };

  const getTimeLeft = (endTime) => {
    if (!endTime) return 'No end time';
    
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getBiddingProducts = () => {
    return products.filter(product => product.biddingEnabled && product.bids?.length > 0);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatPrice = (price) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `₱${numPrice?.toLocaleString() || '0'}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'sold':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConditionIcon = (condition) => {
    switch (condition) {
      case 'Excellent':
        return <Star className="h-4 w-4 text-yellow-500 fill-current" />;
      case 'Good':
        return <Star className="h-4 w-4 text-yellow-400" />;
      case 'Fair':
        return <Star className="h-4 w-4 text-yellow-300" />;
      default:
        return <Star className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse max-w-7xl mx-auto">
          <div className="h-10 bg-gray-200 rounded-lg w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Product Management</h1>
              <p className="text-lg text-gray-600">Manage your upcycled streetwear inventory and bidding</p>
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Package className="h-4 w-4 mr-1" />
                  {products.length} Products
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Gavel className="h-4 w-4 mr-1" />
                  {getBiddingProducts().length} Active Auctions
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#135918] hover:bg-[#0F4713] text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors ${
                activeTab === 'products'
                  ? 'bg-[#135918] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package className="h-5 w-5" />
              <span>Products</span>
            </button>
            <button
              onClick={() => setActiveTab('bidding')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors ${
                activeTab === 'bidding'
                  ? 'bg-[#135918] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Gavel className="h-5 w-5" />
              <span>Bid Management</span>
              {getBiddingProducts().length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                  {getBiddingProducts().length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'products' ? (
          <>
            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search products by name, description, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none transition-colors"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none bg-white min-w-[160px]"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="reserved">Reserved</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  <div className="relative">
                    {product.imageUrls && product.imageUrls.length > 0 ? (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={product.imageUrls[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.png';
                          }}
                        />
                        {product.imageUrls.length > 1 && (
                          <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {product.imageUrls.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                      {product.biddingEnabled && (
                        <span className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1 rounded-full text-xs font-semibold border flex items-center">
                          <Gavel className="h-3 w-3 mr-1" />
                          Auction
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1 mr-2">{product.name}</h3>
                      <span className="text-xl font-bold text-[#135918]">
                        {product.biddingEnabled && product.currentBid ? 
                          formatPrice(product.currentBid) : formatPrice(product.price)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{product.description}</p>
                    
                    {product.biddingEnabled && (
                      <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Minimum Bid:</span>
                          <span className="font-semibold">{formatPrice(product.minimumBid)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Bids:</span>
                          <span className="font-semibold">{product.bids?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Time Left:
                          </span>
                          <span className="font-semibold text-orange-600">
                            {getTimeLeft(product.bidEndTime)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Tag className="h-4 w-4 mr-1" />
                          {product.category}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Shirt className="h-4 w-4 mr-1" />
                          {product.size}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          {getConditionIcon(product.condition)}
                          <span className="ml-1">{product.condition}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-1 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      {product.biddingEnabled && product.bids?.length > 0 && (
                        <button
                          onClick={() => handleViewBids(product)}
                          className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-1 transition-colors"
                        >
                          <Users className="h-4 w-4" />
                          <span>Bids</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Bidding Management Section */
          <div className="space-y-6">
            {/* Bidding Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Gavel className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {getBiddingProducts().length}
                </div>
                <div className="text-sm text-gray-600">Active Auctions</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {getBiddingProducts().reduce((sum, product) => sum + (product.bids?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Bids</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Timer className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.biddingEnabled && 
                    p.bidEndTime && 
                    new Date(p.bidEndTime) > new Date() &&
                    (new Date(p.bidEndTime) - new Date()) < 24 * 60 * 60 * 1000
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Ending Soon</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(getBiddingProducts().reduce((sum, product) => 
                    sum + (product.currentBid || 0), 0
                  ))}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </div>

            {/* Active Auctions with Bids */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Active Auctions</h2>
              
              {getBiddingProducts().length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                  <Gavel className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Auctions</h3>
                  <p className="text-gray-500 mb-6">No products currently have active bids</p>
                </div>
              ) : (
                getBiddingProducts().map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {product.imageUrls?.[0] && (
                            <img
                              src={product.imageUrls[0]}
                              alt={product.name}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h3>
                            <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {getTimeLeft(product.bidEndTime)}
                              </span>
                              <span className="flex items-center text-gray-500">
                                <Users className="h-4 w-4 mr-1" />
                                {product.bids?.length || 0} bids
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">Current Highest Bid</div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatPrice(product.currentBid)}
                          </div>
                          <button
                            onClick={() => handleViewBids(product)}
                            className="mt-2 bg-[#135918] hover:bg-[#0F4713] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Manage Bids
                          </button>
                        </div>
                      </div>

                      {/* Recent Bids Preview */}
                      {product.bids && product.bids.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Recent Bids</h4>
                          <div className="space-y-2">
                            {product.bids
                              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                              .slice(0, 3)
                              .map((bid, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-blue-600 font-semibold text-sm">
                                        {bid.bidderName?.charAt(0)?.toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{bid.bidderName}</div>
                                      <div className="text-sm text-gray-500">
                                        {new Date(bid.timestamp).toLocaleDateString()} at{' '}
                                        {new Date(bid.timestamp).toLocaleTimeString()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-lg font-bold text-gray-900">
                                    {formatPrice(bid.amount)}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && activeTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first product'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Your First Product</span>
              </button>
            )}
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Product Images Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Product Images</label>
                    
                    {/* Drag & Drop Area */}
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        dragActive 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Drag & drop images here, or click to select
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Support for multiple images. Max 5MB per file.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageFileChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="bg-[#135918] hover:bg-[#0F4713] text-white px-6 py-2 rounded-lg font-medium cursor-pointer inline-block transition-colors"
                      >
                        Choose Images
                      </label>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                      <div className="mt-4 bg-blue-50 rounded-lg p-4">
                        <div className="flex justify-between text-sm text-blue-700 mb-2">
                          <span>Uploading images...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Selected Images Preview */}
                    {imageFiles.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">Selected Images ({imageFiles.length})</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {imageFiles.map((file, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                className="w-full h-20 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImageFile(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Existing Images */}
                    {formData.imageUrls && formData.imageUrls.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">Current Images ({formData.imageUrls.length})</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {formData.imageUrls.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={url}
                                alt={`Current ${idx}`}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImageUrl(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Order ID (optional)</label>
                      <input
                        type="text"
                        value={formData.orderId}
                        onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter custom Order ID"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none"
                        required
                        placeholder="Enter product name"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none"
                        rows="4"
                        required
                        placeholder="Describe the product details..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none"
                        required
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Size</label>
                      <select
                        value={formData.size}
                        onChange={(e) => setFormData({...formData, size: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none bg-white"
                        required
                      >
                        <option value="">Select Size</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none"
                        required
                        placeholder="e.g., T-Shirts, Hoodies, Jeans"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
                      <select
                        value={formData.condition}
                        onChange={(e) => setFormData({...formData, condition: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none bg-white"
                        required
                      >
                        <option value="">Select Condition</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none bg-white"
                      >
                        <option value="available">Available</option>
                        <option value="sold">Sold</option>
                        <option value="reserved">Reserved</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Length (inches)
                        </label>
                        <input
                            type="number"
                            name="length"
                            value={formData.length}
                            onChange={(e) => setFormData({...formData, length: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none bg-white"
                            placeholder="Enter length in inches"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Width (inches)
                        </label>
                        <input
                            type="number"
                            name="width"
                            value={formData.width}
                            onChange={(e) => setFormData({...formData, width: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#135918] focus:border-[#135918] outline-none bg-white"
                            placeholder="Enter width in inches"
                        />
                    </div>
                  </div>

                  {/* Bidding Settings */}
                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        id="biddingEnabled"
                        checked={formData.biddingEnabled}
                        onChange={(e) => setFormData({...formData, biddingEnabled: e.target.checked})}
                        className="w-4 h-4 text-[#135918] bg-gray-100 border-gray-300 rounded focus:ring-[#135918] focus:ring-2"
                      />
                      <label htmlFor="biddingEnabled" className="text-lg font-semibold text-gray-900 flex items-center">
                        <Gavel className="h-5 w-5 mr-2" />
                        Enable Bidding/Auction
                      </label>
                    </div>

                    {formData.biddingEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-orange-50 p-6 rounded-lg">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Bid Amount (₱)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.minimumBid}
                            onChange={(e) => setFormData({...formData, minimumBid: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Bidding End Time</label>
                          <input
                            type="datetime-local"
                            value={formData.bidEndTime}
                            onChange={(e) => setFormData({...formData, bidEndTime: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-4 pt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-[#135918] hover:bg-[#0F4713] text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        editingProduct ? 'Update Product' : 'Add Product'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bid Management Modal */}
        {showBidModal && selectedBidProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {selectedBidProduct.imageUrls?.[0] && (
                      <img
                        src={selectedBidProduct.imageUrls[0]}
                        alt={selectedBidProduct.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedBidProduct.name}</h2>
                      <p className="text-gray-600">Manage bids for this product</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowBidModal(false);
                      setSelectedBidProduct(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                {/* Auction Info */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Minimum Bid</div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(selectedBidProduct.minimumBid)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Current Highest</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(selectedBidProduct.currentBid)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Bids</div>
                      <div className="text-lg font-bold text-blue-600">
                        {selectedBidProduct.bids?.length || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Time Left</div>
                      <div className="text-lg font-bold text-orange-600">
                        {getTimeLeft(selectedBidProduct.bidEndTime)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bids List */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">All Bids</h3>
                  
                  {selectedBidProduct.bids && selectedBidProduct.bids.length > 0 ? (
                    <div className="space-y-3">
                      {selectedBidProduct.bids
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .map((bid, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-lg">
                                  {bid.bidderName?.charAt(0)?.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-lg">{bid.bidderName}</div>
                                <div className="text-sm text-gray-500">
                                  {new Date(bid.timestamp).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                                {bid.bidderEmail && (
                                  <div className="text-sm text-gray-500">{bid.bidderEmail}</div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                  {formatPrice(bid.amount)}
                                </div>
                                {index === 0 && (
                                  <div className="text-sm text-green-600 font-medium">Highest Bid</div>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleAcceptBid(selectedBidProduct.id, index)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-1 transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleRejectBid(selectedBidProduct.id, index)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-1 transition-colors"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No bids yet</h3>
                      <p className="text-gray-500">You'll see bids here as users place them.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;