import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Tag, 
  Loader2,
  ArrowRight,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { adminService } from '../services/adminService';
import { cn } from '../lib/utils';
import { Category, Product } from '../types';

interface BatchUploadModalProps {
  onClose: () => void;
  onSave: () => void;
  categories: Category[];
}

interface ParsedRow {
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  unit: string;
  size: number;
  moq: number;
  stock: number;
  discount: number;
  costPrice: number;
  isPopular: boolean;
  isFeatured: boolean;
  isValid: boolean;
  errorMsg?: string;
}

export function BatchUploadModal({ onClose, onSave, categories }: BatchUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to match column headers smartly
  const findValue = (row: any, keys: string[], defaultValue: any) => {
    for (const key of keys) {
      // Direct match
      if (row[key] !== undefined && row[key] !== null) {
        return row[key];
      }
      // Case insensitive match & ignore spaces
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
      for (const rowKey of Object.keys(row)) {
        const normalizedRowKey = rowKey.toLowerCase().replace(/\s+/g, '');
        if (normalizedRowKey === normalizedKey || normalizedRowKey.includes(normalizedKey)) {
          return row[rowKey];
        }
      }
    }
    return defaultValue;
  };

  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    // Elegant sample data mirroring genuine products
    const sampleData = [
      {
        'Product Name (নাম)*': 'সুন্দরবনের প্রিমিয়াম খলিশা মধু',
        'Price (মূল্য)*': 1250,
        'Category ID (ক্যাটাগরি আইডি)*': 'honey',
        'Description (বিবরণ)': 'সুন্দরবনের গভীর জঙ্গল থেকে সংগৃহীত ১০০% খাঁটি খলিশা ফুলের মধু।',
        'Image URL (ছবির লিঙ্ক)': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800',
        'Unit (একক)': 'kg',
        'Size (সাইজ)': 1,
        'MOQ (সর্বনিম্ন ক্রয়ের পরিমাণ)': 1,
        'Stock (স্টক)': 150,
        'Discount Price (ছাড়)': 100,
        'Cost Price (কেনা দাম)': 900,
        'Is Popular (জনপ্রিয় - true/false)': 'true',
        'Is Featured (ফিচার্ড - true/false)': 'false'
      },
      {
        'Product Name (নাম)*': 'হাতে ভাজা লাল চালের মুড়ি',
        'Price (মূল্য)*': 140,
        'Category ID (ক্যাটাগরি আইডি)*': 'rice',
        'Description (বিবরণ)': 'সম্পূর্ণ রাসায়নিক মুক্ত ও কাঠের ঘানিতে তৈরি পদ্ধতিতে আতিথেয়তায় ভরপুর মুড়ি।',
        'Image URL (ছবির লিঙ্ক)': '',
        'Unit (একক)': 'packet',
        'Size (সাইজ)': 1,
        'MOQ (সর্বনিম্ন ক্রয়ের পরিমাণ)': 1,
        'Stock (স্টক)': 200,
        'Discount Price (ছাড়)': 0,
        'Cost Price (কেনা দাম)': 100,
        'Is Popular (জনপ্রিয় - true/false)': 'false',
        'Is Featured (ফিচার্ড - true/false)': 'true'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ahoroon Products");

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, "Ahoroon_Products_Template.xlsx");
    } else {
      XLSX.writeFile(workbook, "Ahoroon_Products_Template.csv", { bookType: 'csv' });
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setErrorMessage('');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          setErrorMessage('ফাইল থেকে ডাটা পড়া যায়নি।');
          return;
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (rawRows.length === 0) {
          setErrorMessage('ফাইলে কোনো পণ্য খুঁজে পাওয়া যায়নি।');
          return;
        }

        const processed: ParsedRow[] = rawRows.map((row, idx) => {
          const rawName = findValue(row, ['Product Name (নাম)*', 'Product Name', 'Name', 'নাম', 'name'], '');
          const rawPrice = findValue(row, ['Price (মূল্য)*', 'Price', 'price', 'মূল্য', 'Price (মূল্য)'], 0);
          const rawCategory = findValue(row, ['Category ID (ক্যাটাগরি আইডি)*', 'Category ID', 'category', 'ক্যাটাগরি', 'Category ID (ক্যাটাগরি আইডি)'], '');
          const description = findValue(row, ['Description (বিবরণ)', 'Description', 'description', 'বিবরণ'], '');
          const image = findValue(row, ['Image URL (ছবির লিঙ্ক)', 'Image URL', 'image', 'ছবি', 'Image URL (ছবির লিঙ্ক)'], '');
          const unit = findValue(row, ['Unit (একক)', 'Unit', 'unit', 'একক'], 'pcs');
          const size = Number(findValue(row, ['Size (সাইজ)', 'Size', 'size', 'সাইজ'], 1)) || 1;
          const moq = Number(findValue(row, ['MOQ (সর্বনিম্ন ক্রয়ের পরিমাণ)', 'MOQ', 'moq', 'সর্বনিম্ন অর্ডার'], 1)) || 1;
          const stock = Number(findValue(row, ['Stock (স্টক)', 'Stock', 'stock', 'স্টক'], 100));
          const discount = Number(findValue(row, ['Discount Price (ছাড়)', 'Discount', 'discount', 'ছাড়'], 0)) || 0;
          const costPrice = Number(findValue(row, ['Cost Price (কেনা দাম)', 'Cost Price', 'costPrice', 'কেনা দাম'], 0)) || 0;
          
          const popularRaw = findValue(row, ['Is Popular (জনপ্রিয় - true/false)', 'Is Popular', 'isPopular', 'জনপ্রিয়'], 'false');
          const isPopular = popularRaw === 'true' || popularRaw === true || popularRaw === 1 || popularRaw === '1';

          const featuredRaw = findValue(row, ['Is Featured (ফিচার্ড - true/false)', 'Is Featured', 'isFeatured', 'ফিচার্ড'], 'false');
          const isFeatured = featuredRaw === 'true' || featuredRaw === true || featuredRaw === 1 || featuredRaw === '1';

          // Validation
          let isValid = true;
          let errorMsg = '';

          if (!rawName) {
            isValid = false;
            errorMsg = 'পণ্যের নাম নেই';
          } else if (!rawPrice || isNaN(Number(rawPrice)) || Number(rawPrice) <= 0) {
            isValid = false;
            errorMsg = 'সঠিক মূল্য নেই';
          } else if (!rawCategory) {
            isValid = false;
            errorMsg = 'ক্যাটাগরি আইডি নেই';
          } else {
            const categoryExists = categories.some(c => c.id.toLowerCase() === String(rawCategory).toLowerCase().trim());
            if (!categoryExists) {
              isValid = false;
              errorMsg = `ভুল ক্যাটাগরি আইডি: "${rawCategory}"`;
            }
          }

          return {
            name: String(rawName).trim(),
            price: Number(rawPrice),
            category: String(rawCategory).trim().toLowerCase(),
            description: String(description).trim(),
            image: String(image).trim(),
            unit: String(unit).trim(),
            size,
            moq,
            stock: isNaN(stock) ? 100 : stock,
            discount,
            costPrice,
            isPopular,
            isFeatured,
            isValid,
            errorMsg
          };
        });

        setParsedProducts(processed);
      } catch (err) {
        console.error(err);
        setErrorMessage('ফাইলটি পার্স করতে সমস্যা হয়েছে। দয়া করে সঠিক ফাইল আপলোড করুন।');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    const validProducts = parsedProducts.filter(p => p.isValid);
    if (validProducts.length === 0) return;

    setIsUploading(true);
    setProgress({ current: 0, total: validProducts.length });

    try {
      for (let i = 0; i < validProducts.length; i++) {
        const item = validProducts[i];
        
        const payload = {
          name: item.name,
          price: item.price,
          rating: 5,
          reviews: 0,
          category: item.category,
          description: item.description || '',
          image: item.image || 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=600&q=80', // placeholder
          images: item.image ? [item.image] : [],
          isPopular: item.isPopular,
          isFeatured: item.isFeatured,
          discount: item.discount,
          unit: item.unit,
          size: item.size,
          moq: item.moq,
          step: 1,
          stock: item.stock,
          costPrice: item.costPrice,
          isFlashSale: false
        };

        await adminService.addProduct(payload);
        setProgress(prev => ({ ...prev, current: i + 1 }));
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert('পণ্য আপলোড করার সময় কিছু ভুল হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = parsedProducts.filter(p => p.isValid).length;
  const invalidCount = parsedProducts.length - validCount;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md shadow-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col relative border border-slate-100"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-display font-black text-slate-800 leading-snug">
                ব্যাচ প্রোডাক্ট আপলোড (Excel/CSV)
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                সহজে এবং দ্রুত একাধিক পণ্য একসাথে তালিকাভুক্ত করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-slate-800 hover:border-slate-200 rounded-full transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader2 className="text-emerald-600 animate-spin" size={60} strokeWidth={1.5} />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-800">ডাটাবেজে পণ্য সেভ হচ্ছে...</h3>
                <p className="text-slate-400 text-sm font-mono">
                  {progress.current} / {progress.total} টি পণ্য আপলোড সম্পন্ন
                </p>
              </div>
              <div className="w-full max-w-md bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Instructions & Template Downloads */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl space-y-4">
                  <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                    <Info size={16} />
                    <span>আপলোড করার নিয়মাবলী এবং নির্দেশনাবলী:</span>
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4 leading-relaxed">
                    <li>প্রথমে নিচের বাটন ক্লিক করে <strong className="text-emerald-700">Excel বা CSV রেডি টেমপ্লেট</strong> ডাউনলোড করুন।</li>
                    <li>ডাউনলোড করা ফাইলটিতে আপনার পণ্যের বিবরণ নির্ভুলভাবে পূরণ করুন।</li>
                    <li><strong className="text-emerald-700">Product Name (নাম)</strong>, <strong className="text-emerald-700">Price (মূল্য)</strong> এবং <strong className="text-emerald-700">Category ID (ক্যাটাগরি আইডি)</strong> অবশ্যই দিতে হবে।</li>
                    <li>ক্যাটাগরি আইডি নিচের তালিকায় থাকা সঠিক ক্যাটাগরি আইডির সাথে মিলতে হবে (যেমন: <code className="bg-slate-100 text-emerald-800 px-1 rounded font-mono">honey</code>)।</li>
                  </ul>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-102 cursor-pointer shadow-xs"
                    >
                      <Download size={14} />
                      <span>Excel টেমপ্লেট ডাউনলোড</span>
                    </button>
                    <button
                      onClick={() => handleDownloadTemplate('csv')}
                      className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-102 cursor-pointer shadow-xs"
                    >
                      <Download size={14} />
                      <span>CSV টেমপ্লেট ডাউনলোড</span>
                    </button>
                  </div>
                </div>

                {/* Available Categories list */}
                <div className="md:col-span-5 bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-3">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                    <Tag size={16} className="text-slate-500" />
                    <span>সঠিক ক্যাটাগরি আইডি সমূহ:</span>
                  </h4>
                  <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {categories.map((c) => (
                      <div 
                        key={c.id} 
                        className="flex items-center justify-between text-xs bg-white border border-slate-100 p-2 rounded-xl"
                      >
                        <span className="font-bold text-slate-700">{c.name}</span>
                        <code className="bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded-lg border border-emerald-500/15">
                          {c.id}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 select-none",
                  dragActive 
                    ? "border-emerald-500 bg-emerald-500/5 scale-99" 
                    : "border-slate-200 hover:border-emerald-500 hover:bg-slate-50/50"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleChange}
                />
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <UploadCloud size={32} />
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-800 text-base md:text-lg">
                    আপনার তৈরি Excel বা CSV ফাইলটি ড্র্যাগ করে এখানে ছাড়ুন
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    অথবা আপনার কম্পিউটার থেকে ব্রাউজ করতে এখানে ক্লিক করুন (সর্বোচ্চ ১০MB)
                  </p>
                </div>
              </div>

              {/* File Info & Parsing Success Message */}
              {fileName && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm truncate max-w-xs sm:max-w-md">{fileName}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        মোট {parsedProducts.length} টি পণ্য পাওয়া গেছে
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2.5">
                    {validCount > 0 && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-xs px-3.5 py-1.5 rounded-full border border-emerald-500/15">
                        <CheckCircle size={12} />
                        <span>{validCount} টি সঠিক</span>
                      </span>
                    )}
                    {invalidCount > 0 && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold text-xs px-3.5 py-1.5 rounded-full border border-rose-500/15 animate-pulse">
                        <AlertCircle size={12} />
                        <span>{invalidCount} টি ভুল</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="flex items-start gap-3 bg-rose-50 border border-rose-500/10 p-5 rounded-2xl text-rose-800">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-sm">ত্রুটি ঘটেছে</h5>
                    <p className="text-xs mt-1 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Parsed Products Table Preview */}
              {parsedProducts.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span>প্রোডাক্ট লিস্টের প্রিভিউ এবং যাচাইকরণ:</span>
                  </h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs bg-white max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-100 z-10">
                        <tr>
                          <th className="px-5 py-3">পণ্যের নাম</th>
                          <th className="px-5 py-3">মূল্য</th>
                          <th className="px-5 py-3">ক্যাটাগরি</th>
                          <th className="px-5 py-3">স্টক</th>
                          <th className="px-5 py-3">অবস্থা</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {parsedProducts.map((p, idx) => (
                          <tr key={idx} className={cn(!p.isValid && "bg-rose-50/30")}>
                            <td className="px-5 py-3">
                              <div className="font-bold text-slate-800 truncate max-w-xs">{p.name || '---'}</div>
                              {p.description && <div className="text-[10px] text-slate-400 truncate max-w-xs">{p.description}</div>}
                            </td>
                            <td className="px-5 py-3 font-mono font-bold">৳{p.price}</td>
                            <td className="px-5 py-3 font-mono text-slate-500">{p.category || '---'}</td>
                            <td className="px-5 py-3 font-mono">{p.stock}</td>
                            <td className="px-5 py-3">
                              {p.isValid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                  <CheckCircle size={14} />
                                  <span>সঠিক</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 font-bold" title={p.errorMsg}>
                                  <AlertCircle size={14} />
                                  <span>{p.errorMsg}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isUploading && (
          <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-medium max-w-md">
              * লাল রঙের চিহ্নিত পণ্যগুলোতে সঠিক ডাটা না থাকায় বাদ দেওয়া হবে। সম্পূর্ণ ডাটা সঠিক করতে চাইলে আবার সংশোধন করে আপলোড করুন।
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                disabled={validCount === 0}
                onClick={handleUploadSubmit}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer",
                  validCount > 0 
                    ? "bg-primary text-white hover:bg-emerald-800 shadow-primary/20 hover:scale-102" 
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                )}
              >
                <span>{validCount}টি প্রোডাক্ট আপলোড করুন</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
