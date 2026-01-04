import { useState } from 'react';
import axios from 'axios';
import './App.css';

const BookingModal = ({ room, onClose }) => {
  const [step, setStep] = useState(1); // 1: Info, 2: Payment
  const [formData, setFormData] = useState({ name: '', phone: '', checkIn: '', checkOut: '' });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  // --- LƯU Ý QUAN TRỌNG: KIỂM TRA LẠI PORT API ---
  // Hãy chắc chắn Project API của cậu đang chạy ở port nào (5271 hay 7289?)
  // Copy đúng link từ Swagger vào đây.
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const BOOKING_API = `${BASE_URL}/api/Booking/create`; 
  const PAYMENT_API = `${BASE_URL}/api/Payment/momo`;
  
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.checkIn || !formData.checkOut) {
      setStatus({ type: 'error', msg: 'Please fill all fields!' });
      return;
    }
    setStep(2);
    setStatus({ type: '', msg: '' });
  };

  // --- XỬ LÝ THANH TOÁN MOMO ---
  const handleMomoPayment = async () => {
    setLoading(true);
    setStatus({ type: 'info', msg: 'Đang kết nối cổng thanh toán MoMo...' });

    try {
        // 1. LƯU THÔNG TIN VÀO LOCAL STORAGE (Để dành dùng sau khi thanh toán xong)
        const bookingData = {
            roomId: room.id,
            customerName: formData.name,
            customerPhone: formData.phone,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            roomNumber: room.roomNumber, // Lưu thêm để hiển thị
            price: room.price
        };
        localStorage.setItem("PENDING_BOOKING", JSON.stringify(bookingData));

        // 2. GỌI API LẤY LINK
        const response = await axios.post(PAYMENT_API, {
            roomNumber: room.roomNumber,
            customerName: formData.name
        });

        if (response.data && response.data.payUrl) {
             // 3. CHUYỂN HƯỚNG SANG MOMO (Dùng window.location.href thay vì open tab mới để trải nghiệm thật hơn)
             window.location.href = response.data.payUrl;
        } else {
            setStatus({ type: 'error', msg: 'Không lấy được link thanh toán!' });
            setLoading(false);
        }

    } catch (error) {
        console.error(error);
        setStatus({ type: 'error', msg: 'Lỗi kết nối MoMo!' });
        setLoading(false);
    }
  };

  const handleSubmit = async (isPaid) => {
    setLoading(true);
    setStatus({ type: '', msg: '' });
    
    const payload = {
        roomId: room.id,
        customerName: formData.name,
        customerPhone: formData.phone,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        isPaid: isPaid, 
        paymentMethod: isPaid ? "MoMo ATM/QR" : "Pay at Hotel"
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
      <div className="modal-content">
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
                <div className="form-row">
                    <div className="form-group"><label>Check-In</label><input type="date" name="checkIn" required onChange={handleChange} /></div>
                    <div className="form-group"><label>Check-Out</label><input type="date" name="checkOut" required onChange={handleChange} /></div>
                </div>
                {status.msg && <div className={`status-msg ${status.type}`}>{status.msg}</div>}
                <button type="submit" className="btn-submit">CONTINUE TO PAYMENT</button>
            </form>
        )}

        {step === 2 && (
            <div className="payment-step">
                <p style={{textAlign: 'center', marginBottom: '15px'}}>Click below to pay via MoMo Sandbox</p>
                <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px'}}>
                     {/* FIX: Link ảnh logo MoMo ổn định hơn */}
                    <img src="https://developers.momo.vn/v3/assets/images/square-8c08a00f550e40a2efafea4a005b1232.png" alt="MoMo Logo" width="100" style={{borderRadius: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
                </div>
                
                {status.msg && <div className={`status-msg ${status.type}`}>{status.msg}</div>}

                <button className="btn-submit" style={{backgroundColor: '#a50064', marginBottom: '10px'}} onClick={handleMomoPayment} disabled={loading}>
                    {loading ? "CONNECTING..." : "💸 PAY WITH MOMO (500k)"}
                </button>
                <button className="btn-detail" style={{width: '100%'}} onClick={() => handleSubmit(false)} disabled={loading}>
                    Skip Payment (Pay at Hotel)
                </button>
            </div>
        )}

        {step === 3 && (
            <div className="success-step" style={{textAlign: 'center'}}>
                <div style={{fontSize: '4rem', marginBottom: '10px'}}>🎉</div>
                <h3>Booking Confirmed!</h3>
                <p>Thank you, <strong>{formData.name}</strong>.</p>
                <p>We have received your booking request.</p>
                <button className="btn-submit" style={{marginTop: '20px'}} onClick={onClose}>DONE</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;