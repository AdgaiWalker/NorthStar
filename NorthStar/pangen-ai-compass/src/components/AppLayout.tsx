import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Sun, BookOpen, Globe, User, Menu, X, ChevronDown, LogOut, Shield, Check } from 'lucide-react';
import { APP_NAME, ICP_LICENSE } from '../constants';
import { Language, Domain } from '../types';
import { DOMAIN_CONFIG, DOMAIN_LIST } from '../constants/domains';
import { useAppStore } from '../store/useAppStore';

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    themeMode, toggleTheme,
    language, setLanguage,
    currentDomain, setCurrentDomain,
    isLoggedIn, setIsLoggedIn,
  } = useAppStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [domainMenuOpen, setDomainMenuOpen] = useState(false);

  const isEyeCare = themeMode === 'eye-care';

  const handleLogoClick = () => {
    setDomainMenuOpen(!domainMenuOpen);
  };

  const handleDomainSelect = (domain: Domain) => {
    setCurrentDomain(domain);
    setDomainMenuOpen(false);
    navigate('/');
  };

  const currentDomainLabel = DOMAIN_CONFIG[currentDomain].label;

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      isEyeCare 
        ? 'bg-[#F7F6F2]/90 border-stone-200' 
        : 'bg-white/90 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Unified Logo & Domain Switcher */}
          <div className="relative">
             <button 
                 onClick={handleLogoClick}
                 className={`flex items-center gap-3 p-1.5 pr-3 rounded-xl transition-all group ${
                    domainMenuOpen 
                      ? 'bg-slate-100 ring-1 ring-slate-200' 
                      : 'hover:bg-slate-50'
                 }`}
             >
                {/* Logo Icon */}
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Layout size={18} strokeWidth={3} />
                </div>
                
                {/* Text Content */}
                <div className="flex flex-col items-start">
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">
                     盘根 AI
                   </span>
                   <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-sm leading-none ${isEyeCare ? 'text-stone-800' : 'text-slate-800'}`}>
                        {currentDomainLabel}
                      </span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${domainMenuOpen ? 'rotate-180' : ''}`} />
                   </div>
                </div>
             </button>

             {/* Dropdown Menu */}
             {domainMenuOpen && (
               <>
                 <div className="fixed inset-0 z-10 cursor-default" onClick={() => setDomainMenuOpen(false)}></div>
                 <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 transition-all duration-200 transform origin-top-left z-20 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">切换领域</div>
                    {DOMAIN_LIST.map((domain) => {
                      const config = DOMAIN_CONFIG[domain];
                      const Icon = config.icon;
                      const isActive = currentDomain === domain;

                      return (
                        <button
                          key={domain}
                          onClick={() => handleDomainSelect(domain)}
                          className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-sm transition-colors text-left group/item ${
                            isActive ? 'bg-slate-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className={`mt-0.5 p-1.5 rounded-lg ${isActive ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'bg-slate-100 text-slate-500 group-hover/item:text-slate-700'}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-bold flex items-center justify-between ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                              <span>{config.label}</span>
                              <span className="flex items-center gap-1">
                                {isActive && <Check size={14} className="text-blue-600" />}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 font-normal">{config.description}</div>
                          </div>
                        </button>
                      );
                    })}
                 </div>
               </>
             )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative group hidden sm:block">
               <button className="p-2 rounded-full hover:bg-black/5 text-slate-600 transition-colors">
                 <Globe size={20} />
               </button>
               <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                  {(['zh', 'en'] as Language[]).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`block w-full text-left px-4 py-2 text-sm ${language === lang ? 'bg-slate-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {lang === 'zh' ? '中文' : 'English'}
                    </button>
                  ))}
               </div>
            </div>

            {isLoggedIn ? (
              <div className="relative group hidden md:block">
                <button 
                  className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 transition-all overflow-hidden"
                >
                  <img src="https://picsum.photos/100/100?random=user" alt="User" className="w-full h-full object-cover" />
                </button>
                {/* User Dropdown */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50 py-2">
                   <div className="px-4 py-3 border-b border-slate-50 mb-1 bg-slate-50/50">
                     <p className="text-sm font-bold text-slate-800">My User</p>
                     <p className="text-xs text-slate-400 truncate">user@pangen.ai</p>
                   </div>
                   <button onClick={() => navigate('/me/profile')} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-3">
                     <User size={16} /> 个人中心
                   </button>
                   <button onClick={() => navigate('/admin')} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-3">
                     <Shield size={16} /> 后台管理
                   </button>
                   <button onClick={toggleTheme} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-3">
                     {themeMode === 'light' ? <Sun size={16} /> : <BookOpen size={16} />} 
                     {themeMode === 'light' ? '开启护眼' : '关闭护眼'}
                   </button>
                   <div className="border-t border-slate-50 mt-1 pt-1">
                     <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3">
                       <LogOut size={16} /> 退出登录
                     </button>
                   </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="hidden md:flex items-center px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
              >
                登录 / 注册
              </button>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md p-4 space-y-4 animate-in slide-in-from-top-2 h-[calc(100vh-64px)] overflow-y-auto">
           {isLoggedIn && (
             <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 rounded-xl mb-2" onClick={() => { navigate('/me/profile'); setMobileMenuOpen(false); }}>
                <img src="https://picsum.photos/100/100?random=user" alt="User" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                <div className="flex-1">
                   <div className="font-bold text-slate-800">My User</div>
                   <div className="text-xs text-slate-500">user@pangen.ai</div>
                </div>
                <User size={18} className="text-slate-400" />
             </div>
           )}

           <div className="pt-2">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">设置</div>
             <button 
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl bg-slate-50 text-slate-600 text-sm font-medium"
             >
                {themeMode === 'light' ? <Sun size={18} /> : <BookOpen size={18} />} 
                {themeMode === 'light' ? '开启护眼模式' : '关闭护眼模式'}
             </button>
             {/* Mobile Language Switcher */}
             <div className="flex gap-2 mt-4 px-4 overflow-x-auto">
                {(['zh', 'en'] as Language[]).map(lang => (
                   <button 
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${language === lang ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}
                   >
                     {lang === 'zh' ? '中文' : 'EN'}
                   </button>
                ))}
             </div>
           </div>

           {!isLoggedIn ? (
             <button 
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="block w-full text-center px-4 py-3.5 rounded-xl bg-slate-900 text-white font-bold shadow-lg mt-4"
              >
                登录 / 注册
              </button>
           ) : (
              <div className="border-t border-slate-100 pt-4 space-y-1 mt-2">
                 <button onClick={() => { navigate('/me/profile'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-600 bg-slate-50 rounded-xl flex items-center gap-3">
                    <User size={18}/> 个人中心
                 </button>
                 <button onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-600 bg-slate-50 rounded-xl flex items-center gap-3">
                    <Shield size={18} /> 后台管理
                 </button>
                 <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-500 bg-red-50 rounded-xl flex items-center gap-3">
                    <LogOut size={18}/> 退出登录
                 </button>
              </div>
           )}
        </div>
      )}
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-slate-500 text-sm mb-2">
          &copy; {new Date().getFullYear()} {APP_NAME}. 保留所有权利。
        </p>
        <div className="text-slate-400 text-xs flex flex-col sm:flex-row justify-center items-center gap-2">
          <span>{ICP_LICENSE}</span>
          <span className="hidden sm:inline">•</span>
          <span>公安备案：备案中</span>
        </div>
      </div>
    </footer>
  );
};
