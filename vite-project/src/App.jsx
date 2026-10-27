import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { translations } from './translations';
import {
  Stethoscope, Phone, Send, MessageCircle, MapPin, BookOpen,
  Award, Moon, Sun, LogOut, Camera, Upload, Trash2, ExternalLink,
  FileText, Globe, Share2, Copy, Check, X
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

  const [activeTab, setActiveTab] = useState('profile');
  const [publicUserId, setPublicUserId] = useState(null);
  const [isPublicView, setIsPublicView] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeShareIndex, setActiveShareIndex] = useState(null);

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
    if (!session) return;
    setLoading(true);
    const updates = {
      id: session.user.id,
      ...profile,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    if (error) showToast(error.message);
    else showToast(t.successUpdate);
    setLoading(false);
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
            <input
              type="password"
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              required
            />
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
                style={{ width: '100%', justifyContent: 'center', padding: '12px', gap: '10px', fontSize: '14px', background: 'linear-gradient(135deg, #0d9488 100%, #115e59 0%)' }}
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
                <h1 style={{ fontSize: '28px', margin: '10px 0 8px', fontWeight: '700' }}>{profile.full_name || t.defaultName}</h1>
                <p style={{ fontStyle: 'italic', opacity: 0.9, fontSize: '15px', marginBottom: '6px' }}>{profile.specialty || t.defaultSpecialty}</p>
                <p style={{ fontWeight: '600', color: 'var(--primary-color)', fontSize: '14px' }}>{profile.university || t.defaultUniversity}</p>
              </div>

              {!isPublicView ? (
                <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder={t.namePlaceholder}
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="glass-input"
                  />
                  <input
                    type="text"
                    placeholder={t.specialtyPlaceholder}
                    value={profile.specialty || ''}
                    onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                    className="glass-input"
                  />
                  <input
                    type="text"
                    placeholder={t.universityPlaceholder}
                    value={profile.university || ''}
                    onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                    className="glass-input"
                  />
                  <textarea
                    placeholder={t.bioPlaceholder}
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
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
                  <p>{profile.bio || t.noBioText}</p>
                </div>
              )}
            </div>
          )}

          {/* 2. ԿՈՆՏԱԿՏՆԵՐ ԵՎ ՍՈՑՑԱՆՑԵՐ */}
          {activeTab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isPublicView && (
                <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder={t.phonePlaceholder}
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="glass-input"
                  />
                  <input
                    type="text"
                    placeholder={t.telegramPlaceholder}
                    value={profile.telegram || ''}
                    onChange={(e) => setProfile({ ...profile, telegram: e.target.value })}
                    className="glass-input"
                  />
                  <input
                    type="text"
                    placeholder={t.whatsappPlaceholder}
                    value={profile.whatsapp || ''}
                    onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                    className="glass-input"
                  />
                  <input
                    type="text"
                    placeholder={t.instagramPlaceholder}
                    value={profile.instagram || ''}
                    onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                    className="glass-input"
                  />
                  <input
                    type="text"
                    placeholder={t.linkedinPlaceholder}
                    value={profile.linkedin || ''}
                    onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    className="glass-input"
                  />
                  <input
                    type="text"
                    placeholder={t.facebookPlaceholder}
                    value={profile.facebook || ''}
                    onChange={(e) => setProfile({ ...profile, facebook: e.target.value })}
                    className="glass-input"
                  />
                  <input
                    type="text"
                    placeholder={t.mapPlaceholder}
                    value={profile.map_url || ''}
                    onChange={(e) => setProfile({ ...profile, map_url: e.target.value })}
                    className="glass-input"
                  />
                  <button type="submit" className="neon-btn" style={{ padding: '14px', width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                    {t.updateBtn}
                  </button>
                </form>
              )}

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

          {/* 3. ԳՐԱԴԱՐԱՆ */}
          {activeTab === 'library' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>{t.tabLibrary}</h3>
                {session && !isPublicView && (
                  <label className="neon-btn" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <Upload size={16} /> {t.uploadLibraryBtn}
                    <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileUpload(e, 'library')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {profile.library.length === 0 ? (
                <p style={{ opacity: 0.7, textAlign: 'center', padding: '30px' }}>{t.noFiles}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile.library.map((item, idx) => (
                    <div key={idx} className="glass-input" style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', position: 'relative' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', wordBreak: 'break-all' }}>
                        <FileText size={18} color="var(--primary-color)" /> {item.name}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <a href={item.url} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ExternalLink size={14} /> {t.openBtn}
                        </a>
                        <button
                          onClick={() => setActiveShareIndex(activeShareIndex === idx ? null : idx)}
                          className="neon-btn"
                          style={{ padding: '6px 10px', fontSize: '12px', background: 'linear-gradient(135deg, #0d9488 100%, #115e59 0%)' }}
                        >
                          <Share2 size={16} />
                        </button>
                        {session && !isPublicView && (
                          <button onClick={() => handleDeleteItem(idx, 'library')} className="neon-btn" style={{ padding: '6px 10px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {activeShareIndex === idx && (
                        <div style={{ width: '100%', marginTop: '10px', padding: '12px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--card-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', opacity: 0.8 }}>
                            <span>{t.shareWithLabel || 'Կիսվել՝'}</span>
                            <X size={16} style={{ cursor: 'pointer' }} onClick={() => setActiveShareIndex(null)} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(item.url)}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 10px', fontSize: '11px', background: '#25D366' }}>WhatsApp</a>
                            <a href={`https://t.me/share/url?url=${encodeURIComponent(item.url)}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 10px', fontSize: '11px', background: '#229ED9' }}>Telegram</a>
                            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(item.url)}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 10px', fontSize: '11px', background: '#0a66c2' }}>LinkedIn</a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(item.url)}`} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 10px', fontSize: '11px', background: '#1877f2' }}>Facebook</a>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. ՍԵՐՏԻՖԻԿԱՏՆԵՐ */}
          {activeTab === 'certificates' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>{t.tabCertificates}</h3>
                {session && !isPublicView && (
                  <label className="neon-btn" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <Upload size={16} /> {t.uploadCertBtn}
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'certificates')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {profile.certificates.length === 0 ? (
                <p style={{ opacity: 0.7, textAlign: 'center', padding: '30px' }}>{t.noFiles}</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                  {profile.certificates.map((cert, idx) => (
                    <div key={idx} className="glass-input" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                      <img src={cert.url} alt="Cert" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px' }} />
                      <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cert.name}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '5px' }}>
                        <a href={cert.url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
                          <ExternalLink size={12} /> {t.openBtn}
                        </a>
                        {session && !isPublicView && (
                          <button onClick={() => handleDeleteItem(idx, 'certificates')} className="neon-btn" style={{ padding: '4px 8px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}