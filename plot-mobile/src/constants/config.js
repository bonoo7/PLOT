export const DEV_SERVER_IP = process.env.EXPO_PUBLIC_DEV_SERVER_IP || '192.168.8.19';
export const DEV_SERVER_PORT = process.env.EXPO_PUBLIC_DEV_SERVER_PORT || '3000';
export const PROD_SERVER_URL = process.env.EXPO_PUBLIC_PROD_SERVER_URL || `http://${DEV_SERVER_IP}:${DEV_SERVER_PORT}`;
