// @next
import { Archivo, Figtree, Roboto } from 'next/font/google';

export enum Themes {
    THEME_DEFAULT = 'default',
    THEME_CRM = 'crm',
    THEME_AI = 'ai',
    THEME_CRYPTO = 'crypto',
    THEME_HOSTING = 'hosting',
    THEME_PMS = 'pms',
    THEME_HRM = 'hrm',
    THEME_PLUGIN = 'plugin',
    THEME_LMS = 'lms'
}

export const CSS_VAR_PREFIX = '';

/***************************  CONFIG  ***************************/

const config = {
    currentTheme: Themes.THEME_AI // Default to AI theme as we are copying it
};

export default config;

/***************************  THEME - FONT FAMILY  ***************************/

const fontRobot = Roboto({ subsets: ['latin'], weight: ['100', '300', '400', '500', '700', '900'] });
const fontArchivo = Archivo({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const fontFigtree = Figtree({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const FONT_ROBOTO = fontRobot.style.fontFamily;
export const FONT_ARCHIVO = fontArchivo.style.fontFamily;
export const FONT_FIGTREE = fontFigtree.style.fontFamily;
