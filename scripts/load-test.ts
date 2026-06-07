/**
 * Professional High-Performance Load Test Script (Worker Pool)
 * 
 * Features:
 * - Constant Concurrency (Worker Pool)
 * - Latency tracking (Min, Max, Avg, P95)
 * - Status code distribution
 * - Detailed error reporting
 */

import { argv } from 'process';

interface RequestResult {
    success: boolean;
    status?: number;
    latency: number;
    error?: string;
}

interface Stats {
    total: number;
    started: number;
    completed: number;
    successful: number;
    failed: number;
    latencies: number[];
    statusCodes: Record<number, number>;
    errors: Record<string, number>;
}

async function callApi(url: string): Promise<RequestResult> {
    const start = performance.now();
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) }); // 10s timeout
        await response.json();
        const latency = performance.now() - start;
        return { success: response.ok, status: response.status, latency };
    } catch (e: any) {
        const latency = performance.now() - start;
        return { success: false, error: e.message, latency };
    }
}

async function worker(url: string, stats: Stats) {
    while (stats.started < stats.total) {
        stats.started++;
        const result = await callApi(url);
        
        // Update stats
        stats.completed++;
        stats.latencies.push(result.latency);
        
        if (result.success) {
            stats.successful++;
        } else {
            stats.failed++;
            if (result.status) {
                stats.statusCodes[result.status] = (stats.statusCodes[result.status] || 0) + 1;
            } else if (result.error) {
                stats.errors[result.error] = (stats.errors[result.error] || 0) + 1;
            }
        }

        // Live progress
        if (stats.completed % 50 === 0 || stats.completed === stats.total) {
            const progress = ((stats.completed / stats.total) * 100).toFixed(1);
            process.stdout.write(`\r🚀 Progress: ${progress}% (${stats.completed}/${stats.total}) | Success: ${stats.successful} | Fail: ${stats.failed}`);
        }
    }
}

async function main() {
    const targetUrl = argv[2];
    const totalRequests = parseInt(argv[3]) || 1000;
    const concurrency = parseInt(argv[4]) || 50;

    if (!targetUrl) {
        console.error("\x1b[31mUsage: npx tsx scripts/load-test.ts <URL> [totalRequests] [concurrency]\x1b[0m");
        process.exit(1);
    }

    const stats: Stats = {
        total: totalRequests,
        started: 0,
        completed: 0,
        successful: 0,
        failed: 0,
        latencies: [],
        statusCodes: {},
        errors: {}
    };

    console.log(`\n\x1b[36m🔥 Starting Advanced Load Test\x1b[0m`);
    console.log(`🔗 Target:      ${targetUrl}`);
    console.log(`📊 Total:       ${totalRequests}`);
    console.log(`👷 Concurrency: ${concurrency}\n`);

    const startTime = Date.now();

    // Spawn workers
    const workers = Array.from({ length: concurrency }, () => worker(targetUrl, stats));
    await Promise.all(workers);

    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;
    
    // Sort latencies for percentiles
    const sortedLatencies = stats.latencies.sort((a, b) => a - b);
    const avgLatency = stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length;
    const p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
    const rps = totalRequests / durationSeconds;

    console.log(`\n\n\x1b[32m✅ Load Test Complete!\x1b[0m`);
    console.log(`-------------------------------------------`);
    console.log(`📈 Throughput:    \x1b[1m${rps.toFixed(2)} req/s\x1b[0m`);
    console.log(`⏱️  Duration:      ${durationSeconds.toFixed(2)}s`);
    console.log(`-------------------------------------------`);
    console.log(`📝 \x1b[33mLatency Metrics:\x1b[0m`);
    console.log(`   Min:           ${sortedLatencies[0].toFixed(2)}ms`);
    console.log(`   Max:           ${sortedLatencies[sortedLatencies.length - 1].toFixed(2)}ms`);
    console.log(`   Avg:           ${avgLatency.toFixed(2)}ms`);
    console.log(`   P95:           \x1b[1m${p95Latency.toFixed(2)}ms\x1b[0m`);
    console.log(`-------------------------------------------`);
    console.log(`📊 \x1b[33mResults:\x1b[0m`);
    console.log(`   Successful:    \x1b[32m${stats.successful}\x1b[0m`);
    console.log(`   Failed:        \x1b[31m${stats.failed}\x1b[0m`);

    if (Object.keys(stats.statusCodes).length > 0) {
        console.log(`   Status Codes:  ${JSON.stringify(stats.statusCodes)}`);
    }
    if (Object.keys(stats.errors).length > 0) {
        console.log(`   Errors:        ${JSON.stringify(stats.errors)}`);
    }
    console.log(`-------------------------------------------\n`);
}

main().catch(console.error);
