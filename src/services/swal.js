import Swal from 'sweetalert2';

const swalService = {
    // تنبيه النجاح - مع إضافة أنيميشن خفيف
    success: (title, text) => {
        return Swal.fire({
            icon: 'success',
            title: title || 'Success!',
            text: text || '',
            timer: 2000,
            showConfirmButton: false,
            iconColor: '#10b981', // لون أخضر حيوي مريح للعين
            padding: '2em',
            customClass: {
                popup: 'rounded-2xl', // لجعل الزوايا ناعمة تماشياً مع الـ UI الحديث
            }
        });
    },

    // تنبيه الخطأ
    error: (title, text) => {
        return Swal.fire({
            icon: 'error',
            title: title || 'Error!',
            text: text || 'Something went wrong.',
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Try Again',
            customClass: {
                popup: 'rounded-2xl',
            }
        });
    },

    // رسالة التأكيد (Confirm) - مخصصة للحذف أو الإجراءات الخطيرة
    confirm: async (title, text, confirmText = 'Yes, delete it!') => {
        return Swal.fire({
            title: title || 'Are you sure?',
            text: text || "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel',
            reverseButtons: true, // يضع زر التأكيد على اليمين (أفضل للـ UX)
            customClass: {
                popup: 'rounded-2xl',
            }
        });
    },

    // إضافة دالة Loading (مفيدة جداً عند انتظار الـ API)
    showLoading: (title = 'Processing...') => {
        Swal.fire({
            title: title,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: {
                popup: 'rounded-2xl',
            }
        });
    },

    close: () => {
        Swal.close();
    }
};

export default swalService;