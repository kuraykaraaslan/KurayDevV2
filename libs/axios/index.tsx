//axios instance

import axios from 'axios';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

const axiosInstance = axios.create({
    baseURL: INTERNAL_API_URL,
    headers: {},
});

export default axiosInstance;
