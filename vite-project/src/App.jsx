import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { translations } from './translations';
import {
  Stethoscope, Phone, Send, MessageCircle, MapPin, BookOpen,
  Award, Moon, Sun, LogOut, Camera, Upload, Trash2, ExternalLink,
  FileText, Globe, Share2, Copy, Check, X, Eye, EyeOff
} from 'lucide-react';
import './index.css';

export default function App() {
  // Հիմնական վիճակներ (State) ավտորիզացիայի, բեռնման և կարգավորումների համար
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [lang, setLang] = useState('am');
  const [theme, setTheme] = useState('dark');
  const t = translations[lang];
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [publicUserId, setPublicUserId] = useState(null);
  const [isPublicView, setIsPublicView] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeShareIndex, setActiveShareIndex] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Օգտատիրոջ պրոֆիլի տվյալների վիճակ (ըստ լեզուների առանձնացված անուն-ազգանվան, մասնագիտության և այլնի դաշտերով)
  const [profile, setProfile] = useState({
    full_name_am: '',
    full_name_en: '',
    full_name_ru: '',
    specialty_am: '',
    specialty_en: '',
    specialty_ru: '',
    university_am: '',
    university_en: '',
    university_ru: '',
    bio_am: '',
    bio_en: '',
    bio_ru: '',
    phone: '',
    email: '',
    telegram: '',
    whatsapp: '',
    instagram: '',
    linkedin: '',
    facebook: '',
    map_url: '',
    avatar_url: '',
    library: [],
    certificates: [],
  });

  // Թեմայի փոփոխության կիրառում HTML-ին
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // 🌟 Ծանուցումների (Toast) ցուցադրման ֆունկցիա
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // URL-ից հանրային պրոֆիլի ID-ի ստուգում
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('user');
    if (userIdParam) {
      setPublicUserId(userIdParam);
      setIsPublicView(true);
      fetchPublicProfile(userIdParam);
    }
  }, []);

  // Supabase ավտորիզացիայի վերահսկում
  useEffect(() => {
    if (isPublicView) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && !isPublicView) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [isPublicView]);

  // Պրոֆիլի տվյալների բեռնում բազայից (ապահովելով հին `full_name` և `specialty` դաշտերի աջակցությունը)
  const fetchProfile = async (userId) => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile({
        ...data,
        full_name_am: data.full_name_am || data.full_name || '',
        full_name_en: data.full_name_en || '',
        full_name_ru: data.full_name_ru || '',
        specialty_am: data.specialty_am || data.specialty || '',
        specialty_en: data.specialty_en || '',
        specialty_ru: data.specialty_ru || '',
        university_am: data.university_am || data.university || '',
        university_en: data.university_en || '',
        university_ru: data.university_ru || '',
        bio_am: data.bio_am || data.bio || '',
        bio_en: data.bio_en || '',
        bio_ru: data.bio_ru || '',
        library: data.library || [],
        certificates: data.certificates || [],
      });
    }
    setLoading(false);
  };

  // Հանրային պրոֆիլի տվյալների բեռնում
  const fetchPublicProfile = async (userId) => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile({
        ...data,
        full_name_am: data.full_name_am || data.full_name || '',
        full_name_en: data.full_name_en || '',
        full_name_ru: data.full_name_ru || '',
        specialty_am: data.specialty_am || data.specialty || '',
        specialty_en: data.specialty_en || '',
        specialty_ru: data.specialty_ru || '',
        university_am: data.university_am || data.university || '',
        university_en: data.university_en || '',
        university_ru: data.university_ru || '',
        bio_am: data.bio_am || data.bio || '',
        bio_en: data.bio_en || '',
        bio_ru: data.bio_ru || '',
        library: data.library || [],
        certificates: data.certificates || [],
      });
    }
    setLoading(false);
  };

  // Կոնտակտների պահպանում բազայում
  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: profile.phone,
          email: profile.email,
          telegram: profile.telegram,
          whatsapp: profile.whatsapp,
          instagram: profile.instagram,
          linkedin: profile.linkedin,
          facebook: profile.facebook,
          map_url: profile.map_url
        })
        .eq('id', session.user.id);

      if (error) throw error;
      showToast(t.successUpdate || 'Կոնտակտները հաջողությամբ պահպանվեցին։');
    } catch (error) {
      console.error('Error saving profile:', error.message);
      showToast(error.message);
    }
  };

  // Մուտքագրման և գրանցման կառավարում
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) showToast(error.message);
      else showToast(t.successRegister || 'Հաջողվեց! Ստուգեք ձեր էլ. հասցեն։');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) showToast(error.message);
    }
    setLoading(false);
  };

  // Անձնական նկարի (Avatar) վերբեռնում
  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      showToast('Նկարը հաջողությամբ փոխվեց։');
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ֆայլերի վերբեռնում (Գրադարան կամ Սերտիֆիկատներ)
  const handleFileUpload = async (e, type) => {
    try {
      setLoading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileName = `${session.user.id}-${Date.now()}-${file.name}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const fileItem = { name: file.name, url: data.publicUrl };

      let updatedList;
      if (type === 'library') {
        updatedList = [...profile.library, fileItem];
        setProfile({ ...profile, library: updatedList });
      } else {
        updatedList = [...profile.certificates, fileItem];
        setProfile({ ...profile, certificates: updatedList });
      }

      await supabase.from('profiles').upsert({
        id: session.user.id,
        [type]: updatedList,
        updated_at: new Date()
      });

      showToast(t.successFileUpload || 'Ֆայլը հաջողությամբ ավելացվեց։');
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ֆայլի կամ նյութի ջնջում ցանկից
  const handleDeleteItem = async (index, type) => {
    const list = type === 'library' ? [...profile.library] : [...profile.certificates];
    list.splice(index, 1);

    const updatedProfile = { ...profile, [type]: list };
    setProfile(updatedProfile);

    await supabase.from('profiles').upsert({
      id: session.user.id,
      [type]: list,
      updated_at: new Date()
    });
    showToast(t.successDelete || 'Նյութը հաջողությամբ ջնջվեց։');
  };

  // 🌟 Հիմնական պրոֆիլի տվյալների թարմացում ըստ ընթացիկ լեզվի (Անուն, Մասնագիտություն, Համալսարան, Կենսագրություն)
  const updateProfile = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    try {
      setLoading(true);

      const updateData = {
        [`full_name_${lang}`]: profile[`full_name_${lang}`],
        [`specialty_${lang}`]: profile[`specialty_${lang}`],
        [`university_${lang}`]: profile[`university_${lang}`],
        [`bio_${lang}`]: profile[`bio_${lang}`],
        full_name: profile[`full_name_${lang}`] || profile.full_name_am
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id);

      if (error) throw error;

      if (session) {
        await fetchProfile(session.user.id);
      }

      setIsEditingProfile(false);
      showToast(t.successUpdate || 'Պրոֆիլը հաջողությամբ թարմացվեց։');
    } catch (error) {
      console.error("Update error:", error.message);
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Հղման պատճենման ֆունկցիա
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast(t.copiedText || 'Հղումը պատճենված է։');
    setTimeout(() => setCopied(false), 2500);
  };

  // Անուն-ազգանվան առաջին տառերի ստացում լոգոյի համար
  const getInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'ՎՎ';
    const trimmed = fullName.trim();
    if (!trimmed) return 'ՎՎ';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && trimmed.length >= 2) {
      return trimmed.substring(0, 2).toUpperCase();
    }
    return 'ՎՎ';
  };

  // Բեռնման վիճակի էկրան
  if (loading && !profile.full_name_am && !profile.full_name_en) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="ecg-loader">
          <svg viewBox="0 0 150 50" width="150" height="50">
            <path className="ecg-line" d="M0,25 l30,0 l10,-20 l10,40 l15,-50 l10,60 l10,-30 l30,0" />
          </svg>
        </div>
        <p style={{ fontWeight: '600', letterSpacing: '1px' }}>{t.loading || 'Բեռնվում է...'}</p>
      </div>
    );
  }

  const currentFullName = profile[`full_name_${lang}`] || profile.full_name_am || t.defaultName;

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', maxWidth: '850px', margin: '0 auto', boxSizing: 'border-box', position: 'relative' }}>

      {/* 🌟 Ծանուցումների (Toast) Վահանակ */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid var(--primary-color)',
          color: '#fff', padding: '12px 24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px var(--primary-glow)',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '500'
        }}>
          <Stethoscope size={18} color="var(--primary-color)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🌟 Մեծացված նկարի/սերտիֆիկատի ցուցադրման մոդալ պատուհան (Lightbox) */}
      {selectedCertificate && (
        <div
          onClick={() => setSelectedCertificate(null)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(10, 15, 30, 0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px',
            boxSizing: 'border-box', animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '700px', maxHeight: '85vh', background: 'rgba(15, 23, 42, 0.98)',
              border: '1.5px solid rgba(20, 184, 166, 0.5)', borderRadius: '20px', padding: '16px', boxSizing: 'border-box',
              display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(20, 184, 166, 0.3)',
              position: 'relative', cursor: 'default'
            }}
          >
            {/* Մոդալի վերնագիր և փակելու կոճակ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f8fafc', fontSize: '14px', fontWeight: '600', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '10px' }}>
                {selectedCertificate.name}
              </span>
              <button
                onClick={() => setSelectedCertificate(null)}
                style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', fontSize: '18px', padding: '4px 8px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            {/* Մոդալի բովանդակություն (Նկար կամ PDF) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', overflow: 'hidden', flex: 1 }}>
              {selectedCertificate.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <img
                  src={selectedCertificate.url}
                  alt={selectedCertificate.name}
                  style={{ maxWidth: '100%', maxHeight: '68vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: '12px', boxSizing: 'border-box' }}
                />
              ) : (
                <iframe
                  src={selectedCertificate.url}
                  title={selectedCertificate.name}
                  style={{ width: '100%', height: '68vh', border: 'none', borderRadius: '12px', boxSizing: 'border-box' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Վերին գլխավոր վահանակ (Լոգո, Թեմա, Լեզու, Ելք) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.1)',
            border: '1px solid var(--primary-color)', boxShadow: '0 0 15px var(--primary-glow)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '16px', letterSpacing: '1px'
          }}>
            {getInitials(currentFullName)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={toggleTheme} className="neon-btn" style={{ padding: '8px 14px', fontSize: '13px' }}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'light' ? t.themeNight : t.themeDay}
          </button>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="glass-input"
            style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer', width: 'auto' }}
          >
            <option value="am" style={{ background: '#0f172a', color: '#fff' }}>🇦🇲 Հայ</option>
            <option value="en" style={{ background: '#0f172a', color: '#fff' }}>🇬🇧 Eng</option>
            <option value="ru" style={{ background: '#0f172a', color: '#fff' }}>🇷🇺 Рус</option>
          </select>
          {session && !isPublicView && (
            <button onClick={() => supabase.auth.signOut()} className="neon-btn" style={{ padding: '8px 14px', fontSize: '13px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
              <LogOut size={16} /> {t.logout}
            </button>
          )}
        </div>
      </div>

      {/* 🌟 Հանրային պրոֆիլի կիսվելու մոդալ պատուհան */}
      {showShareModal && (
        <div
          onClick={() => setShowShareModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10, 15, 30, 0.75)',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '12px', boxSizing: 'border-box'
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px', background: 'rgba(15, 23, 42, 0.98)', border: '1.5px solid rgba(20, 184, 166, 0.5)', borderRadius: '20px', padding: '20px', boxSizing: 'border-box', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(20, 184, 166, 0.25)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(20, 184, 166, 0.15)', border: '1.5px solid rgba(20, 184, 166, 0.4)', borderRadius: '12px', padding: '12px', textAlign: 'center', color: '#2dd4bf', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
              <Share2 size={18} /> Share My Public Profile
            </div>
            <div>
              <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '6px', color: '#cbd5e1' }}>Your public portfolio link:</p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
                <input type="text" readOnly value={`${window.location.origin}${window.location.pathname}?user=${session?.user?.id}`} className="glass-input" style={{ flex: '1', fontSize: '11px', background: 'rgba(0,0,0,0.4)', padding: '10px 12px' }} />
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?user=${session?.user?.id}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="neon-btn" style={{ padding: '10px 14px', fontSize: '12px' }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              {(() => {
                const profileUrl = `${window.location.origin}${window.location.pathname}?user=${session?.user?.id}`;
                const encodedUrl = encodeURIComponent(profileUrl);
                const encodedTitle = encodeURIComponent("Իմ բժշկական պորտֆոլիոն");
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e', color: '#4ade80', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><MessageCircle size={16} color="#22c55e" /> WhatsApp</a>
                    <a href={`viber://forward?text=${encodedTitle}%20${encodedUrl}`} className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(114, 95, 209, 0.15)', borderColor: '#735fd1', color: '#a78bfa', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Phone size={16} color="#a78bfa" /> Viber</a>
                    <a href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Send size={16} color="#38bdf8" /> Telegram</a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(10, 102, 194, 0.15)', borderColor: '#0a66c2', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Share2 size={16} color="#60a5fa" /> LinkedIn</a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(66, 103, 178, 0.15)', borderColor: '#4267B2', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Globe size={16} color="#60a5fa" /> Facebook</a>
                    <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(244, 63, 94, 0.15)', borderColor: '#f43f5e', color: '#fb7185', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><FileText size={16} color="#fb7185" /> Email</a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 🔐 Մուտքագրման և Գրանցման Ձև (Եթե օգտատերը մուտք չի գործել) */}
      {!session && !isPublicView ? (
        <div className="glass-box" style={{ padding: '30px', maxWidth: '400px', width: '100%', margin: '40px auto', textAlign: 'center', boxSizing: 'border-box' }}>
          <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Stethoscope size={24} /> {isSignUp ? t.signUpTitle : t.loginTitle}
          </h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input" required />
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
              <input type={showPassword ? "text" : "password"} placeholder={t.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input" style={{ width: '100%', paddingRight: '45px' }} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '4px' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" className="neon-btn" style={{ padding: '12px', width: '100%', justifyContent: 'center' }}>
              {isSignUp ? t.signUpBtn : t.loginBtn}
            </button>
          </form>
          <p onClick={() => setIsSignUp(!isSignUp)} style={{ marginTop: '20px', cursor: 'pointer', fontSize: '13px', opacity: 0.8, color: 'var(--primary-color)' }}>
            {isSignUp ? t.haveAccountText : t.noAccountText}
          </p>
        </div>
      ) : (
        <div className="glass-box" style={{ padding: '30px', width: '100%', boxSizing: 'border-box' }}>

          {/* 🔗 Հանրային պրոֆիլի կիսվելու գլխավոր կոճակ */}
          {session && !isPublicView && (
            <div style={{ marginBottom: '25px' }}>
              <button onClick={() => setShowShareModal(!showShareModal)} className="neon-btn" style={{ width: '100%', justifyContent: 'center', padding: '5px', gap: '5px', fontSize: '12px', background: 'linear-gradient(135deg, #0d9488 100%, #115e59 0%)' }}>
                <Share2 size={18} /> 🔗 {t.sharePublicProfile}
              </button>
            </div>
          )}

          {/* 📱 Ներդիրների (Tabs) Վահանակ */}
          <div className="tabs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '30px' }}>
            <button onClick={() => setActiveTab('profile')} className={`neon-btn ${activeTab === 'profile' ? 'active' : ''}`} style={{ padding: '8px 10px', fontSize: '12px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Stethoscope size={16} /> <span>{t.tabProfile}</span>
            </button>
            <button onClick={() => setActiveTab('contact')} className={`neon-btn ${activeTab === 'contact' ? 'active' : ''}`} style={{ padding: '8px 10px', fontSize: '12px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <MapPin size={16} /> <span>{t.tabContact}</span>
            </button>
            <button onClick={() => setActiveTab('library')} className={`neon-btn ${activeTab === 'library' ? 'active' : ''}`} style={{ padding: '8px 10px', fontSize: '12px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <BookOpen size={16} /> <span>{t.tabLibrary}</span>
            </button>
            <button onClick={() => setActiveTab('certificates')} className={`neon-btn ${activeTab === 'certificates' ? 'active' : ''}`} style={{ padding: '8px 10px', fontSize: '12px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Award size={16} /> <span>{t.tabCertificates}</span>
            </button>
          </div>

          {/* 🩺 1. ՀԻՄՆԱԿԱՆ ԲԱԺԻՆ (Profile) */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {session && !isPublicView && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                  <button type="button" onClick={async () => { if (isEditingProfile) { await updateProfile(); } else { setIsEditingProfile(true); } }} className="neon-btn" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isEditingProfile ? (t.saveProfile || 'Save Profile') : (t.editProfile || 'Edit Profile')}
                  </button>
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '10px', padding: '25px 15px', background: 'rgba(20, 184, 166, 0.03)', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
                <div style={{ position: 'relative', width: '220px', height: '260px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {profile && profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                  ) : (
                    <div className="glass-input" style={{ width: '100%', height: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(20, 184, 166, 0.05)', border: '1.5px dashed rgba(20, 184, 166, 0.4)' }}>
                      <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '2px', textShadow: '0 0 15px rgba(20, 184, 166, 0.6)' }}>
                        {getInitials(currentFullName)}
                      </div>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>{t.noImageText || 'Նկար չկա'}</span>
                    </div>
                  )}

                  {session && !isPublicView && (
                    <label style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'var(--primary-color)', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', boxShadow: '0 0 15px var(--primary-glow)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                      <Camera size={18} />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>

                <h1 style={{ fontSize: '28px', margin: '10px 0 8px', fontWeight: '700' }}>{currentFullName}</h1>
                <p style={{ fontStyle: 'italic', opacity: 0.9, fontSize: '15px', marginBottom: '6px' }}>{profile[`specialty_${lang}`] || t.defaultSpecialty}</p>
                <p style={{ fontWeight: '600', color: 'var(--primary-color)', fontSize: '14px' }}>{profile[`university_${lang}`] || t.defaultUniversity}</p>
              </div>

              {isEditingProfile && session && !isPublicView ? (
                <div className="glass-input" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ color: 'var(--primary-color)', fontSize: '15px', marginBottom: '2px' }}>
                    {t.editProfileTitle || 'Խմբագրել պրոֆիլը'} ({lang.toUpperCase()})
                  </h3>

                  <label style={{ fontSize: '12px', opacity: 0.8 }}>{t.nameLabel || 'Անուն Ազգանուն'} ({lang.toUpperCase()})</label>
                  <input type="text" placeholder={t.namePlaceholder || 'Անուն Ազգանուն'} value={profile[`full_name_${lang}`] || ''} onChange={(e) => setProfile(prev => ({ ...prev, [`full_name_${lang}`]: e.target.value }))} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />

                  <label style={{ fontSize: '12px', opacity: 0.8 }}>{t.specialtyLabel || 'Մասնագիտություն'} ({lang.toUpperCase()})</label>
                  <input type="text" placeholder={t.specialtyPlaceholder || 'Մասնագիտություն'} value={profile[`specialty_${lang}`] || ''} onChange={(e) => setProfile(prev => ({ ...prev, [`specialty_${lang}`]: e.target.value }))} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />

                  <label style={{ fontSize: '12px', opacity: 0.8 }}>{t.universityLabel || 'Համալսարան / Հաստատություն'} ({lang.toUpperCase()})</label>
                  <input type="text" placeholder={t.universityPlaceholder || 'Համալսարան'} value={profile[`university_${lang}`] || ''} onChange={(e) => setProfile(prev => ({ ...prev, [`university_${lang}`]: e.target.value }))} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />

                  <label style={{ fontSize: '12px', opacity: 0.8 }}>{t.bioLabel || 'Կենսագրություն'} ({lang.toUpperCase()})</label>
                  <textarea placeholder={t.bioPlaceholder || 'Կենսագրություն...'} value={profile[`bio_${lang}`] || ''} onChange={(e) => setProfile(prev => ({ ...prev, [`bio_${lang}`]: e.target.value }))} className="glass-input" style={{ height: '110px', resize: 'none', padding: '10px 12px', fontSize: '13px' }} />
                </div>
              ) : (
                <div className="glass-input" style={{ padding: '20px', lineHeight: '1.6' }}>
                  <p style={{ fontWeight: '600', marginBottom: '6px', color: 'var(--primary-color)' }}>{t.bioLabel || 'Կենսագրություն'}:</p>
                  <p style={{ opacity: 0.9, fontSize: '14px' }}>{profile[`bio_${lang}`] || t.noBioText}</p>
                </div>
              )}
            </div>
          )}

          {/* 📞 2. ԿՈՆՏԱԿՏՆԵՐ ԵՎ ՍՈՑՑԱՆՑԵՐ (Contact) */}
          {activeTab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {session && !isPublicView && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                  <button onClick={() => { if (isEditingContact) { handleSaveProfile(); } setIsEditingContact(!isEditingContact); }} className="neon-btn" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isEditingContact ? (t.saveContacts || 'Save Contacts') : (t.editContacts || 'Edit Contacts')}
                  </button>
                </div>
              )}

              {isEditingContact && session && !isPublicView ? (
                <div className="glass-input" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ color: 'var(--primary-color)', fontSize: '15px', marginBottom: '4px' }}>Խմբագրել կոնտակտները</h3>
                  <label style={{ fontSize: '12px', opacity: 0.8 }}>Հեռախոսահամար</label>
                  <input type="text" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />
                  <label style={{ fontSize: '12px', opacity: 0.8 }}>Էլ․ հասցե (Email)</label>
                  <input type="email" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />
                  <label style={{ fontSize: '12px', opacity: 0.8 }}>Telegram</label>
                  <input type="text" value={profile.telegram || ''} onChange={(e) => setProfile({ ...profile, telegram: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />
                  <label style={{ fontSize: '12px', opacity: 0.8 }}>WhatsApp</label>
                  <input type="text" value={profile.whatsapp || ''} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />
                  <label style={{ fontSize: '12px', opacity: 0.8 }}>Instagram</label>
                  <input type="text" value={profile.instagram || ''} onChange={(e) => setProfile({ ...profile, instagram: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />
                  <label style={{ fontSize: '12px', opacity: 0.8 }}>LinkedIn</label>
                  <input type="text" value={profile.linkedin || ''} onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />
                  <label style={{ fontSize: '12px', opacity: 0.8 }}>Facebook</label>
                  <input type="text" value={profile.facebook || ''} onChange={(e) => setProfile({ ...profile, facebook: e.target.value })} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />
                  <label style={{ fontSize: '12px', opacity: 0.8 }}>{t.mapLabel || 'Google Map (iframe կամ հղում)'}</label>
                  <input type="text" value={profile.map_url || ''} onChange={(e) => setProfile({ ...profile, map_url: e.target.value })} placeholder={t.mapPlaceholder || 'Օրինակ՝ https://maps.app.goo.gl/...'} className="glass-input" style={{ padding: '8px 12px', fontSize: '13px' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="glass-input" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {profile.phone ? (
                      <a href={`tel:${profile.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-color)', fontWeight: '600' }}>
                        <Phone size={18} color="var(--primary-color)" /> {profile.phone}
                      </a>
                    ) : isPublicView && <span style={{ opacity: 0.6, fontSize: '13px' }}>Հեռախոսահամար նշված չէ</span>}

                    {profile.email && (
                      <a href={`mailto:${profile.email}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-color)', fontWeight: '600' }}>
                        <FileText size={18} color="var(--primary-color)" /> Email: {profile.email}
                      </a>
                    )}
                    {profile.telegram && (
                      <a href={`https://t.me/${profile.telegram}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--primary-color)', fontWeight: '600' }}>
                        <Send size={18} color="var(--primary-color)" /> Telegram: @{profile.telegram}
                      </a>
                    )}
                    {profile.whatsapp && (
                      <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-color)', fontWeight: '600' }}>
                        <MessageCircle size={18} color="var(--primary-color)" /> WhatsApp: {profile.whatsapp}
                      </a>
                    )}
                    {profile.instagram && (
                      <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--primary-color)', fontWeight: '600' }}>
                        <Globe size={18} color="var(--primary-color)" /> Instagram
                      </a>
                    )}
                    {profile.linkedin && (
                      <a href={profile.linkedin} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--primary-color)', fontWeight: '600' }}>
                        <Share2 size={18} color="var(--primary-color)" /> LinkedIn
                      </a>
                    )}
                    {profile.facebook && (
                      <a href={profile.facebook} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--primary-color)', fontWeight: '600' }}>
                        <Globe size={18} color="var(--primary-color)" /> Facebook
                      </a>
                    )}
                  </div>

                  {profile.map_url && (
                    <div className="glass-input" style={{ overflow: 'hidden', height: '250px', borderRadius: '16px', marginTop: '10px', padding: 0 }}>
                      <iframe src={profile.map_url.includes('src="') ? profile.map_url.split('src="')[1].split('"')[0] : profile.map_url} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" title="Location Map"></iframe>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 📚 3. ԳՐԱԴԱՐԱՆԻ ԲԱԺԻՆ (Library) */}
          {activeTab === 'library' && (
            <div>
              {session && !isPublicView && (
                <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                  <label className="neon-btn" style={{ padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <Upload size={16} /> {t.uploadLibraryBtn || 'Վերբեռնել նյութ'}
                    <input type="file" accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => handleFileUpload(e, 'library')} style={{ display: 'none' }} />
                  </label>
                </div>
              )}

              {profile.library.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '40px' }}>{t.noFiles || 'Ֆայլեր չկան'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile.library.map((item, index) => {
                    const shareKey = `lib-${index}`;
                    const isSharing = activeShareIndex === shareKey;
                    const encodedUrl = encodeURIComponent(item.url);
                    const encodedTitle = encodeURIComponent(item.name);

                    return (
                      <div key={index} className="glass-input" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', position: 'relative', overflow: 'visible' }}>
                        <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '15px', flex: 1 }}>{item.name}</span>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
                          <button onClick={() => setActiveShareIndex(isSharing ? null : shareKey)} className="neon-btn" style={{ padding: '6px 12px', fontSize: '12px', background: isSharing ? 'rgba(168, 85, 247, 0.2)' : 'transparent', borderColor: isSharing ? '#a855f7' : 'var(--primary-color)', color: '#a855f7' }} title="Կիսվել">
                            <Share2 size={14} />
                          </button>

                          {isSharing && (
                            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 999, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px', background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                              <div style={{ fontSize: '11px', fontWeight: '600', color: '#a855f7', marginBottom: '2px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Կիսվել հղումով</div>
                              <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#f8fafc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageCircle size={15} color="#22c55e" /> WhatsApp</a>
                              <a href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#f8fafc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><Send size={15} color="#38bdf8" /> Telegram</a>
                              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#f8fafc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={15} color="#60a5fa" /> Facebook</a>
                              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#f8fafc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><Share2 size={15} color="#818cf8" /> LinkedIn</a>
                              <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} style={{ fontSize: '13px', color: '#f8fafc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={15} color="#f43f5e" /> Email</a>
                            </div>
                          )}

                          <a href={item.url} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}>
                            <ExternalLink size={14} /> Բացել
                          </a>

                          {session && !isPublicView && (
                            <button onClick={() => handleDeleteItem(index, 'library')} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 🏆 4. ՍԵՐՏԻՖԻԿԱՏՆԵՐԻ ԲԱԺԻՆ (Certificates) */}
          {activeTab === 'certificates' && (
            <div>
              {session && !isPublicView && (
                <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                  <label className="neon-btn" style={{ padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <Award size={16} /> {t.uploadCertBtn || 'Վերբեռնել սերտիֆիկատ'}
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'certificates')} style={{ display: 'none' }} />
                  </label>
                </div>
              )}

              {profile.certificates.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '40px' }}>{t.noFiles || 'Սերտիֆիկատներ չկան'}</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {profile.certificates.map((item, index) => {
                    const isImage = item.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                    return (
                      <div key={index} className="glass-input" style={{ display: 'flex', flexDirection: 'column', padding: '12px', gap: '10px', borderRadius: '16px', overflow: 'hidden' }}>
                        <div onClick={() => setSelectedCertificate(item)} style={{ width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Սեղմեք՝ մեծացնելու համար">
                          {isImage ? (
                            <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#2dd4bf' }}>
                              <FileText size={32} />
                              <span style={{ fontSize: '11px' }}>PDF File</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span onClick={() => setSelectedCertificate(item)} style={{ fontWeight: '500', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, cursor: 'pointer', color: '#f8fafc' }} title={item.name}>
                            {item.name}
                          </span>
                          {session && !isPublicView && (
                            <button onClick={() => handleDeleteItem(index, 'certificates')} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}