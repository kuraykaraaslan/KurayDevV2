'use client';
import axios from 'axios';
import useGlobalStore from '../zustand';
import { AuthMessages } from '@/messages/AuthMessages';

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

// Add a response interceptor
axiosInstance.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
}, function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response) {
        const { message } = error.response.data;
        if (message === AuthMessages.TOKEN_EXPIRED || message === AuthMessages.USER_NOT_AUTHENTICATED) {
            window.location.href = '/auth/login';
        } else {
            console.error('Response error:', error.response.data);
        }
    } else {
        console.error('Response error without response:', error);
    }
    return Promise.reject(error);
});
// Handle login required error

export default axiosInstance;
