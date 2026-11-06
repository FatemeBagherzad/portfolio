/// <reference types="vite/client" />

// Swiper ships these stylesheets without type declarations, so the
// side-effect imports in SwiperComponent need to be declared explicitly.
declare module 'swiper/css';
declare module 'swiper/css/navigation';
declare module 'swiper/css/pagination';
