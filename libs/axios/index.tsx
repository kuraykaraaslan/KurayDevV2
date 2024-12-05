//axios instance

import axios from 'axios';
import useGlobalStore from '../zustand';

const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useGlobalStore.getState().token}`,
    },
});

export default axiosInstance;
