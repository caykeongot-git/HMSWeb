import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import BookingModal from './BookingModal';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';

// --- BỘ SƯU TẬP ẢNH "BẤT TỬ" (Dùng ID chuẩn của Unsplash) ---
const LUXURY_IMAGES = [
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80", // 0. Sang trọng
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", // 1. Ấm cúng
  "https://images.unsplash.com/photo-1590490360182-f33fb0d41022?auto=format&fit=crop&w=800&q=80", // 2. Hiện đại
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", // 3. View biển
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80", // 4. Giường đôi
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80", // 5. Suite
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80", // 6. Mát mẻ
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80", // 7. Thượng lưu
];

const ROOM_DESCRIPTIONS = {
    "Single": "Phòng đơn sang trọng dành cho doanh nhân với bàn làm việc riêng biệt và tầm nhìn hướng phố nhộn nhịp.",
    "Double": "Không gian lãng mạn hoàn hảo cho các cặp đôi, thiết kế gam màu ấm áp, bồn tắm nằm thư giãn.",
    "Suite": "Đẳng cấp thượng lưu 5 sao. Phòng khách riêng biệt, phục vụ rượu vang, view biển Panorama bao trọn vịnh.",
    "Deluxe": "Trải nghiệm nghỉ dưỡng đỉnh cao với nội thất nhập khẩu từ Ý, ban công rộng thoáng đón gió biển."
};

// --- COMPONENT: POPUP CHI TIẾT (ROOM DETAIL MODAL) ---
const RoomDetailModal = ({ room, imgIndex, onClose, onBook }) => {
    // Lấy 3 ảnh khác làm ảnh phụ (Gallery giả lập)
    const galleryImages = [
        LUXURY_IMAGES[(imgIndex + 1) % LUXURY_IMAGES.length],
        LUXURY_IMAGES[(imgIndex + 2) % LUXURY_IMAGES.length],
        LUXURY_IMAGES[(imgIndex + 3) % LUXURY_IMAGES.length]
    ];
    
    const description = ROOM_DESCRIPTIONS[room.type] || "Tiện nghi cao cấp chuẩn quốc tế, mang lại giấc ngủ êm ái.";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="detail-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn-circle" onClick={onClose}>&times;</button>
                
                <div className="detail-grid">
                    {/* Cột Trái: Ảnh */}
                    <div className="detail-gallery">
                        <div className="main-img-wrapper">
                             <img src={LUXURY_IMAGES[imgIndex % LUXURY_IMAGES.length]} alt="Main Room" className="detail-main-img" />
                             <div className="tag-overlay">{room.type}</div>
                        </div>
                        <div className="thumb-grid">
                            {galleryImages.map((img, idx) => (
                                <img key={idx} src={img} alt="Thumb" className="detail-thumb" />
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
                            <div className="feature-item">📐 {45 + (imgIndex * 5)}m²</div>
                            <div className="feature-item">📶 High-Speed Wifi</div>
                            <div className="feature-item">❄️ Air Conditioner</div>
                            <div className="feature-item">📺 4K Smart TV</div>
                            <div className="feature-item">🛁 Bathtub</div>
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


// --- COMPONENT KẾT QUẢ THANH TOÁN (PaymentResult) ---
const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); 

    const resultCode = searchParams.get('resultCode');
    const message = searchParams.get('message');
    const BOOKING_API = `${import.meta.env.VITE_API_BASE_URL}/api/Booking/create`; 

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
            </div>
        </div>
    );
};

// --- COMPONENT TRANG CHỦ (Home) ---
const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('ALL');
  
  // State quản lý Modal
  const [selectedBookingRoom, setSelectedBookingRoom] = useState(null); // Modal Booking
  const [selectedDetailRoom, setSelectedDetailRoom] = useState(null);   // Modal Detail (MỚI)

  const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/Room/available`; 

  useEffect(() => {
    const fetchRooms = async () => {
      try {
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
        }
      } catch (error) {
        console.error("Lỗi API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const handleFilterChange = (e) => {
    const type = e.target.value;
    setSelectedType(type);
    if (type === 'ALL') setFilteredRooms(rooms);
    else setFilteredRooms(rooms.filter(room => room.type === type));
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">MOSHI HOTELS <span>★★★★★</span></div>
        <ul className="nav-links">
          <li>HOME</li>
          <li>SUITES</li>
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
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải danh sách phòng hạng sang...</p>
          </div>
        ) : (
          <div className="room-grid">
            {filteredRooms.map((room, index) => (
              <div key={room.id} className="room-card">
                <div className="room-image-wrapper">
                  {/* Sử dụng ảnh từ mảng LUXURY_IMAGES theo index để không bị trùng */}
                  <img 
                    src={LUXURY_IMAGES[index % LUXURY_IMAGES.length]} 
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
                  
                  {/* Mô tả ngắn (cắt bớt) */}
                  <p className="room-short-desc">
                     {(ROOM_DESCRIPTIONS[room.type] || "Tiện nghi cao cấp...").substring(0, 60)}...
                  </p>

                  <div className="card-footer">
                    {/* Nút DETAIL giờ sẽ mở Modal xịn */}
                    <button className="btn-detail" onClick={() => setSelectedDetailRoom({room, index})}>
                        DETAILS
                    </button>
                    <button className="btn-book" onClick={() => setSelectedBookingRoom(room)}>
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

      {/* --- MODAL BOOKING (Cũ) --- */}
      {selectedBookingRoom && (
        <BookingModal room={selectedBookingRoom} onClose={() => setSelectedBookingRoom(null)} />
      )}

      {/* --- MODAL DETAIL (Mới - Xịn xò) --- */}
      {selectedDetailRoom && (
        <RoomDetailModal 
            room={selectedDetailRoom.room} 
            imgIndex={selectedDetailRoom.index}
            onClose={() => setSelectedDetailRoom(null)} 
            onBook={(r) => {
                setSelectedDetailRoom(null); // Đóng Detail
                setSelectedBookingRoom(r);   // Mở Booking
            }}
        />
      )}
    </div>
  );
};

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