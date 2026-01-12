
import React, { useState, useEffect, useMemo } from 'react';
import { View, Member, Product, Employee, Payment, Plan, MemberStatus, Expense, CashSession } from './types';
import { INITIAL_MEMBERS, INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_PAYMENTS, INITIAL_PLANS } from './constants';
import { 
  Users, 
  LayoutDashboard, 
  CreditCard, 
  Package, 
  TrendingUp, 
  CheckCircle, 
  X, 
  MessageCircle,
  QrCode,
  Zap,
  Settings,
  Sun,
  Moon,
  Plus,
  Edit2,
  Trash2,
  IdCard,
  Search,
  UserCheck,
  LogOut,
  Lock,
  ArrowDownCircle,
  Wallet,
  BarChart3,
  PieChart,
  MoreHorizontal,
  History,
  Receipt,
  LogIn,
  AlertTriangle,
  Dumbbell,
  Sparkles,
  ChevronRight,
  ArrowUpCircle,
  Calendar,
  Smartphone,
  Share2,
  Copy,
  Link
} from 'lucide-react';
import { getGymInsights, getWorkoutRoutine } from './geminiService';

const App: React.FC = () => {
  // --- Estados Core ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('admin');
  const [loginForm, setLoginForm] = useState({ user: 'admin', pass: '' });
  const [darkMode, setDarkMode] = useState(false);
  const [businessName, setBusinessName] = useState('GymPro Manager');
  const [welcomeMsg, setWelcomeMsg] = useState('Bienvenido al Control Fitness');
  
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  // --- Estados de Rutinas ---
  const [selectedMemberForWorkout, setSelectedMemberForWorkout] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('Ganar Masa Muscular');
  const [selectedIntensity, setSelectedIntensity] = useState<string>('Intermedio');
  const [generatedWorkout, setGeneratedWorkout] = useState<string>('');
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

  // --- Estados de Caja ---
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [showCashModal, setShowCashModal] = useState(false);

  // --- Estados Animaciones / UI ---
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'member' | 'product' | 'plan' | 'employee' | 'expense' | 'payment', data: any } | null>(null);
  const [viewingCredential, setViewingCredential] = useState<Member | null>(null);
  const [checkInId, setCheckInId] = useState('');
  const [checkInMsg, setCheckInMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // --- Estados de Búsqueda y AI ---
  const [searchTerm, setSearchTerm] = useState('');
  const [financeTab, setFinanceTab] = useState<'Caja' | 'Ingresos' | 'Gastos'>('Caja');
  const [aiInsight, setAiInsight] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const stats = useMemo(() => {
    const totalIncomes = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'Activo').length,
      revenue: totalIncomes,
      totalExpenses,
      currentBalance: totalIncomes - totalExpenses,
      lowStock: products.filter(p => p.stock < 5).length
    };
  }, [members, payments, products, expenses]);

  const handleDelete = (type: string, id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    setDeletingId(id);
    setTimeout(() => {
      if (type === 'member') setMembers(members.filter(m => m.id !== id));
      if (type === 'product') setProducts(products.filter(p => p.id !== id));
      if (type === 'employee') setEmployees(employees.filter(e => e.id !== id));
      if (type === 'plan') setPlans(plans.filter(p => p.id !== id));
      if (type === 'expense') setExpenses(expenses.filter(e => e.id !== id));
      if (type === 'payment') setPayments(payments.filter(p => p.id !== id));
      setDeletingId(null);
    }, 300);
  };

  const handleShareApp = async () => {
    const shareData = {
      title: businessName,
      text: `¡Hola! Prueba nuestra app de gestión para el gimnasio: ${businessName}.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.log('Error al compartir:', err);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const saveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const type = editingItem?.type;
    if (!type) return;

    const id = editingItem?.data?.id || `${type.charAt(0)}-${Date.now()}`;

    if (type === 'member') {
      const updated: Member = {
        id: editingItem?.data?.id || Math.random().toString(36).substr(2, 5).toUpperCase(),
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        email: editingItem?.data?.email || '',
        status: formData.get('status') as MemberStatus,
        planId: formData.get('planId') as string,
        joinDate: editingItem?.data?.joinDate || new Date().toISOString().split('T')[0]
      };
      setMembers(prev => editingItem.data ? prev.map(m => m.id === updated.id ? updated : m) : [...prev, updated]);
    } else if (type === 'product') {
      const updated: Product = {
        id,
        name: formData.get('name') as string,
        price: Number(formData.get('price')),
        stock: Number(formData.get('stock'))
      };
      setProducts(prev => editingItem.data ? prev.map(p => p.id === updated.id ? updated : p) : [...prev, updated]);
    } else if (type === 'employee') {
      const updated: Employee = {
        id,
        name: formData.get('name') as string,
        role: formData.get('role') as any,
        phone: formData.get('phone') as string
      };
      setEmployees(prev => editingItem.data ? prev.map(emp => emp.id === updated.id ? updated : emp) : [...prev, updated]);
    } else if (type === 'plan') {
      const updated: Plan = {
        id,
        name: formData.get('name') as string,
        price: Number(formData.get('price')),
        durationMonths: Number(formData.get('duration'))
      };
      setPlans(prev => editingItem.data ? prev.map(p => p.id === updated.id ? updated : p) : [...prev, updated]);
    } else if (type === 'expense') {
      const updated: Expense = {
        id,
        concept: formData.get('concept') as string,
        amount: Number(formData.get('amount')),
        date: new Date().toISOString().split('T')[0],
        category: formData.get('category') as any
      };
      setExpenses(prev => editingItem.data ? prev.map(ex => ex.id === updated.id ? updated : ex) : [...prev, updated]);
    } else if (type === 'payment') {
      const updated: Payment = {
        id,
        memberId: formData.get('memberId') as string,
        amount: Number(formData.get('amount')),
        date: new Date().toISOString().split('T')[0],
        concept: formData.get('concept') as string
      };
      setPayments(prev => editingItem.data ? prev.map(p => p.id === updated.id ? updated : p) : [updated, ...prev]);
    }
    setEditingItem(null);
  };

  const handleOpenCash = (employeeId: string, amount: number) => {
    const newSession: CashSession = {
      id: `session-${Date.now()}`,
      employeeId,
      openingDate: new Date().toLocaleString(),
      openingBalance: amount,
      status: 'Abierta'
    };
    setCashSessions([newSession, ...cashSessions]);
    setActiveSession(newSession);
    setShowCashModal(false);
  };

  const handleCloseCash = (closingAmount: number) => {
    if (!activeSession) return;
    const incomesInSession = payments.filter(p => new Date(p.date) >= new Date(activeSession.openingDate)).reduce((a, b) => a + b.amount, 0);
    const expensesInSession = expenses.filter(e => new Date(e.date) >= new Date(activeSession.openingDate)).reduce((a, b) => a + b.amount, 0);
    const expected = activeSession.openingBalance + incomesInSession - expensesInSession;

    const updated = {
      ...activeSession,
      closingDate: new Date().toLocaleString(),
      closingBalance: closingAmount,
      expectedBalance: expected,
      status: 'Cerrada' as const
    };
    setCashSessions(prev => prev.map(s => s.id === activeSession.id ? updated : s));
    setActiveSession(null);
    setShowCashModal(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === 'admin' && loginForm.pass === adminPassword) setIsLoggedIn(true);
    else alert('Credenciales incorrectas');
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find(m => m.id.toUpperCase() === checkInId.toUpperCase());
    if (!member) {
      setCheckInMsg({ type: 'error', text: 'SOCIO NO ENCONTRADO' });
    } else if (member.status !== 'Activo') {
      setCheckInMsg({ type: 'error', text: 'MEMBRESÍA VENCIDA' });
    } else {
      setCheckInMsg({ type: 'success', text: `¡HOLA, ${member.name.split(' ')[0]}!` });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, lastCheckIn: new Date().toLocaleString() } : m));
    }
    setCheckInId('');
    setTimeout(() => setCheckInMsg(null), 3000);
  };

  const fetchInsights = async () => {
    setIsLoadingAi(true);
    const insight = await getGymInsights({ 
      members: members.length, 
      active: stats.activeMembers, 
      revenue: stats.revenue, 
      expenses: stats.totalExpenses 
    });
    setAiInsight(insight);
    setIsLoadingAi(false);
  };

  const handleGenerateWorkout = async () => {
    if (!selectedMemberForWorkout) {
        alert("Por favor selecciona un socio primero.");
        return;
    }
    setIsGeneratingWorkout(true);
    const member = members.find(m => m.id === selectedMemberForWorkout);
    const routine = await getWorkoutRoutine(member?.name || 'Socio', selectedGoal, selectedIntensity);
    setGeneratedWorkout(routine);
    setIsGeneratingWorkout(false);
  };

  const sendWhatsApp = (phone: string, message: string) => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getQRUrl = (id: string) => `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(id)}`;

  const NavItem = ({ active, icon: Icon, label, onClick }: any) => (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center space-y-1 py-2 px-4 rounded-[1.8rem] transition-all duration-300 ${
        active 
          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 scale-105 shadow-sm' 
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={24} className={active ? 'fill-emerald-600/10' : ''} />
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-slate-800 animate-slide-in">
           <div className="flex justify-center mb-10">
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                 <Zap className="text-white fill-current" size={40} />
              </div>
           </div>
           <h2 className="text-4xl font-black text-white text-center mb-2 tracking-tighter italic">GymPro</h2>
           <p className="text-slate-500 text-center mb-10 font-bold uppercase text-[10px] tracking-[0.3em]">Acceso Administrativo</p>
           <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="text" placeholder="USUARIO" 
                className="w-full bg-slate-800 border-none rounded-2xl py-5 px-6 text-white font-black text-center outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase"
                value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})}
              />
              <input 
                type="password" placeholder="CONTRASEÑA" 
                className="w-full bg-slate-800 border-none rounded-2xl py-5 px-6 text-white font-black text-center outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase"
                value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})}
              />
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 uppercase tracking-widest mt-4">Iniciar Sesión</button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 pb-36`}>
      <header className="fixed top-0 inset-x-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b dark:border-slate-800 px-8 py-5 flex justify-between items-center">
        <div className="flex items-center space-x-3 text-emerald-600">
           <Zap className="fill-current" size={24} />
           <span className="font-black text-2xl tracking-tighter dark:text-emerald-400 uppercase italic leading-none">{businessName}</span>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
           {activeSession && (
              <div className="hidden md:flex items-center bg-emerald-100 dark:bg-emerald-900/40 px-4 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold text-xs space-x-2 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Turno Activo: {employees.find(e => e.id === activeSession.employeeId)?.name}</span>
              </div>
           )}
           <button onClick={handleShareApp} className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:scale-110 transition-all relative">
              <Share2 size={20}/>
              {copiedLink && <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Copiado</span>}
           </button>
           <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:scale-110 transition-all">
              {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
           </button>
           <button onClick={() => setIsLoggedIn(false)} className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:scale-110 transition-all">
              <LogOut size={20} />
           </button>
        </div>
      </header>

      <main className="pt-28 px-4 md:px-6 max-w-7xl mx-auto">
        {/* --- DASHBOARD --- */}
        {currentView === 'Dashboard' && (
          <div className="space-y-10 animate-slide-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight italic">{welcomeMsg}</h1>
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] mt-2">Módulo de Control</p>
               </div>
               <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 flex items-center space-x-4 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white"><Wallet size={20}/></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Balance General</p>
                    <h4 className="text-xl font-black dark:text-white">${stats.currentBalance}</h4>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                { icon: Users, label: 'Socios', value: stats.totalMembers, color: 'blue' },
                { icon: CheckCircle, label: 'Activos', value: stats.activeMembers, color: 'emerald' },
                { icon: TrendingUp, label: 'Ventas', value: `$${stats.revenue}`, color: 'amber' },
                { icon: ArrowDownCircle, label: 'Gastos', value: `$${stats.totalExpenses}`, color: 'rose' }
              ].map((card, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                   <div className={`p-4 bg-${card.color}-100 dark:bg-${card.color}-900/30 text-${card.color}-600 rounded-2xl inline-flex mb-6 group-hover:scale-110 transition-transform`}><card.icon size={28} /></div>
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
                   <h3 className="text-3xl font-black dark:text-white tracking-tighter">{card.value}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- WORKOUTS --- */}
        {currentView === 'Workouts' && (
            <div className="space-y-10 animate-slide-in">
                <div className="bg-emerald-600 p-12 rounded-[4rem] text-white shadow-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10"><Dumbbell size={120} /></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="max-w-xl">
                            <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none mb-4 flex items-center gap-4">
                                Entrenador IA <Sparkles className="fill-current text-emerald-200 animate-pulse" />
                            </h2>
                            <p className="text-emerald-100 font-bold uppercase text-xs tracking-[0.2em]">Genera rutinas personalizadas de nivel experto para tus socios en segundos.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-xl space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Socio Destinatario</label>
                                <select 
                                    className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black uppercase text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    value={selectedMemberForWorkout}
                                    onChange={(e) => setSelectedMemberForWorkout(e.target.value)}
                                >
                                    <option value="">Seleccionar Socio...</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivo del Socio</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['Ganar Masa Muscular', 'Pérdida de Grasa', 'Fuerza Máxima', 'Resistencia', 'Flexibilidad'].map(goal => (
                                        <button 
                                            key={goal}
                                            onClick={() => setSelectedGoal(goal)}
                                            className={`w-full text-left p-4 rounded-xl font-bold text-xs transition-all flex justify-between items-center ${selectedGoal === goal ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                                        >
                                            {goal} {selectedGoal === goal && <ChevronRight size={16}/>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nivel de Intensidad</label>
                                <div className="flex gap-2">
                                    {['Principiante', 'Intermedio', 'Avanzado'].map(lvl => (
                                        <button 
                                            key={lvl}
                                            onClick={() => setSelectedIntensity(lvl)}
                                            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${selectedIntensity === lvl ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleGenerateWorkout}
                                disabled={isGeneratingWorkout}
                                className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isGeneratingWorkout ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Sparkles size={20}/>}
                                {isGeneratingWorkout ? 'Analizando...' : 'Generar Rutina'}
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900 min-h-[600px] p-10 rounded-[4rem] border dark:border-slate-800 shadow-xl overflow-hidden relative">
                            {!generatedWorkout && !isGeneratingWorkout ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-8">
                                        <Dumbbell size={64}/>
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Esperando Parámetros</h3>
                                    <p className="max-w-xs mx-auto mt-4 font-bold text-xs">Selecciona un socio y su objetivo para recibir una rutina profesional creada por IA.</p>
                                </div>
                            ) : isGeneratingWorkout ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-8 animate-bounce">
                                        <Sparkles size={48}/>
                                    </div>
                                    <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter animate-pulse">Entrenador IA Pensando...</h3>
                                    <p className="max-w-xs mx-auto mt-4 font-bold text-xs text-slate-400 uppercase tracking-widest">Diseñando bloques de entrenamiento personalizados</p>
                                </div>
                            ) : (
                                <div className="animate-success-pop">
                                    <div className="flex justify-between items-center mb-10 pb-6 border-b dark:border-slate-800">
                                        <div>
                                            <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter italic leading-none">Tu Plan Maestro</h3>
                                            <p className="text-emerald-500 font-black uppercase text-[10px] tracking-widest mt-2">Personalizado para {members.find(m => m.id === selectedMemberForWorkout)?.name}</p>
                                        </div>
                                        <button 
                                            onClick={() => sendWhatsApp(members.find(m => m.id === selectedMemberForWorkout)?.phone || '', `*RUTINA IA - ${businessName}*\n\nHola, aquí tienes tu rutina personalizada:\n\n${generatedWorkout}`)}
                                            className="bg-emerald-500/10 text-emerald-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all"
                                        >
                                            <MessageCircle size={18}/> Enviar Socio
                                        </button>
                                    </div>
                                    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line text-sm leading-relaxed">
                                        {generatedWorkout}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- CHECK-IN --- */}
        {currentView === 'CheckIn' && (
           <div className="max-w-md mx-auto pt-10 text-center animate-slide-in">
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border dark:border-slate-800 relative">
              <div className="w-24 h-24 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/30">
                <QrCode size={48} />
              </div>
              <h2 className="text-3xl font-black mb-8 dark:text-white uppercase tracking-tighter italic">Validar Acceso</h2>
              
              <form onSubmit={handleCheckIn} className="space-y-6">
                <input 
                  type="text" 
                  placeholder="ID SOCIO" 
                  className={`w-full px-6 py-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none dark:text-white focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-center text-4xl font-black tracking-widest uppercase placeholder:text-slate-200 ${checkInMsg?.type === 'error' ? 'animate-shake ring-2 ring-rose-500' : ''}`}
                  value={checkInId}
                  onChange={(e) => setCheckInId(e.target.value)}
                  autoFocus
                />
                <button className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 uppercase tracking-widest active:scale-95">
                  Registrar Entrada
                </button>
              </form>

              {checkInMsg && (
                <div className={`mt-8 p-8 rounded-[2rem] flex items-center justify-center space-x-4 animate-success-pop shadow-2xl ${
                  checkInMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {checkInMsg.type === 'success' ? <CheckCircle size={40} /> : <X size={40} />}
                  <span className="font-black text-2xl uppercase tracking-tighter italic">{checkInMsg.text}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- AJUSTES --- */}
        {currentView === 'Settings' && (
           <div className="max-w-3xl mx-auto space-y-10 animate-slide-in pb-20">
              {/* SECCIÓN: COMPARTIR APP (EL LINK) */}
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border dark:border-slate-800 shadow-xl overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-10 opacity-5"><Link size={100} /></div>
                 <h3 className="text-3xl font-black mb-10 dark:text-white uppercase tracking-tighter italic leading-none flex items-center gap-3">
                    <Share2 className="text-emerald-500" /> Enlace de Acceso
                 </h3>
                 <div className="flex flex-col md:flex-row gap-10 items-center">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border dark:border-slate-800">
                        <img src={getQRUrl(window.location.href)} alt="App QR" className="w-48 h-48" />
                        <p className="text-[9px] font-black text-center mt-4 text-slate-400 uppercase tracking-widest">Escanear para entrar</p>
                    </div>
                    <div className="flex-1 space-y-6 w-full">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Directa de la App</label>
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700">
                                <span className="text-xs font-bold text-slate-500 truncate flex-1 lowercase">{window.location.href}</span>
                                <button onClick={copyToClipboard} className={`ml-4 p-3 rounded-xl transition-all ${copiedLink ? 'bg-emerald-500 text-white' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                                    {copiedLink ? <CheckCircle size={18}/> : <Copy size={18}/>}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={handleShareApp} className="flex items-center justify-center gap-3 bg-slate-950 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl">
                                <Share2 size={18}/> Menú Compartir
                            </button>
                            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`¡Hola! Te comparto el sistema de gestión de ${businessName}: ${window.location.href}`)}`, '_blank')} className="flex items-center justify-center gap-3 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-xl">
                                <MessageCircle size={18}/> Enviar WhatsApp
                            </button>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border dark:border-slate-800 shadow-xl">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter italic leading-none">Configuración Visual</h3>
                 </div>
                 <div className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial del Gimnasio</label>
                       <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-black text-2xl outline-none dark:text-white shadow-inner uppercase italic border-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje de Pantalla de Inicio</label>
                       <input value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-bold text-lg outline-none dark:text-white shadow-inner border-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    
                    {/* SECCIÓN DE INSTALACIÓN */}
                    <div className="pt-8 border-t dark:border-slate-800 space-y-6">
                        <h4 className="text-xl font-black dark:text-white uppercase flex items-center gap-2 italic">
                            <Smartphone size={20} className="text-emerald-500"/> Guía de Instalación Móvil
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border dark:border-slate-700">
                                <p className="font-black text-xs uppercase mb-3 flex items-center gap-2">
                                    <Smartphone size={16} /> En Android (Chrome)
                                </p>
                                <ol className="text-[11px] text-slate-500 dark:text-slate-400 font-bold space-y-2 list-decimal ml-4 uppercase tracking-tighter">
                                    <li>Abre el enlace de arriba</li>
                                    <li>Toca los tres puntos (⋮)</li>
                                    <li>Dale a "Instalar aplicación"</li>
                                </ol>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border dark:border-slate-700">
                                <p className="font-black text-xs uppercase mb-3 flex items-center gap-2">
                                    <Smartphone size={16} /> En iPhone (Safari)
                                </p>
                                <ol className="text-[11px] text-slate-500 dark:text-slate-400 font-bold space-y-2 list-decimal ml-4 uppercase tracking-tighter">
                                    <li>Abre el enlace arriba</li>
                                    <li>Toca el botón "Compartir"</li>
                                    <li>"Añadir a pantalla de inicio"</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t dark:border-slate-800">
                       <h4 className="text-xl font-black dark:text-white uppercase mb-6 flex items-center gap-2 italic"><Lock size={18} className="text-rose-500"/> Seguridad Administrativa</h4>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Clave de Administrador</label>
                          <input type="password" placeholder="Ingresa nueva clave..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 font-black text-xl outline-none dark:text-white shadow-inner border-none focus:ring-2 focus:ring-rose-500/20" onBlur={(e) => { if(e.target.value) { setAdminPassword(e.target.value); alert("Contraseña actualizada con éxito"); e.target.value = ""; } }} />
                       </div>
                    </div>
                    <div className="pt-10 flex justify-between items-center p-8 bg-slate-100 dark:bg-slate-800/40 rounded-[2.5rem] shadow-inner">
                       <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-white text-slate-600 shadow-sm'}`}>{darkMode ? <Sun size={24}/> : <Moon size={24}/>}</div>
                          <div><span className="font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter text-lg">Modo de Interfaz</span></div>
                       </div>
                       <button onClick={() => setDarkMode(!darkMode)} className={`w-16 h-10 rounded-full p-2 transition-all shadow-lg ${darkMode ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`w-6 h-6 bg-white rounded-full transition-all shadow-md ${darkMode ? 'translate-x-6' : ''}`} /></button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- ANALYTICS --- */}
        {currentView === 'Analytics' && (
           <div className="space-y-10 animate-slide-in">
              <h3 className="text-4xl font-black dark:text-white uppercase tracking-tighter italic leading-none">Métricas de Rendimiento</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border dark:border-slate-800 shadow-xl">
                    <h4 className="text-xl font-black dark:text-white mb-8 flex items-center gap-2 italic uppercase"><BarChart3 size={20} className="text-emerald-500"/> Flujo de Efectivo</h4>
                    <div className="flex items-end justify-between h-48 px-10">
                       <div className="flex flex-col items-center gap-2 w-1/3">
                          <div className="w-full bg-emerald-500 rounded-t-2xl shadow-lg transition-all" style={{ height: `${(stats.revenue / (stats.revenue + stats.totalExpenses || 1)) * 100}%` }}></div>
                          <span className="text-[10px] font-black dark:text-slate-400 uppercase mt-4">Ventas</span>
                       </div>
                       <div className="flex flex-col items-center gap-2 w-1/3">
                          <div className="w-full bg-rose-500 rounded-t-2xl shadow-lg transition-all" style={{ height: `${(stats.totalExpenses / (stats.revenue + stats.totalExpenses || 1)) * 100}%` }}></div>
                          <span className="text-[10px] font-black dark:text-slate-400 uppercase mt-4">Gastos</span>
                       </div>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border dark:border-slate-800 shadow-xl">
                    <h4 className="text-xl font-black dark:text-white mb-8 flex items-center gap-2 italic uppercase"><PieChart size={20} className="text-blue-500"/> Salud del Padrón</h4>
                    <div className="flex flex-col gap-6">
                       {[
                          { label: 'Activos', val: stats.activeMembers, c: 'bg-emerald-500' },
                          { label: 'Vencidos', val: members.filter(m => m.status === 'Vencido').length, c: 'bg-rose-500' },
                          { label: 'Inactivos', val: members.filter(m => m.status === 'Inactivo').length, c: 'bg-slate-400' }
                       ].map((item, i) => (
                          <div key={i} className="space-y-2">
                             <div className="flex justify-between text-xs font-black uppercase dark:text-slate-300 tracking-widest">
                                <span>{item.label}</span>
                                <span>{item.val}</span>
                             </div>
                             <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full ${item.c} shadow-2xl shadow-black/20 transition-all`} style={{ width: `${(item.val / (members.length || 1)) * 100}%` }}></div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- AI INSIGHTS --- */}
        {currentView === 'AI' && (
           <div className="max-w-4xl mx-auto pt-6 animate-slide-in">
              <div className="bg-slate-950 p-16 rounded-[4rem] text-white text-center shadow-3xl relative overflow-hidden border border-white/5">
                 <div className="absolute top-0 right-0 p-12"><Zap size={64} className="text-emerald-500 fill-current opacity-20 blur-sm" /></div>
                 <h2 className="text-5xl font-black mb-6 tracking-tighter italic">AI Business Coach</h2>
                 <p className="text-slate-500 mb-14 max-w-sm mx-auto font-black uppercase text-[11px] tracking-[0.4em]">Algoritmos de Optimización GymPro</p>
                 <button onClick={fetchInsights} disabled={isLoadingAi} className="bg-white text-slate-950 px-16 py-7 rounded-[2.5rem] font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-white/20 shadow-2xl uppercase tracking-widest">
                    {isLoadingAi ? 'ANALIZANDO...' : 'Obtener Estrategia'}
                 </button>
              </div>
              {aiInsight && (
                <div className="mt-12 bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-2xl border dark:border-slate-800 leading-relaxed text-lg dark:text-slate-300 font-medium whitespace-pre-line animate-success-pop">
                   <div className="flex items-center space-x-4 mb-8 text-emerald-500">
                      <TrendingUp size={40}/>
                      <h3 className="font-black uppercase tracking-tighter text-3xl italic">Diagnóstico Estratégico</h3>
                   </div>
                   {aiInsight}
                </div>
              )}
           </div>
        )}

        {/* --- PLANES --- */}
        {currentView === 'Plans' && (
           <div className="space-y-10 animate-slide-in">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-xl border dark:border-slate-800 gap-6">
                 <div>
                    <h3 className="text-4xl font-black dark:text-white uppercase tracking-tighter italic leading-none">Membresías</h3>
                    <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mt-2">Ofertas y suscripciones del gimnasio</p>
                 </div>
                 <button onClick={() => setEditingItem({ type: 'plan', data: null })} className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-3 active:scale-95">
                    <Plus size={24}/> Nuevo Plan
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {plans.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
                       <div className="absolute top-0 right-0 p-8 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingItem({ type: 'plan', data: p })} className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Edit2 size={18}/></button>
                          <button onClick={() => handleDelete('plan', p.id)} className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl"><Trash2 size={18}/></button>
                       </div>
                       <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-8"><Zap size={32}/></div>
                       <h4 className="text-3xl font-black dark:text-white uppercase tracking-tighter mb-2 italic leading-none">{p.name}</h4>
                       <div className="flex items-baseline space-x-3 mb-8">
                          <span className="text-5xl font-black text-emerald-600 tracking-tighter">${p.price}</span>
                          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Pago Único</span>
                       </div>
                       <div className="pt-8 border-t dark:border-slate-800">
                          <div className="flex items-center gap-3 text-slate-500 font-black text-xs uppercase tracking-widest italic">
                             <History size={16}/> 
                             <span>Validez: {p.durationMonths} {p.durationMonths === 1 ? 'Mes' : 'Meses'}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- STAFF --- */}
        {currentView === 'Employees' && (
           <div className="space-y-10 animate-slide-in">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-xl border dark:border-slate-800 gap-6">
                 <div>
                    <h3 className="text-4xl font-black dark:text-white uppercase tracking-tighter italic leading-none">Equipo Staff</h3>
                    <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mt-2">Gestión de instructores y administración</p>
                 </div>
                 <button onClick={() => setEditingItem({ type: 'employee', data: null })} className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95">
                    <UserCheck size={20}/> Añadir Personal
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {employees.map(e => (
                    <div key={e.id} className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border dark:border-slate-800 shadow-sm group hover:shadow-2xl transition-all relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingItem({ type: 'employee', data: e })} className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Edit2 size={18}/></button>
                          <button onClick={() => handleDelete('employee', e.id)} className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl"><Trash2 size={18}/></button>
                       </div>
                       <div className="flex flex-col items-center text-center">
                          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-slate-400 mb-6 group-hover:scale-110 transition-transform">
                             {e.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <h4 className="text-3xl font-black dark:text-white uppercase tracking-tighter mb-2 italic leading-none">{e.name}</h4>
                          <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 ${
                             e.role === 'Admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                             e.role === 'Instructor' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                             'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                          }`}>
                             {e.role}
                          </span>
                          <div className="w-full pt-8 border-t dark:border-slate-800">
                             <button onClick={() => sendWhatsApp(e.phone, `Hola ${e.name}, mensaje administrativo de ${businessName}.`)} className="w-full flex items-center justify-center space-x-3 bg-slate-950 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all">
                                <MessageCircle size={18} /> <span>Contactar Staff</span>
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- STOCK --- */}
        {currentView === 'Products' && (
           <div className="space-y-10 animate-slide-in">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-xl border dark:border-slate-800 gap-6">
                 <div>
                    <h3 className="text-4xl font-black dark:text-white uppercase tracking-tighter italic leading-none">Inventario</h3>
                    <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mt-2">Gestión de suplementos y productos</p>
                 </div>
                 <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative">
                       <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                          type="text" 
                          placeholder="Buscar producto..." 
                          className="pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-sm w-full md:w-80 dark:text-white shadow-inner"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setEditingItem({ type: 'product', data: null })} className="bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                       <Plus size={20}/> Nuevo Producto
                    </button>
                 </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                 {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
                       <div className="flex justify-between items-start mb-6">
                          <div className={`p-4 rounded-2xl ${p.stock < 5 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
                             <Package size={28} />
                          </div>
                          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => setEditingItem({ type: 'product', data: p })} className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Edit2 size={18}/></button>
                             <button onClick={() => handleDelete('product', p.id)} className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl"><Trash2 size={18}/></button>
                          </div>
                       </div>
                       <h4 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-4 italic leading-tight">{p.name}</h4>
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio</p>
                             <span className="text-3xl font-black text-emerald-600 tracking-tighter">${p.price}</span>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cant.</p>
                             <span className={`text-xl font-black ${p.stock < 5 ? 'text-rose-500 animate-pulse' : 'dark:text-white'}`}>
                                {p.stock}
                             </span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- SOCIOS --- */}
        {currentView === 'Members' && (
           <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border dark:border-slate-800 shadow-xl overflow-hidden animate-slide-in">
              <div className="p-10 border-b dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div>
                    <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter italic leading-none">Padre de Socios</h3>
                    <div className="mt-4 relative">
                       <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                          type="text" 
                          placeholder="Nombre o ID..." 
                          className="pl-12 pr-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold text-sm w-full md:w-80 dark:text-white shadow-inner"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                 </div>
                 <button onClick={() => setEditingItem({ type: 'member', data: null })} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-lg shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95">
                    <Plus size={20} /> <span>Añadir</span>
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b dark:border-slate-800">
                       <tr>
                          <th className="px-10 py-5">Nombre / ID</th>
                          <th className="px-10 py-5">Plan</th>
                          <th className="px-10 py-5">Estado</th>
                          <th className="px-10 py-5 text-right">Acciones</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                       {members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                          <tr key={m.id} className={`transition-all ${deletingId === m.id ? 'animate-shrink-out' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}`}>
                             <td className="px-10 py-6">
                                <div className="font-black dark:text-white text-lg tracking-tight uppercase leading-tight italic">{m.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {m.id} • {m.phone}</div>
                             </td>
                             <td className="px-10 py-6">
                                <span className="text-[10px] font-black dark:text-slate-300 uppercase tracking-tighter whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border dark:border-slate-700">
                                   {plans.find(p => p.id === m.planId)?.name || 'Sin Plan'}
                                </span>
                             </td>
                             <td className="px-10 py-6">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${m.status === 'Activo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                                   {m.status}
                                </span>
                             </td>
                             <td className="px-10 py-6 text-right space-x-3">
                                <button onClick={() => setViewingCredential(m)} className="text-slate-300 hover:text-emerald-500 transition-all"><IdCard size={22}/></button>
                                <button onClick={() => setEditingItem({ type: 'member', data: m })} className="text-slate-300 hover:text-blue-500 transition-all"><Edit2 size={22}/></button>
                                <button onClick={() => handleDelete('member', m.id)} className="text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={22}/></button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* --- FINANZAS (CAJA/INGRESOS/GASTOS) --- */}
        {currentView === 'Payments' && (
           <div className="space-y-10 animate-slide-in">
              <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] border dark:border-slate-800 w-fit shadow-sm mx-auto mb-10">
                 {['Caja', 'Ingresos', 'Gastos'].map((tab) => (
                    <button 
                       key={tab} 
                       onClick={() => setFinanceTab(tab as any)}
                       className={`px-10 py-4 rounded-[2rem] font-black text-xs uppercase transition-all ${financeTab === tab ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                       {tab}
                    </button>
                 ))}
              </div>
              
              {financeTab === 'Caja' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-2xl border dark:border-slate-800 text-center flex flex-col items-center justify-center">
                       <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center mb-8 shadow-2xl ${activeSession ? 'bg-rose-500' : 'bg-emerald-500'} text-white`}>
                          <Wallet size={48} />
                       </div>
                       <h3 className="text-3xl font-black dark:text-white uppercase mb-4 italic tracking-tighter">Control de Turno</h3>
                       {activeSession ? (
                          <div className="space-y-6 w-full max-w-sm">
                             <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cajero Responsable</p>
                                <p className="text-xl font-black dark:text-white uppercase">{employees.find(e => e.id === activeSession.employeeId)?.name}</p>
                                <div className="mt-4 flex justify-between items-center text-xs">
                                   <span className="text-slate-400 font-bold uppercase">Balance Apertura:</span>
                                   <span className="font-black dark:text-emerald-400">${activeSession.openingBalance}</span>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setEditingItem({ type: 'payment', data: null })} className="bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 transition-all active:scale-95">
                                   + Ingreso
                                </button>
                                <button onClick={() => setEditingItem({ type: 'expense', data: null })} className="bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-rose-700 transition-all active:scale-95">
                                   + Gasto
                                </button>
                             </div>
                             <button onClick={() => setShowCashModal(true)} className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black uppercase text-sm shadow-xl hover:bg-slate-800 transition-all active:scale-95 border border-white/10">
                                Finalizar Turno
                             </button>
                          </div>
                       ) : (
                          <div className="space-y-6 w-full max-w-sm">
                             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay una sesión de caja activa</p>
                             <button onClick={() => setShowCashModal(true)} className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black uppercase text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                                <LogIn size={20}/> Abrir Nueva Caja
                             </button>
                          </div>
                       )}
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] shadow-xl border dark:border-slate-800">
                       <div className="flex items-center gap-3 mb-8">
                          <History className="text-emerald-500" size={24}/>
                          <h3 className="text-2xl font-black dark:text-white uppercase italic tracking-tighter">Historial Sesiones</h3>
                       </div>
                       <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                          {cashSessions.map(s => (
                             <div key={s.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border dark:border-slate-700">
                                <div className="flex justify-between items-start mb-2">
                                   <p className="text-sm font-black dark:text-white uppercase italic">{employees.find(e => e.id === s.employeeId)?.name}</p>
                                   <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${s.status === 'Abierta' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                                      {s.status}
                                   </span>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{s.openingDate}</p>
                                <div className="flex justify-between font-black text-xs dark:text-white">
                                   <span>Inicio: ${s.openingBalance}</span>
                                   <span>Cierre: {s.closingBalance !== undefined ? `$${s.closingBalance}` : '---'}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              )}

              {financeTab === 'Ingresos' && (
                 <div className="space-y-8 animate-slide-in">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full md:w-auto">
                          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Ingresos</p>
                             <h4 className="text-3xl font-black text-emerald-600 tracking-tighter">${stats.revenue}</h4>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagos Recibidos</p>
                             <h4 className="text-3xl font-black dark:text-white tracking-tighter">{payments.length}</h4>
                          </div>
                       </div>
                       <button onClick={() => setEditingItem({ type: 'payment', data: null })} className="w-full md:w-auto bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                          <Plus size={20}/> Registrar Ingreso
                       </button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] border dark:border-slate-800 shadow-xl overflow-hidden">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b dark:border-slate-800">
                             <tr>
                                <th className="px-10 py-5">Socio / Concepto</th>
                                <th className="px-10 py-5">Fecha</th>
                                <th className="px-10 py-5 text-right">Acciones</th>
                                <th className="px-10 py-5 text-right">Monto</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y dark:divide-slate-800">
                             {payments.map(p => (
                                <tr key={p.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all ${deletingId === p.id ? 'animate-shrink-out' : ''}`}>
                                   <td className="px-10 py-6">
                                      <div className="font-black dark:text-white uppercase italic text-sm">{members.find(m => m.id === p.memberId)?.name || 'General / Venta'}</div>
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.concept}</div>
                                   </td>
                                   <td className="px-10 py-6">
                                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                                         <Calendar size={14}/> {p.date}
                                      </div>
                                   </td>
                                   <td className="px-10 py-6 text-right space-x-2">
                                      <button onClick={() => setEditingItem({ type: 'payment', data: p })} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><Edit2 size={16}/></button>
                                      <button onClick={() => handleDelete('payment', p.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"><Trash2 size={16}/></button>
                                   </td>
                                   <td className="px-10 py-6 text-right font-black text-emerald-600 text-lg tracking-tighter">
                                      ${p.amount}
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}

              {financeTab === 'Gastos' && (
                 <div className="space-y-8 animate-slide-in">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full md:w-auto">
                          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Gastos</p>
                             <h4 className="text-3xl font-black text-rose-600 tracking-tighter">${stats.totalExpenses}</h4>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registros</p>
                             <h4 className="text-3xl font-black dark:text-white tracking-tighter">{expenses.length}</h4>
                          </div>
                       </div>
                       <button onClick={() => setEditingItem({ type: 'expense', data: null })} className="w-full md:w-auto bg-rose-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-sm shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                          <Plus size={20}/> Registrar Gasto
                       </button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] border dark:border-slate-800 shadow-xl overflow-hidden">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b dark:border-slate-800">
                             <tr>
                                <th className="px-10 py-5">Concepto / Categoría</th>
                                <th className="px-10 py-5">Fecha</th>
                                <th className="px-10 py-5 text-right">Acciones</th>
                                <th className="px-10 py-5 text-right">Monto</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y dark:divide-slate-800">
                             {expenses.map(e => (
                                <tr key={e.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all ${deletingId === e.id ? 'animate-shrink-out' : ''}`}>
                                   <td className="px-10 py-6">
                                      <div className="font-black dark:text-white uppercase italic text-sm">{e.concept}</div>
                                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-lg">
                                         {e.category}
                                      </span>
                                   </td>
                                   <td className="px-10 py-6">
                                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                                         <Calendar size={14}/> {e.date}
                                      </div>
                                   </td>
                                   <td className="px-10 py-6 text-right space-x-2">
                                      <button onClick={() => setEditingItem({ type: 'expense', data: e })} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><Edit2 size={16}/></button>
                                      <button onClick={() => handleDelete('expense', e.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"><Trash2 size={16}/></button>
                                   </td>
                                   <td className="px-10 py-6 text-right font-black text-rose-600 text-lg tracking-tighter">
                                      -${e.amount}
                                   </td>
                                </tr>
                             ))}
                             {expenses.length === 0 && (
                                <tr>
                                   <td colSpan={4} className="px-10 py-12 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic opacity-40">
                                      No hay gastos registrados todavía
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}
           </div>
        )}
      </main>

      {/* --- DOCK NAVIGATION --- */}
      <nav className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-6 pointer-events-none">
         <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-3xl border dark:border-slate-800 p-3 rounded-[2.8rem] shadow-2xl flex items-center gap-2 pointer-events-auto max-w-full overflow-x-auto scrollbar-hide">
            <NavItem active={currentView === 'Dashboard'} icon={LayoutDashboard} label="Home" onClick={() => {setCurrentView('Dashboard'); setIsMoreMenuOpen(false);}} />
            <NavItem active={currentView === 'CheckIn'} icon={QrCode} label="Entrada" onClick={() => {setCurrentView('CheckIn'); setIsMoreMenuOpen(false);}} />
            <NavItem active={currentView === 'Members'} icon={Users} label="Socios" onClick={() => {setCurrentView('Members'); setIsMoreMenuOpen(false);}} />
            <NavItem active={currentView === 'Payments'} icon={CreditCard} label="Caja" onClick={() => {setCurrentView('Payments'); setIsMoreMenuOpen(false);}} />
            <NavItem active={currentView === 'Analytics'} icon={BarChart3} label="Gráficas" onClick={() => {setCurrentView('Analytics'); setIsMoreMenuOpen(false);}} />
            <div className="w-[1px] h-10 bg-slate-200 dark:bg-slate-800 mx-1" />
            <NavItem active={currentView === 'Products'} icon={Package} label="Stock" onClick={() => {setCurrentView('Products'); setIsMoreMenuOpen(false);}} />
            <NavItem active={isMoreMenuOpen} icon={MoreHorizontal} label="Menu" onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} />
         </div>
      </nav>

      {/* Menú Flotante Más */}
      {isMoreMenuOpen && (
         <div className="fixed bottom-32 inset-x-0 z-50 flex justify-center px-8 animate-success-pop">
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-[3.5rem] shadow-3xl w-full max-w-[320px] grid grid-cols-2 gap-4">
               {[
                 { v: 'Workouts', i: Dumbbell, l: 'Rutinas IA', c: 'text-emerald-500' },
                 { v: 'Plans', i: Zap, l: 'Planes', c: 'text-emerald-500' },
                 { v: 'Employees', i: UserCheck, l: 'Staff', c: 'text-blue-500' },
                 { v: 'AI', i: TrendingUp, l: 'Insights', c: 'text-amber-500' },
                 { v: 'Settings', i: Settings, l: 'Ajustes', c: 'text-slate-400' }
               ].map((btn, idx) => (
                  <button key={idx} onClick={() => {setCurrentView(btn.v as View); setIsMoreMenuOpen(false);}} className={`flex flex-col items-center p-6 rounded-[2.5rem] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${btn.c} active:scale-95`}>
                     <btn.i size={28} />
                     <span className="text-[10px] font-black uppercase tracking-widest mt-3 text-slate-500">{btn.l}</span>
                  </button>
               ))}
            </div>
         </div>
      )}

      {/* MODAL GESTIÓN DE CAJA */}
      {showCashModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in zoom-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3.5rem] shadow-3xl overflow-hidden border dark:border-slate-800">
              <div className="p-10 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                 <h3 className="text-xl font-black dark:text-white uppercase italic tracking-tighter leading-none">{activeSession ? 'Cierre de Caja' : 'Apertura de Turno'}</h3>
                 <button onClick={() => setShowCashModal(false)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={20}/></button>
              </div>
              <form onSubmit={(e) => {
                 e.preventDefault();
                 const formData = new FormData(e.currentTarget);
                 if (activeSession) {
                    handleCloseCash(Number(formData.get('amount')));
                 } else {
                    handleOpenCash(formData.get('employeeId') as string, Number(formData.get('amount')));
                 }
              }} className="p-10 space-y-6">
                 {!activeSession && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Cajero Responsable</label>
                       <select name="employeeId" required className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black uppercase text-xs shadow-inner outline-none border-none focus:ring-2 focus:ring-emerald-500/20">
                          {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                       </select>
                    </div>
                 )}
                 <div className="space-y-2 text-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{activeSession ? 'Dinero Real en Caja $' : 'Fondo de Apertura $'}</label>
                    <input name="amount" type="number" required placeholder="0.00" className="w-full p-8 rounded-[2.5rem] bg-slate-950 text-white font-black text-5xl outline-none text-center shadow-2xl" />
                 </div>
                 <button type="submit" className={`w-full ${activeSession ? 'bg-rose-600' : 'bg-emerald-600'} text-white py-6 rounded-3xl font-black text-lg shadow-xl transition-all uppercase tracking-widest active:scale-95`}>
                    {activeSession ? 'Confirmar Cierre' : 'Abrir Turno'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL CRUD GENERAL */}
      {editingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in zoom-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden border dark:border-slate-800">
              <div className="p-10 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                 <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter italic leading-none">Gestión de {editingItem.type}</h3>
                 <button onClick={() => setEditingItem(null)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-400 hover:text-rose-500 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={saveItem} className="p-10 space-y-6">
                 {editingItem.type === 'plan' && (
                    <div className="space-y-6">
                       <input name="name" defaultValue={editingItem.data?.name} required placeholder="Nombre del Plan" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black border-none outline-none" />
                       <div className="grid grid-cols-2 gap-4">
                          <input name="price" type="number" defaultValue={editingItem.data?.price} required placeholder="Precio $" className="p-5 rounded-2xl bg-slate-950 text-white font-black border-none outline-none" />
                          <input name="duration" type="number" defaultValue={editingItem.data?.durationMonths} required placeholder="Meses" className="p-5 rounded-2xl bg-slate-950 text-white font-black border-none outline-none" />
                       </div>
                    </div>
                 )}
                 {editingItem.type === 'member' && (
                    <div className="space-y-6">
                       <input name="name" defaultValue={editingItem.data?.name} required placeholder="Nombre Completo" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black border-none outline-none" />
                       <input name="phone" defaultValue={editingItem.data?.phone} placeholder="WhatsApp (52...)" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black border-none outline-none" />
                       <div className="grid grid-cols-2 gap-4">
                          <select name="planId" className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black border-none dark:text-white outline-none">
                             {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <select name="status" className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black border-none dark:text-white outline-none">
                             <option value="Activo">Activo</option>
                             <option value="Vencido">Vencido</option>
                          </select>
                       </div>
                    </div>
                 )}
                 {editingItem.type === 'product' && (
                    <div className="space-y-6">
                       <input name="name" defaultValue={editingItem.data?.name} required placeholder="Nombre Producto" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black border-none outline-none" />
                       <div className="grid grid-cols-2 gap-4">
                          <input name="price" type="number" defaultValue={editingItem.data?.price} required placeholder="Precio $" className="p-5 rounded-2xl bg-slate-950 text-white font-black border-none outline-none" />
                          <input name="stock" type="number" defaultValue={editingItem.data?.stock} required placeholder="Stock" className="p-5 rounded-2xl bg-slate-950 text-white font-black border-none outline-none" />
                       </div>
                    </div>
                 )}
                 {editingItem.type === 'employee' && (
                    <div className="space-y-6">
                       <input name="name" defaultValue={editingItem.data?.name} required placeholder="Nombre Staff" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black border-none outline-none" />
                       <input name="phone" defaultValue={editingItem.data?.phone} placeholder="WhatsApp Staff" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black border-none outline-none" />
                       <select name="role" defaultValue={editingItem.data?.role || 'Instructor'} className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black border-none dark:text-white outline-none">
                            <option value="Admin">Admin</option>
                            <option value="Instructor">Instructor</option>
                            <option value="Recepcionista">Recepcionista</option>
                       </select>
                    </div>
                 )}
                 {editingItem.type === 'expense' && (
                    <div className="space-y-6">
                       <input name="concept" defaultValue={editingItem.data?.concept} required placeholder="Concepto (Ej: Luz, Renta)" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black border-none outline-none" />
                       <div className="grid grid-cols-2 gap-4">
                          <select name="category" defaultValue={editingItem.data?.category || 'Otros'} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black border-none dark:text-white outline-none">
                             <option value="Mantenimiento">Mantenimiento</option>
                             <option value="Servicios">Servicios</option>
                             <option value="Sueldos">Sueldos</option>
                             <option value="Limpieza">Limpieza</option>
                             <option value="Otros">Otros</option>
                          </select>
                          <input name="amount" type="number" defaultValue={editingItem.data?.amount} required placeholder="Monto $" className="p-5 rounded-2xl bg-slate-950 text-white font-black border-none outline-none" />
                       </div>
                    </div>
                 )}
                 {editingItem.type === 'payment' && (
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Socio (Opcional)</label>
                          <select name="memberId" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black border-none outline-none">
                             <option value="">Ingreso General (Venta)</option>
                             {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                       </div>
                       <input name="concept" defaultValue={editingItem.data?.concept} required placeholder="Concepto del Ingreso (Ej: Mensualidad, Suplemento)" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-black border-none outline-none" />
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto del Pago $</label>
                          <input name="amount" type="number" defaultValue={editingItem.data?.amount} required placeholder="0.00" className="w-full p-6 rounded-2xl bg-slate-950 text-white font-black text-3xl outline-none text-center" />
                       </div>
                    </div>
                 )}
                 <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-xl shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest active:scale-95">Confirmar Guardado</button>
              </form>
           </div>
        </div>
      )}

      {/* CREDENCIAL MODAL */}
      {viewingCredential && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-sm animate-success-pop">
             <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[4rem] p-10 text-white shadow-3xl relative overflow-hidden border border-white/20">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
                <div className="flex justify-between items-start relative z-10 mb-10">
                   <h4 className="text-2xl font-black tracking-tighter uppercase italic">{businessName}</h4>
                   <IdCard size={40} className="opacity-20" />
                </div>
                <div className="flex flex-col items-center mb-10 relative z-10">
                  <div className="bg-white p-5 rounded-[2.5rem] mb-6 shadow-2xl"><img src={getQRUrl(viewingCredential.id)} alt="QR" className="w-40 h-40 rounded-xl"/></div>
                  <h3 className="text-3xl font-black mb-1 uppercase tracking-tighter italic text-center leading-none">{viewingCredential.name}</h3>
                  <p className="text-emerald-200 text-[10px] font-black uppercase tracking-[0.2em] bg-black/30 px-6 py-1.5 rounded-full mt-4">Socio ID: {viewingCredential.id}</p>
                </div>
                <div className="flex justify-between items-center relative z-10 border-t border-white/20 pt-8 uppercase font-black text-[9px] tracking-[0.2em]">
                   <span className="opacity-70">{plans.find(p => p.id === viewingCredential.planId)?.name}</span>
                   <span className="bg-white text-emerald-800 px-3 py-1 rounded-full">{viewingCredential.status}</span>
                </div>
             </div>
             <div className="mt-8 space-y-3">
                <button onClick={() => sendWhatsApp(viewingCredential.phone, `¡Hola ${viewingCredential.name}! Tu pase digital de ${businessName} está activo.`)} className="w-full bg-white text-slate-950 py-5 rounded-[1.8rem] font-black shadow-2xl flex items-center justify-center space-x-3 uppercase tracking-widest text-xs hover:scale-[1.03] transition-all">
                   <MessageCircle size={22} /> <span>Enviar por WhatsApp</span>
                </button>
                <button onClick={() => setViewingCredential(null)} className="w-full py-4 text-white font-black uppercase tracking-widest text-[9px] opacity-40 hover:opacity-100 transition-all">Cerrar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
