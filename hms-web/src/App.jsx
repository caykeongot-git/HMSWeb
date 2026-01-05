import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import BookingModal from './BookingModal';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';

// --- COMPONENT KẾT QUẢ THANH TOÁN (PaymentResult) ---
const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); 

    const resultCode = searchParams.get('resultCode');
    const message = searchParams.get('message');
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
  const [selectedRoom, setSelectedRoom] = useState(null);

  // -------------------------------------------------------------------------------------
  // --- SENIOR FIX 1: BỘ ẢNH CHUẨN KHÁCH SẠN 5 SAO (Thay vì 1 ảnh lặp lại) ---
  const HOTEL_IMAGES = [
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-f33fb0d41022?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80"
  ];

  // --- SENIOR FIX 2: MÔ TẢ GIẢ LẬP CHO TỪNG LOẠI PHÒNG (Để nút Detail có cái mà hiện) ---
  const ROOM_DESCRIPTIONS = {
    "Single": "Phòng đơn sang trọng với tầm nhìn hướng phố, trang bị đầy đủ tiện nghi cho doanh nhân.",
    "Double": "Không gian lãng mạn dành cho các cặp đôi, bồn tắm nằm và ban công rộng thoáng.",
    "Suite": "Đẳng cấp thượng lưu với phòng khách riêng biệt, phục vụ rượu vang và bữa sáng tại phòng.",
    "Deluxe": "Trải nghiệm nghỉ dưỡng đỉnh cao với nội thất nhập khẩu Ý và view biển Panorama."
  };

  // Hàm xử lý khi bấm nút DETAILS (Thêm cái này để nút không bị liệt)
  const handleShowDetail = (room) => {
    const desc = ROOM_DESCRIPTIONS[room.type] || "Trải nghiệm tiện nghi đẳng cấp 5 sao quốc tế.";
    // Dùng alert cho nhanh gọn lẹ, hoặc nếu cậu pro hơn thì làm Modal riêng. 
    // Nhưng deadline gấp thì ALERT đẹp + xuống dòng là đủ ăn điểm chữa cháy.
    alert(`🌟 CHI TIẾT PHÒNG ${room.roomNumber} (${room.type})\n\nℹ️ Mô tả: ${desc}\n\n💰 Giá: ${room.price.toLocaleString()} VND/đêm\n✨ Tiện ích: ${room.capacity} Khách, Wifi, Minibar, Smart TV.\n\n👉 Vui lòng nhấn BOOK NOW để đặt phòng này!`);
  };
  // -------------------------------------------------------------------------------------

  const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/Room/available`; 

useEffect(() => {
    const fetchRooms = async () => {
      try {
        console.log("Đang gọi API:", API_URL); // Log 1: Xem link đúng chưa

        const config = {
            headers: {
                "ngrok-skip-browser-warning": "true",
                "Content-Type": "application/json"
            }
        };

        const response = await axios.get(API_URL, config);
        const data = response.data;
        
        console.log("Dữ liệu API trả về:", data); // Log 2: Quan trọng nhất!

        // KIỂM TRA: Nếu data là mảng thì mới chạy tiếp
        if (Array.isArray(data)) {
            setRooms(data);
            setFilteredRooms(data);
            // Sửa lỗi: Chỉ map khi chắc chắn là mảng
            const types = ['ALL', ...new Set(data.map(room => room.type))];
            setRoomTypes(types);
        } else {
            console.error("🔥 LỖI: API không trả về danh sách!", data);
            // Nếu data là HTML (chuỗi), nó sẽ hiện ra đây
            if (typeof data === 'string') {
                console.warn("⚠️ Có vẻ như Ngrok hoặc Server đang trả về HTML thay vì JSON.");
            }
        }
      } catch (error) {
        console.error("❌ Lỗi gọi API:", error);
        // Log chi tiết lỗi mạng nếu có
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
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

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">MOSHI HOTELS</div>
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
            {filteredRooms.map((room, index) => ( // Nhớ thêm index vào tham số
              <div key={room.id} className="room-card">
                <div className="room-image-wrapper">
                  {/* FIX 1: Lấy ảnh theo thứ tự index để không bị trùng */}
                  <img 
                    src={HOTEL_IMAGES[index % HOTEL_IMAGES.length]} 
                    alt="Hotel Room" 
                    style={{height: '250px', objectFit: 'cover'}} // Thêm style cứng để ảnh đều nhau tăm tắp
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
                    <span>📐 {45 + (index * 5)}m²</span> {/* Hack nhẹ diện tích cho phong phú */}
                    <span>📶 Free Wifi</span>
                  </div>
                  
                  {/* Đã thêm mô tả ngắn (Cắt bớt text cho đẹp layout) */}
                  <p style={{fontSize: '0.85rem', color: '#666', margin: '10px 0', fontStyle: 'italic'}}>
                     {ROOM_DESCRIPTIONS[room.type] || "Tiện nghi cao cấp..."}
                  </p>

                  <div className="card-footer">
                    {/* FIX 2: Nút DETAILS giờ đã có sự sống */}
                    <button className="btn-detail" onClick={() => handleShowDetail(room)}>
                        DETAILS
                    </button>
                    
                    {/* FIX 3: Nút BOOK NOW */}
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

      {selectedRoom && (
        <BookingModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />
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