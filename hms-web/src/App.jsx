import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import BookingModal from './BookingModal';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';

// --- 1. BỘ SƯU TẬP ẢNH "BẤT TỬ" (Đã update link ổn định hơn) ---
const LUXURY_IMAGES = [
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80", // 0. Sang trọng
  "https://images.unsplash.com/photo-1590490360182-f33fb0d41022?auto=format&fit=crop&w=800&q=80", // 1. Hiện đại
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", // 2. View biển
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", // 3. Ấm cúng
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80", // 4. Giường đôi
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80", // 5. Suite
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80", // 6. Mát mẻ
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80", // 7. Thượng lưu
];

// Ảnh dự phòng (Nếu ảnh trên bị lỗi thì hiện ảnh này)
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";

// --- MÔ TẢ PHÒNG (KHỚP VỚI DATABASE CỦA CẬU) ---
const ROOM_DESCRIPTIONS = {
    "Standard King": "Phòng tiêu chuẩn với giường King Size êm ái, thiết kế hiện đại, đầy đủ tiện nghi cho kỳ nghỉ trọn vẹn.",
    "Deluxe Ocean View": "Tầm nhìn hướng biển tuyệt đẹp với ban công riêng đón gió, nội thất sang trọng nhập khẩu Châu Âu.",
    "Executive Suite": "Không gian đẳng cấp dành cho doanh nhân với phòng khách và khu vực làm việc tách biệt.",
    "Royal VIP": "Trải nghiệm phong cách hoàng gia, bồn tắm dát vàng và dịch vụ quản gia riêng 24/7.",
    "Presidential Suite": "Đỉnh cao của sự xa hoa, diện tích cực lớn với view Panorama toàn cảnh thành phố và biển."
};

// --- 2. COMPONENT POPUP CHI TIẾT (ROOM DETAIL MODAL - MỚI) ---
const RoomDetailModal = ({ room, imgIndex, onClose, onBook }) => {
    // Xử lý an toàn: Nếu imgIndex undefined thì dùng 0
    const safeIndex = imgIndex || 0;
    
    // Gallery giả lập (Lấy 3 ảnh tiếp theo)
    const galleryImages = [
        LUXURY_IMAGES[(safeIndex + 1) % LUXURY_IMAGES.length],
        LUXURY_IMAGES[(safeIndex + 2) % LUXURY_IMAGES.length],
        LUXURY_IMAGES[(safeIndex + 3) % LUXURY_IMAGES.length]
    ];
    
    // Logic lấy mô tả thông minh
    const description = ROOM_DESCRIPTIONS[room.type] || `Trải nghiệm đẳng cấp 5 sao tại phòng ${room.type} với tiện nghi vượt trội.`;

    // Hàm xử lý khi ảnh lỗi -> Đổi sang ảnh dự phòng ngay lập tức
    const handleImgError = (e) => {
        e.target.src = FALLBACK_IMAGE; 
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{zIndex: 2000}}>
            <div className="detail-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn-circle" onClick={onClose}>&times;</button>
                
                <div className="detail-grid">
                    {/* Cột Trái: Ảnh */}
                    <div className="detail-gallery">
                        <div className="main-img-wrapper">
                             <img 
                                src={LUXURY_IMAGES[safeIndex % LUXURY_IMAGES.length]} 
                                onError={handleImgError}
                                alt="Main Room" 
                                className="detail-main-img" 
                             />
                             <div className="tag-overlay">{room.type}</div>
                        </div>
                        <div className="thumb-grid">
                            {galleryImages.map((img, idx) => (
                                <img 
                                    key={idx} 
                                    src={img} 
                                    onError={handleImgError}
                                    alt="Thumb" 
                                    className="detail-thumb" 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Cột Phải: Thông tin */}
                    <div className="detail-info">
                        <h2 className="detail-title">Room {room.roomNumber} <span className="star-rating">★★★★★</span></h2>
                        <p className="detail-price">
                            {room.price.toLocaleString()} VND <span style={{fontSize:'0.6em', color:'#777'}}>/ Night</span>
                        </p>
                        <div className="detail-divider"></div>
                        <p className="detail-desc">{description}</p>
                        
                        <div className="detail-features">
                            <div className="feature-item">👥 {room.capacity} Guests</div>
                            <div className="feature-item">📐 {45 + (safeIndex * 5)}m²</div>
                            <div className="feature-item">📶 High-Speed Wifi</div>
                            <div className="feature-item">❄️ AC & Heating</div>
                        </div>

                        <div className="detail-actions">
                            <button className="btn-book-large" onClick={() => { onClose(); onBook(room); }}>
                                BOOK THIS ROOM NOW
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 3. COMPONENT PaymentResult (GIỮ NGUYÊN LOGIC CỦA CẬU) ---
const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); 

    const resultCode = searchParams.get('resultCode');
    const message = searchParams.get('message');
    // Logic của cậu giữ nguyên ở đây
    const BOOKING_API = "http://localhost:5271/api/Booking/create";

    useEffect(() => {
        const processBooking = async () => {
            if (resultCode === '0') {
                const savedData = localStorage.getItem("PENDING_BOOKING");
                if (!savedData) {
                    setStatus('fail');
                    return;
                }
                const bookingData = JSON.parse(savedData);
                
                try {
                    await axios.post(BOOKING_API, {
                        roomId: bookingData.roomId,
                        customerName: bookingData.customerName,
                        customerPhone: bookingData.customerPhone,
                        checkIn: bookingData.checkIn,
                        checkOut: bookingData.checkOut
                    });
                    setStatus('success');
                    localStorage.removeItem("PENDING_BOOKING");
                } catch (error) {
                    console.error("Lưu booking thất bại:", error);
                    setStatus('error_save');
                }
            } else {
                setStatus('fail');
            }
        };
        processBooking();
    }, [resultCode]);

    return (
        <div className="app-container" style={{justifyContent:'center', alignItems:'center', background:'#f4f7fa'}}>
            <div className="room-card" style={{padding:'50px', maxWidth:'600px', textAlign:'center', margin:'50px auto'}}>
                {status === 'processing' && (
                    <>
                        <div className="spinner" style={{margin:'0 auto 20px'}}></div>
                        <h2>Đang xác thực giao dịch...</h2>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div style={{fontSize:'5rem', marginBottom:'10px'}}>✅</div>
                        <h2 style={{color:'#27ae60', fontFamily:'Playfair Display'}}>Thanh Toán Thành Công!</h2>
                        <p>Cảm ơn bạn đã lựa chọn Moshi Hotel.</p>
                        <div className="divider" style={{width:'50px', margin:'20px auto', backgroundColor:'#ccc'}}></div>
                        <button className="btn-book" onClick={() => navigate('/')}>VỀ TRANG CHỦ</button>
                    </>
                )}
                {status === 'fail' && (
                    <>
                        <div style={{fontSize:'5rem', marginBottom:'10px'}}>❌</div>
                        <h2 style={{color:'#c0392b'}}>Thanh Toán Thất Bại</h2>
                        <p>{decodeURIComponent(message || "Giao dịch đã bị hủy.")}</p>
                        <button className="btn-detail" onClick={() => navigate('/')} style={{marginTop:'20px'}}>QUAY LẠI</button>
                    </>
                )}
                {status === 'error_save' && (
                    <>
                        <div style={{fontSize:'5rem', marginBottom:'10px'}}>⚠️</div>
                        <h2 style={{color:'#f39c12'}}>Lỗi Lưu Đơn</h2>
                        <p>Vui lòng liên hệ lễ tân để được hỗ trợ.</p>
                        <button className="btn-detail" onClick={() => navigate('/')}>VỀ TRANG CHỦ</button>
                    </>
                )}
            </div>
        </div>
    );
};

// --- 4. COMPONENT TRANG CHỦ (Home) - ĐÃ UPDATE UI ---
const Home = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('ALL');
  
  // State quản lý Modal
  const [selectedRoom, setSelectedRoom] = useState(null); // Modal Booking (Cũ)
  const [selectedDetailRoom, setSelectedDetailRoom] = useState(null); // Modal Detail (Mới)

  const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/Room/available`; 

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        console.log("Đang gọi API:", API_URL); 
        const config = {
            headers: {
                "ngrok-skip-browser-warning": "true",
                "Content-Type": "application/json"
            }
        };
        const response = await axios.get(API_URL, config);
        const data = response.data;
        
        if (Array.isArray(data)) {
            setRooms(data);
            setFilteredRooms(data);
            const types = ['ALL', ...new Set(data.map(room => room.type))];
            setRoomTypes(types);
        } else {
            console.error("🔥 LỖI: API không trả về danh sách!", data);
        }
      } catch (error) {
        console.error("❌ Lỗi gọi API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const handleFilterChange = (e) => {
    const type = e.target.value;
    setSelectedType(type);
    if (type === 'ALL') {
      setFilteredRooms(rooms);
    } else {
      setFilteredRooms(rooms.filter(room => room.type === type));
    }
  };

  // Hàm xử lý lỗi ảnh ở trang chủ
  const handleImgError = (e) => {
      e.target.src = FALLBACK_IMAGE;
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        {/* Dùng thẻ <a> với href="/" để nó tự load lại trang chủ */}
        <a 
          href="/" 
          className="logo" 
          style={{
            textDecoration: 'none', // Bỏ gạch chân của link
            display: 'flex',        // Giữ layout đẹp
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          MOSHI HOTELS <span style={{marginLeft: '10px'}}>★★★★★</span>
        </a>
        <ul className="nav-links">
          <li>HOME</li>
          <li>ROOMS & SUITES</li>
          <li>DINING</li>
          <li>SPA</li>
          <li className="active">BOOK NOW</li>
        </ul>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <p className="subtitle">WELCOME TO PARADISE</p>
          <h1>Luxury & Resort Suites</h1>
          <div className="divider"></div>
          <p className="description">Trải nghiệm kỳ nghỉ đẳng cấp thượng lưu với dịch vụ 5 sao chuẩn quốc tế.</p>
        </div>
      </header>

      <div className="content">
        <div className="section-title">
          <h2>Accommodations</h2>
          <p>Tìm không gian hoàn hảo cho kỳ nghỉ của bạn</p>
          {!loading && (
            <div className="filter-container">
              <label className="filter-label">Filter by Room Type:</label>
              <select className="filter-select" value={selectedType} onChange={handleFilterChange}>
                {roomTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type === 'ALL' ? 'Show All Rooms' : type}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p style={{marginTop: '10px', fontSize: '0.9rem', fontStyle: 'italic', color: '#777'}}>
             Hiển thị {filteredRooms.length} phòng trống
          </p>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tìm phòng tốt nhất cho bạn...</p>
          </div>
        ) : (
          <div className="room-grid">
            {filteredRooms.map((room, index) => (
              <div key={room.id} className="room-card">
                <div className="room-image-wrapper">
                  {/* Ảnh có xử lý Fallback nếu lỗi */}
                  <img 
                    src={LUXURY_IMAGES[index % LUXURY_IMAGES.length]} 
                    onError={handleImgError}
                    alt="Hotel Room" 
                    style={{height: '250px', objectFit: 'cover'}} 
                  />
                  <div className="price-badge">
                    <span className="currency">VND</span>
                    <span className="amount">{room.price.toLocaleString()}</span>
                    <span className="period">/ Night</span>
                  </div>
                </div>
                
                <div className="room-details">
                  <span className="room-type">{room.type}</span>
                  <h3 className="room-number">Room {room.roomNumber}</h3>
                  <div className="room-features">
                    <span>👥 {room.capacity} Guests</span>
                    <span>📐 {45 + (index * 5)}m²</span>
                    <span>📶 Free Wifi</span>
                  </div>
                  
                  {/* --- SỬA FONT & FIX MẤT CHỮ --- */}
                  <p style={{
                      fontSize: '0.9rem',           // Chữ to hơn xíu cho sang
                      color: '#555',                // Màu đậm hơn cho dễ đọc
                      margin: '15px 0',             // Cách xa tí cho thoáng
                      lineHeight: '1.5',            // Giãn dòng dễ đọc
                      fontFamily: 'Lato, sans-serif', // Font chuẩn
                      // CSS Kỹ thuật: Cắt chữ thông minh (Line Clamp)
                      display: '-webkit-box',
                      WebkitLineClamp: 2,           // Chỉ hiện tối đa 2 dòng
                      WebkitBoxOrient: 'vertical',  //
                      overflow: 'hidden',           //
                      textOverflow: 'ellipsis',     // Tự thêm dấu ...
                      height: '2.8em'               // Chiều cao cố định để khung không nhảy
                  }}>
                     {ROOM_DESCRIPTIONS[room.type] || `Trải nghiệm đẳng cấp 5 sao tại phòng ${room.type} với đầy đủ tiện nghi.`}
                  </p>

                  <div className="card-footer">
                    {/* Nút DETAIL mở Modal xịn */}
                    <button className="btn-detail" onClick={() => setSelectedDetailRoom({room, index})}>
                         DETAILS
                    </button>
                    {/* Nút BOOK mở Booking Form (Cũ) */}
                    <button className="btn-book" onClick={() => setSelectedRoom(room)}>
                      BOOK NOW
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="footer">
        <div className="footer-content">
          <h3>MOSHI HOTEL</h3>
          <p>123 Beach Road, Danang City, Vietnam</p>
          <p>Hotline: (+84) 909 123 456</p>
          <p className="copyright">© 2026 Moshi Hotel Group. All rights reserved.</p>
        </div>
      </footer>

      {/* MODAL BOOKING (CŨ - GIỮ NGUYÊN) */}
      {selectedRoom && (
        <BookingModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />
      )}

      {/* MODAL DETAIL (MỚI - THÊM VÀO) */}
      {selectedDetailRoom && (
        <RoomDetailModal 
            room={selectedDetailRoom.room} 
            imgIndex={selectedDetailRoom.index}
            onClose={() => setSelectedDetailRoom(null)} 
            onBook={(r) => {
                setSelectedDetailRoom(null); // Đóng Detail trước
                setSelectedRoom(r);          // Mở form Booking sau
            }}
        />
      )}
    </div>
  );
};

// --- APP COMPONENT CHÍNH ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/payment-result" element={<PaymentResult />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;