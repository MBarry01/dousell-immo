// @project
import { extendPaletteWithChannels } from '@/components/saasable/utils/colorUtils';

/***************************  DEFAULT / AI THEME - PALETTE  ***************************/

export function buildPalette() {
    // Doussel Immo Colors
    const gold = '#F4C430'; // Primary
    const black = '#000000'; // Background
    const white = '#FFFFFF'; // Text
    const greyText = '#A0A0A0';

    const darkPalette = {
        primary: {
            lighter: '#FDF0CC',
            light: '#F9E199',
            main: gold,
            dark: '#C29800',
            darker: '#614C00'
        },
        secondary: {
            lighter: '#D3E4F8',
            light: '#B7C8DB',
            main: '#4F6070',
            dark: '#384858',
            darker: '#0B1D2B'
        },
        grey: {
            50: '#121212',
            100: '#1E1E1E',
            200: '#2C2C2C',
            300: '#3A3A3A',
            400: '#484848',
            500: '#565656',
            600: '#646464',
            700: '#727272',
            800: '#808080',
            900: white
        },
        text: {
            primary: white,
            secondary: greyText
        },
        divider: 'rgba(255, 255, 255, 0.12)',
        background: {
            default: black,
            paper: '#0A0A0A'
        }
    };

    const commonColor = { common: { black: '#000', white: '#fff' } };

    const extendedDark = extendPaletteWithChannels(darkPalette);
    const extendedCommon = extendPaletteWithChannels(commonColor);

    return {
        dark: {
            mode: 'dark',
            ...extendedCommon,
            ...extendedDark
        },
        // Keep light for fallback or specific components, mapped to dark for consistency if needed
        light: {
            mode: 'dark',
            ...extendedCommon,
            ...extendedDark
        }
    };
}
