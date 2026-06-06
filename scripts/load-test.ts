/**
 * Advanced Load Test Script in TypeScript
 * 
 * Usage: npx tsx scripts/load-test.ts <URL> [totalRequests/duration] [concurrency]
 * Example: npx tsx scripts/load-test.ts http://192.168.252.104/work 1000 20
 */

import { argv } from 'process';

async function callApi(url: string, requestId: number) {
    try {
        const response = await fetch(url);
        const data = await response.json() as any;
        // console.log(`[${requestId}] Status: ${response.status} | Res: ${JSON.stringify(data)}`);
        return true;
    } catch (error: any) {
        // console.error(`[${requestId}] Error: ${error.message}`);
        return false;
    }
}

async function main() {
    const targetUrl = argv[2];
    const totalRequests = parseInt(argv[3]) || 100;
    const concurrency = parseInt(argv[4]) || 10;

    if (!targetUrl) {
        console.error("Usage: npx tsx scripts/load-test.ts <URL> [totalRequests] [concurrency]");
        process.exit(1);
    }

    console.log(`🚀 Starting load test on ${targetUrl}`);
    console.log(`📊 Total requests: ${totalRequests} | Concurrency: ${concurrency}\n`);

    const startTime = Date.now();
    let completed = 0;
    let successful = 0;

    // Run requests in batches to respect concurrency
    for (let i = 0; i < totalRequests; i += concurrency) {
        const batchSize = Math.min(concurrency, totalRequests - i);
        const batch = Array.from({ length: batchSize }, (_, index) => 
            callApi(targetUrl, i + index + 1)
        );
        const results = await Promise.all(batch);
        successful += results.filter(r => r).length;
        completed += batchSize;
        
        if (completed % 100 === 0) {
            process.stdout.write(`\rProgress: ${completed}/${totalRequests} requests completed...`);
        }
    }

    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;
    const rps = totalRequests / durationSeconds;

    console.log(`\n\n✅ Load test complete!`);
    console.log(`⏱️  Duration: ${durationSeconds.toFixed(2)} seconds`);
    console.log(`✅ Successful: ${successful}/${totalRequests}`);
    console.log(`📈 Requests per second: ${rps.toFixed(2)}`);
    
    if (targetUrl.endsWith('/work')) {
        console.log(`\n💡 Note: You were hitting the /work endpoint. Check Grafana or 'kubectl top nodes' to see the CPU impact.`);
    }
}

main().catch(console.error);
