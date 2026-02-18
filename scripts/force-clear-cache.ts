
import { _redis, getRedisClient } from "../lib/cache/redis-client";

async function clearCache() {
    console.log("🔥 Starting cache cleanup...");

    const client = getRedisClient();

    if (!client) {
        console.error("❌ Redis client not initialized or disabled.");
        return;
    }

    try {
        // Determine cleaner method based on enviroment
        const isUpstash = process.env.UPSTASH_REDIS_REST_URL;

        if (isUpstash) {
            console.log("🌐 Vercel/Upstash Environment Detected");
            await client.flushdb(); // Upstash supports flushdb
        } else {
            console.log("🖥️ Local/TCP Environment Detected");
            await client.flushall(); // Standard Redis
        }

        console.log("✅ CACHE CLEARED SUCCESSFULLY!");
    } catch (error) {
        console.error("❌ Error clearing cache:", error);
    } finally {
        // Clean exit
        if (client.disconnect) {
            client.disconnect();
        } else if (client.quit) {
            client.quit();
        }
        process.exit(0);
    }
}

clearCache();
