
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Get API URL with fallback
        const socketUrl = window.API_BASE_URL || 'http://localhost:3000';

        // Initialize socket connection
        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'], // Allow fallback to polling
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('connect_error', (error) => {
            console.warn('Socket connection error:', error.message);
        });

        setSocket(newSocket);

        // Cleanup
        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
