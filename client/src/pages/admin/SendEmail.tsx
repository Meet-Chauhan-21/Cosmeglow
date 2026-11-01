import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Mail, 
  Send, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw, 
  Eye, 
  Clock,
  Search,
  X,
  UserCheck,
  UserPlus,
  CheckSquare,
  Square,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Link as LinkIcon,
  Table as TableIcon,
  Palette,
  Eraser,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

interface UserOption {
  _id: string;
  name: string;
  email: string;
  role: string;
  orders?: number;
  createdAt?: string;
}

interface SentRecord {
  id: string;
  recipient: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

const COLOR_SWATCHES = [
  { name: 'Dark Charcoal', color: '#111827' },
  { name: 'Slate Gray', color: '#4b5563' },
  { name: 'Muted Gray', color: '#9ca3af' },
  { name: 'Brand Indigo', color: '#4f46e5' },
  { name: 'Royal Blue', color: '#2563eb' },
  { name: 'Emerald Green', color: '#059669' },
  { name: 'Amber Gold', color: '#d97706' },
  { name: 'Crimson Red', color: '#dc2626' },
  { name: 'Rose Pink', color: '#e11d48' },
  { name: 'Purple', color: '#9333ea' }
];

const HIGHLIGHT_SWATCHES = [
  { name: 'Yellow', color: '#fef08a' },
  { name: 'Green', color: '#bbf7d0' },
  { name: 'Blue', color: '#bfdbfe' },
  { name: 'Pink', color: '#fbcfe8' },
  { name: 'Orange', color: '#fed7aa' },
  { name: 'Lavender', color: '#e9d5ff' },
  { name: 'Remove Highlight', color: 'transparent' }
];

const EMAIL_TEMPLATES = [
  {
    title: 'Special Offer / Discount',
    subject: 'Exclusive 20% Off Your Next CosmeGlow Skincare Order ✨',
    message: `<p>We appreciate you being a part of the <strong>CosmeGlow</strong> family!</p><p>As a token of our gratitude, we would love to offer you an exclusive <span style="color: #4f46e5; font-weight: bold;">20% discount</span> on your next order across our entire biological cellular restoration collection.</p><p>Use code <strong>GLOW20</strong> at checkout to claim your savings. If you need any recommendations for your daily skincare regimen, our specialists are always here to assist you.</p><p>Warm regards,<br/><strong>The CosmeGlow Team</strong></p>`
  },
  {
    title: 'Order Status Update',
    subject: 'Important Update Regarding Your CosmeGlow Order',
    message: `<p>We are writing to share an update regarding your recent order.</p><p>Our botanical laboratory and fulfillment center has carefully packed and inspected your items to ensure optimal formula stability and freshness. Your package is dispatched and on its way to you.</p><p>You can track the live shipment progress directly from your account dashboard or using the tracking link previously shared.</p><p>Thank you for choosing <strong>CosmeGlow</strong>!</p>`
  },
  {
    title: 'Customer Feedback & Care',
    subject: 'How is your CosmeGlow routine going?',
    message: `<p>We hope your new skincare routine is treating your skin with the care and glow it deserves!</p><p>We always strive to deliver the highest quality biological formulations. If you have any feedback, questions about product application, or need personalized recommendations, please reply to this email.</p><p>Your satisfaction is our utmost priority.</p>`
  }
];

const getInitials = (name?: string, email?: string) => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'CG';
};

const getAvatarGradient = (str: string) => {
  const gradients = [
    'from-indigo-600 to-purple-600',
    'from-emerald-600 to-teal-600',
    'from-rose-600 to-pink-600',
    'from-amber-600 to-orange-600',
    'from-blue-600 to-cyan-600',
    'from-violet-600 to-fuchsia-600'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export const SendEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { accessToken } = useAuth();

  // Mode: 'individual' (select specific users) | 'all' (broadcast to all)
  const [targetType, setTargetType] = useState<'individual' | 'all'>('individual');

  // Selected Users List (supports single OR multiple users!)
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);

  // CC and BCC State
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState('');
  const [showBcc, setShowBcc] = useState(false);
  const [bcc, setBcc] = useState('');

  // Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [sending, setSending] = useState(false);

  // Search & Dropdown State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Popover State for Color and Highlighter
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#4f46e5');

  // Users Directory Modal State (with checkboxes for multi-select!)
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);
  const savedSelectionRange = useRef<Range | null>(null);

  // History state
  const [sentHistory, setSentHistory] = useState<SentRecord[]>([]);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);

  // Synchronize editor innerHTML when message changes externally (e.g. presets, reset)
  useEffect(() => {
    if (!isHtmlMode && editorRef.current) {
      if (editorRef.current.innerHTML !== message) {
        editorRef.current.innerHTML = message;
      }
    }
  }, [message, isHtmlMode]);

  // Handle click outside dropdown and popovers to close them safely
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(target)) {
        setShowHighlightPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch users for selector
  useEffect(() => {
    if (!accessToken) return;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch(`${API_BASE_URL}/admin/users?limit=1000`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          const fetchedUsers: UserOption[] = data.users || [];
          setUsersList(fetchedUsers);

          // If URL params exist (?email=...), pre-select the user
          const urlEmail = searchParams.get('email');
          const urlName = searchParams.get('name');
          if (urlEmail) {
            const matched = fetchedUsers.find(
              (u) => u.email?.toLowerCase() === urlEmail.toLowerCase()
            );
            if (matched) {
              setSelectedUsers([matched]);
            } else {
              setSelectedUsers([
                {
                  _id: 'url-' + Date.now(),
                  name: urlName || urlEmail.split('@')[0],
                  email: urlEmail,
                  role: 'custom'
                }
              ]);
            }
            setTargetType('individual');
          }
        }
      } catch (err) {
        console.error('Error fetching users for email selector:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [accessToken, searchParams]);

  // Calculate clean text statistics (Word Count & Character Count)
  const getTextStats = (htmlStr: string) => {
    const text = htmlStr
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = text ? text.split(' ').filter(Boolean).length : 0;
    const chars = text.length;
    return { words, chars };
  };

  const { words: wordCount, chars: charCount } = getTextStats(message);

  // Save current selection range inside editor
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRange.current = range.cloneRange();
      }
    }
  };

  // Restore saved selection range
  const restoreSelection = () => {
    if (savedSelectionRange.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRange.current);
      }
    }
  };

  // Execute formatting command on rich text editor
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (isHtmlMode) {
      toast.info('Switch to visual editor mode to use formatting tools.');
      return;
    }
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      try {
        document.execCommand('styleWithCSS', false, 'true');
      } catch (e) {
        // ignore
      }
      document.execCommand(command, false, value);
      saveSelection();
      setMessage(editorRef.current.innerHTML);
    }
  };

  // Format block (Paragraph, H1, H2, H3)
  const handleFormatBlock = (tag: string) => {
    if (isHtmlMode) {
      toast.info('Switch to visual editor mode to use formatting tools.');
      return;
    }
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      try {
        document.execCommand('formatBlock', false, `<${tag}>`);
      } catch {
        try {
          document.execCommand('formatBlock', false, tag);
        } catch (e) {
          console.warn('formatBlock error', e);
        }
      }
      saveSelection();
      setMessage(editorRef.current.innerHTML);
    }
  };

  // Apply text color
  const applyColor = (color: string) => {
    if (isHtmlMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      try {
        document.execCommand('styleWithCSS', false, 'true');
      } catch (e) {
        // ignore
      }
      document.execCommand('foreColor', false, color);
      saveSelection();
      setMessage(editorRef.current.innerHTML);
    }
    setShowColorPicker(false);
  };

  // Apply background highlight
  const applyHighlight = (color: string) => {
    if (isHtmlMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      try {
        document.execCommand('styleWithCSS', false, 'true');
      } catch (e) {
        // ignore
      }
      if (color === 'transparent') {
        document.execCommand('removeFormat', false);
      } else {
        try {
          document.execCommand('hiliteColor', false, color);
        } catch {
          document.execCommand('backColor', false, color);
        }
      }
      saveSelection();
      setMessage(editorRef.current.innerHTML);
    }
    setShowHighlightPicker(false);
  };

  const handleInsertLink = () => {
    if (isHtmlMode) {
      toast.info('Switch to visual editor mode to use formatting tools.');
      return;
    }
    saveSelection();
    const url = window.prompt('Enter link destination URL (e.g. https://cosmeglow.com):', 'https://');
    if (url && url.trim()) {
      if (editorRef.current) {
        editorRef.current.focus();
        restoreSelection();
        document.execCommand('createLink', false, url.trim());
        saveSelection();
        setMessage(editorRef.current.innerHTML);
      }
    }
  };

  const handleInsertTable = () => {
    if (isHtmlMode) {
      toast.info('Switch to visual editor mode to use formatting tools.');
      return;
    }
    const tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin:14px 0; border:1px solid #cbd5e1; font-size:12px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="border:1px solid #cbd5e1; padding:8px 12px; text-align:left; font-weight:bold;">Item / Service</th>
            <th style="border:1px solid #cbd5e1; padding:8px 12px; text-align:left; font-weight:bold;">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:8px 12px;">Cell 1</td>
            <td style="border:1px solid #cbd5e1; padding:8px 12px;">Description 1</td>
          </tr>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:8px 12px;">Cell 2</td>
            <td style="border:1px solid #cbd5e1; padding:8px 12px;">Description 2</td>
          </tr>
        </tbody>
      </table><p><br/></p>
    `;
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
        document.execCommand('insertHTML', false, tableHtml);
      } else {
        editorRef.current.innerHTML += tableHtml;
      }
      saveSelection();
      setMessage(editorRef.current.innerHTML);
    }
  };

  const toggleHtmlMode = () => {
    if (!isHtmlMode && editorRef.current) {
      setMessage(editorRef.current.innerHTML);
    }
    setIsHtmlMode((prev) => !prev);
    setShowColorPicker(false);
    setShowHighlightPicker(false);
  };

  // Add a user from autocomplete dropdown
  const handleSelectFromDropdown = (user: UserOption) => {
    if (!selectedUsers.some((u) => u._id === user._id || u.email.toLowerCase() === user.email.toLowerCase())) {
      setSelectedUsers((prev) => [...prev, user]);
      toast.success(`Added ${user.name || user.email}`);
    } else {
      toast.info('User is already selected.');
    }
    setIsDropdownOpen(false);
    setUserSearchTerm('');
  };

  // Add custom email recipient if admin types an address
  const handleAddCustomEmail = (customEmail: string) => {
    const clean = customEmail.trim();
    if (!clean) return;

    if (selectedUsers.some((u) => u.email.toLowerCase() === clean.toLowerCase())) {
      toast.info('This email is already in the recipient list.');
      return;
    }

    const customUser: UserOption = {
      _id: 'custom-' + Date.now(),
      name: clean.split('@')[0],
      email: clean,
      role: 'custom'
    };

    setSelectedUsers((prev) => [...prev, customUser]);
    setIsDropdownOpen(false);
    setUserSearchTerm('');
    toast.success(`Added ${clean}`);
  };

  // Remove single recipient
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  // Clear all recipients
  const handleClearAllRecipients = () => {
    setSelectedUsers([]);
  };

  // Modal handlers (Multi-select with checkboxes)
  const openSelectModal = () => {
    setTempSelectedIds(selectedUsers.map((u) => u._id));
    setModalSearchTerm('');
    setUserModalOpen(true);
  };

  const toggleUserCheckbox = (userId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const modalFilteredUsers = usersList.filter(
    (u) =>
      u.email?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const isAllModalSelected =
    modalFilteredUsers.length > 0 &&
    modalFilteredUsers.every((u) => tempSelectedIds.includes(u._id));

  const handleToggleSelectAll = () => {
    const filteredIds = modalFilteredUsers.map((u) => u._id);
    if (isAllModalSelected) {
      setTempSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setTempSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const confirmModalSelection = () => {
    const chosenUsers = usersList.filter((u) => tempSelectedIds.includes(u._id));
    const customUsers = selectedUsers.filter((u) => u._id.startsWith('custom-') || u._id.startsWith('url-'));
    setSelectedUsers([...chosenUsers, ...customUsers]);
    setUserModalOpen(false);
    toast.success(`${chosenUsers.length} user(s) selected.`);
  };

  const applyTemplate = (tpl: typeof EMAIL_TEMPLATES[0]) => {
    setSubject(tpl.subject);
    setMessage(tpl.message);
    if (!isHtmlMode && editorRef.current) {
      editorRef.current.innerHTML = tpl.message;
    }
    toast.success(`Template "${tpl.title}" applied.`);
  };

  const handleReset = () => {
    setSelectedUsers([]);
    setSubject('');
    setMessage('');
    setCc('');
    setBcc('');
    setShowCc(false);
    setShowBcc(false);
    setIsHtmlMode(false);
    setShowColorPicker(false);
    setShowHighlightPicker(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setTargetType('individual');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === 'individual' && selectedUsers.length === 0) {
      toast.error('Please select at least one recipient user.');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter an email subject.');
      return;
    }

    const currentMessage = isHtmlMode ? message : (editorRef.current?.innerHTML || message);
    if (!currentMessage || !currentMessage.trim() || currentMessage === '<p><br></p>') {
      toast.error('Please write an email message description.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate CC if entered
    let cleanedCc = '';
    if (showCc && cc.trim()) {
      const ccParts = cc.split(/[,;\n\r]+/).map((p) => p.trim()).filter(Boolean);
      for (const part of ccParts) {
        const emailMatch = part.match(/<([^>]+)>/) ? part.match(/<([^>]+)>/)![1].trim() : part.replace(/^[<"']+|[>"']+$/g, '').trim();
        if (!emailRegex.test(emailMatch)) {
          toast.error(`Invalid email in CC: "${part}". Please enter a valid email address (e.g. name@example.com).`);
          return;
        }
      }
      cleanedCc = ccParts.join(', ');
    }

    // Validate BCC if entered
    let cleanedBcc = '';
    if (showBcc && bcc.trim()) {
      const bccParts = bcc.split(/[,;\n\r]+/).map((p) => p.trim()).filter(Boolean);
      for (const part of bccParts) {
        const emailMatch = part.match(/<([^>]+)>/) ? part.match(/<([^>]+)>/)![1].trim() : part.replace(/^[<"']+|[>"']+$/g, '').trim();
        if (!emailRegex.test(emailMatch)) {
          toast.error(`Invalid email in BCC: "${part}". Please enter a valid email address (e.g. name@example.com).`);
          return;
        }
      }
      cleanedBcc = bccParts.join(', ');
    }

    setSending(true);

    try {
      const payload: any = {
        subject: subject.trim(),
        message: currentMessage.trim(),
        logoUrl: window.location.origin + '/logo.png'
      };

      if (showCc && cleanedCc) {
        payload.cc = cleanedCc;
      }
      if (showBcc && cleanedBcc) {
        payload.bcc = cleanedBcc;
      }

      let recipientLogLabel = '';

      if (targetType === 'all') {
        payload.sendToAll = true;
        recipientLogLabel = `Broadcast (All ${usersList.length} Users)`;
      } else if (selectedUsers.length === 1) {
        payload.email = selectedUsers[0].email.trim();
        payload.recipientName = selectedUsers[0].name?.trim() || '';
        recipientLogLabel = selectedUsers[0].email.trim();
      } else {
        payload.emails = selectedUsers.map((u) => ({
          email: u.email.trim(),
          name: u.name?.trim() || ''
        }));
        recipientLogLabel = `${selectedUsers.length} Selected Users`;
      }

      const res = await fetch(`${API_BASE_URL}/admin/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Email sent successfully!');
        
        setSentHistory((prev) => [
          {
            id: Date.now().toString(),
            recipient: recipientLogLabel,
            subject: subject.trim(),
            sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent'
          },
          ...prev.slice(0, 9)
        ]);

        if (targetType !== 'all') {
          setSubject('');
          setMessage('');
          setCc('');
          setBcc('');
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
          }
        }
      } else {
        toast.error(data.message || 'Failed to send email. Please check server logs.');
      }
    } catch (err: any) {
      console.error('Send Email Error:', err);
      toast.error('Error dispatching email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const isEmailInputValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userSearchTerm.trim());

  return (
    <AdminLayout title="Send Email">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-3">
                <Mail size={13} />
                User Communications
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
                Email Dispatch Center
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                Compose and send branded CosmeGlow emails directly to selected users or broadcast to all registered customers with rich formatting and real-time preview.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setShowPreviewMobile(!showPreviewMobile)}
                className="lg:hidden flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Eye size={14} />
                {showPreviewMobile ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Templates Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 font-sans uppercase tracking-wider">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            Quick Template Presets:
          </div>
          <div className="flex flex-wrap gap-2">
            {EMAIL_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200/80 hover:border-indigo-200 transition-all cursor-pointer"
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Email Form (Col Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            <Card title="Compose Message">
              <form onSubmit={handleSend} className="space-y-6">
                
                {/* 1. Recipient Target Mode (Pill selector) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    Select Audience
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80">
                    <button
                      type="button"
                      onClick={() => setTargetType('individual')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        targetType === 'individual'
                          ? 'bg-white text-indigo-700 shadow-sm border border-gray-100'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <UserCheck size={14} />
                      Specific User(s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('all')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        targetType === 'all'
                          ? 'bg-white text-indigo-700 shadow-sm border border-gray-100'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Users size={14} />
                      All Users ({usersList.length})
                    </button>
                  </div>
                </div>

                {/* 2. Recipient Selection Section */}
                {targetType === 'all' ? (
                  /* Broadcast Info Banner */
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Users size={18} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                        Broadcast To All Registered Customers
                      </h4>
                      <p className="text-xs text-indigo-800 leading-relaxed font-sans">
                        This email will be dispatched to all <strong>{usersList.length} registered customer accounts</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Specific Recipients UI */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                        Recipient User(s) <span className="text-red-500">*</span>
                      </label>
                      {selectedUsers.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllRecipients}
                          className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                        >
                          Clear All ({selectedUsers.length})
                        </button>
                      )}
                    </div>

                    {/* Search & "Select Users" Button Row */}
                    <div className="space-y-2 relative" ref={dropdownRef}>
                      <div className="flex gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <div className="absolute left-3.5 top-0 bottom-0 flex items-center justify-center pointer-events-none z-10">
                            <Search size={16} className="text-gray-400 shrink-0" />
                          </div>
                          <input
                            type="text"
                            placeholder="Type customer name, email, or custom address..."
                            value={userSearchTerm}
                            onChange={(e) => {
                              setUserSearchTerm(e.target.value);
                              setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans shadow-2xs"
                            style={{ paddingLeft: '2.75rem' }}
                          />
                          {userSearchTerm && (
                            <button
                              type="button"
                              onClick={() => {
                                setUserSearchTerm('');
                                setIsDropdownOpen(false);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>

                        {/* "Select Users" Button */}
                        <button
                          type="button"
                          onClick={openSelectModal}
                          className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm shadow-indigo-600/20"
                          title="Open selection popup with checkboxes"
                        >
                          <Users size={14} />
                          <span>Select Users ({usersList.length})</span>
                        </button>
                      </div>

                      {/* Dropdown Autocomplete for quick typing */}
                      {isDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto custom-scrollbar p-1">
                          {userSearchTerm.trim() && (
                            <div
                              onClick={() => handleAddCustomEmail(userSearchTerm)}
                              className="p-3 bg-indigo-50/70 hover:bg-indigo-100/70 rounded-xl transition-colors cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2 text-indigo-700">
                                <UserPlus size={15} />
                                <span>
                                  Add custom recipient: <strong className="font-semibold">{userSearchTerm.trim()}</strong>
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                                + Add
                              </span>
                            </div>
                          )}

                          {loadingUsers ? (
                            <div className="p-4 text-center text-xs text-gray-400">Loading customers...</div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500 space-y-1">
                              <p className="font-semibold">No registered users matched "{userSearchTerm}".</p>
                              {isEmailInputValid && (
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomEmail(userSearchTerm)}
                                  className="text-indigo-600 hover:underline font-bold text-xs mt-1 block mx-auto cursor-pointer"
                                >
                                  Add "{userSearchTerm}" as recipient &rarr;
                                </button>
                              )}
                            </div>
                          ) : (
                            filteredUsers.map((u) => {
                              const isAlreadySelected = selectedUsers.some(
                                (sel) => sel._id === u._id || sel.email.toLowerCase() === u.email.toLowerCase()
                              );
                              return (
                                <div
                                  key={u._id}
                                  onClick={() => handleSelectFromDropdown(u)}
                                  className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs ${
                                    isAlreadySelected ? 'bg-indigo-50/40 text-indigo-900' : 'hover:bg-gray-50 text-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${getAvatarGradient(u.name || u.email)} text-white font-bold flex items-center justify-center text-xs shrink-0`}>
                                      {getInitials(u.name, u.email)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-gray-900 truncate">
                                        {u.name || 'Customer'}
                                      </p>
                                      <p className="text-[11px] text-gray-400 font-sans truncate">
                                        {u.email}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {isAlreadySelected ? (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        ✓ Selected
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-semibold text-indigo-600">
                                        + Add
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Users Chips Container */}
                    {selectedUsers.length > 0 && (
                      <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span className="font-bold uppercase tracking-wider text-[11px] text-gray-500">
                            Selected Recipients ({selectedUsers.length})
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                          {selectedUsers.map((u) => (
                            <div
                              key={u._id}
                              className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-white border border-indigo-150 shadow-3xs text-xs group"
                            >
                              <div className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${getAvatarGradient(u.name || u.email)} text-white font-bold flex items-center justify-center text-[10px] shrink-0`}>
                                {getInitials(u.name, u.email)}
                              </div>
                              <div className="flex flex-col min-w-0 max-w-[170px]">
                                <span className="font-bold text-gray-800 truncate leading-tight">
                                  {u.name || 'User'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-sans truncate leading-none">
                                  {u.email}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(u._id)}
                                className="w-4 h-4 rounded-full hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer ml-1"
                                title="Remove recipient"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CC and BCC Options */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Additional:
                    </span>
                    {!showCc && (
                      <button
                        type="button"
                        onClick={() => setShowCc(true)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        + Add CC
                      </button>
                    )}
                    {!showBcc && (
                      <button
                        type="button"
                        onClick={() => setShowBcc(true)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        + Add BCC
                      </button>
                    )}
                  </div>

                  {showCc && (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400">
                          CC:
                        </span>
                        <input
                          type="text"
                          value={cc}
                          onChange={(e) => setCc(e.target.value)}
                          placeholder="Enter CC email address(es) comma-separated..."
                          className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans shadow-2xs"
                          style={{ paddingLeft: '2.75rem' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCc(false);
                          setCc('');
                        }}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove CC field"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {showBcc && (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400">
                          BCC:
                        </span>
                        <input
                          type="text"
                          value={bcc}
                          onChange={(e) => setBcc(e.target.value)}
                          placeholder="Enter BCC email address(es) comma-separated..."
                          className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans shadow-2xs"
                          style={{ paddingLeft: '2.75rem' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBcc(false);
                          setBcc('');
                        }}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove BCC field"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Subject Line */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Email Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter a descriptive email subject..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold shadow-2xs"
                  />
                </div>

                {/* 5. Rich Text Editor with Image 2 Toolbar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-gray-400 font-sans">
                      Rich text editor with HTML mode support
                    </span>
                  </div>

                  {/* Editor Container with 2-Row Toolbar */}
                  <div className="border border-gray-200 rounded-2xl bg-white shadow-2xs overflow-visible focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    {/* Toolbar Header (2 Rows) */}
                    <div className="bg-slate-50/80 border-b border-gray-200/80 p-2.5 space-y-2 rounded-t-2xl">
                      {/* Row 1 */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* T: Normal Paragraph */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleFormatBlock('p')}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Normal Text / Paragraph"
                        >
                          T
                        </button>

                        {/* H1 */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleFormatBlock('h1')}
                          className="h-7 px-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Heading 1"
                        >
                          H<span className="text-[10px] leading-none">1</span>
                        </button>

                        {/* H2 */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleFormatBlock('h2')}
                          className="h-7 px-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Heading 2"
                        >
                          H<span className="text-[10px] leading-none">2</span>
                        </button>

                        {/* H3 */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleFormatBlock('h3')}
                          className="h-7 px-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Heading 3"
                        >
                          H<span className="text-[10px] leading-none">3</span>
                        </button>

                        {/* B: Bold */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeCommand('bold')}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-800 text-xs font-black flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Bold (Ctrl+B)"
                        >
                          B
                        </button>

                        {/* I: Italic */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeCommand('italic')}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-800 text-xs italic font-serif flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Italic (Ctrl+I)"
                        >
                          I
                        </button>

                        {/* U: Underline */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeCommand('underline')}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-800 text-xs underline font-semibold flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Underline (Ctrl+U)"
                        >
                          U
                        </button>

                        {/* x2: Subscript */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeCommand('subscript')}
                          className="h-7 px-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Subscript"
                        >
                          x<span className="text-[10px] align-sub">2</span>
                        </button>

                        {/* x^2: Superscript */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeCommand('superscript')}
                          className="h-7 px-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Superscript"
                        >
                          x<span className="text-[10px] align-super">2</span>
                        </button>

                        {/* Bullet List */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeCommand('insertUnorderedList')}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Bullet List"
                        >
                          <List size={14} />
                        </button>

                        {/* Numbered List */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeCommand('insertOrderedList')}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Numbered List"
                        >
                          <ListOrdered size={14} />
                        </button>

                        {/* Indent Right */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeCommand('indent')}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Indent Right"
                        >
                          <Indent size={14} />
                        </button>

                        {/* Indent Left */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => executeCommand('outdent')}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Indent Left"
                        >
                          <Outdent size={14} />
                        </button>

                        {/* Link */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleInsertLink}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Insert Link"
                        >
                          <LinkIcon size={14} />
                        </button>

                        {/* Table */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleInsertTable}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                          title="Insert Table"
                        >
                          <TableIcon size={14} />
                        </button>
                      </div>

                      {/* Row 2 */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 relative">
                          {/* Palette / Text Color Dropdown */}
                          <div className="relative" ref={colorPickerRef}>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                saveSelection();
                              }}
                              onClick={() => {
                                setShowColorPicker((prev) => !prev);
                                setShowHighlightPicker(false);
                              }}
                              className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shadow-3xs ${
                                showColorPicker
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                                  : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700'
                              }`}
                              title="Text Color"
                            >
                              <Palette size={14} />
                            </button>

                            {/* Color Swatches Popover */}
                            {showColorPicker && (
                              <div className="absolute left-0 top-full mt-2 p-3 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 w-52 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Select Text Color
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                  {COLOR_SWATCHES.map((swatch) => (
                                    <button
                                      key={swatch.color}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        applyColor(swatch.color);
                                      }}
                                      title={swatch.name}
                                      className="w-7 h-7 rounded-lg border border-black/10 hover:scale-110 active:scale-95 transition-all shadow-3xs cursor-pointer"
                                      style={{ backgroundColor: swatch.color }}
                                    />
                                  ))}
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                  <input
                                    type="color"
                                    value={customTextColor}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      setCustomTextColor(e.target.value);
                                      applyColor(e.target.value);
                                    }}
                                    className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200 p-0.5 bg-white"
                                  />
                                  <span className="text-[11px] text-gray-600 font-sans font-medium">
                                    Custom color picker
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Eraser / Clear Formatting */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand('removeFormat')}
                            className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                            title="Clear Formatting"
                          >
                            <Eraser size={14} />
                          </button>

                          {/* Strikethrough */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand('strikeThrough')}
                            className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                            title="Strikethrough"
                          >
                            <Strikethrough size={14} />
                          </button>

                          {/* Highlighter Popover */}
                          <div className="relative" ref={highlightPickerRef}>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                saveSelection();
                              }}
                              onClick={() => {
                                setShowHighlightPicker((prev) => !prev);
                                setShowColorPicker(false);
                              }}
                              className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shadow-3xs ${
                                showHighlightPicker
                                  ? 'bg-amber-50 border-amber-300 text-amber-600'
                                  : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700'
                              }`}
                              title="Highlight Text"
                            >
                              <Highlighter size={14} />
                            </button>

                            {/* Highlight Swatches Popover */}
                            {showHighlightPicker && (
                              <div className="absolute left-0 top-full mt-2 p-3 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 w-48 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Highlight Color
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {HIGHLIGHT_SWATCHES.map((swatch) => (
                                    <button
                                      key={swatch.name}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        applyHighlight(swatch.color);
                                      }}
                                      title={swatch.name}
                                      className="w-7 h-7 rounded-lg border border-gray-200 hover:scale-110 active:scale-95 transition-all shadow-3xs cursor-pointer flex items-center justify-center text-xs font-bold"
                                      style={{ backgroundColor: swatch.color === 'transparent' ? '#ffffff' : swatch.color }}
                                    >
                                      {swatch.color === 'transparent' && (
                                        <span className="text-rose-500 font-bold leading-none">✕</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Align Left */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand('justifyLeft')}
                            className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                            title="Align Left"
                          >
                            <AlignLeft size={14} />
                          </button>

                          {/* Align Center */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand('justifyCenter')}
                            className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                            title="Align Center"
                          >
                            <AlignCenter size={14} />
                          </button>

                          {/* Align Right */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand('justifyRight')}
                            className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                            title="Align Right"
                          >
                            <AlignRight size={14} />
                          </button>

                          {/* Undo */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand('undo')}
                            className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                            title="Undo (Ctrl+Z)"
                          >
                            <Undo size={14} />
                          </button>

                          {/* Redo */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand('redo')}
                            className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shadow-3xs"
                            title="Redo (Ctrl+Y)"
                          >
                            <Redo size={14} />
                          </button>

                          {/* HTML Mode Toggle */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={toggleHtmlMode}
                            className={`h-7 px-2.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-3xs ${
                              isHtmlMode
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700'
                            }`}
                            title={isHtmlMode ? 'Switch to Visual Editor' : 'Switch to HTML Code Mode'}
                          >
                            <Code size={13} />
                            <span>&lt;/&gt;</span>
                          </button>
                        </div>

                        {/* Words and Characters Counter */}
                        <div className="text-[11px] font-sans text-gray-400 select-none shrink-0 pr-1">
                          Words: <span className="font-semibold text-gray-600">{wordCount}</span> &nbsp;&nbsp;
                          Characters: <span className="font-semibold text-gray-600">{charCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    {isHtmlMode ? (
                      <textarea
                        rows={10}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write custom HTML code here or switch to visual mode..."
                        className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-y min-h-[260px] custom-scrollbar border-0 rounded-b-2xl"
                      />
                    ) : (
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={(e) => {
                          setMessage(e.currentTarget.innerHTML);
                          saveSelection();
                        }}
                        onKeyUp={saveSelection}
                        onMouseUp={saveSelection}
                        onSelect={saveSelection}
                        data-placeholder="Write your email content here or switch to HTML mode..."
                        className="p-4 min-h-[260px] text-xs leading-relaxed focus:outline-none text-gray-800 font-sans custom-scrollbar prose prose-xs max-w-none rounded-b-2xl"
                      />
                    )}
                  </div>
                </div>

                {/* 6. Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="ghost"
                    icon={RotateCcw}
                    onClick={handleReset}
                    className="text-gray-500 hover:text-gray-700 text-xs"
                  >
                    Reset Form
                  </Button>

                  <Button
                    type="submit"
                    disabled={sending}
                    icon={Send}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 text-xs px-6 py-2.5 font-bold cursor-pointer"
                  >
                    {sending
                      ? 'Dispatching Email...'
                      : targetType === 'all'
                      ? `Broadcast to All Users (${usersList.length})`
                      : selectedUsers.length > 1
                      ? `Send to ${selectedUsers.length} Selected Users`
                      : 'Send Email Now'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Recent Sent Log Card */}
            {sentHistory.length > 0 && (
              <Card title="Recently Dispatched (This Session)">
                <div className="space-y-2.5">
                  {sentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{item.recipient}</p>
                          <p className="text-[11px] text-gray-400 truncate max-w-xs">{item.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                        <Clock size={12} />
                        {item.sentAt}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Live Email Preview (Col Span 5) */}
          <div className={`lg:col-span-5 space-y-4 ${showPreviewMobile ? 'block' : 'hidden lg:block'}`}>
            <Card title="Live Email Preview" icon={Eye}>
              <div className="text-[11px] text-gray-400 mb-3">
                Below is a 1:1 preview of how the recipient will see this email in their inbox.
              </div>

              {/* Email Container Mimic */}
              <div className="border border-gray-200 rounded-2xl bg-gray-50/80 p-4 font-sans shadow-inner overflow-hidden">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                  {/* Brand Header with CosmeGlow Logo */}
                  <div className="text-center pb-4 border-b border-gray-200">
                    <img
                      src="/logo.png"
                      alt="CosmeGlow"
                      className="h-10 mx-auto object-contain"
                    />
                  </div>

                  {/* Subject and Recipient Info */}
                  <div className="pt-2">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug">
                      {subject.trim() || 'Subject will appear here...'}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1">
                      To:{' '}
                      {targetType === 'all'
                        ? 'All Registered Users'
                        : selectedUsers.length === 1
                        ? `${selectedUsers[0].name || ''} <${selectedUsers[0].email}>`
                        : selectedUsers.length > 1
                        ? `${selectedUsers[0].name || selectedUsers[0].email}, ${selectedUsers[1].name || selectedUsers[1].email}${
                            selectedUsers.length > 2 ? ` (+${selectedUsers.length - 2} others)` : ''
                          } [${selectedUsers.length} recipients]`
                        : 'recipient@domain.com'}
                    </p>
                    {showCc && cc.trim() && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        <span className="font-semibold text-gray-600">CC:</span> {cc.trim()}
                      </p>
                    )}
                    {showBcc && bcc.trim() && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        <span className="font-semibold text-gray-600">BCC:</span> {bcc.trim()}
                      </p>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="border-t border-b border-gray-100 py-4 text-xs text-gray-700 leading-relaxed min-h-[120px]">
                    {message.trim() ? (
                      <div
                        className="space-y-2 email-preview-content"
                        dangerouslySetInnerHTML={{ __html: message }}
                      />
                    ) : (
                      <p className="text-gray-400 italic">
                        Write your message in the compose box to preview it formatted here...
                      </p>
                    )}
                  </div>

                  {/* Support Notice */}
                  <div className="text-center py-2 text-[11px] text-gray-500">
                    Need assistance? Contact our support team at{' '}
                    <span className="font-semibold text-gray-800">support@cosmeglow.com</span>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-150 pt-3 text-center text-[10px] text-gray-400">
                    &copy; {new Date().getFullYear()} <strong>COSMEGLOW</strong>. All rights reserved.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Select Registered Customer Modal (Multi-select with checkboxes!) */}
      {userModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-150 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">
                  Select Registered Customers
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select one or multiple users to receive this email ({tempSelectedIds.length} selected)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/60 space-y-3">
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 flex items-center justify-center pointer-events-none z-10">
                  <Search size={16} className="text-gray-400 shrink-0" />
                </div>
                <input
                  type="text"
                  placeholder="Search by customer name or email..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  style={{ paddingLeft: '2.75rem' }}
                  autoFocus
                />
              </div>

              {/* Master Select All Checkbox bar */}
              <div className="flex items-center justify-between px-1 text-xs">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-2 font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                >
                  {isAllModalSelected ? (
                    <CheckSquare size={16} className="text-indigo-600 fill-indigo-50" />
                  ) : (
                    <Square size={16} className="text-gray-400" />
                  )}
                  <span>
                    {isAllModalSelected ? 'Deselect All' : `Select All (${modalFilteredUsers.length})`}
                  </span>
                </button>
                <span className="text-[11px] text-gray-500 font-medium">
                  {tempSelectedIds.length} of {usersList.length} selected
                </span>
              </div>
            </div>

            {/* Modal User List with Checkboxes */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar divide-y divide-gray-50">
              {modalFilteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No registered users match your search.
                </div>
              ) : (
                modalFilteredUsers.map((u) => {
                  const isChecked = tempSelectedIds.includes(u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => toggleUserCheckbox(u._id)}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50/80 border border-indigo-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Custom Checkbox */}
                        <div className="shrink-0 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleUserCheckbox(u._id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>

                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${getAvatarGradient(u.name || u.email)} text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0`}>
                          {getInitials(u.name, u.email)}
                        </div>

                        {/* User Info */}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-xs truncate">
                            {u.name || 'Customer'}
                          </p>
                          <p className="text-[11px] text-gray-500 font-sans truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {u.orders !== undefined && u.orders > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80">
                            {u.orders} {u.orders === 1 ? 'order' : 'orders'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer with Confirm Button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-600">
                {tempSelectedIds.length} user(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmModalSelection}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm shadow-indigo-600/20 cursor-pointer"
                >
                  Done ({tempSelectedIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SendEmail;
