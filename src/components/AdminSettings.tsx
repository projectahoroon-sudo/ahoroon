import React, { useState, useEffect } from 'react';
import { Save, Upload, Truck, Key, CheckCircle, ExternalLink } from 'lucide-react';
import { adminService } from '../services/adminService';
import { compressImage } from '../lib/imageUtils';

export default function AdminSettings() {
  const [logoUrl, setLogoUrl] = useState('');
  const [footerLogoUrl, setFooterLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [canModify, setCanModify] = useState(true);

  // Courier API Settings state
  const [courierSettings, setCourierSettings] = useState({
    defaultProvider: 'Steadfast Courier',
    steadfastApiKey: '',
    steadfastSecretKey: '',
    pathaoClientId: '',
    pathaoClientSecret: '',
    pathaoUsername: '',
    pathaoPassword: '',
    pathaoStoreId: '',
    redxAccessToken: '',
    autoUpdateStatusOnBooking: true
  });
  const [courierSavedSuccess, setCourierSavedSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
    loadCourierSettings();
    
    // Determine edit permission based on custom user role
    const customUserStr = localStorage.getItem('customAdminUser');
    if (customUserStr) {
      try {
        const customUser = JSON.parse(customUserStr);
        if (customUser.email === 'reocleanproperties@gmail.com' || customUser.email === 'ahorooon@gmail.com' || customUser.email === 'admin@ahoroon.com' || customUser.role === 'super_admin' || customUser.role === 'admin') {
          setCanModify(true);
        } else if (customUser.isCustom) {
          const role = customUser.role;
          setCanModify(role === 'admin'); // Only super_admin and admin can modify settings, not editors or staff
        }
      } catch (e) {
        console.error('Error parsing custom user role:', e);
      }
    }
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await adminService.getSettings();
      if (settings && settings.logoUrl) {
        setLogoUrl(settings.logoUrl);
      }
      if (settings && settings.footerLogoUrl) {
        setFooterLogoUrl(settings.footerLogoUrl);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourierSettings = async () => {
    try {
      const cs = await adminService.getCourierSettings();
      if (cs) {
        setCourierSettings(prev => ({ ...prev, ...cs }));
      }
    } catch (err) {
      console.error('Error loading courier settings:', err);
    }
  };

  const handleSaveCourierSettings = async () => {
    setSaving(true);
    try {
      await adminService.updateCourierSettings(courierSettings);
      setCourierSavedSuccess(true);
      setTimeout(() => setCourierSavedSuccess(false), 3000);
    } catch (err) {
      alert('কুরিয়ার সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isFooter: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        try {
          const compressed = await compressImage(base64String, 400, 400, 0.8);
          if (isFooter) {
            setFooterLogoUrl(compressed);
          } else {
            setLogoUrl(compressed);
          }
        } catch (err) {
          console.error("Compression error:", err);
          alert("Failed to compress image");
        }
      };
      reader.onerror = () => alert("Failed to read file");
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Failed to process image');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateSettings({ logoUrl, footerLogoUrl });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div></div>;
  }

  return (
    <div className="p-4 sm:p-8 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Site Settings</h1>
          <p className="text-sm text-gray-500">Manage your website's general configuration.</p>
        </div>
        {canModify && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-accent-deep text-white px-5 py-2.5 rounded-xl transition-all font-medium disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            ) : (
              <Save size={20} />
            )}
            Save Changes
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Branding</h2>
        
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Main Website Logo</label>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-48 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Site Logo Preview" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <div className="text-gray-400 text-sm flex flex-col items-center">
                  <Upload size={24} className="mb-2" />
                  No Logo
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              <label className="inline-flex items-center gap-2 bg-surface hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-all cursor-pointer font-medium">
                <Upload size={18} />
                Upload New Logo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleImageUpload(e, false)}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 leading-relaxed">
                Recommended size: 400x120 pixels. Max file size: 1MB. Allowed formats: JPG, PNG, WEBP.
                Use a transparent PNG for best results.
              </p>
              {logoUrl && (
                <button 
                  onClick={() => setLogoUrl('')}
                  className="text-red-500 text-sm hover:text-red-600 font-medium"
                >
                  Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-gray-100 mt-6">
          <label className="block text-sm font-medium text-gray-700">Footer Logo</label>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-48 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {footerLogoUrl ? (
                <img src={footerLogoUrl} alt="Footer Logo Preview" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <div className="text-gray-400 text-sm flex flex-col items-center">
                  <Upload size={24} className="mb-2" />
                  No Logo
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              <label className="inline-flex items-center gap-2 bg-surface hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-all cursor-pointer font-medium">
                <Upload size={18} />
                Upload Footer Logo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 leading-relaxed">
                Optional separate logo for the footer. Recommended size: 400x120 pixels.
              </p>
              {footerLogoUrl && (
                <button 
                  onClick={() => setFooterLogoUrl('')}
                  className="text-red-500 text-sm hover:text-red-600 font-medium"
                >
                  Remove Footer Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Courier API Integration Section */}
        <div className="pt-8 border-t border-gray-100 mt-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <Truck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-accent-deep">Courier API Configuration (কুরিয়ার অটোমেশন এপিআই)</h2>
                <p className="text-xs text-gray-500">অ্যাডমিন প্যানেল থেকে সরাসরি ১-ক্লিকে কুরিয়ার এন্ট্রি দিতে এপিআই তথ্য সেটআপ করুন।</p>
              </div>
            </div>
            {canModify && (
              <button
                type="button"
                onClick={handleSaveCourierSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {courierSavedSuccess ? <CheckCircle size={16} /> : <Save size={16} />}
                {courierSavedSuccess ? 'সংরক্ষিত হয়েছে!' : 'Save Courier API Settings'}
              </button>
            )}
          </div>

          <div className="bg-emerald-50/40 p-5 rounded-3xl border border-emerald-100 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Default Courier Provider (ডিফল্ট কুরিয়ার)
                </label>
                <select
                  value={courierSettings.defaultProvider}
                  onChange={e => setCourierSettings({...courierSettings, defaultProvider: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Steadfast Courier">Steadfast Courier (স্টেডফাস্ট)</option>
                  <option value="Pathao Courier">Pathao Courier (পাঠাও)</option>
                  <option value="RedX Courier">RedX Courier (রেডএক্স)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="autoStatus"
                  checked={courierSettings.autoUpdateStatusOnBooking}
                  onChange={e => setCourierSettings({...courierSettings, autoUpdateStatusOnBooking: e.target.checked})}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="autoStatus" className="text-xs font-bold text-gray-700 cursor-pointer">
                  কুরিয়ার এন্ট্রি দিলে অর্ডার স্ট্যাটাস স্বয়ংক্রিয়ভাবে "Shipped" করুন
                </label>
              </div>
            </div>

            {/* Steadfast API Config */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-black text-accent-deep uppercase tracking-wider">Steadfast Courier API Keys</span>
                </div>
                <a 
                  href="https://portal.steadfast.com.bd/user/api" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  Steadfast API Panel <ExternalLink size={12} />
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    placeholder="Steadfast API Key..."
                    value={courierSettings.steadfastApiKey}
                    onChange={e => setCourierSettings({...courierSettings, steadfastApiKey: e.target.value})}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Secret Key
                  </label>
                  <input
                    type="password"
                    placeholder="Steadfast Secret Key..."
                    value={courierSettings.steadfastSecretKey}
                    onChange={e => setCourierSettings({...courierSettings, steadfastSecretKey: e.target.value})}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Pathao API Config */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-xs font-black text-accent-deep uppercase tracking-wider">Pathao Courier API Credentials</span>
                </div>
                <a 
                  href="https://merchant.pathao.com/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  Pathao Merchant Panel <ExternalLink size={12} />
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    placeholder="Pathao Client ID"
                    value={courierSettings.pathaoClientId}
                    onChange={e => setCourierSettings({...courierSettings, pathaoClientId: e.target.value})}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    placeholder="Pathao Secret"
                    value={courierSettings.pathaoClientSecret}
                    onChange={e => setCourierSettings({...courierSettings, pathaoClientSecret: e.target.value})}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Store ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1234"
                    value={courierSettings.pathaoStoreId}
                    onChange={e => setCourierSettings({...courierSettings, pathaoStoreId: e.target.value})}
                    className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* RedX API Config */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span className="text-xs font-black text-accent-deep uppercase tracking-wider">RedX Courier Access Token</span>
                </div>
                <a 
                  href="https://redx.com.bd/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                >
                  RedX Panel <ExternalLink size={12} />
                </a>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Access Token
                </label>
                <input
                  type="password"
                  placeholder="RedX Bearer Token..."
                  value={courierSettings.redxAccessToken}
                  onChange={e => setCourierSettings({...courierSettings, redxAccessToken: e.target.value})}
                  className="w-full bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-800 font-medium flex items-start gap-2">
              <span className="font-bold shrink-0">💡 টিপস:</span>
              <span>
                আপনি এপিআই কি ফাঁকা রাখলেও টেস্ট বা ডেমো মোডে ১-ক্লিকে কুরিয়ার এন্ট্রি দিতে পারবেন এবং অটোমেটিক প্রফেশনাল ট্র্যাকিং কোড জেনারেট হয়ে অর্ডারে যুক্ত হয়ে যাবে।
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-gray-100 mt-6">
          <label className="block text-sm font-medium text-gray-700">System Utilities</label>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <div>
                <p className="font-bold text-orange-900">Clear Cache & Unused Images</p>
                <p className="text-sm text-orange-700/80 mt-1">
                  Deletes unused image data from the local browser storage while preserving your current uploaded logos and cart data.
                </p>
              </div>
              <button
                onClick={() => {
                  const preserveKeys = ['siteLogo', 'siteFooterLogo', 'cart_items_v1'];
                  const keysToRemove = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && !preserveKeys.includes(key) && !key.startsWith('firebase:')) {
                      keysToRemove.push(key);
                    }
                  }
                  keysToRemove.forEach(k => localStorage.removeItem(k));
                  alert('Local cache has been cleared successfully.');
                }}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shrink-0 shadow-lg shadow-orange-200"
              >
                Clear Cache
              </button>
            </div>

            {canModify && (
              <>
                <div className="flex items-center justify-between bg-green-50 p-6 rounded-2xl border border-green-100 mt-6">
                  <div>
                    <p className="font-bold text-green-900">Seed Categories</p>
                    <p className="text-sm text-green-700/80 mt-1">
                      Adds new categories to the database.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const categories = [
                        { name: 'নিরাপদ প্রাকৃতিক সার', icon: 'Leaf' },
                        { name: 'নিরাপদ আবাদের চাল', icon: 'Wheat' },
                        { name: 'নিরাপদ আবাদের দেশি ডাল ও বিচি', icon: 'Bean' },
                        { name: 'নিরাপদ আবাদের দেশি মশলা', icon: 'Flame' },
                        { name: 'নিরাপদ ভোজ্য তেল', icon: 'Droplets' },
                        { name: 'নিরাপদ আবাদের পাহাড়ি ফল এবং সবজী', icon: 'Apple' },
                        { name: 'ময়দা ও ছাতু আইটেম', icon: 'Wheat' },
                        { name: 'দুগ্ধজাত পন্য', icon: 'Milk' },
                        { name: 'প্রাকৃতিক মিষ্টি', icon: 'Candy' },
                        { name: 'প্রাকৃতিক নির্যাস', icon: 'FlaskConical' },
                        { name: 'আদরের শিশুদের খাদ্য', icon: 'Baby' },
                        { name: 'প্রাকৃতিক গুল্মলতার পুনর্জীবনদায়ী প্রাচীন প্রতিকার', icon: 'Sprout' },
                        { name: 'নিরাপদ ড্রাই ফিশ', icon: 'Fish' },
                        { name: 'নিরাপদ তরতাজা আমিষ', icon: 'Drumstick' },
                        { name: 'অন্যান্য', icon: 'MoreHorizontal' },
                      ];
                      setSeeding(true);
                      try {
                        for (const cat of categories) {
                          await adminService.addCategory({ 
                            name: cat.name,
                            icon: cat.icon
                          });
                        }
                        alert('Categories added successfully!');
                      } catch (err) {
                        console.error(err);
                        alert('Failed to add categories');
                      } finally {
                        setSeeding(false);
                      }
                    }}
                    disabled={seeding}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shrink-0 shadow-lg shadow-green-200"
                  >
                    {seeding ? 'Adding...' : 'Add Categories'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-red-50 p-6 rounded-2xl border border-red-100">
                  <div>
                    <p className="font-bold text-red-900">Wipe Categories Only</p>
                    <p className="text-sm text-red-700/80 mt-1">
                      WARNING: This will permanently delete ALL categories.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to wipe all categories?")) {
                        setSeeding(true);
                        const success = await adminService.wipeCategories();
                        setSeeding(false);
                        if (success) {
                          alert('Categories wiped successfully.');
                        } else {
                          alert('Failed to wipe categories.');
                        }
                      }
                    }}
                    disabled={seeding}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shrink-0 shadow-lg shadow-red-200"
                  >
                    Wipe Categories
                  </button>
                </div>

                <div className="flex items-center justify-between bg-red-50 p-6 rounded-2xl border border-red-100">
                  <div>
                    <p className="font-bold text-red-900">Wipe Full Database</p>
                    <p className="text-sm text-red-700/80 mt-1">
                      WARNING: This will permanently delete ALL data (Products, Categories, Sliders, Producers, Press, etc). This cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you ABSOLUTELY sure you want to completely erase the database? All your uploaded products will be gone.")) {
                        if (window.confirm("Double checking: DELETE EVERYTHING?")) {
                          const success = await adminService.factoryReset();
                          if (success) {
                            alert('Database wiped completely. The website is now clean.');
                            window.location.reload();
                          } else {
                            alert('Failed to drop the database. See console for details.');
                          }
                        }
                      }
                    }}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shrink-0 shadow-lg shadow-red-200"
                  >
                    Factory Reset
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
