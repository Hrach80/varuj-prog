import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { translations } from './translations';
import {
  Stethoscope, Phone, Send, MessageCircle, MapPin, BookOpen,
  Award, Moon, Sun, LogOut, Camera, Upload, Trash2, ExternalLink, FileText
} from 'lucide-react';
import './index.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const [lang, setLang] = useState('am');
  const [theme, setTheme] = useState('light');
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState('profile');
  const [publicUserId, setPublicUserId] = useState(null);
  const [isPublicView, setIsPublicView] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '',
    specialty: '',
    university: '',
    bio: '',
    phone: '',
    telegram: '',
    whatsapp: '',
    map_url: '',
    avatar_url: '',
    library: [],
    certificates: [],
  });

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 20 || currentHour < 7) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
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
      if (error) alert(error.message);
      else alert('Success! Check your email if required.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
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
    } catch (error) {
      alert(error.message);
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

      alert('Ֆայլը հաջողությամբ ավելացվեց։');
    } catch (error) {
      alert(error.message);
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
    if (error) alert(error.message);
    else alert(t.successUpdate);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="ecg-loader">
          <svg viewBox="0 0 150 50" width="150" height="50">
            <path className="ecg-line" d="M0,25 l30,0 l10,-20 l10,40 l15,-50 l10,60 l10,-30 l30,0" />
          </svg>
        </div>
        <p style={{ fontWeight: '600', letterSpacing: '1px' }}>Բեռնվում է...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', maxWidth: '850px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={toggleTheme} className="neumorph-btn" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'light' ? 'Գիշեր' : 'Ցերեկ'}
        </button>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="neumorph-inset"
          style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer' }}
        >
          <option value="am">🇦🇲 Հայ</option>
          <option value="en">🇬🇧 Eng</option>
          <option value="ru">🇷🇺 Рус</option>
        </select>
        {session && !isPublicView && (
          <button onClick={() => supabase.auth.signOut()} className="neumorph-btn" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LogOut size={16} /> {t.logout}
          </button>
        )}
      </div>

      {!session && !isPublicView ? (
        <div className="neumorph-box" style={{ padding: '30px', maxWidth: '400px', margin: '40px auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
            {isSignUp ? t.signUpTitle : t.loginTitle}
          </h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="neumorph-inset"
              style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}
              required
            />
            <input
              type="password"
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="neumorph-inset"
              style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}
              required
            />
            <button type="submit" className="neumorph-btn" style={{ padding: '12px', fontWeight: 'bold' }}>
              {isSignUp ? t.signUpBtn : t.loginBtn}
            </button>
          </form>
          <p onClick={() => setIsSignUp(!isSignUp)} style={{ marginTop: '20px', cursor: 'pointer', fontSize: '13px', opacity: 0.8 }}>
            {isSignUp ? 'Արդեն ունե՞ք հաշիվ: Մուտք գործեք' : "Չունե՞ք հաշիվ: Գրանցվեք"}
          </p>
        </div>
      ) : (
        <div className="neumorph-box" style={{ padding: '30px', width: '100%', boxSizing: 'border-box' }}>

          {session && !isPublicView && (
            <div className="neumorph-inset" style={{ padding: '12px 15px', marginBottom: '20px', fontSize: '13px', wordBreak: 'break-all' }}>
              <strong>{t.shareLinkTitle}</strong> <br />
              <a href={`${window.location.origin}?user=${session.user.id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>
                {window.location.origin}?user={session.user.id}
              </a>
            </div>
          )}

          {/* Ներդիրներ (Tabs) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '30px' }}>
            <button onClick={() => setActiveTab('profile')} className={`neumorph-btn ${activeTab === 'profile' ? 'active' : ''}`} style={{ padding: '12px 5px', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <Stethoscope size={18} /> {t.tabProfile}
            </button>
            <button onClick={() => setActiveTab('contact')} className={`neumorph-btn ${activeTab === 'contact' ? 'active' : ''}`} style={{ padding: '12px 5px', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <MapPin size={18} /> {t.tabContact}
            </button>
            <button onClick={() => setActiveTab('library')} className={`neumorph-btn ${activeTab === 'library' ? 'active' : ''}`} style={{ padding: '12px 5px', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <BookOpen size={18} /> {t.tabLibrary}
            </button>
            <button onClick={() => setActiveTab('certificates')} className={`neumorph-btn ${activeTab === 'certificates' ? 'active' : ''}`} style={{ padding: '12px 5px', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <Award size={18} /> {t.tabCertificates}
            </button>
          </div>

          {/* 1. ՀԻՄՆԱԿԱՆ ԲԱԺԻՆ */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 15px' }}>
                  <div className="neumorph-inset" style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Stethoscope size={40} style={{ opacity: 0.6 }} />
                    )}
                  </div>
                  {session && !isPublicView && (
                    <label style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--bg-color)', borderRadius: '50%', padding: '6px', cursor: 'pointer', boxShadow: 'var(--box-shadow)' }}>
                      <Camera size={16} />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
                <h1 style={{ fontSize: '24px', margin: '10px 0 5px' }}>{profile.full_name || 'Բժշկական Մասնագետ'}</h1>
                <p style={{ fontStyle: 'italic', opacity: 0.8, fontSize: '14px' }}>{profile.specialty || 'Մասնագիտություն չկա'}</p>
                <p style={{ fontWeight: '600', color: 'var(--primary-color)', fontSize: '13px' }}>{profile.university || 'Բուհ չկա նշված'}</p>
              </div>

              {!isPublicView ? (
                <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder="Անուն Ազգանուն (օր. Վարուժան Վաղարշակյան)"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="neumorph-inset"
                    style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    placeholder="Մասնագիտություն / Կոչում (օր. Բժշկական ֆակուլտետի ուսանող)"
                    value={profile.specialty || ''}
                    onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                    className="neumorph-inset"
                    style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    placeholder="Ուսումնական հաստատություն (օր. ՄՊՀ Անվան Բժշկական Համալսարան)"
                    value={profile.university || ''}
                    onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                    className="neumorph-inset"
                    style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <textarea
                    placeholder="Գրեք ձեր գործունեության, հաջողությունների և հետաքրքրությունների մասին..."
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="neumorph-inset"
                    style={{ padding: '12px', width: '100%', height: '90px', resize: 'none', boxSizing: 'border-box' }}
                  />
                  <button type="submit" className="neumorph-btn" style={{ padding: '14px', fontWeight: 'bold' }}>
                    {t.updateBtn}
                  </button>
                </form>
              ) : (
                <div className="neumorph-inset" style={{ padding: '20px', lineHeight: '1.6' }}>
                  <p><strong>{t.bioLabel}:</strong></p>
                  <p>{profile.bio || 'Տեղեկություն չկա...'}</p>
                </div>
              )}
            </div>
          )}

          {/* 2. ԿՈՆՏԱԿՏՆԵՐ ԵՎ ՔԱՐՏԵԶ */}
          {activeTab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isPublicView ? (
                <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={20} color="var(--primary-color)" />
                    <input
                      type="text"
                      placeholder="Հեռախոսահամար (օր. +37494395221)"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="neumorph-inset"
                      style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Send size={20} color="var(--primary-color)" />
                    <input
                      type="text"
                      placeholder="Telegram օգտանուն (առանց @-ի, օր. hrach_v)"
                      value={profile.telegram || ''}
                      onChange={(e) => setProfile({ ...profile, telegram: e.target.value })}
                      className="neumorph-inset"
                      style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageCircle size={20} color="var(--primary-color)" />
                    <input
                      type="text"
                      placeholder="WhatsApp համար (օր. +37494395221)"
                      value={profile.whatsapp || ''}
                      onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                      className="neumorph-inset"
                      style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <MapPin size={20} color="var(--primary-color)" />
                      <span style={{ fontSize: '13px', opacity: 0.8 }}>Google Maps (Embed SRC հղում)</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Մուտքագրեք Google Maps-ի iframe src հղումը..."
                      value={profile.map_url || ''}
                      onChange={(e) => setProfile({ ...profile, map_url: e.target.value })}
                      className="neumorph-inset"
                      style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                    <small style={{ display: 'block', marginTop: '5px', opacity: 0.6, fontSize: '11px' }}>
                      💡 Ինչպես ստանալ. Google Maps-ում ընտրեք վայրը -&gt; Share -&gt; Embed a map -&gt; պատճենեք միայն src="..." մեջի հղումը։
                    </small>
                  </div>
                  <button type="submit" className="neumorph-btn" style={{ padding: '14px', fontWeight: 'bold' }}>
                    {t.updateBtn}
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="neumorph-inset" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {profile.phone && <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Phone size={18} color="var(--primary-color)" /> <strong>Հեռախոս:</strong> {profile.phone}</p>}
                    {profile.telegram && <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Send size={18} color="var(--primary-color)" /> <strong>Telegram:</strong> <a href={`https://t.me/${profile.telegram}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>@{profile.telegram}</a></p>}
                    {profile.whatsapp && <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MessageCircle size={18} color="var(--primary-color)" /> <strong>WhatsApp:</strong> <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>{profile.whatsapp}</a></p>}
                  </div>
                </div>
              )}

              {profile.map_url && (
                <div className="neumorph-inset" style={{ overflow: 'hidden', height: '250px', borderRadius: '15px' }}>
                  <iframe
                    src={profile.map_url}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>{t.tabLibrary}</h3>
                {session && !isPublicView && (
                  <label className="neumorph-btn" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <Upload size={16} /> Ներբեռնել նյութ
                    <input type="file" onChange={(e) => handleFileUpload(e, 'library')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {profile.library.length === 0 ? (
                <p style={{ opacity: 0.7, textAlign: 'center', padding: '30px' }}>{t.noFiles}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile.library.map((item, idx) => (
                    <div key={idx} className="neumorph-inset" style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', wordBreak: 'break-all' }}>
                        <FileText size={18} color="var(--primary-color)" /> {item.name}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <a href={item.url} target="_blank" rel="noreferrer" className="neumorph-btn" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ExternalLink size={14} /> Բացել
                        </a>
                        {session && !isPublicView && (
                          <button onClick={() => handleDeleteItem(idx, 'library')} className="neumorph-btn" style={{ padding: '6px', color: '#ef4444' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. ՍԵՐՏԻՖԻԿԱՏՆԵՐ */}
          {activeTab === 'certificates' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>{t.tabCertificates}</h3>
                {session && !isPublicView && (
                  <label className="neumorph-btn" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <Upload size={16} /> Ավելացնել սերտիֆիկատ
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'certificates')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {profile.certificates.length === 0 ? (
                <p style={{ opacity: 0.7, textAlign: 'center', padding: '30px' }}>{t.noFiles}</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
                  {profile.certificates.map((cert, idx) => (
                    <div key={idx} className="neumorph-inset" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                      <img src={cert.url} alt="Cert" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                      <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cert.name}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <a href={cert.url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
                          <ExternalLink size={12} /> Մեծացնել
                        </a>
                        {session && !isPublicView && (
                          <button onClick={() => handleDeleteItem(idx, 'certificates')} className="neumorph-btn" style={{ padding: '4px', color: '#ef4444' }}>
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