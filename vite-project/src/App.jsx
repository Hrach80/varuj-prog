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
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const [lang, setLang] = useState('am');
  const [theme, setTheme] = useState('dark');
  const t = translations[lang];
  const [showMainShareMenu, setShowMainShareMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [publicUserId, setPublicUserId] = useState(null);
  const [isPublicView, setIsPublicView] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeShareIndex, setActiveShareIndex] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    specialty: '',
    university: '',
    bio: '',
    phone: '',
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('user');
    if (userIdParam) {
      setPublicUserId(userIdParam);
      setIsPublicView(true);
      fetchPublicProfile(userIdParam);
    }
  }, []);

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
        library: data.library || [],
        certificates: data.certificates || [],
      });
    }
    setLoading(false);
  };

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
        library: data.library || [],
        certificates: data.certificates || [],
      });
    }
    setLoading(false);
  };

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

  const handleAvatarUpload = async (e) => {
    try {
      setLoading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProfile({ ...profile, avatar_url: data.publicUrl });
      showToast(t.successPhotoUpdate || 'Նկարը հաջողությամբ թարմացվեց։');
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name_am: profile.full_name_am,
          full_name_en: profile.full_name_en,
          full_name_ru: profile.full_name_ru,
          specialty_am: profile.specialty_am,
          specialty_en: profile.specialty_en,
          specialty_ru: profile.specialty_ru,
          university_am: profile.university_am,
          university_en: profile.university_en,
          university_ru: profile.university_ru,
          bio_am: profile.bio_am,
          bio_en: profile.bio_en,
          bio_ru: profile.bio_ru,
          phone: profile.phone,
          telegram: profile.telegram,
          whatsapp: profile.whatsapp,
          instagram: profile.instagram,
          linkedin: profile.linkedin,
          facebook: profile.facebook,
          map_url: profile.map_url,
          updated_at: new Date()
        })
        .eq('id', session.user.id);

      if (error) throw error;
      alert(t.successUpdate);
    } catch (error) {
      console.error('Error updating profile:', error.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast(t.copiedText || 'Հղումը պատճենված է։');
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
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

  const publicLink = session ? `${window.location.origin}?user=${session.user.id}` : '';

  // Դինամիկ ստեղծում ենք լոգոյի տառերը անուն-ազգանունից (օր. "Վարուժան Վաղարշակյան" -> "ՎՎ")
  const getInitials = (name) => {
    if (!name) return 'MD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', maxWidth: '850px', margin: '0 auto', boxSizing: 'border-box', position: 'relative' }}>

      {/* 🌟 Ծանուցում (Toast) */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--primary-color)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px var(--primary-glow)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <Stethoscope size={18} color="var(--primary-color)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Վերին վահանակ՝ Ձախ կողմում Նեոնային Լոգո (Անուն-Ազգանվան տառերով), Աջ կողմում՝ Լեզու և Թեմա */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>

        {/* 🌟 Նեոնային Լոգո Վերին Ձախ Անկյունում */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(20, 184, 166, 0.1)',
            border: '1px solid var(--primary-color)',
            boxShadow: '0 0 15px var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'var(--primary-color)',
            fontSize: '16px',
            letterSpacing: '1px'
          }}>
            {getInitials(profile.full_name)}
          </div>
        </div>

        {/* Աջ վահանակ (Թեմա, Լեզու, Ելք) */}
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
      {/* Հանրային պորտֆոլիոյի կիսվելու մոդալ պատուհան */}
      {showShareModal && (
        <div
          onClick={() => setShowShareModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(10, 15, 30, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999,
            padding: '12px',
            boxSizing: 'border-box',
            animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
              border: '1.5px solid rgba(20, 184, 166, 0.5)',
              borderRadius: '20px',
              padding: '20px',
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(20, 184, 166, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              cursor: 'default'
            }}
          >
            {/* Վերնագրի վահանակը */}
            <div style={{
              background: 'rgba(20, 184, 166, 0.15)',
              border: '1.5px solid rgba(20, 184, 166, 0.4)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              color: '#2dd4bf',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              boxShadow: '0 0 15px rgba(20, 184, 166, 0.15)'
            }}>
              <Share2 size={18} /> Share My Public Profile
            </div>

            <div>
              <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '6px', color: '#cbd5e1' }}>
                Your public portfolio link:
              </p>

              {/* Հղման դաշտ և Copy կոճակ */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}?user=${session?.user?.id}`}
                  className="glass-input"
                  style={{ flex: 1, minWidth: '180px', fontSize: '11px', background: 'rgba(0,0,0,0.4)', padding: '10px 12px', boxSizing: 'border-box' }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?user=${session?.user?.id}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="neon-btn"
                  style={{ padding: '10px 14px', fontSize: '12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Սոց. ցանցերի իկոնկաներով կոճակներ (հավասարաչափ բաշխված) */}
            {(() => {
              const profileUrl = `${window.location.origin}${window.location.pathname}?user=${session?.user?.id}`;
              const encodedUrl = encodeURIComponent(profileUrl);
              const encodedTitle = encodeURIComponent("Իմ բժշկական պորտֆոլիոն");

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  marginTop: '2px'
                }}>
                  {/* WhatsApp */}
                  <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e', color: '#4ade80', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxSizing: 'border-box' }}>
                    <MessageCircle size={16} color="#22c55e" /> WhatsApp
                  </a>
                  {/* Viber */}
                  <a href={`viber://forward?text=${encodedTitle}%20${encodedUrl}`} className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(114, 95, 209, 0.15)', borderColor: '#735fd1', color: '#a78bfa', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxSizing: 'border-box' }}>
                    <Phone size={16} color="#a78bfa" /> Viber
                  </a>
                  {/* Telegram */}
                  <a href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxSizing: 'border-box' }}>
                    <Send size={16} color="#38bdf8" /> Telegram
                  </a>
                  {/* LinkedIn */}
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(10, 102, 194, 0.15)', borderColor: '#0a66c2', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxSizing: 'border-box' }}>
                    <Share2 size={16} color="#60a5fa" /> LinkedIn
                  </a>
                  {/* Facebook */}
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(66, 103, 178, 0.15)', borderColor: '#4267B2', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxSizing: 'border-box' }}>
                    <Globe size={16} color="#60a5fa" /> Facebook
                  </a>
                  {/* Email */}
                  <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} className="neon-btn" style={{ fontSize: '12px', padding: '10px 8px', background: 'rgba(244, 63, 94, 0.15)', borderColor: '#f43f5e', color: '#fb7185', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxSizing: 'border-box' }}>
                    <FileText size={16} color="#fb7185" /> Email
                  </a>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {!session && !isPublicView ? (
        <div className="glass-box" style={{ padding: '30px', maxWidth: '400px', width: '100%', margin: '40px auto', textAlign: 'center', boxSizing: 'border-box' }}>
          <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Stethoscope size={24} /> {isSignUp ? t.signUpTitle : t.loginTitle}
          </h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              required
            />
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
                style={{ width: '100%', paddingRight: '45px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--primary-color)', // Հիմնական նեոնային/տարբերվող գույնը
                  opacity: 0.9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  padding: '4px'
                }}
                title={showPassword ? "Թաքցնել գաղտնաբառը" : "Ցույց տալ գաղտնաբառը"}
              >
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

          {session && !isPublicView && (
            <div style={{ marginBottom: '25px' }}>
              <button
                onClick={() => setShowShareModal(!showShareModal)}
                className="neon-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '5px', gap: '5px', fontSize: '12px', background: 'linear-gradient(135deg, #0d9488 100%, #115e59 0%)' }}
              >
                <Share2 size={18} /> 🔗 {t.sharePublicProfile}
              </button>

              <div style={{
                maxHeight: showShareModal ? '220px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease, opacity 0.4s ease, margin 0.4s ease',
                opacity: showShareModal ? 1 : 0,
                marginTop: showShareModal ? '12px' : '0px'
              }}>
                <div className="glass-input" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px' }}>
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>{t.shareLinkTitle}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      readOnly
                      value={publicLink}
                      className="glass-input"
                      style={{ padding: '8px 12px', fontSize: '12px', background: 'rgba(0,0,0,0.2)' }}
                    />
                    <button
                      onClick={() => copyToClipboard(publicLink)}
                      className="neon-btn"
                      style={{ padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t.copiedBtn : t.copyBtn}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px', flexWrap: 'wrap' }}>
                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(publicLink)}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 12px', fontSize: '12px', background: '#25D366' }}>WhatsApp</a>
                    <a href={`https://t.me/share/url?url=${encodeURIComponent(publicLink)}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 12px', fontSize: '12px', background: '#229ED9' }}>Telegram</a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicLink)}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 12px', fontSize: '12px', background: '#0a66c2' }}>LinkedIn</a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicLink)}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 12px', fontSize: '12px', background: '#1877f2' }}>Facebook</a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ներդիրներ (Tabs) */}
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

            {/* 1. ՀԻՄՆԱԿԱՆ ԲԱԺԻՆ */}
            {activeTab === 'profile' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '30px', padding: '25px 15px', background: 'rgba(20, 184, 166, 0.03)', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
                  <div style={{ position: 'relative', width: '220px', height: '260px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="pure-transparent-img" />
                    ) : (
                      <div className="glass-input" style={{ width: '100%', height: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.6 }}>
                        <Stethoscope size={55} />
                        <span style={{ fontSize: '13px' }}>{t.noImageText || 'Նկար չկա'}</span>
                      </div>
                    )}
                    {session && !isPublicView && (
                      <label style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'var(--primary-color)', borderRadius: '50%', padding: '10px', cursor: 'pointer', boxShadow: '0 0 15px var(--primary-glow)', color: '#fff', display: 'flex', zIndex: 5 }}>
                        <Camera size={18} />
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                  <h1 style={{ fontSize: '28px', margin: '10px 0 8px', fontWeight: '700' }}>
                    {profile[`full_name_${lang}`] || t.defaultName}
                  </h1>
                  <p style={{ fontStyle: 'italic', opacity: 0.9, fontSize: '15px', marginBottom: '6px' }}>
                    {profile[`specialty_${lang}`] || t.defaultSpecialty}
                  </p>
                  <p style={{ fontWeight: '600', color: 'var(--primary-color)', fontSize: '14px' }}>
                    {profile[`university_${lang}`] || t.defaultUniversity}
                  </p>
                </div>

                {!isPublicView ? (
                  <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                      type="text"
                      placeholder={`${t.namePlaceholder} (${lang.toUpperCase()})`}
                      value={profile[`full_name_${lang}`] || ''}
                      onChange={(e) => setProfile({ ...profile, [`full_name_${lang}`]: e.target.value })}
                      className="glass-input"
                    />
                    <input
                      type="text"
                      placeholder={`${t.specialtyPlaceholder} (${lang.toUpperCase()})`}
                      value={profile[`specialty_${lang}`] || ''}
                      onChange={(e) => setProfile({ ...profile, [`specialty_${lang}`]: e.target.value })}
                      className="glass-input"
                    />
                    <input
                      type="text"
                      placeholder={`${t.universityPlaceholder} (${lang.toUpperCase()})`}
                      value={profile[`university_${lang}`] || ''}
                      onChange={(e) => setProfile({ ...profile, [`university_${lang}`]: e.target.value })}
                      className="glass-input"
                    />
                    <textarea
                      placeholder={`${t.bioPlaceholder} (${lang.toUpperCase()})`}
                      value={profile[`bio_${lang}`] || ''}
                      onChange={(e) => setProfile({ ...profile, [`bio_${lang}`]: e.target.value })}
                      className="glass-input"
                      style={{ height: '100px', resize: 'none' }}
                    />
                    <button type="submit" className="neon-btn" style={{ padding: '14px', width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                      {t.updateBtn}
                    </button>
                  </form>
                ) : (
                  <div className="glass-input" style={{ padding: '20px', lineHeight: '1.6' }}>
                    <p><strong>{t.bioLabel}:</strong></p>
                    <p>{profile[`bio_${lang}`] || profile.bio || t.noBioText}</p>
                  </div>
                )}
              </div>
            )}
          {/* 2. ԿՈՆՏԱԿՏՆԵՐ ԵՎ ՍՈՑՑԱՆՑԵՐ */}
            {activeTab === 'contact' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Կոնտակտային տվյալների ցուցադրում / հղումներ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="glass-input" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {profile.phone ? (
                      <a href={`tel:${profile.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-color)', fontWeight: '600' }}>
                        <Phone size={18} color="var(--primary-color)" /> {t.callLabel}: {profile.phone}
                      </a>
                    ) : isPublicView && <span style={{ opacity: 0.6, fontSize: '13px' }}>Հեռախոսահամար նշված չէ</span>}

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
                </div>

                {/* Քարտեզի ցուցադրում */}
                {profile.map_url && (
                  <div className="glass-input" style={{ overflow: 'hidden', height: '250px', borderRadius: '16px', marginTop: '10px', padding: 0 }}>
                    <iframe
                      src={profile.map_url.includes('src="') ? profile.map_url.split('src="')[1].split('"')[0] : profile.map_url}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      title="Location Map"
                    ></iframe>
                  </div>
                )}
              </div>
            )}
      
            {/* 3. ԳՐԱԴԱՐԱՆԻ ԲԱԺԻՆ (Library) */}
            {activeTab === 'library' && (
              <div>
                {session && !isPublicView && (
                  <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                    <label className="neon-btn" style={{ padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      <Upload size={16} /> {t.uploadLibraryBtn}
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={(e) => handleFileUpload(e, 'library')}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}

                {profile.library.length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '40px' }}>{t.noFiles}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {profile.library.map((item, index) => {
                      const shareKey = `lib-${index}`;
                      const isSharing = activeShareIndex === shareKey;
                      const encodedUrl = encodeURIComponent(item.url);
                      const encodedTitle = encodeURIComponent(item.name);

                      return (
                        <div key={index} className="glass-input" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', position: 'relative', overflow: 'visible' }}>
                          <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '15px', flex: 1 }}>
                            {item.name}
                          </span>

                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
                            {/* Կիսվելու կոճակ */}
                            <button
                              onClick={() => setActiveShareIndex(isSharing ? null : shareKey)}
                              className="neon-btn"
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                background: isSharing ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                                borderColor: isSharing ? '#a855f7' : 'var(--primary-color)'
                              }}
                              title="Կիսվել"
                            >
                              <Share2 size={14} />
                            </button>

                            {/* Բացվող անիմացիոն մենյու (Absolute դիրքով, որը չի հրում այլ կոճակները) */}
                            {isSharing && (
                              <div style={{
                                position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 999,
                                padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px',
                                background: 'rgba(15, 23, 42, 0.92)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                borderRadius: '14px',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(168, 85, 247, 0.2)',
                                animation: 'fadeInScale 0.25s ease-in-out'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#a855f7', marginBottom: '2px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                  Կիսվել հղումով
                                </div>
                                <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#f8fafc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <MessageCircle size={15} color="#22c55e" /> WhatsApp
                                </a>
                                <a href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#f8fafc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <Send size={15} color="#38bdf8" /> Telegram
                                </a>
                                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#f8fafc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <Globe size={15} color="#60a5fa" /> Facebook
                                </a>
                                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#f8fafc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <Share2 size={15} color="#818cf8" /> LinkedIn
                                </a>
                                <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} style={{ fontSize: '13px', color: '#f8fafc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <FileText size={15} color="#f43f5e" /> Email
                                </a>
                              </div>
                            )}

                            <a href={item.url} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}>
                              <ExternalLink size={14} /> {t.openBtn}
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

            {/* 4. ՍԵՐՏԻՖԻԿԱՏՆԵՐԻ ԲԱԺԻՆ (Certificates) */}
            {activeTab === 'certificates' && (
              <div>
                {session && !isPublicView && (
                  <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                    <label className="neon-btn" style={{ padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      <Award size={16} /> {t.uploadCertBtn}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'certificates')}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}

                {profile.certificates.length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.6, marginTop: '40px' }}>{t.noFiles}</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {profile.certificates.map((item, index) => {
                      const isImage = item.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);

                      return (
                        <div
                          key={index}
                          className="glass-input"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '12px',
                            gap: '10px',
                            position: 'relative',
                            borderRadius: '16px',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Նախնական փոքր նկար/նախադիտում */}
                          <div
                            onClick={() => setSelectedCertificate(item)}
                            style={{
                              width: '100%',
                              height: '140px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              background: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative'
                            }}
                            title="Սեղմեք՝ մեծացնելու համար"
                          >
                            {isImage ? (
                              <img
                                src={item.url}
                                alt={item.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              />
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#2dd4bf' }}>
                                <FileText size={32} />
                                <span style={{ fontSize: '11px' }}>PDF File</span>
                              </div>
                            )}
                          </div>

                          {/* Անունը և ջնջելու կոճակը */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <span
                              onClick={() => setSelectedCertificate(item)}
                              style={{ fontWeight: '500', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, cursor: 'pointer', color: '#f8fafc' }}
                              title={item.name}
                            >
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

                {/* Մեծացված նկարի/սերտիֆիկատի ցուցադրման մոդալ պատուհան (Lightbox) */}
                {selectedCertificate && (
                  <div
                    onClick={() => setSelectedCertificate(null)}
                    style={{
                      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                      background: 'rgba(10, 15, 30, 0.85)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 99999,
                      padding: '20px',
                      animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        maxWidth: '92vw',
                        maxHeight: '92vh',
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1.5px solid rgba(20, 184, 166, 0.5)',
                        borderRadius: '20px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(20, 184, 166, 0.3)',
                        position: 'relative',
                        cursor: 'default'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f8fafc', fontSize: '14px', fontWeight: '600', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <span>{selectedCertificate.name}</span>
                        <button
                          onClick={() => setSelectedCertificate(null)}
                          style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        {selectedCertificate.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                          <img
                            src={selectedCertificate.url}
                            alt={selectedCertificate.name}
                            style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: '12px' }}
                          />
                        ) : (
                          <iframe
                            src={selectedCertificate.url}
                            title={selectedCertificate.name}
                            style={{ width: '80vw', height: '78vh', border: 'none', borderRadius: '12px' }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

        </div>
      )}
    </div>
  );
}