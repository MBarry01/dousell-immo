export default function GetImagePath(path: string) {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/')) {
        return path;
    }
    // Default saasable path if needed, or just return as is
    return path;
}
