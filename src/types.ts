export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  description: string;
  isFlashSale?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  discount?: number;
  images: string[];
  unit?: string;
  size?: number;
  sizes?: string[];
  colors?: string[];
  brand?: string;
  moq?: number;
  step?: number;
  origin?: string;
  labTestUrl?: string;
  harvestDate?: string;
  isVerified?: boolean;
  stock?: number;
  costPrice?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
  slug?: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface InvoiceDeliveryInfo {
  companyEmailStatus: 'sent' | 'failed' | 'pending' | 'simulated';
  customerEmailStatus: 'sent' | 'failed' | 'not_required' | 'pending' | 'simulated';
  companySentAt?: string | null;
  customerSentAt?: string | null;
  lastAttemptAt?: string;
  lastError?: string | null;
  invoiceNo?: string;
}

export interface Order {
  id?: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  deliveryCharge?: number;
  discount?: number;
  coupon?: string;
  customer?: {
    name: string;
    phone: string;
    address: string;
    email?: string;
  };
  customerName?: string;
  phoneNumber?: string;
  address?: string;
  paymentMethod?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;
  trackingCode?: string;
  courier?: string;
  consignmentId?: string;
  trackingUrl?: string;
  invoiceDelivery?: InvoiceDeliveryInfo;
  adminEmailSent?: boolean;
  createdAt: any;
}

export interface AppUser {
  id: string;
  name?: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: string[];
  createdAt?: any;
}

export interface ManualInvoice {
  id: string;
  invoiceNo: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: {
    name: string;
    price: number;
    quantity: number;
    unit: string;
  }[];
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: any;
}

export interface SliderImage {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  link: string;
  order: number;
}

export interface Producer {
  id: string;
  name: string;
  role: string;
  img: string;
  story: string;
  order: number;
}

export interface PressCoverage {
  id: string;
  source: string;
  title: string;
  excerpt: string;
  img: string;
  link: string;
  date: string;
  order: number;
}

export interface SiteSetting {
  id: string;
  logoUrl: string;
}


