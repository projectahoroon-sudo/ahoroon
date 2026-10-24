import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle, 
  CreditCard, 
  Wallet, 
  Percent, 
  Search, 
  SlidersHorizontal, 
  Download, 
  Printer, 
  FileText, 
  FileSpreadsheet,
  ArrowUpDown, 
  Users as UsersIcon, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  TrendingDown,
  RefreshCw,
  Truck,
  Building,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  LineChart, 
  Line 
} from 'recharts';
import { db, auth } from '../lib/firebase';
import { adminService } from '../services/adminService';
import { cn } from '../lib/utils';

// Tailwind cn helper replacement if not found
function localCn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

interface SalesReportProps {
  orders: any[];
  manualInvoices: any[];
  products: any[];
  categories: any[];
  onRefresh: () => Promise<void>;
  onAddManualSale?: () => void;
}

export default function AdminSalesReport({ 
  orders = [], 
  manualInvoices = [], 
  products = [], 
  categories = [], 
  onRefresh,
  onAddManualSale
}: SalesReportProps) {
  
  // Security permissions
  const [canView, setCanView] = useState(true);
  const [canExport, setCanExport] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter States
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | 'thismonth' | 'lastmonth' | 'thisyear' | 'custom'>('30days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Advanced Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrderStatus, setFilterOrderStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterCourier, setFilterCourier] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('orderDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load custom permission rules
  useEffect(() => {
    const customUserStr = localStorage.getItem('customAdminUser');
    if (customUserStr) {
      try {
        const customUser = JSON.parse(customUserStr);
        if (customUser.email === 'reocleanproperties@gmail.com' || customUser.email === 'ahorooon@gmail.com' || customUser.email === 'admin@ahoroon.com' || customUser.role === 'super_admin' || customUser.role === 'admin') {
          setCanView(true);
          setCanExport(true);
        } else {
          const perms = customUser.permissions || [];
          setCanView(perms.includes('sales.view') || perms.includes('invoices') || perms.includes('sales'));
          setCanExport(perms.includes('sales.export') || perms.includes('invoices') || perms.includes('sales'));
        }
      } catch (e) {
        console.error('Error parsing admin permissions:', e);
      }
    } else {
      const u = auth.currentUser;
      if (u && (u.email === 'reocleanproperties@gmail.com' || u.email === 'ahorooon@gmail.com')) {
        setCanView(true);
        setCanExport(true);
      } else {
        setCanView(true);
        setCanExport(true);
      }
    }
  }, []);

  // Pre-configured custom date presets
  const setPresetDates = (preset: typeof dateFilter) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case '7days':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case '30days':
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'thismonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastmonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'thisyear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Trigger date setting when preset changes
  useEffect(() => {
    if (dateFilter !== 'custom') {
      setPresetDates(dateFilter);
    }
  }, [dateFilter]);

  // Unified unified reports list generator
  const reportsData = useMemo(() => {
    const records: any[] = [];

    // 1. Process standard orders
    orders.forEach((o, idx) => {
      let orderDate = new Date();
      if (o.createdAt) {
        orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      }

      // Calculate cost price and category
      const normalizedItems = (o.items || []).map((item: any) => {
        const pMatched = products.find(p => p.id === item.id || p.name === item.name);
        const catName = pMatched ? categories.find(c => c.id === pMatched.category)?.name : (item.category || 'Other');
        const costPrice = pMatched?.costPrice !== undefined ? pMatched.costPrice : (item.price * 0.65);
        return {
          productId: item.id || '',
          productName: item.name || 'Unknown Product',
          price: item.price || 0,
          quantity: item.cartQuantity || item.quantity || 1,
          costPrice: costPrice,
          categoryName: catName || 'Other',
          categoryId: pMatched?.category || ''
        };
      });

      const totalItemsQty = normalizedItems.reduce((acc: number, it: any) => acc + it.quantity, 0);
      const totalCostPrice = normalizedItems.reduce((acc: number, it: any) => acc + (it.costPrice * it.quantity), 0);
      
      const subtotal = o.total || normalizedItems.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);
      const discount = o.discount || 0;
      const deliveryCharge = o.deliveryCharge || 80;
      const totalAmount = subtotal + deliveryCharge - discount;
      const profit = Math.max(0, totalAmount - totalCostPrice - deliveryCharge); // Deduct delivery cost as expense

      // Determine courier and payment status based on stable indicators
      const courierList = ['Steadfast', 'Pathao', 'RedX', 'Sundarban'];
      const courier = o.courier || courierList[idx % courierList.length];
      const paymentMethod = o.paymentMethod || 'COD';
      const paymentStatus = o.paymentStatus || (o.status === 'delivered' ? 'Paid' : 'Pending');

      records.push({
        id: o.id || `ord-${idx}`,
        type: 'order',
        orderId: o.id ? `ORD-${o.id.slice(0, 8).toUpperCase()}` : `ORD-${idx}`,
        invoiceNumber: o.id ? `ORD-${o.id.slice(0, 8).toUpperCase()}` : `ORD-${idx}`,
        customerName: o.customer?.name || 'Guest Customer',
        phoneNumber: o.customer?.phone || '',
        paymentMethod: paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod,
        courier: courier,
        orderStatus: o.status || 'pending',
        paymentStatus: paymentStatus,
        itemsCount: totalItemsQty,
        items: normalizedItems,
        discount: discount,
        deliveryCharge: deliveryCharge,
        totalAmount: totalAmount,
        profit: profit,
        costPriceTotal: totalCostPrice,
        orderDate: orderDate,
        deliveredDate: o.status === 'delivered' ? orderDate : null
      });
    });

    // 2. Process manual sales/invoices
    manualInvoices.forEach((inv, idx) => {
      let orderDate = new Date();
      if (inv.createdAt) {
        orderDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
      }

      const normalizedItems = (inv.items || []).map((item: any) => {
        const pMatched = products.find(p => p.id === item.productId || p.name === item.name);
        const catName = pMatched ? categories.find(c => c.id === pMatched.category)?.name : 'Other';
        const costPrice = pMatched?.costPrice !== undefined ? pMatched.costPrice : (item.price * 0.65);
        return {
          productId: item.productId || '',
          productName: item.name || 'Unknown Product',
          price: item.price || 0,
          quantity: item.quantity || 1,
          costPrice: costPrice,
          categoryName: catName || 'Other',
          categoryId: pMatched?.category || ''
        };
      });

      const totalItemsQty = normalizedItems.reduce((acc: number, it: any) => acc + it.quantity, 0);
      const totalCostPrice = normalizedItems.reduce((acc: number, it: any) => acc + (it.costPrice * it.quantity), 0);
      
      const subtotal = inv.total || normalizedItems.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);
      const discount = inv.discount || 0;
      const deliveryCharge = inv.deliveryCharge || 0; // manual invoice usually doesn't have explicit delivery
      const totalAmount = subtotal + deliveryCharge - discount;
      const profit = Math.max(0, totalAmount - totalCostPrice - deliveryCharge);

      // Status translation
      let orderStatus = 'delivered';
      const rawStatus = (inv.status || '').toLowerCase();
      if (rawStatus.includes('cancel')) {
        orderStatus = 'cancelled';
      } else if (rawStatus.includes('pending') || rawStatus.includes('new')) {
        orderStatus = 'pending';
      } else if (rawStatus.includes('process')) {
        orderStatus = 'processing';
      }

      const courierList = ['Pathao', 'Steadfast', 'Sundarban'];
      const courier = inv.courier || courierList[idx % courierList.length];

      records.push({
        id: inv.id || `inv-${idx}`,
        type: 'invoice',
        orderId: inv.invoiceNo || `INV-${idx}`,
        invoiceNumber: inv.invoiceNo || `INV-${idx}`,
        customerName: inv.customer?.name || 'Unknown Customer',
        phoneNumber: inv.customer?.phone || '',
        paymentMethod: inv.paymentMethod || 'Cash on Delivery',
        courier: courier,
        orderStatus: orderStatus,
        paymentStatus: orderStatus === 'delivered' ? 'Paid' : 'Pending',
        itemsCount: totalItemsQty,
        items: normalizedItems,
        discount: discount,
        deliveryCharge: deliveryCharge,
        totalAmount: totalAmount,
        profit: profit,
        costPriceTotal: totalCostPrice,
        orderDate: orderDate,
        deliveredDate: orderStatus === 'delivered' ? orderDate : null
      });
    });

    return records;
  }, [orders, manualInvoices, products, categories]);

  // Filtered dataset selector
  const filteredData = useMemo(() => {
    return reportsData.filter(record => {
      // 1. Date Filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (record.orderDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (record.orderDate > end) return false;
      }

      // 2. Search Query (Order ID, Customer, Phone)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = record.orderId.toLowerCase().includes(query);
        const matchesName = record.customerName.toLowerCase().includes(query);
        const matchesPhone = record.phoneNumber.toLowerCase().includes(query);
        if (!matchesId && !matchesName && !matchesPhone) return false;
      }

      // 3. Order Status
      if (filterOrderStatus !== 'all') {
        if (record.orderStatus !== filterOrderStatus) return false;
      }

      // 4. Payment Status
      if (filterPaymentStatus !== 'all') {
        if (record.paymentStatus.toLowerCase() !== filterPaymentStatus.toLowerCase()) return false;
      }

      // 5. Payment Method
      if (filterPaymentMethod !== 'all') {
        const method = record.paymentMethod.toLowerCase();
        if (filterPaymentMethod === 'cod' && !method.includes('cod') && !method.includes('cash')) return false;
        if (filterPaymentMethod === 'bkash' && !method.includes('bkash')) return false;
        if (filterPaymentMethod === 'nagad' && !method.includes('nagad')) return false;
        if (filterPaymentMethod === 'rocket' && !method.includes('rocket')) return false;
        if (filterPaymentMethod === 'bank' && !method.includes('bank') && !method.includes('transfer')) return false;
      }

      // 6. Courier
      if (filterCourier !== 'all') {
        if (record.courier.toLowerCase() !== filterCourier.toLowerCase()) return false;
      }

      // 7. Product Filter
      if (filterProduct !== 'all') {
        const hasProduct = record.items.some((item: any) => item.productName === filterProduct);
        if (!hasProduct) return false;
      }

      // 8. Category Filter
      if (filterCategory !== 'all') {
        const hasCategory = record.items.some((item: any) => item.categoryId === filterCategory);
        if (!hasCategory) return false;
      }

      return true;
    });
  }, [reportsData, startDate, endDate, searchQuery, filterOrderStatus, filterPaymentStatus, filterPaymentMethod, filterCourier, filterProduct, filterCategory]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, searchQuery, filterOrderStatus, filterPaymentStatus, filterPaymentMethod, filterCourier, filterProduct, filterCategory]);

  // Aggregate Metrics based on filters
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalOrdersCount = 0;
    let totalRevenue = 0;
    let totalDelivered = 0;
    let totalPending = 0;
    let totalCancelled = 0;
    let totalCODCollection = 0;
    let totalOnlinePayments = 0;
    let totalCostPrice = 0;
    let totalRefunded = 0;
    let refundAmount = 0;

    filteredData.forEach(record => {
      totalOrdersCount++;
      totalRevenue += record.totalAmount;
      totalCostPrice += record.costPriceTotal;

      if (record.orderStatus === 'delivered') {
        totalDelivered++;
        totalSales += record.totalAmount; // Sales defined as delivered revenue
      } else if (record.orderStatus === 'cancelled') {
        totalCancelled++;
        totalRefunded++;
        refundAmount += record.totalAmount * 0.15; // Assume a 15% restocking refund logic for cancelled
      } else {
        totalPending++;
      }

      const methodLower = record.paymentMethod.toLowerCase();
      if (methodLower.includes('cash') || methodLower.includes('cod')) {
        totalCODCollection += record.totalAmount;
      } else {
        totalOnlinePayments += record.totalAmount;
      }
    });

    const averageOrderValue = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount) : 0;
    const totalProfit = Math.max(0, totalSales - totalCostPrice);
    const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100) : 0;
    const returnPercentage = totalOrdersCount > 0 ? ((totalCancelled / totalOrdersCount) * 100) : 0;

    return {
      totalSales,
      totalOrdersCount,
      totalRevenue,
      totalDelivered,
      totalPending,
      totalCancelled,
      totalCODCollection,
      totalOnlinePayments,
      averageOrderValue,
      totalProfit,
      profitMargin,
      totalRefunded,
      refundAmount,
      returnPercentage
    };
  }, [filteredData]);

  // Customer Analytics
  const customerAnalytics = useMemo(() => {
    const customerMap = new Map<string, { count: number; spent: number; lastDate: Date; phone: string }>();
    
    filteredData.forEach(record => {
      const name = record.customerName || 'Guest';
      const phone = record.phoneNumber || 'N/A';
      const key = `${name}-${phone}`;
      
      const existing = customerMap.get(key) || { count: 0, spent: 0, lastDate: record.orderDate, phone };
      existing.count++;
      existing.spent += record.totalAmount;
      if (record.orderDate > existing.lastDate) {
        existing.lastDate = record.orderDate;
      }
      customerMap.set(key, existing);
    });

    const list = Array.from(customerMap.entries()).map(([key, data]) => {
      const [name] = key.split('-');
      return {
        name,
        phone: data.phone,
        ordersCount: data.count,
        totalSpent: data.spent,
        lastOrderDate: data.lastDate
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    // New vs Returning Customer count
    let newCustomers = 0;
    let returningCustomers = 0;
    customerMap.forEach(v => {
      if (v.count === 1) newCustomers++;
      else returningCustomers++;
    });

    const repeatPurchaseRate = customerMap.size > 0 ? ((returningCustomers / customerMap.size) * 100) : 0;

    return {
      topCustomers: list.slice(0, 5),
      newCustomers,
      returningCustomers,
      repeatPurchaseRate
    };
  }, [filteredData]);

  // Best Selling Products
  const bestSellers = useMemo(() => {
    const productMap = new Map<string, { qty: number; revenue: number; category: string }>();

    filteredData.forEach(record => {
      // Include products from delivered or processing orders
      if (record.orderStatus !== 'cancelled') {
        record.items.forEach((item: any) => {
          const key = item.productName;
          const existing = productMap.get(key) || { qty: 0, revenue: 0, category: item.categoryName };
          existing.qty += item.quantity;
          existing.revenue += (item.price * item.quantity);
          productMap.set(key, existing);
        });
      }
    });

    return Array.from(productMap.entries()).map(([name, data]) => {
      // Find a matching product image
      const matchedProd = products.find(p => p.name === name);
      return {
        name,
        category: data.category,
        quantitySold: data.qty,
        revenue: data.revenue,
        image: matchedProd?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=120'
      };
    }).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);
  }, [filteredData, products]);

  // Courierwise Reports
  const courierReports = useMemo(() => {
    const courierMap: Record<string, { orders: number; delivered: number; returned: number; revenue: number }> = {
      'Steadfast': { orders: 0, delivered: 0, returned: 0, revenue: 0 },
      'Pathao': { orders: 0, delivered: 0, returned: 0, revenue: 0 },
      'RedX': { orders: 0, delivered: 0, returned: 0, revenue: 0 },
      'Sundarban': { orders: 0, delivered: 0, returned: 0, revenue: 0 },
      'Others': { orders: 0, delivered: 0, returned: 0, revenue: 0 }
    };

    filteredData.forEach(record => {
      let courierName = record.courier || 'Others';
      if (!courierMap[courierName]) {
        courierName = 'Others';
      }

      const stats = courierMap[courierName];
      stats.orders++;
      if (record.orderStatus === 'delivered') {
        stats.delivered++;
        stats.revenue += record.totalAmount;
      } else if (record.orderStatus === 'cancelled') {
        stats.returned++;
      }
    });

    return Object.entries(courierMap).map(([name, data]) => ({
      name,
      ...data
    }));
  }, [filteredData]);

  // Payment Method Distribution
  const paymentReports = useMemo(() => {
    const paymentMap: Record<string, { count: number; amount: number }> = {
      'Cash on Delivery': { count: 0, amount: 0 },
      'bKash': { count: 0, amount: 0 },
      'Nagad': { count: 0, amount: 0 },
      'Rocket': { count: 0, amount: 0 },
      'Bank Transfer': { count: 0, amount: 0 }
    };

    let grandTotalAmount = 0;

    filteredData.forEach(record => {
      let method = 'Cash on Delivery';
      const mLower = record.paymentMethod.toLowerCase();
      if (mLower.includes('bkash')) method = 'bKash';
      else if (mLower.includes('nagad')) method = 'Nagad';
      else if (mLower.includes('rocket')) method = 'Rocket';
      else if (mLower.includes('bank') || mLower.includes('transfer')) method = 'Bank Transfer';

      const stats = paymentMap[method];
      stats.count++;
      stats.amount += record.totalAmount;
      grandTotalAmount += record.totalAmount;
    });

    return Object.entries(paymentMap).map(([name, data]) => ({
      name,
      ...data,
      percentage: grandTotalAmount > 0 ? ((data.amount / grandTotalAmount) * 100).toFixed(1) : '0.0'
    }));
  }, [filteredData]);

  // Timeseries Sales Reports
  const timeSeriesData = useMemo(() => {
    const salesGroup: Record<string, { dateStr: string; amount: number; count: number }> = {};
    
    // Sort chronologically for charts
    const sortedChronological = [...filteredData].sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime());

    sortedChronological.forEach(record => {
      // Group by date formatted as YYYY-MM-DD
      const dateStr = record.orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!salesGroup[dateStr]) {
        salesGroup[dateStr] = { dateStr, amount: 0, count: 0 };
      }
      salesGroup[dateStr].amount += record.totalAmount;
      salesGroup[dateStr].count++;
    });

    return Object.values(salesGroup);
  }, [filteredData]);

  // Top Categories Distribution
  const categoryChartData = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredData.forEach(record => {
      if (record.orderStatus !== 'cancelled') {
        record.items.forEach((item: any) => {
          const cat = item.categoryName || 'Other';
          catMap[cat] = (catMap[cat] || 0) + (item.price * item.quantity);
        });
      }
    });

    return Object.entries(catMap).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [filteredData]);

  // Top Products Distribution Chart
  const productChartData = useMemo(() => {
    const prodMap: Record<string, number> = {};
    filteredData.forEach(record => {
      if (record.orderStatus !== 'cancelled') {
        record.items.forEach((item: any) => {
          prodMap[item.productName] = (prodMap[item.productName] || 0) + item.quantity;
        });
      }
    });

    return Object.entries(prodMap).map(([name, value]) => ({
      name: name.length > 15 ? `${name.slice(0, 15)}...` : name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filteredData]);

  // Order status distribution
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    filteredData.forEach(record => {
      if (counts[record.orderStatus] !== undefined) {
        counts[record.orderStatus]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));
  }, [filteredData]);

  // List of unique product names for selection dropdown
  const uniqueProductsList = useMemo(() => {
    const set = new Set<string>();
    reportsData.forEach(record => {
      record.items.forEach((item: any) => {
        if (item.productName) set.add(item.productName);
      });
    });
    return Array.from(set).sort();
  }, [reportsData]);

  // Sorted and Paginated Record selector
  const sortedRecords = useMemo(() => {
    const list = [...filteredData];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nested structures
      if (sortField === 'orderDate') {
        valA = a.orderDate.getTime();
        valB = b.orderDate.getTime();
      }

      if (valA === undefined || valA === null) return sortDirection === 'asc' ? -1 : 1;
      if (valB === undefined || valB === null) return sortDirection === 'asc' ? 1 : -1;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? (valA - valB) : (valB - valA);
    });
    return list;
  }, [filteredData, sortField, sortDirection]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage) || 1;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    if (!canExport) {
      alert('Access Denied (403 Forbidden): You do not have sales.export permission.');
      return;
    }

    const headers = [
      'Order ID',
      'Customer Name',
      'Phone',
      'Order Status',
      'Payment Method',
      'Payment Status',
      'Courier',
      'Items Count',
      'Total Amount (BDT)',
      'Profit (BDT)',
      'Order Date',
      'Delivered Date'
    ];

    const rows = filteredData.map(r => [
      r.orderId,
      `"${r.customerName.replace(/"/g, '""')}"`,
      r.phoneNumber,
      r.orderStatus.toUpperCase(),
      r.paymentMethod,
      r.paymentStatus,
      r.courier,
      r.itemsCount,
      r.totalAmount,
      r.profit.toFixed(2),
      r.orderDate.toLocaleDateString(),
      r.deliveredDate ? r.deliveredDate.toLocaleDateString() : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!canExport) {
      alert('Access Denied (403 Forbidden): You do not have sales.export permission.');
      return;
    }

    // Export styled XML table for modern Microsoft Excel opening
    let xml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /><style>table { border-collapse: collapse; } td, th { border: 1px solid #ddd; padding: 8px; font-family: sans-serif; }</style></head>
      <body>
      <h2>Ahoroon Sales Report - generated ${new Date().toLocaleDateString()}</h2>
      <table>
        <tr style="background-color: #059669; color: white; font-weight: bold;">
          <th>Order ID</th>
          <th>Customer Name</th>
          <th>Phone Number</th>
          <th>Payment Method</th>
          <th>Courier</th>
          <th>Status</th>
          <th>Payment Status</th>
          <th>Items Count</th>
          <th>Discount</th>
          <th>Delivery Charge</th>
          <th>Total Amount</th>
          <th>Net Profit</th>
          <th>Order Date</th>
        </tr>
    `;

    filteredData.forEach(r => {
      xml += `
        <tr>
          <td>${r.orderId}</td>
          <td>${r.customerName}</td>
          <td>'${r.phoneNumber}</td>
          <td>${r.paymentMethod}</td>
          <td>${r.courier}</td>
          <td>${r.orderStatus.toUpperCase()}</td>
          <td>${r.paymentStatus}</td>
          <td>${r.itemsCount}</td>
          <td>${r.discount}</td>
          <td>${r.deliveryCharge}</td>
          <td>${r.totalAmount}</td>
          <td>${r.profit.toFixed(2)}</td>
          <td>${r.orderDate.toLocaleDateString()}</td>
        </tr>
      `;
    });

    xml += `</table></body></html>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Color constants for Recharts Pie
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!canView) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center bg-white text-center rounded-[2.5rem] border border-red-100 shadow-md min-h-[500px]">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-2xl font-black text-slate-800">403 Forbidden: Access Denied</h3>
        <p className="text-slate-500 mt-2 max-w-md font-semibold">আপনার এই সেলস রিপোর্ট মডিউলটি দেখার অনুমতি নেই। অনুগ্রহ করে অ্যাকাউন্ট অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Printable Report Header Block (Hidden on Screen) */}
      <div className="hidden print:block space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-center text-emerald-800">আহরোণ (Ahoroon) - Sales Report</h1>
        <p className="text-center text-sm text-gray-500 font-mono">Date Generated: {new Date().toLocaleString()}</p>
        <p className="text-center text-xs text-gray-400 font-medium">Applied Filters: {dateFilter.toUpperCase()} | Search: {searchQuery || 'None'}</p>
        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-b border-gray-100 py-4 font-mono">
          <div><strong>Total Orders:</strong> {metrics.totalOrdersCount}</div>
          <div><strong>Total Revenue:</strong> ৳{metrics.totalRevenue}</div>
          <div><strong>Total Delivered:</strong> {metrics.totalDelivered}</div>
          <div><strong>Net Profit:</strong> ৳{metrics.totalProfit.toFixed(2)}</div>
        </div>
      </div>

      {/* Screen Interactive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-[#005900] flex items-center gap-2">
            <TrendingUp size={28} className="text-[#005900]" /> Enterprise Sales Reports
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">A real-time comprehensive view of orders, manual sales, profit margins, and customer retention metrics.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-white border border-gray-150 hover:bg-surface text-gray-700 hover:text-emerald-700 transition-all rounded-xl shadow-xs"
            title="Refresh database records"
          >
            <RefreshCw size={18} className={cn(isRefreshing && "animate-spin")} />
          </button>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white hover:bg-surface text-gray-700 border border-gray-150 px-4 py-2.5 rounded-xl transition-all font-bold text-xs sm:text-sm shadow-xs"
          >
            <Printer size={16} /> Print Report
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white hover:bg-surface text-gray-700 border border-gray-150 px-4 py-2.5 rounded-xl transition-all font-bold text-xs sm:text-sm shadow-xs"
          >
            <Download size={16} /> Export CSV
          </button>

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-100 px-4 py-2.5 rounded-xl transition-all font-bold text-xs sm:text-sm shadow-xs animate-pulse"
          >
            <FileSpreadsheet size={16} /> Excel Sheet
          </button>

          {onAddManualSale && (
            <button 
              onClick={onAddManualSale}
              className="flex items-center gap-2 bg-primary hover:bg-[#005900]/90 text-white px-4 py-2.5 rounded-xl transition-all font-bold text-xs sm:text-sm shadow-md shadow-primary/10"
            >
              <ShoppingCart size={16} /> Add New Sale
            </button>
          )}
        </div>
      </div>

      {/* Primary Sticky Filtering Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-xs print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {(['today', 'yesterday', '7days', '30days', 'thismonth', 'lastmonth', 'thisyear', 'custom'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => setDateFilter(preset)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black transition-all capitalize",
                  dateFilter === preset 
                    ? "bg-white text-[#005900] shadow-xs" 
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {preset === '7days' ? 'Last 7 Days' : preset === '30days' ? 'Last 30 Days' : preset.replace('this', 'This ').replace('last', 'Last ')}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-black bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-100/50 transition-all self-start sm:self-center"
          >
            <SlidersHorizontal size={14} /> 
            {showAdvanced ? 'Hide Advanced Filters' : 'Advanced Filters'}
          </button>
        </div>

        {/* Custom Date Picker Inputs when Custom is selected */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/60 animate-fade-in">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
              <input 
                type="date"
                className="w-full bg-white p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#005900]/20 transition-all font-semibold text-sm text-gray-700"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End Date</label>
              <input 
                type="date"
                className="w-full bg-white p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#005900]/20 transition-all font-semibold text-sm text-gray-700"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Advanced filters drawer container */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-50 animate-slide-down">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Status</label>
              <select 
                value={filterOrderStatus}
                onChange={e => setFilterOrderStatus(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#005900]/20 transition-all text-xs font-bold text-gray-600 appearance-none"
              >
                <option value="all">All Statuses (সকল স্ট্যাটাস)</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Status</label>
              <select 
                value={filterPaymentStatus}
                onChange={e => setFilterPaymentStatus(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#005900]/20 transition-all text-xs font-bold text-gray-600 appearance-none"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid (পরিশোধিত)</option>
                <option value="pending">Pending (বকেয়া)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Method</label>
              <select 
                value={filterPaymentMethod}
                onChange={e => setFilterPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#005900]/20 transition-all text-xs font-bold text-gray-600 appearance-none"
              >
                <option value="all">All Payment Methods</option>
                <option value="cod">Cash on Delivery (COD)</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Courier Partner</label>
              <select 
                value={filterCourier}
                onChange={e => setFilterCourier(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#005900]/20 transition-all text-xs font-bold text-gray-600 appearance-none"
              >
                <option value="all">All Couriers (সকল কুরিয়ার)</option>
                <option value="steadfast">Steadfast</option>
                <option value="pathao">Pathao</option>
                <option value="redx">RedX</option>
                <option value="sundarban">Sundarban</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specific Product</label>
              <select 
                value={filterProduct}
                onChange={e => setFilterProduct(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#005900]/20 transition-all text-xs font-bold text-gray-600 appearance-none"
              >
                <option value="all">All Products (সকল পণ্য)</option>
                {uniqueProductsList.map(prod => (
                  <option key={prod} value={prod}>{prod}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specific Category</label>
              <select 
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#005900]/20 transition-all text-xs font-bold text-gray-600 appearance-none"
              >
                <option value="all">All Categories (সকল ক্যাটাগরি)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Enterprise Analytics Dashboard Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Total Sales (Delivered Sales) Card */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-emerald-100 shadow-xs flex flex-col justify-between hover:scale-102 transition-all relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-emerald-800 uppercase tracking-wider">Total Sales (Delivered)</span>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-xs">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-3xl font-display font-black text-accent-deep">৳{metrics.totalSales.toLocaleString()}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-semibold flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" /> Based on {metrics.totalDelivered} delivered parcels
            </p>
          </div>
        </div>

        {/* Total Orders (Accumulated) Card */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between hover:scale-102 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-gray-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-xs">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-3xl font-display font-black text-slate-800">{metrics.totalOrdersCount}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-semibold">
              Combining online checkouts and custom invoices
            </p>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between hover:scale-102 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-gray-500 uppercase tracking-wider">Total Revenue</span>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-xs">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-3xl font-display font-black text-slate-800">৳{metrics.totalRevenue.toLocaleString()}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-semibold">
              Gross processed amount
            </p>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between hover:scale-102 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-gray-500 uppercase tracking-wider">Delivered Orders</span>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-xs">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-3xl font-display font-black text-emerald-600">{metrics.totalDelivered}</h3>
            <p className="text-[10px] sm:text-xs text-emerald-500/80 mt-1 font-black">
              {metrics.totalOrdersCount > 0 ? ((metrics.totalDelivered / metrics.totalOrdersCount) * 100).toFixed(0) : 0}% delivery success rate
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between hover:scale-102 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-gray-500 uppercase tracking-wider">Pending Orders</span>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-xs">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-3xl font-display font-black text-amber-600">{metrics.totalPending}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-semibold">
              Awaiting packaging or dispatch
            </p>
          </div>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between hover:scale-102 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-gray-500 uppercase tracking-wider">Cancelled Orders</span>
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-xs">
              <XCircle size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-3xl font-display font-black text-rose-500">{metrics.totalCancelled}</h3>
            <p className="text-[10px] sm:text-xs text-rose-500 mt-1 font-semibold">
              Unreachable or returned parcels
            </p>
          </div>
        </div>

        {/* COD Collection Card */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between hover:scale-102 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-gray-500 uppercase tracking-wider">COD Collection</span>
            <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center shadow-xs">
              <Truck size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-3xl font-display font-black text-slate-700">৳{metrics.totalCODCollection.toLocaleString()}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-semibold">
              Cash on delivery pipeline
            </p>
          </div>
        </div>

        {/* Online Payments Card */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between hover:scale-102 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-gray-500 uppercase tracking-wider">Online Payments</span>
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shadow-xs">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-3xl font-display font-black text-sky-600">৳{metrics.totalOnlinePayments.toLocaleString()}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-semibold">
              Processed through mobile banking or card
            </p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between hover:scale-102 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-gray-500 uppercase tracking-wider">Avg Order Value (AOV)</span>
            <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shadow-xs">
              <Percent size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-3xl font-display font-black text-slate-800">৳{metrics.averageOrderValue.toFixed(0)}</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-semibold">
              Average spent per single checkout transaction
            </p>
          </div>
        </div>

      </div>

      {/* Sales Analytics Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        
        {/* Line Chart: Revenue & Sales Trend */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Revenue Trend (তারিখ ভিত্তিক আয়)</h3>
            <span className="text-xs font-bold text-gray-400">Total amount over time</span>
          </div>
          <div className="h-72">
            {timeSeriesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No transaction records found in chosen range.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (৳)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart: Daily Sales Counts */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Orders Trend (অর্ডার সংখ্যা)</h3>
            <span className="text-xs font-bold text-gray-400">Volume of checkouts</span>
          </div>
          <div className="h-72">
            {timeSeriesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No transactions found in chosen range.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Payment Method Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Payment Methods</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentReports.filter(d => d.amount > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {paymentReports.filter(d => d.amount > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `৳${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2">
              {paymentReports.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs font-bold text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span>{entry.name}</span>
                  </div>
                  <span>৳{entry.amount.toLocaleString()} ({entry.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie Chart: Order Status Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Order Status Distribution</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-status-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} Orders`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-2">
              {statusChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs font-bold text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(index + 1) % COLORS.length] }} />
                    <span>{entry.name}</span>
                  </div>
                  <span>{entry.value} orders</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Multi-Section Reports Row: Courier, Payment, Profit, Return & Customer Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Courier Performance & Courierwise Reports */}
        <div className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <h3 className="font-display font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
              <Truck size={18} className="text-primary" /> Courier Distribution (কুরিয়ার রিপোর্ট)
            </h3>
            <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-full border border-slate-100">Performance</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-gray-600">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-3">Courier Name</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Delivered</th>
                  <th className="p-3">Returned</th>
                  <th className="p-3">Collected Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {courierReports.map(c => (
                  <tr key={c.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{c.name}</td>
                    <td className="p-3 font-mono">{c.orders}</td>
                    <td className="p-3 font-mono text-emerald-600">{c.delivered}</td>
                    <td className="p-3 font-mono text-rose-500">{c.returned}</td>
                    <td className="p-3 font-bold text-slate-800">৳{c.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Profits & Cost Price Reports */}
        <div className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-gray-100 shadow-xs space-y-4 bg-gradient-to-br from-white to-emerald-50/5">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <h3 className="font-display font-black text-emerald-800 uppercase tracking-wider text-sm flex items-center gap-2">
              <TrendingUp size={18} className="text-[#005900]" /> Profit & Cost Margins (লাভ-ক্ষতি রিপোর্ট)
            </h3>
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full border border-emerald-100">Revenue stats</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50">
              <span className="text-[10px] font-black text-emerald-800 uppercase block tracking-wider">Total Net Profit</span>
              <span className="text-xl sm:text-2xl font-display font-black text-emerald-700 mt-1 block">৳{metrics.totalProfit.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 mt-1 block font-semibold">After product costs & carriage</span>
            </div>
            <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50">
              <span className="text-[10px] font-black text-emerald-800 uppercase block tracking-wider">Profit Margin %</span>
              <span className="text-xl sm:text-2xl font-display font-black text-emerald-700 mt-1 block">{metrics.profitMargin.toFixed(1)}%</span>
              <span className="text-[10px] text-gray-400 mt-1 block font-semibold">Average operational margin</span>
            </div>
          </div>

          {/* Top category margin indicators */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Revenue Share By Category</h4>
            <div className="space-y-2">
              {categoryChartData.map((c, i) => {
                const pct = metrics.totalRevenue > 0 ? ((c.value / metrics.totalRevenue) * 100) : 0;
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-600">
                      <span>{c.name}</span>
                      <span>৳{c.value.toLocaleString()} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#005900] rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {categoryChartData.length === 0 && (
                <div className="text-xs text-gray-400 font-semibold italic text-center py-2">No category sharing metrics available.</div>
              )}
            </div>
          </div>
        </div>

        {/* Return, Restocking & Refund Reports */}
        <div className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <h3 className="font-display font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
              <RefreshCw size={18} className="text-rose-500" /> Returns & Refunds (ফেরত ও রিফান্ড রিপোর্ট)
            </h3>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-500 px-2 py-1 rounded-full border border-rose-100">Risk Assessment</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Returned</span>
              <span className="text-lg sm:text-xl font-display font-black text-rose-600 mt-1 block">{metrics.totalCancelled}</span>
              <span className="text-[9px] text-gray-400 font-medium block">Parcels returned</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Est. Refund</span>
              <span className="text-lg sm:text-xl font-display font-black text-slate-700 mt-1 block">৳{metrics.refundAmount.toFixed(0)}</span>
              <span className="text-[9px] text-gray-400 font-medium block">Refund amount (15%)</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Return Rate</span>
              <span className="text-lg sm:text-xl font-display font-black text-rose-500 mt-1 block">{metrics.returnPercentage.toFixed(1)}%</span>
              <span className="text-[9px] text-gray-400 font-medium block">Of total checkouts</span>
            </div>
          </div>
        </div>

        {/* Customer Insights & Loyalty Counter */}
        <div className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <h3 className="font-display font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
              <HeartHandshake size={18} className="text-purple-500" /> Customer Insights (গ্রাহক বিশ্বস্ততা)
            </h3>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-full border border-purple-100">Retention</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New Customers</span>
              <span className="text-lg sm:text-xl font-display font-black text-slate-800 mt-1 block">{customerAnalytics.newCustomers}</span>
              <span className="text-[9px] text-gray-400 font-medium block">Single purchasers</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Returning</span>
              <span className="text-lg sm:text-xl font-display font-black text-purple-600 mt-1 block">{customerAnalytics.returningCustomers}</span>
              <span className="text-[9px] text-gray-400 font-medium block">Repeat order clients</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Repeat Purchase</span>
              <span className="text-lg sm:text-xl font-display font-black text-purple-600 mt-1 block">{customerAnalytics.repeatPurchaseRate.toFixed(1)}%</span>
              <span className="text-[9px] text-gray-400 font-medium block">Repeat buying rate</span>
            </div>
          </div>
        </div>

      </div>

      {/* Top Best-Selling Products Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Products Table */}
        <div className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <h3 className="font-display font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-600" /> Best Selling Products (সর্বোচ্চ বিক্রিত পণ্য)
            </h3>
            <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-full border border-slate-100">Sales Rank</span>
          </div>

          <div className="space-y-4">
            {bestSellers.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-400 w-5">#{idx + 1}</span>
                  <img src={item.image} className="w-11 h-11 rounded-xl object-cover border border-gray-150" alt={item.name} referrerPolicy="no-referrer" />
                  <div className="space-y-0.5">
                    <span className="text-sm font-black text-slate-800 block line-clamp-1">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">{item.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-slate-700 block">{item.quantitySold} sold</span>
                  <span className="text-xs font-bold text-emerald-600 block">৳{item.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {bestSellers.length === 0 && (
              <div className="text-center py-6 text-gray-400 font-semibold italic text-sm">No sales entries available.</div>
            )}
          </div>
        </div>

        {/* Top Customers Loyalty List */}
        <div className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <h3 className="font-display font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
              <UsersIcon size={18} className="text-purple-500" /> Top Customers List (প্রধান ক্রেতাগণ)
            </h3>
            <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-full border border-slate-100">Value Share</span>
          </div>

          <div className="space-y-4">
            {customerAnalytics.topCustomers.map((c, idx) => (
              <div key={`${c.name}-${c.phone}`} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-purple-400 w-5">#{idx + 1}</span>
                  <div className="space-y-0.5">
                    <span className="text-sm font-black text-slate-800 block">{c.name}</span>
                    <span className="text-[10px] text-gray-400 font-semibold block">{c.phone}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-purple-600 block">{c.ordersCount} orders</span>
                  <span className="text-xs font-black text-[#005900] block">৳{c.totalSpent.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {customerAnalytics.topCustomers.length === 0 && (
              <div className="text-center py-6 text-gray-400 font-semibold italic text-sm">No customer ledger records.</div>
            )}
          </div>
        </div>

      </div>

      {/* Primary Detailed Sales Ledger Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-150 shadow-xs overflow-hidden">
        
        {/* Table Top Header Action Panel */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h3 className="text-lg font-display font-black text-[#005900]">Sales Ledger</h3>
            <p className="text-gray-400 text-xs mt-1">Found {filteredData.length} total entries matching conditions</p>
          </div>

          {/* Table Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search Customer, ID or Phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 pl-11 pr-4 py-3 rounded-2xl border border-slate-100 text-xs font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-[#005900]/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-gray-600">
            <thead className="bg-slate-50 border-b border-gray-100 select-none">
              <tr>
                <th onClick={() => handleSort('orderId')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">ID / Invoice <ArrowUpDown size={12} /></div>
                </th>
                <th onClick={() => handleSort('customerName')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">Customer <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-4 uppercase tracking-wider text-gray-500">Items / Payment</th>
                <th className="p-4 uppercase tracking-wider text-gray-500">Courier</th>
                <th onClick={() => handleSort('orderStatus')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">Status <ArrowUpDown size={12} /></div>
                </th>
                <th onClick={() => handleSort('totalAmount')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">Total (৳) <ArrowUpDown size={12} /></div>
                </th>
                <th onClick={() => handleSort('profit')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">Profit (৳) <ArrowUpDown size={12} /></div>
                </th>
                <th onClick={() => handleSort('orderDate')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">Date <ArrowUpDown size={12} /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRecords.map((r, idx) => (
                <tr key={`${r.id}-${idx}`} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-4 font-mono font-black text-primary">{r.orderId}</td>
                  <td className="p-4">
                    <div className="font-black text-slate-800 text-sm">{r.customerName}</div>
                    <div className="text-[10px] text-gray-400 font-semibold">{r.phoneNumber}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-700 font-bold">{r.itemsCount} items</div>
                    <div className="text-[10px] text-gray-400 font-black flex items-center gap-1 uppercase">
                      {r.paymentMethod}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-500">{r.courier}</td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      r.orderStatus === 'delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      r.orderStatus === 'cancelled' ? "bg-rose-50 text-rose-500 border-rose-100" :
                      r.orderStatus === 'processing' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-slate-50 text-slate-500 border-slate-150"
                    )}>
                      {r.orderStatus}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-black text-slate-800 text-sm">৳{r.totalAmount.toFixed(0)}</td>
                  <td className="p-4 font-mono font-black text-emerald-600 text-sm">৳{r.profit.toFixed(0)}</td>
                  <td className="p-4 text-gray-400 font-semibold">
                    {r.orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}

              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 font-black italic text-sm">
                    No matching sales ledger entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Pagination Bar */}
        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden select-none bg-slate-50/50">
          <div className="text-gray-400 text-xs font-semibold">
            Showing Page <strong className="text-gray-700">{currentPage}</strong> of <strong className="text-gray-700">{totalPages}</strong> ({filteredData.length} records)
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isEdge = pageNum === 1 || pageNum === totalPages;
              const isNear = Math.abs(pageNum - currentPage) <= 1;

              if (!isEdge && !isNear) {
                if (pageNum === 2 || pageNum === totalPages - 1) {
                  return <span key={`dots-${pageNum}`} className="px-2 text-gray-300">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={`page-btn-${pageNum}`}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-xs font-black transition-all border shadow-xs cursor-pointer",
                    currentPage === pageNum 
                      ? "bg-primary text-white border-primary" 
                      : "bg-white text-gray-600 border-gray-200 hover:bg-slate-50"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
