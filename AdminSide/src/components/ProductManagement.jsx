import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Package
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import axios from "axios";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    size: '',
    condition: '',
    status: 'available',
    imageUrl: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const productsCollection = collection(db, "products"); // 'products' is your Firestore collection name
      const snapshot = await getDocs(productsCollection);
  
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.imageUrl; // fallback to existing value

      // If a new image file is selected, upload to Cloudinary
      if (imageFile) {
        setUploading(true);
        const data = new FormData();
        data.append("file", imageFile);
        data.append("upload_preset", "bshhhijy"); // your Cloudinary preset
        data.append("folder", "shop_products");   // optional

        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/dznhei4mc/image/upload",
          data
        );
        imageUrl = res.data.secure_url;
        setUploading(false);
      }

      const productPayload = {
        ...formData,
        imageUrl, // use the Cloudinary URL or fallback
        createdAt: editingProduct ? formData.createdAt : new Date()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productPayload);
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productPayload } : p));
      } else {
        const docRef = await addDoc(collection(db, 'products'), productPayload);
        setProducts([...products, { id: docRef.id, ...productPayload }]);
      }
      resetForm();
      setShowModal(false);
      setImageFile(null);
    } catch (error) {
      setUploading(false);
      console.error('Error saving product:', error);
      alert("Failed to save product.");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      size: '',
      condition: '',
      status: 'available',
      imageUrl: ''
    });
    setEditingProduct(null);
    setImageFile(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatPrice = (price) => {
    return `₱${price.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Product Management</h1>
          <p className="text-gray-600">Manage your upcycled streetwear inventory</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products..."
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
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="card hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                {product.status.toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-secondary">{product.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{product.category}</span>
                <span>Size: {product.size}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
                <span className="text-sm text-gray-500">{product.condition}</span>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-secondary mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setImageFile(e.target.files[0])}
                    className="input-field"
                  />
                  {uploading && <p className="text-xs text-blue-500 mt-1">Uploading image...</p>}
                  {formData.imageUrl && !imageFile && (
                    <img src={formData.imageUrl} alt="Preview" className="w-24 h-24 object-cover mt-2 rounded" />
                  )}
                  {imageFile && (
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-24 h-24 object-cover mt-2 rounded" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Or Image URL (optional)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="input-field"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input-field"
                    rows="3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <select
                      value={formData.size}
                      onChange={(e) => setFormData({...formData, size: e.target.value})}
                      className="input-field"
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
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                      className="input-field"
                      required
                    >
                      <option value="">Select Condition</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="input-field"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                    disabled={uploading}
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
