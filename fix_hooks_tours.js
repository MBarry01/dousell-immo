const fs = require('fs');
const path = require('path');

const toursDir = path.join(__dirname, 'components', 'gestion', 'tours');
const files = fs.readdirSync(toursDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    const filePath = path.join(toursDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Fix checkMobile() -> setTimeout(checkMobile, 0)
    const checkMobileRegex = /        checkMobile\(\);/g;
    if (checkMobileRegex.test(content)) {
        content = content.replace(checkMobileRegex, '        // Use setTimeout to avoid synchronous setState in effect\n        setTimeout(checkMobile, 0);');
        changed = true;
    }

    // 2. Fix setIsBottomNavVisible(false) -> setTimeout(() => setIsBottomNavVisible(false), 0)
    const bottomNavRegex = /            setIsBottomNavVisible\(false\);/g;
    if (bottomNavRegex.test(content)) {
        content = content.replace(bottomNavRegex, '            // Use setTimeout to avoid synchronous setState in effect\n            setTimeout(() => setIsBottomNavVisible(false), 0);');
        changed = true;
    }

    // 3. Fix setMounted(true) -> setTimeout(() => setMounted(true), 0)
    // Only if it's within a useEffect likely to trigger the warning
    const mountedRegex = /        setMounted\(true\);/g;
    if (mountedRegex.test(content)) {
        content = content.replace(mountedRegex, '        // Use setTimeout to avoid synchronous setState in effect\n        setTimeout(() => setMounted(true), 0);');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed hooks in ${file}`);
    }
});
