import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  RefreshCw, 
  Send, 
  Inbox, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Search, 
  Eye, 
  ShieldCheck, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Check, 
  ArrowRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { 
  signInWithGmail, 
  getGmailAccessToken, 
  disconnectGmail, 
  subscribeWorkspaceAuth 
} from '../lib/workspaceAuth';
import { gmailService, GmailOrderEmail, GmailUserProfile } from '../services/gmailService';

interface AdminGmailInboxProps {
  orders: any[];
  onOrderUpdated?: () => void;
}

export default function AdminGmailInbox({ orders }: AdminGmailInboxProps) {
  const [token, setToken] = useState<string | null>(getGmailAccessToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [userProfile, setUserProfile] = useState<GmailUserProfile | null>(null);
  const [emails, setEmails] = useState<GmailOrderEmail[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<GmailOrderEmail | null>(null);

  // Sync state
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Send Email Modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Explicit confirmation dialog state (Mandatory per Workspace Skill)
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeWorkspaceAuth((newToken) => {
      setToken(newToken);
      if (newToken) {
        loadProfileAndEmails(newToken);
      } else {
        setUserProfile(null);
        setEmails([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProfileAndEmails = async (accessToken: string) => {
    setLoadingEmails(true);
    try {
      const profile = await gmailService.getProfile(accessToken);
      setUserProfile(profile);

      const orderEmails = await gmailService.listOrderEmails(accessToken);
      setEmails(orderEmails);
    } catch (err: any) {
      console.error('Error loading Gmail data:', err);
      showStatus('error', err.message || 'Failed to connect to Gmail.');
    } finally {
      setLoadingEmails(false);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 6000);
  };

  const handleConnectGmail = async () => {
    setIsAuthenticating(true);
    try {
      const res = await signInWithGmail();
      if (res?.accessToken) {
        showStatus('success', `Connected to Gmail as ${res.user.email}!`);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      showStatus('error', err.message || 'Gmail login was cancelled or failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGmail();
    setUserProfile(null);
    setEmails([]);
    showStatus('success', 'Disconnected from Gmail session.');
  };

  const handleRefresh = async () => {
    if (!token) return;
    setLoadingEmails(true);
    try {
      const orderEmails = await gmailService.listOrderEmails(token, searchQuery ? `subject:(${searchQuery})` : undefined);
      setEmails(orderEmails);
      showStatus('success', `Found ${orderEmails.length} order emails in Gmail.`);
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to refresh Gmail inbox.');
    } finally {
      setLoadingEmails(false);
    }
  };

  // Deliver an order into Gmail Inbox
  const handleDeliverToInbox = async (order: any) => {
    if (!token) {
      showStatus('error', 'Please connect Gmail first.');
      return;
    }

    setSyncingOrderId(order.id);
    try {
      await gmailService.deliverOrderToInbox(order, token, userProfile?.emailAddress);
      showStatus('success', `Order #${order.id} delivered into your Gmail Inbox!`);
      // Refresh inbox list
      setTimeout(() => handleRefresh(), 1200);
    } catch (err: any) {
      console.error('Failed to deliver order to Gmail:', err);
      showStatus('error', err.message || 'Could not deliver order to Gmail.');
    } finally {
      setSyncingOrderId(null);
    }
  };

  // Deliver all orders to Gmail Inbox
  const handleDeliverAllToInbox = async () => {
    if (!token) {
      showStatus('error', 'Please connect Gmail first.');
      return;
    }

    setSyncAllLoading(true);
    let successCount = 0;
    try {
      for (const order of orders.slice(0, 10)) {
        try {
          await gmailService.deliverOrderToInbox(order, token, userProfile?.emailAddress);
          successCount++;
        } catch (e) {
          console.warn('Sync failed for order:', order.id, e);
        }
      }
      showStatus('success', `Successfully delivered ${successCount} orders to your Gmail Inbox!`);
      setTimeout(() => handleRefresh(), 1500);
    } catch (err: any) {
      showStatus('error', err.message || 'Sync encountered an error.');
    } finally {
      setSyncAllLoading(false);
    }
  };

  // Open compose modal for a specific customer/order
  const handleOpenCompose = (order?: any) => {
    if (order) {
      const customerEmail = order.customer?.email || '';
      const customerName = order.customer?.name || 'Customer';
      setComposeTo(customerEmail);
      setComposeSubject(`Update regarding your Ahoroon Order #${order.id}`);
      setComposeBody(
        `Dear ${customerName},\n\n` +
        `Thank you for shopping with Ahoroon! Your order #${order.id} with total amount ৳${(order.grandTotal || order.total || 0).toLocaleString()} is currently ${order.status || 'processing'}.\n\n` +
        (order.trackingCode ? `Courier Tracking Code: ${order.trackingCode}\nTracking Link: ${order.trackingUrl || 'https://steadfast.com.bd/tracking/' + order.trackingCode}\n\n` : '') +
        `If you have any questions or special instructions, please reply to this email.\n\nWarm regards,\nAhoroon eCommerce Team`
      );
    } else {
      setComposeTo('');
      setComposeSubject('Message from Ahoroon eCommerce');
      setComposeBody('');
    }
    setIsComposeOpen(true);
  };

  // Trigger Confirmation Dialog before sending
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      showStatus('error', 'Please fill in recipient email, subject, and message body.');
      return;
    }
    setShowConfirmModal(true);
  };

  // Execute actual send after user explicitly confirms
  const handleExecuteSend = async () => {
    setShowConfirmModal(false);
    if (!token) {
      showStatus('error', 'Gmail token missing. Please reconnect.');
      return;
    }

    setSendingEmail(true);
    try {
      const formattedHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; padding: 20px;">
          <div style="border-bottom: 2px solid #005900; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #005900; margin: 0;">আহরোণ (Ahoroon)</h2>
          </div>
          <div style="white-space: pre-wrap; font-size: 14px;">${composeBody}</div>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            Sent securely via Gmail &bull; Ahoroon eCommerce
          </div>
        </div>
      `;

      await gmailService.sendEmail(composeTo, composeSubject, formattedHtml, token);
      showStatus('success', `Email sent successfully to ${composeTo} via Gmail!`);
      setIsComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
    } catch (err: any) {
      console.error('Send error:', err);
      showStatus('error', err.message || 'Failed to dispatch email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredEmails = emails.filter(em => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      em.subject.toLowerCase().includes(q) ||
      em.from.toLowerCase().includes(q) ||
      em.snippet.toLowerCase().includes(q) ||
      (em.orderId && em.orderId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Status notification toast */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-fade-in ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-200 border border-white/10">
              <Mail size={14} />
              <span>Google Workspace &bull; Gmail API Integration</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Gmail Order Inbox & Notification Center
            </h2>
            <p className="text-emerald-100 text-sm max-w-xl leading-relaxed">
              Connect your Gmail account to receive all incoming store orders directly in your Gmail Inbox, 
              view customer order threads, and send official receipts or status updates to customers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {!token ? (
              <button
                onClick={handleConnectGmail}
                disabled={isAuthenticating}
                className="gsi-material-button group cursor-pointer inline-flex items-center justify-center gap-3 bg-white text-slate-800 font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 border border-slate-200 hover:bg-slate-50"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span>{isAuthenticating ? 'Connecting...' : 'Connect with Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeliverAllToInbox}
                  disabled={syncAllLoading || orders.length === 0}
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-4 py-3 rounded-2xl shadow-md transition-all active:scale-95 text-xs sm:text-sm cursor-pointer"
                >
                  <Inbox size={16} />
                  <span>{syncAllLoading ? 'Delivering...' : 'Deliver All Orders to Gmail'}</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer"
                  title="Disconnect Gmail"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User profile bar if connected */}
        {token && userProfile && (
          <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-100 font-medium">Connected Gmail:</span>
              <span className="font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">
                {userProfile.emailAddress}
              </span>
            </div>

            <div className="flex items-center gap-4 text-emerald-100 font-semibold">
              <span>Messages: <strong>{userProfile.messagesTotal?.toLocaleString()}</strong></span>
              <span>Threads: <strong>{userProfile.threadsTotal?.toLocaleString()}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Orders to Sync & Gmail Inbox Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Store Orders (Deliver to Gmail Inbox) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Store Orders</h3>
                <p className="text-xs text-slate-400">Click to deliver any order directly into your Gmail Inbox</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {orders.length} total
              </span>
            </div>

            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No orders recorded yet.
                </div>
              ) : (
                orders.slice(0, 15).map((order) => {
                  const isSyncing = syncingOrderId === order.id;
                  const customerName = order.customer?.name || 'Customer';
                  const total = (order.grandTotal || order.total || 0).toLocaleString();

                  return (
                    <div 
                      key={order.id}
                      className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/30 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800">#{order.id}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              {order.status || 'pending'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">{customerName}</p>
                        </div>
                        <span className="font-extrabold text-sm text-[#005900]">৳{total}</span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Items: {order.items?.length || 0}</span>
                        <span>{order.createdAt ? new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-150 flex items-center gap-2">
                        <button
                          onClick={() => handleDeliverToInbox(order)}
                          disabled={isSyncing || !token}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Inbox size={13} />
                          <span>{isSyncing ? 'Delivering...' : 'Deliver to Inbox'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenCompose(order)}
                          disabled={!token}
                          className="py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all hover:bg-white cursor-pointer"
                          title="Send update email to customer"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Gmail Order Emails Viewer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Mail className="text-[#005900]" size={20} />
                  <span>Emails in Gmail Inbox</span>
                </h3>
                <p className="text-xs text-slate-400">Order receipts and notifications found in your connected Gmail</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loadingEmails || !token}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={loadingEmails ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => handleOpenCompose()}
                  disabled={!token}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#005900] hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>Compose Email</span>
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search order emails by ID, customer, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Email list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
              {!token ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 text-[#005900] rounded-2xl flex items-center justify-center mx-auto">
                    <Mail size={24} />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">Gmail is not connected</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click "Connect with Google" above to authorize Gmail scopes and read all order emails in your inbox.
                  </p>
                </div>
              ) : loadingEmails ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw size={24} className="animate-spin text-[#005900] mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">Reading order emails from Gmail...</p>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Inbox size={28} className="text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-sm">No order emails found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No emails matching "Order" or "Ahoroon" were found in your inbox. 
                    Use the "Deliver to Inbox" button on any store order to create one!
                  </p>
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 bg-white hover:bg-slate-50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {email.isUnread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        )}
                        <span className="font-bold text-xs text-slate-800 line-clamp-1">
                          {email.subject}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{email.date.split(',')[0]}</span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 mt-1 pl-4">
                      {email.snippet}
                    </p>

                    <div className="mt-2 pl-4 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="line-clamp-1 max-w-[200px]">From: {email.from}</span>
                      <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        View email <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Selected Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Gmail Order Email
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1">{selectedEmail.subject}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  From: <strong>{selectedEmail.from}</strong> &bull; {selectedEmail.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {selectedEmail.bodyHtml ? (
                <div 
                  className="prose prose-sm max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                />
              ) : (
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">
                  {selectedEmail.bodyText || selectedEmail.snippet}
                </pre>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">ID: {selectedEmail.id}</span>
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Send className="text-[#005900]" size={18} />
                <h3 className="font-bold text-slate-800 text-base">Send Email via Gmail</h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateSend} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">To (Customer Email)</label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Order status update / receipt"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
                <textarea
                  required
                  rows={6}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your email message here..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-5 py-2 bg-[#005900] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Send via Gmail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Explicit Confirmation Dialog for Sending Email */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <AlertCircle size={24} />
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-lg">Confirm Email Dispatch</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You are about to send an email on behalf of <strong>{userProfile?.emailAddress || 'your Gmail account'}</strong> to:
              </p>
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                <div><strong>Recipient:</strong> {composeTo}</div>
                <div><strong>Subject:</strong> {composeSubject}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSend}
                disabled={sendingEmail}
                className="px-5 py-2 bg-[#005900] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {sendingEmail ? 'Sending...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
