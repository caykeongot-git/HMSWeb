import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BookingModal = ({ room, onClose }) => {
  const [step, setStep] = useState(1); // 1: Info, 2: Payment
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', checkIn: '', checkOut: '' });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  
  // State mới: Để bật/tắt chế độ hiển thị QR (cho nút VNPAY)
  const [showQR, setShowQR] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  // API Config
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const BOOKING_API = `${BASE_URL}/api/Booking/create`; 
  const PAYMENT_API = `${BASE_URL}/api/Payment/momo`; // API cũ của cậu
  
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Tính tổng tiền tự động
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
        const start = new Date(formData.checkIn);
        const end = new Date(formData.checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const nights = diffDays > 0 ? diffDays : 1;
        setTotalPrice(nights * room.price);
    }
  }, [formData.checkIn, formData.checkOut, room.price]);

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.checkIn || !formData.checkOut) {
      setStatus({ type: 'error', msg: 'Please fill all fields!' });
      return;
    }
    setStep(2);
    setStatus({ type: '', msg: '' });
  };

  // --- 1. LOGIC CŨ (MOMO & ATM) - GIỮ NGUYÊN ĐỂ BÁO CÁO ---
  const handleMomoPayment = async (type) => {
    setLoading(true);
    setStatus({ type: 'info', msg: 'Đang kết nối cổng thanh toán MoMo...' });

    try {
        const bookingData = {
            roomId: room.id,
            customerName: formData.name,
            customerPhone: formData.phone,
            customerEmail: formData.email,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            roomNumber: room.roomNumber,
            price: room.price
        };
        localStorage.setItem("PENDING_BOOKING", JSON.stringify(bookingData));

        const response = await axios.post(PAYMENT_API, {
            roomNumber: room.roomNumber,
            customerName: formData.name,
            requestType: type
        });

        if (response.data && response.data.payUrl) {
             window.location.href = response.data.payUrl;
        } else {
            setStatus({ type: 'error', msg: 'Không lấy được link thanh toán!' });
            setLoading(false);
        }

    } catch (error) {
        console.error(error);
        setStatus({ type: 'error', msg: 'Lỗi kết nối MoMo (Sandbox bảo trì)!' });
        setLoading(false);
    }
  };

  // --- 2. LOGIC MỚI (VNPAY/VIETQR) - CHẮC CHẮN CHẠY ---
const getVietQRUrl = () => {
      const bankId = "MB"; 
      const accountNo = "0916897032"; 
      const accountName = "NGUYEN DINH AN NINH";
      
      const fullAmount = totalPrice > 0 ? totalPrice : room.price;
      const depositAmount = Math.ceil(fullAmount * 0.5); // Cọc 50%
      
      const description = `DEPOSIT ${formData.phone}`; 
      
      // Sửa 'amount' thành 'depositAmount' ở đây 👇
      return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;
  };

  const handleVnPayClick = () => {
      setShowQR(true); // Chỉ cần bật QR lên, không cần gọi API nào cả
      setStatus({ type: '', msg: '' });
  };

  // Xử lý tạo Booking (Dùng chung cho cả Pay Later và VNPAY QR)
  const handleSubmit = async (isPaid, method) => {
    setLoading(true);
    setStatus({ type: '', msg: '' });
    
    const payload = {
        roomId: room.id,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        isPaid: isPaid, 
        paymentMethod: method // Lưu phương thức thanh toán
    };

    try {
      await axios.post(BOOKING_API, payload);
      setStep(3); 
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Lỗi kết nối!";
      setStatus({ type: 'error', msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '550px'}}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="modal-header">
            <h2>{step === 1 ? "YOUR INFORMATION" : step === 2 ? "SECURE PAYMENT" : "CONFIRMED!"}</h2>
            <p className="room-name">Room {room.roomNumber} - {room.type}</p>
        </div>

        {step === 1 && (
            <form onSubmit={handleNext}>
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" name="name" required placeholder="Your Name" onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" name="phone" required placeholder="09xxxxxxx" onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Email (To receive invoice)</label>
                  <input type="email" name="email" placeholder="example@gmail.com" onChange={handleChange} />
              </div>
                <div className="form-row">
                    <div className="form-group"><label>Check-In</label><input 
                                                                            type="datetime-local" // <--- Đổi thành cái này
                                                                            required
                                                                            value={checkIn}
                                                                            onChange={(e) => setCheckIn(e.target.value)}
                                                                            className="form-control"
                                                                        />
                    </div>
                    <div className="form-group"><label>Check-Out</label><input 
                                                                            type="datetime-local" // <--- Đổi thành cái này
                                                                            required
                                                                            value={checkOut}
                                                                            onChange={(e) => setCheckOut(e.target.value)}
                                                                            className="form-control"
                                                                        />
                    </div>
                </div>
                {status.msg && <div className={`status-msg ${status.type}`}>{status.msg}</div>}
                <button type="submit" className="btn-submit">CONTINUE</button>
            </form>
        )}

        {step === 2 && !showQR && (
            <div className="payment-step">
                <p style={{textAlign: 'center', marginBottom: '15px'}}>Chọn cổng thanh toán:</p>
                
                {status.msg && <div className={`status-msg ${status.type}`}>{status.msg}</div>}

                {/* --- 3 NÚT THANH TOÁN --- */}
                <div className="payment-options" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    
                    {/* Nút 1: MoMo QR (Cũ) */}
                    <button className="btn-payment btn-qr" onClick={() => handleMomoPayment("captureWallet")} disabled={loading}>
                        <span className="btn-icon">📱</span> 
                        <span>MoMo Wallet (QR Code)</span>
                    </button>

                    {/* Nút 2: ATM (Cũ) */}
                    <button className="btn-payment btn-atm" onClick={() => handleMomoPayment("payWithATM")} disabled={loading}>
                        <span className="btn-icon">💳</span>
                        <span>Thẻ ATM / Napas</span>
                    </button>

                    {/* Nút 3: VNPAY (Mới - Class btn-vnpay đã thêm trong CSS) */}
                    <button className="btn-payment btn-vnpay" onClick={handleVnPayClick} disabled={loading}>
                        <span className="btn-icon">🔥</span>
                        <span>VNPAY QR (Khuyên dùng)</span>
                    </button>

                </div>

                <div style={{borderTop: '1px solid #eee', marginTop: '20px', paddingTop: '10px'}}>
                     <button className="btn-detail" style={{width: '100%'}} onClick={() => handleSubmit(false, "Pay at Hotel")} disabled={loading}>
                        Skip Payment (Pay at Hotel)
                    </button>
                </div>
            </div>
        )}

        {/* --- GIAO DIỆN QUÉT MÃ VIETQR (Khi bấm VNPAY) --- */}
        {step === 2 && showQR && (
             <div className="payment-step" style={{textAlign: 'center'}}>
                <h3 style={{color: '#ed1c24', marginBottom: '5px'}}>Cổng Thanh Toán VNPAY</h3>
                <p style={{marginBottom: '15px', fontSize: '0.9rem', color: '#666'}}>Mở App Ngân hàng hoặc VNPAY để quét mã</p>
                
                <div style={{background: 'white', padding: '10px', display: 'inline-block', border: '2px solid #eee', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)'}}>
                    <img src={getVietQRUrl()} alt="VNPAY QR" width="220" style={{display: 'block'}} />
                </div>

                {/* <div style={{margin: '20px 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50'}}>
                    Tổng tiền: {totalPrice.toLocaleString()} VND
                </div> */}

                <div style={{margin: '20px 0', fontSize: '1.2rem', color: '#2c3e50'}}>
                <div>Tổng tiền phòng: <s>{totalPrice.toLocaleString()} VND</s></div>
                    <div style={{fontWeight: 'bold', color: '#ed1c24', fontSize: '1.4rem'}}>
                        Cần cọc (50%): {(Math.ceil((totalPrice > 0 ? totalPrice : room.price) * 0.5)).toLocaleString()} VND
                    </div>
                </div>

                <button 
                    type="button" // Quan trọng: Đảm bảo nó là nút bấm thường, không submit bậy bạ
                    className="btn-confirm" 
                    onClick={() => {
                        console.log("Button Clicked!"); // F12 để xem log này nổ là code chạy ngon
                        handleSubmit(true, "VNPAY QR");
                    }} 
                    disabled={loading}
                >
                    {loading ? (
                        <span>⏳ ĐANG XỬ LÝ...</span> // Hiệu ứng text khi đang loading
                    ) : (
                        <>
                            <span style={{fontSize: '1.4rem'}}>✅</span> 
                            <span>TÔI ĐÃ THANH TOÁN XONG</span>
                        </>
                    )}
                </button>

                <button 
                    onClick={() => setShowQR(false)} 
                    style={{background: 'none', border: 'none', textDecoration: 'underline', color: '#666', cursor: 'pointer', marginTop: '10px'}}
                >
                    &larr; Chọn phương thức khác
                </button>
             </div>
        )}

        {step === 3 && (
            <div className="success-step" style={{textAlign: 'center'}}>
                <div style={{fontSize: '4rem', marginBottom: '10px'}}>🎉</div>
                <h3>Booking Confirmed!</h3>
                <p>Cảm ơn, <strong>{formData.name}</strong>.</p>
                <p>Mã đặt phòng của bạn đã được ghi nhận.</p>
                <button className="btn-submit" style={{marginTop: '20px'}} onClick={onClose}>DONE</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;