//axios instance

import axios from 'axios';
import useAuthStore from '../zustand';

const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
    },
});

export default axiosInstance;
