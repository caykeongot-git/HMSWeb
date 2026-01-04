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
            {filteredRooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-image-wrapper">
                  <img src={`https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80&sig=${room.id}`} alt="Hotel Room" />
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
                    <span>📐 45m²</span>
                    <span>📶 Free Wifi</span>
                  </div>
                  <div className="card-footer">
                    <button className="btn-detail">DETAILS</button>
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