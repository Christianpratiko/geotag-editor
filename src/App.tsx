import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, MapPin, Calendar, Clock, Download, Image as ImageIcon, Plus, RefreshCw, Layers, Search, X, ThermometerSun, ChevronLeft } from 'lucide-react';
import Cropper from 'react-easy-crop';

// Helper to crop image
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string | null> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 1.0);
};

export default function App() {
  const [activeView, setActiveView] = useState<'home' | 'generate' | 'combine'>('home');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 overflow-x-hidden w-full">
      {activeView === 'home' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 pt-10">
          <div className="max-w-md w-full space-y-4">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center gap-3 mb-6">
                <div className="bg-indigo-600 p-3 sm:p-4 rounded-2xl text-white shadow-xl shadow-indigo-200 transform -rotate-6">
                  <MapPin className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h1 className="font-bold text-3xl sm:text-4xl tracking-tight text-slate-800">
                  GeoTag<span className="text-indigo-600">Snap</span>
                </h1>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Selamat datang</h2>
              <p className="text-slate-500 mt-2 text-sm sm:text-base">Pilih fitur yang ingin Anda gunakan hari ini</p>
            </div>
            
            <button
              onClick={() => setActiveView('generate')}
              className="w-full flex items-center p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:ring-4 hover:ring-indigo-50 transition-all group text-left active:scale-[0.98]"
            >
              <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="ml-4 sm:ml-5 flex-1">
                <h3 className="font-bold text-slate-800 text-lg sm:text-xl group-hover:text-indigo-700 transition-colors">Edit Geotag</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 leading-relaxed">Tambahkan informasi map, lokasi, jam, dan cuaca pada foto</p>
              </div>
            </button>

            <button
              onClick={() => setActiveView('combine')}
              className="w-full flex items-center p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:ring-4 hover:ring-indigo-50 transition-all group text-left active:scale-[0.98]"
            >
              <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Layers className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="ml-4 sm:ml-5 flex-1">
                <h3 className="font-bold text-slate-800 text-lg sm:text-xl group-hover:text-indigo-700 transition-colors">Gabung Gambar</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 leading-relaxed">Gabungkan foto utama dengan foto resi atau geotag secara vertikal</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {activeView !== 'home' && (
        <main className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 mt-2">
          <div className="mb-6">
            <button 
              onClick={() => setActiveView('home')}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 hover:border-indigo-200 w-fit active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
          </div>
          {activeView === 'generate' ? <GenerateGeotag /> : <CombineImages />}
        </main>
      )}
    </div>
  );
}

function GenerateGeotag() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  
  const [mapSourceUrl, setMapSourceUrl] = useState<string | null>(null);
  const [mapPhoto, setMapPhoto] = useState<string | null>(null);

  const [croppingTarget, setCroppingTarget] = useState<'main' | 'map' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [location, setLocation] = useState('Jl. Gembong Sekolahan No.5, Kapasan, Kec. Simokerto, Surabaya, Jawa Timur 60141, Indonesia');
  const [district, setDistrict] = useState('Kecamatan Simokerto');
  const [province, setProvince] = useState('Jawa Timur');
  const [country, setCountry] = useState('Indonesia');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [temperature, setTemperature] = useState('33');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingLoc, setIsLoadingLoc] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const day = days[now.getDay()];
    setDate(`${y}-${m}-${d}(${day})`);
    
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const min = String(now.getMinutes()).padStart(2, '0');
    setTime(`${String(hours).padStart(2, '0')}:${min}(${ampm})`);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setPhotoUrl(fileUrl);
      setCroppingTarget('main');
    }
  };

  const handleMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setMapSourceUrl(fileUrl);
      setCroppingTarget('map');
    }
  };

  const completeCrop = async () => {
    if (croppingTarget === 'main' && photoUrl && croppedAreaPixels) {
      const croppedUrl = await getCroppedImg(photoUrl, croppedAreaPixels);
      setCroppedImage(croppedUrl);
      setCroppingTarget(null);
    } else if (croppingTarget === 'map' && mapSourceUrl && croppedAreaPixels) {
      const croppedUrl = await getCroppedImg(mapSourceUrl, croppedAreaPixels);
      setMapPhoto(croppedUrl);
      setCroppingTarget(null);
    }
  };

  const applyAddressData = (data: any) => {
    if (data && data.address) {
      const addr = data.address;
      const roadParts = [addr.road, addr.house_number].filter(Boolean).join(' ');
      const detail = [roadParts, addr.neighbourhood, addr.village].filter(Boolean).join(', ');
      setLocation(detail || data.display_name);
      
      const dist = addr.county || addr.suburb || addr.city_district || addr.city || '';
      setDistrict(dist ? `Kecamatan ${dist.replace('Kecamatan ', '')}` : '');
      setProvince(addr.state || '');
      setCountry(addr.country || '');
    } else if (data && data.display_name) {
      setLocation(data.display_name);
    }
  };

  const fetchLocation = () => {
    setIsLoadingLoc(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
            const data = await res.json();
            applyAddressData(data);
            setSearchQuery(data.display_name.split(',')[0]);
          } catch (err) {
            setLocation(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
          }
          setIsLoadingLoc(false);
        },
        (error) => {
          console.error(error);
          alert('Gagal mengambil lokasi. Pastikan izin lokasi diberikan.');
          setIsLoadingLoc(false);
        }
      );
    } else {
      alert('Browser Anda tidak mendukung geolokasi.');
      setIsLoadingLoc(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mencari alamat.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectAddress = (res: any) => {
    applyAddressData(res);
    setSearchQuery(res.display_name.split(',')[0]);
    setSearchResults([]);
  };

  useEffect(() => {
    const drawCanvas = async () => {
      if (!croppedImage) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = croppedImage;
      await new Promise((r) => (img.onload = r));

      const W = 960;
      const H = 1280;

      canvas.width = W;
      canvas.height = H;

      // Draw photo (cropped 1:1) at top
      ctx.drawImage(img, 0, 0, W, W);

      // Draw map on bottom left (W/3 = 320, W/3 = 320)
      if (mapPhoto) {
        const mapImg = new Image();
        mapImg.src = mapPhoto;
        await new Promise((r) => (mapImg.onload = r));
        ctx.drawImage(mapImg, 0, W, 320, 320);
      } else {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, W, 320, 320);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for(let i=1; i<4; i++) {
            ctx.moveTo(i*80, W);
            ctx.lineTo(i*80, H);
            ctx.moveTo(0, W + i*80);
            ctx.lineTo(320, W + i*80);
        }
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(160, W + 150, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(145, W + 155);
        ctx.lineTo(160, W + 190);
        ctx.lineTo(175, W + 155);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('Google', 20, H - 20);
      }

      ctx.fillStyle = '#898a8c'; // Matching grey background
      ctx.fillRect(320, W, 640, 320);

      ctx.fillStyle = 'white';

      const PADDING_X = 24;

      // 1. Text Address (left aligned)
      ctx.textAlign = 'left';
      ctx.font = '10px Arial, sans-serif'; 
      const maxW = 480;
      const words = location.split(' ');
      let line = '';
      let addressYOffset = W + 30;
      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxW && n > 0) {
          ctx.fillText(line, 320 + PADDING_X, addressYOffset);
          line = words[n] + ' ';
          addressYOffset += 14;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 320 + PADDING_X, addressYOffset);

      // -- Left Section Base Coordinates --
      const leftCenterX = 320 + 250; // 570
      
      // 2. Middle Texts (Kecamatan, Provinsi, Negara) - left side, centered
      ctx.textAlign = 'center';
      ctx.font = '40px Arial, sans-serif';
      const middleYBase = addressYOffset + 65;
      ctx.fillText(district, leftCenterX, middleYBase);
      ctx.fillText(province, leftCenterX, middleYBase + 55);
      ctx.fillText(country, leftCenterX, middleYBase + 110);

      // 3. Bottom left Date & Time - left side, centered
      ctx.font = '28px Arial, sans-serif';
      ctx.fillText(`${date}   ${time}`, leftCenterX, H - 35);

      // -- Right Section Base Coordinates --
      const rightCenterX = 960 - 75; // 885
      
      // 4. Cloud/Sun Icon - right side, Top
      const iconX = rightCenterX - 5; 
      const iconY = W + 65;
      
      // Sun
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.arc(iconX + 20, iconY - 15, 16, 0, Math.PI * 2);
      ctx.fill();
      
      // Sun rays
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(iconX + 20 + Math.cos(angle) * 19, iconY - 15 + Math.sin(angle) * 19);
        ctx.lineTo(iconX + 20 + Math.cos(angle) * 27, iconY - 15 + Math.sin(angle) * 27);
        ctx.stroke();
      }

      // Cloud
      ctx.fillStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.arc(iconX - 15, iconY, 15, 0, Math.PI * 2);
      ctx.arc(iconX + 5, iconY - 15, 20, 0, Math.PI * 2);
      ctx.arc(iconX + 25, iconY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(iconX - 15, iconY - 15, 40, 30);

      // 5. Bottom right Temperature - right side, centered horizontally
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '40px Arial, sans-serif';
      const c = parseInt(temperature) || 0;
      const f = Math.round((c * 9) / 5 + 32);
      ctx.fillText(`${c}°C`, rightCenterX, H - 90);
      ctx.fillText(`${f}°F`, rightCenterX, H - 35);

      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.95));
    };

    drawCanvas();
  }, [croppedImage, mapPhoto, location, district, province, country, date, time, temperature]);

  const downloadImage = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = `geotagSnap-${Date.now()}.jpg`;
    link.href = previewUrl;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
      {croppingTarget !== null && (croppingTarget === 'main' ? photoUrl : mapSourceUrl) && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex-1 relative">
            <Cropper
              image={(croppingTarget === 'main' ? photoUrl : mapSourceUrl) as string}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              onZoomChange={setZoom}
            />
          </div>
          <div className="p-4 bg-slate-900 flex justify-center items-center text-slate-300 text-sm">
             <p>Geser & zoom foto untuk disesuaikan menjadi bentuk kotak rata (1:1).</p>
          </div>
          <div className="p-4 bg-slate-900 flex justify-end gap-3 text-white border-t border-slate-800 pb-8">
             <button onClick={() => { setCroppingTarget(null); setPhotoUrl(null); setMapSourceUrl(null); }} className="px-5 py-2 font-medium bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500">Batal</button>
             <button onClick={completeCrop} className="px-5 py-2 font-bold bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400">Crop & Selesai</button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <Camera className="w-5 h-5" />
            </div>
            Atur Geotag
          </h2>
          {croppedImage && (
            <button onClick={() => { setCroppedImage(null); setPhotoUrl(null); }} className="text-slate-400 hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="space-y-5">
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. Upload Foto Utama</label>
            <div className={`border border-slate-200 rounded-xl transition-all p-2 bg-slate-50 flex items-center gap-3`}>
              {croppedImage ? (
                <img src={croppedImage} alt="Cropped" className="w-10 h-10 object-cover rounded shadow-sm" />
              ) : (
                <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs w-full text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer" />
            </div>
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Peta Kiri Bawah (Opsional)</label>
            <div className={`border border-slate-200 rounded-xl transition-all p-2 bg-slate-50 flex items-center gap-3`}>
              {mapPhoto ? (
                <img src={mapPhoto} alt="Map" className="w-10 h-10 object-cover rounded shadow-sm" />
              ) : (
                <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleMapUpload} className="text-xs w-full text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-slate-200 file:text-slate-600 hover:file:bg-slate-300 cursor-pointer" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">2. Cari Lokasi Server</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Cari alamat atau koordinat..."
                  className="w-full rounded-xl border-slate-200 shadow-sm pl-10 pr-3 py-2.5 border focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
              <button 
                onClick={fetchLocation}
                disabled={isLoadingLoc}
                title="Gunakan Geolocation HP"
                className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50 border border-slate-200"
              >
                <RefreshCw className={`w-5 h-5 ${isLoadingLoc ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {searchResults.map((res, index) => (
                  <button
                    key={index}
                    onClick={() => selectAddress(res)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-700 truncate">{res.display_name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{res.type} • {res.lat}, {res.lon}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alamat Detail</label>
            <textarea 
              value={location}
              onChange={e => setLocation(e.target.value)}
              rows={2}
              className="w-full rounded-xl border-slate-200 shadow-sm px-3 py-2.5 border focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kecamatan</label>
              <input type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full rounded-xl border-slate-200 shadow-sm px-3 py-2.5 border focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Provinsi</label>
              <input type="text" value={province} onChange={e => setProvince(e.target.value)} className="w-full rounded-xl border-slate-200 shadow-sm px-3 py-2.5 border focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"/>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Negara</label>
              <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="w-full rounded-xl border-slate-200 shadow-sm px-3 py-2.5 border focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Suhu (°C)</label>
              <div className="relative">
                <ThermometerSun className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input type="text" value={temperature} onChange={e => setTemperature(e.target.value)} className="w-full rounded-xl border-slate-200 shadow-sm pl-10 pr-3 py-2.5 border focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"/>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tanggal</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full rounded-xl border-slate-200 shadow-sm pl-10 pr-3 py-2.5 border focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jam</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full rounded-xl border-slate-200 shadow-sm pl-10 pr-3 py-2.5 border focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {croppedImage ? (
          <button 
            onClick={downloadImage}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            SIMPAN HASIL GEOTAG
          </button>
        ) : (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400 font-medium italic">
            Silakan pilih foto terlebih dahulu
          </div>
        )}
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-7 flex flex-col gap-4 lg:sticky lg:top-6 mt-6 lg:mt-0">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Pratinjau Hasil
          </h3>
          {previewUrl && <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">READY TO SAVE (3:4)</span>}
        </div>
        
        <div className="bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center min-h-[500px] relative w-full aspect-[3/4]">
          {previewUrl ? (
            <div className="w-full h-full p-0 flex items-center justify-center">
             <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-contain shadow-2xl bg-white"
              />
            </div>
          ) : (
            <div className="text-slate-400 flex flex-col items-center p-12 text-center animate-pulse">
              <div className="bg-slate-100 p-6 rounded-full mb-4">
                <ImageIcon className="w-16 h-16 stroke-1 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-500">Menunggu Foto Utama</p>
              <p className="text-xs mt-2 max-w-[200px]">Hasil 3:4 akan muncul di sini secara otomatis</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}

function CombineImages() {
  const [photo1Url, setPhoto1Url] = useState<string | null>(null);
  const [photo2Url, setPhoto2Url] = useState<string | null>(null);
  const [croppedImage1, setCroppedImage1] = useState<string | null>(null);
  const [croppedImage2, setCroppedImage2] = useState<string | null>(null);

  const [croppingTarget, setCroppingTarget] = useState<'photo1' | 'photo2' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePhoto1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setPhoto1Url(fileUrl);
      setCroppingTarget('photo1');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspectRatio(1);
    }
  };

  const handlePhoto2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setPhoto2Url(fileUrl);
      setCroppingTarget('photo2');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspectRatio(3/1); // Default to 3:1 for Geotag/Watermark
    }
  };

  const completeCropCombine = async () => {
    if (croppingTarget === 'photo1' && photo1Url && croppedAreaPixels) {
      const croppedUrl = await getCroppedImg(photo1Url, croppedAreaPixels);
      setCroppedImage1(croppedUrl);
      setCroppingTarget(null);
    } else if (croppingTarget === 'photo2' && photo2Url && croppedAreaPixels) {
      const croppedUrl = await getCroppedImg(photo2Url, croppedAreaPixels);
      setCroppedImage2(croppedUrl);
      setCroppingTarget(null);
    }
  };

  useEffect(() => {
    if (!croppedImage1 || !croppedImage2) return;

    const drawCombined = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = src;
        });
      };

      const img1 = await loadImage(croppedImage1);
      const img2 = await loadImage(croppedImage2);

      canvas.width = img1.width;
      const scaleFactor = img1.width / img2.width;
      const img2ScaledHeight = img2.height * scaleFactor;
      canvas.height = img1.height + img2ScaledHeight;

      ctx.drawImage(img1, 0, 0, img1.width, img1.height);
      ctx.drawImage(img2, 0, img1.height, img1.width, img2ScaledHeight);

      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.95));
    };

    drawCombined();
  }, [croppedImage1, croppedImage2]);

  const downloadImage = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = `combineSnap-${Date.now()}.jpg`;
    link.href = previewUrl;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
      {croppingTarget !== null && (croppingTarget === 'photo1' ? photo1Url : photo2Url) && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex-1 relative">
            <Cropper
              image={(croppingTarget === 'photo1' ? photo1Url : photo2Url) as string}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              onZoomChange={setZoom}
            />
          </div>
          <div className="p-4 bg-slate-900 flex justify-center items-center text-slate-300 text-sm gap-4 flex-wrap">
             <span className="text-xs text-slate-400 font-medium bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
               Rasio Tetap: {croppingTarget === 'photo1' ? '1:1 (Persegi)' : '3:1 (Geotag/Watermark)'}
             </span>
          </div>
          <div className="p-4 bg-slate-900 flex justify-end gap-3 text-white border-t border-slate-800 pb-8">
             <button onClick={() => { setCroppingTarget(null); setPhoto1Url(null); setPhoto2Url(null); }} className="px-5 py-2.5 font-medium bg-slate-800 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors">Batal</button>
             <button onClick={completeCropCombine} className="px-5 py-2.5 font-bold bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg shadow-indigo-600/30">Crop & Selesai</button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <ImageIcon className="w-5 h-5" />
            </div>
            Gabung Gambar
          </h2>
          
          <div className="space-y-4 mt-6">
            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>1. Foto Utama (Atas)</span>
                {croppedImage1 && (
                  <button onClick={() => { setCroppedImage1(null); setPhoto1Url(null); setPreviewUrl(null); }} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </label>
              <div className={`border-2 border-dashed rounded-xl p-4 transition-all ${croppedImage1 ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200 bg-slate-50'}`}>
                {croppedImage1 ? (
                  <div className="flex items-center gap-4">
                    <img src={croppedImage1} alt="Foto 1" className="w-16 h-16 object-cover rounded-lg border border-indigo-100 shadow-sm bg-white" />
                    <span className="text-sm font-semibold text-indigo-700">Foto Siap</span>
                  </div>
                ) : (
                  <input type="file" accept="image/*" onChange={handlePhoto1} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" />
                )}
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-white border-2 border-slate-100 text-slate-300 rounded-full p-1.5 shadow-sm">
                <Plus className="w-4 h-4" />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>2. Foto Geotag/Watermark (Bawah)</span>
                {croppedImage2 && (
                  <button onClick={() => { setCroppedImage2(null); setPhoto2Url(null); setPreviewUrl(null); }} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </label>
              <div className={`border-2 border-dashed rounded-xl p-4 transition-all ${croppedImage2 ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200 bg-slate-50'}`}>
                {croppedImage2 ? (
                  <div className="flex items-center gap-4">
                    <img src={croppedImage2} alt="Foto 2" className="w-16 h-16 object-cover rounded-lg border border-indigo-100 shadow-sm bg-white" />
                    <span className="text-sm font-semibold text-indigo-700">Foto Siap</span>
                  </div>
                ) : (
                  <input type="file" accept="image/*" onChange={handlePhoto2} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" />
                )}
              </div>
            </div>
          </div>
        </div>

        {croppedImage1 && croppedImage2 && (
          <button 
            onClick={downloadImage}
            className="mt-4 w-full flex items-center justify-center gap-3 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            GABUNGKAN & SIMPAN
          </button>
        )}
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-7 flex flex-col gap-4 lg:sticky lg:top-6 mt-6 lg:mt-0">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Hasil Gabungan
          </h3>
        </div>
        
        <div className="bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center min-h-[500px] relative">
          {previewUrl ? (
            <div className="w-full h-full p-4 flex items-center justify-center">
              <img 
                src={previewUrl} 
                alt="Preview Gabungan" 
                className="max-w-full max-h-[700px] object-contain shadow-2xl rounded-lg bg-white"
              />
            </div>
          ) : (
            <div className="text-slate-400 flex flex-col items-center p-12 text-center">
              <div className="bg-slate-100 p-6 rounded-full mb-4">
                <Layers className="w-16 h-16 stroke-1 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-500">Menunggu Input Gambar</p>
              <p className="text-xs mt-2 max-w-[220px]">Pilih dan crop kedua gambar untuk melihat pratinjau hasil penggabungan vertikal di sini.</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
