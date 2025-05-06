'use client';
import axios from 'axios';
import useGlobalStore from '../zustand';

const axiosInstance = axios.create({
    withCredentials: true, // Enable sending cookies with requests
});

// Add a request interceptor
axiosInstance.interceptors.request.use(async function (config) {
    /*
    const { session } = await useGlobalStore.getState();

    if (session) {
        config.headers['Authorization'] = `Bearer ${session?.sessionToken}`;
    }
    */

    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});

export default axiosInstance;
