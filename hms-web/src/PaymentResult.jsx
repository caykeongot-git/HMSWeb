import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // processing | success | fail
    const [bookingId, setBookingId] = useState(null);

    // Lấy kết quả từ URL
    const resultCode = searchParams.get('resultCode');
    const message = searchParams.get('message'); // Lời nhắn từ MoMo
    
    // API tạo booking
    const BOOKING_API = `${import.meta.env.VITE_API_BASE_URL}/api/Booking/create`;
    useEffect(() => {
        // Chỉ xử lý 1 lần khi mount
        const handleResult = async () => {
            if (resultCode === '0') {
                // THANH TOÁN THÀNH CÔNG -> TIẾN HÀNH TẠO BOOKING
                await createBooking();
            } else {
                setStatus('fail');
            }
        };
        handleResult();
    }, []); // Empty dependency array để chạy 1 lần

    const createBooking = async () => {
        // Lấy dữ liệu đã lưu
        const savedJson = localStorage.getItem("PENDING_BOOKING");
        if (!savedJson) {
            setStatus('fail'); // Không tìm thấy đơn hàng tạm
            return;
        }

        const bookingData = JSON.parse(savedJson);

        try {
            // Gọi API lưu vào DB
            const payload = {
                roomId: bookingData.roomId,
                customerName: bookingData.customerName,
                customerPhone: bookingData.customerPhone,
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut
            };

            const response = await axios.post(BOOKING_API, payload);
            
            // Lấy ID booking vừa tạo (nếu API trả về)
            if(response.data && response.data.message) {
                 // Trích xuất ID từ message nếu có, hoặc sửa API trả về ID rõ ràng hơn
            }

            setStatus('success');
            localStorage.removeItem("PENDING_BOOKING"); // Xóa cache để tránh tạo lại khi refresh
        } catch (error) {
            console.error(error);
            // Tiền trừ rồi mà lưu lỗi -> Hiển thị thông báo đặc biệt
            setStatus('error_save'); 
        }
    };

    return (
        <div className="app-container" style={{justifyContent:'center', alignItems:'center', background:'#f4f7fa'}}>
            <div className="modal-content" style={{padding:'50px', textAlign:'center', maxWidth:'600px', margin:'50px auto'}}>
                
                {/* TRẠNG THÁI: ĐANG XỬ LÝ */}
                {status === 'processing' && (
                    <>
                        <div className="spinner" style={{margin:'0 auto 20px'}}></div>
                        <h2>Verifying Payment...</h2>
                        <p>Vui lòng đợi trong giây lát, hệ thống đang xử lý đơn hàng.</p>
                    </>
                )}

                {/* TRẠNG THÁI: THÀNH CÔNG */}
                {status === 'success' && (
                    <>
                        <div style={{fontSize:'5rem', marginBottom:'10px'}}>✅</div>
                        <h2 style={{color:'#27ae60', fontFamily:'Playfair Display', marginBottom:'10px'}}>Thanh Toán Thành Công!</h2>
                        <p>Cảm ơn bạn đã đặt phòng tại <strong>Moshi Hotel</strong>.</p>
                        <p>Đơn đặt phòng của bạn đã được hệ thống ghi nhận.</p>
                        <div className="divider" style={{width:'50px', margin:'20px auto', backgroundColor:'#ccc'}}></div>
                        <button className="btn-book" onClick={() => navigate('/')}>VỀ TRANG CHỦ</button>
                    </>
                )}

                {/* TRẠNG THÁI: THẤT BẠI (Do MoMo trả về lỗi) */}
                {status === 'fail' && (
                    <>
                        <div style={{fontSize:'5rem', marginBottom:'10px'}}>❌</div>
                        <h2 style={{color:'#c0392b'}}>Thanh Toán Thất Bại</h2>
                        <p style={{color:'#555', fontStyle:'italic'}}>"{decodeURIComponent(message || "Giao dịch bị hủy hoặc lỗi")}"</p>
                        <p>Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
                        <button className="btn-detail" onClick={() => navigate('/')} style={{marginTop:'20px'}}>QUAY LẠI</button>
                    </>
                )}

                 {/* TRẠNG THÁI: LỖI LƯU (Tiền đi, Đơn chưa về - Rất quan trọng) */}
                 {status === 'error_save' && (
                    <>
                        <div style={{fontSize:'5rem', marginBottom:'10px'}}>⚠️</div>
                        <h2 style={{color:'#f39c12'}}>Giao Dịch Treo</h2>
                        <p>Thanh toán thành công nhưng hệ thống chưa tạo được đơn hàng.</p>
                        <p>Vui lòng liên hệ hotline <strong>0909 123 456</strong> và cung cấp mã giao dịch MoMo để được hỗ trợ ngay.</p>
                        <button className="btn-detail" onClick={() => navigate('/')}>VỀ TRANG CHỦ</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentResult;