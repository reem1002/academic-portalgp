import Swal from 'sweetalert2';

const swalService = {
    success: (title, text) => {
        return Swal.fire({
            icon: 'success',
            title: title || 'Success!',
            text: text || '',
            timer: 2000,
            showConfirmButton: false,
            iconColor: '#10b981',
            padding: '2em',
            customClass: {
                popup: 'rounded-2xl',
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

    confirm: async (title, text, confirmText = 'Yes, delete it!') => {
        return Swal.fire({
            title: title || 'Are you sure?',
            text: text || "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e293b',
            cancelButtonColor: '#186F8F',
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-2xl',
            }
        });
    },

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