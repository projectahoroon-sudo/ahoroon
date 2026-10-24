import { Category, Product, SliderImage, Producer, PressCoverage } from './types';

export const STATIC_SLIDERS: SliderImage[] = [
  {
    id: 'slider-1',
    title: 'মাটির সোঁদা গন্ধে, মমতার স্পর্শে',
    description: 'গ্রামের কৃষকের ঘাম আর কারিগরের মমতা মাখা খাঁটি পণ্য এখন সরাসরি আপনার দোরগোড়ায়।',
    imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=1600&q=80',
    link: '/category/all',
    order: 1
  },
  {
    id: 'slider-2',
    title: 'ঐতিহ্যবাহী খাঁটি মশলা',
    description: 'বিখ্যাত চট্টগ্রামের মেজবানি রান্নার আসল স্বাদ পেতে আমাদের স্পেশাল গোপন মশলা।',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&q=80',
    link: '/category/spices',
    order: 2
  },
  {
    id: 'slider-3',
    title: 'সুন্দরবনের খাঁটি মধু',
    description: 'রাঙ্গামাটির গভীর জঙ্গল ও সুন্দরবন থেকে সংগৃহীত খাঁটি মধু, শতভাগ কৃত্রিম উপাদানমুক্ত।',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1600&q=80',
    link: '/category/honey',
    order: 3
  },
  {
    id: 'slider-4',
    title: 'উপকূলের তাজা শুঁটকি',
    description: 'প্রাকৃতিকভাবে শুকানো, কোনো রাসায়নিক ছাড়া তৈরি আসল স্বাদের লইট্টা ও ছুরি শুঁটকি।',
    imageUrl: 'https://images.unsplash.com/photo-1626132646529-5003375a954e?w=1600&q=80',
    link: '/category/dry-fish',
    order: 4
  },
  {
    id: 'slider-5',
    title: 'জৈব ও প্রাকৃতিক চাষাবাদ',
    description: 'আমাদের সকল পণ্য সম্পূর্ণ প্রাকৃতিক উপায়ে উৎপাদিত ও পরম যত্নে সংগৃহীত।',
    imageUrl: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=1600&q=80',
    link: '/category/organic',
    order: 5
  },
  {
    id: 'slider-6',
    title: 'পাবনার গাওয়া ঘি ও দুগ্ধজাত পণ্য',
    description: 'ঐতিহ্যবাহী পদ্ধতিতে তৈরি খাঁটি ঘি আপনার খাবারে যোগ করবে অতুলনীয় আভিজাত্য।',
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=1600&q=80',
    link: '/category/ghee',
    order: 6
  },
  {
    id: 'slider-7',
    title: 'মানিকগঞ্জের ঘানি-ভাঙা সরিষার তেল',
    description: 'নিজে ঘানি টেনে বের করা খাঁটি তেলের তীব্র ঝাঁঝ ও মনমাতানো সুবাস।',
    imageUrl: 'https://images.unsplash.com/photo-1511208687438-2c5a5abb810c?w=1600&q=80',
    link: '/category/spices',
    order: 7
  },
  {
    id: 'slider-8',
    title: 'বাংলার কারিগরদের ঐতিহ্যবাহী মৃৎশিল্প',
    description: 'মমতা ও ঐতিহ্যের ছোঁয়ায় তৈরি খাঁটি দেশীয় মাটির বাসন-কোসন ও সাজসজ্জা।',
    imageUrl: 'https://images.unsplash.com/photo-1608697138356-dfc0032cc629?w=1600&q=80',
    link: '/category/crafts',
    order: 8
  }
];

export const CATEGORIES: Category[] = [
  { id: 'নিরাপদ-প্রাকৃতিক-সার', name: 'নিরাপদ প্রাকৃতিক সার', icon: 'Leaf', image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=300&q=80', slug: 'organic-fertilizer' },
  { id: 'নিরাপদ-আবাদের-চাল', name: 'নিরাপদ আবাদের চাল', icon: 'Wheat', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80', slug: 'organic-rice' },
  { id: 'নিরাপদ-আবাদের-দেশি-ডাল-ও-বিচি', name: 'নিরাপদ আবাদের দেশি ডাল ও বিচি', icon: 'Beans', image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=300&q=80', slug: 'pulses-and-seeds' },
  { id: 'নিরাপদ-আবাদের-দেশি-মশলা', name: 'নিরাপদ আবাদের দেশি মশলা', icon: 'Flame', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80', slug: 'organic-spices' },
  { id: 'নিরাপদ-ভোজ্য-তেল', name: 'নিরাপদ ভোজ্য তেল', icon: 'Droplets', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80', slug: 'edible-oils' },
  { id: 'নিরাপদ-আবাদের-পাহাড়ি-ফল-এবং-সবজী', name: 'নিরাপদ আবাদের পাহাড়ি ফল এবং সবজী', icon: 'Apple', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80', slug: 'fruits-and-vegetables' },
  { id: 'ময়দা-ও-ছাতু-আইটেম', name: 'ময়দা ও ছাতু আইটেম', icon: 'Wheat', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80', slug: 'flour-and-grains' },
  { id: 'দুগ্ধজাত-পন্য', name: 'দুগ্ধজাত পন্য', icon: 'Milk', image: 'https://images.unsplash.com/photo-1528750997573-59b89d66f4f7?w=300&q=80', slug: 'dairy-products' },
  { id: 'প্রাকৃতিক-মিষ্টি', name: 'প্রাকৃতিক মিষ্টি', icon: 'Candy', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&q=80', slug: 'natural-sweeteners' },
  { id: 'প্রাকৃতিক-নির্যাস', name: 'প্রাকৃতিক নির্যাস', icon: 'Droplet', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&q=80', slug: 'natural-extracts' },
  { id: 'আদরের-শিশুদের-খাদ্য', name: 'আদরের শিশুদের খাদ্য', icon: 'Baby', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80', slug: 'baby-food' },
  { id: 'প্রাকৃতিক-গুল্মলতার-পুনর্জীবনদায়ী-প্রাচীন-প্রতিকার', name: 'প্রাকৃতিক গুল্মলতার পুনর্জীবনদায়ী প্রাচীন প্রতিকার', icon: 'Leaf', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80', slug: 'herbal-remedies' },
  { id: 'নিরাপদ-ড্রাই-ফিশ', name: 'নিরাপদ ড্রাই ফিশ', icon: 'Fish', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80', slug: 'dry-fish' },
  { id: 'নিরাপদ-তরতাজা-আমিষ', name: 'নিরাপদ তরতাজা আমিষ', icon: 'Drumstick', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&q=80', slug: 'fresh-protein' },
  { id: 'অন্যান্য', name: 'অন্যান্য', icon: 'MoreHorizontal', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80', slug: 'others' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'সুন্দরবনের খাঁটি খলিশা ফুলের মধু (RAW Honey)',
    price: 850,
    rating: 4.9,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
    category: 'প্রাকৃতিক-মিষ্টি',
    description: 'সুন্দরবনের গভীর জঙ্গল থেকে সংগৃহীত ১০০% খাঁটি ও প্রক্রিয়াজাতহীন র মধু। এতে কোনো প্রকার কৃত্রিম চিনি বা কেমিক্যাল নেই।',
    isFlashSale: true,
    isFeatured: true,
    isPopular: true,
    discount: 10,
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80'],
    unit: 'কেজি',
    size: 1,
    sizes: ['৫০০ গ্রাম', '১ কেজি'],
    origin: 'সুন্দরবন, বাংলাদেশ',
    isVerified: true,
    stock: 50
  },
  {
    id: 'prod-2',
    name: 'কাঠের ঘানিতে ভাঙা খাঁটি সরিষার তেল',
    price: 360,
    rating: 4.8,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80',
    category: 'নিরাপদ-ভোজ্য-তেল',
    description: 'দেশি মাঘি সরিষা থেকে কাঠের ঘানিতে ঠাণ্ডা চাপে সংগৃহীত ঝাঁঝালো ও সুস্বাদু খাঁটি সরিষার তেল।',
    isFlashSale: true,
    isFeatured: true,
    isPopular: true,
    discount: 5,
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80'],
    unit: 'লিটার',
    size: 1,
    sizes: ['১ লিটার', '২ লিটার', '৫ লিটার'],
    origin: 'পাবনা, বাংলাদেশ',
    isVerified: true,
    stock: 80
  },
  {
    id: 'prod-3',
    name: 'পাবনার খাঁটি গাওয়া ঘি (Pure Cow Ghee)',
    price: 1450,
    rating: 5.0,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1628102491629-778571d893a3?w=800&q=80',
    category: 'দুগ্ধজাত-পন্য',
    description: 'দেশি গাভীর খাঁটি দুধের সর থেকে ঐতিহ্যবাহী পদ্ধতিতে তৈরি সুবাসিত ও সুস্বাদু গাওয়া ঘি।',
    isFlashSale: false,
    isFeatured: true,
    isPopular: true,
    discount: 0,
    images: ['https://images.unsplash.com/photo-1628102491629-778571d893a3?w=800&q=80'],
    unit: 'কেজি',
    size: 1,
    sizes: ['৫০০ গ্রাম', '১ কেজি'],
    origin: 'পাবনা, বাংলাদেশ',
    isVerified: true,
    stock: 40
  },
  {
    id: 'prod-4',
    name: 'অর্গানিক কাঁচা মরিচ ও হলুদ গুঁড়া (Organic Turmeric)',
    price: 240,
    rating: 4.7,
    reviews: 65,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
    category: 'নিরাপদ-আবাদের-দেশি-মশলা',
    description: 'পাহাড় ও চরাঞ্চলে কেমিক্যাল ছাড়া উৎপাদিত খাঁটি হলুদ শুকিয়ে ভাঙানো তাজা মশলা গুঁড়া।',
    isFlashSale: true,
    isFeatured: false,
    isPopular: true,
    discount: 8,
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'],
    unit: 'গ্রাম',
    size: 250,
    sizes: ['২৫০ গ্রাম', '৫০০ গ্রাম'],
    origin: 'খাগড়াছড়ি, বাংলাদেশ',
    isVerified: true,
    stock: 120
  },
  {
    id: 'prod-5',
    name: 'দিনাজপুরের সুগন্ধি কাটারিভোগ চাল (Katari Rice)',
    price: 110,
    rating: 4.9,
    reviews: 140,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
    category: 'নিরাপদ-আবাদের-চাল',
    description: 'দিনাজপুরের বিখ্যাত কাটারিভোগ চাল, কেমিক্যাল পলিশ ছাড়া প্রাকৃতিক উপায়ে প্রক্রিয়াজাত।',
    isFlashSale: false,
    isFeatured: true,
    isPopular: false,
    discount: 0,
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80'],
    unit: 'কেজি',
    size: 1,
    sizes: ['৫ কেজি', '১০ কেজি', '২৫ কেজি'],
    origin: 'দিনাজপুর, বাংলাদেশ',
    isVerified: true,
    stock: 200
  },
  {
    id: 'prod-6',
    name: 'অর্গানিক কোল্ড প্রেসড কালোজিরা তেল',
    price: 520,
    rating: 4.9,
    reviews: 88,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
    category: 'প্রাকৃতিক-নির্যাস',
    description: 'সর্বরোগের মহাঔষধ বিশুদ্ধ কালোজিরা কোল্ড প্রেস করে তৈরি অর্গানিক ঘন তেল।',
    isFlashSale: true,
    isFeatured: true,
    isPopular: true,
    discount: 12,
    images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80'],
    unit: 'মিলি',
    size: 250,
    sizes: ['১০০ মিলি', '২৫০ মিলি'],
    origin: 'নাটোর, বাংলাদেশ',
    isVerified: true,
    stock: 60
  }
];

export const PRODUCERS: Producer[] = [
  {
    id: 'prod-user-1',
    name: 'আব্দুল করিম',
    role: 'জৈব চাল ও সবজি চাষী',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    story: 'গত ১০ বছর ধরে কীটনাশকমুক্ত প্রাকৃতিক উপায়ে দিনাজপুর অঞ্চলে কাটারিভোগ চাল চাষ করছেন।',
    order: 1
  },
  {
    id: 'prod-user-2',
    name: 'মোছাঃ ছালেহা বেগম',
    role: 'প্রাকৃতিক খামারী ও ঘি প্রস্তুতকারক',
    img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    story: 'পাবনার চাটমোহরে দেশি গাভীর বিশুদ্ধ দুধ থেকে ঘরোয়া পদ্ধতিতে ঘি তৈরি করে সফল উদ্যোক্তা।',
    order: 2
  }
];

export const PRESS_COVERAGES: PressCoverage[] = [
  {
    id: 'press-1',
    source: 'দৈনিক প্রথম আলো',
    title: 'নিরাপদ খাদ্যের নতুন বিপ্লব: সরাসরি কৃষকের হাত থেকে আপনার রান্নাঘরে',
    excerpt: 'কীটনাশক মুক্ত অর্গানিক খাদ্যের চাহিদা পূরণে অনন্য উদ্যোগ নিয়েছে আহরণ অর্গানিক।',
    img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
    link: 'https://prothomalo.com',
    date: '২০২৪-০৫-১৫',
    order: 1
  }
];
