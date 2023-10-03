const ENVIRONMENT = __ENV.MF_BENCH_ENVIRONMENT;


export function generateVusAndDuration() {
    const devConfig = {
        // wait period of 5s in between each test
        smoke: { vus: 1, duration: "1s", startTime: "0s" },
        load: {
            stages: [
                { duration: "1s", target: 10 },
                { duration: "2s", target: 10 },
                { duration: "1s", target: 0 },
            ],
            duration: "4", // 1s + 2s + 1s
            startTime: "6s", // 1 + 5 = 6s
        },
        stress: {
            stages: [
                { duration: "2s", target: 20 },
                { duration: "4s", target: 20 },
                { duration: "2s", target: 0 },
            ],
            duration: "8", // 2s + 4s + 2s
            startTime: "15s", // 6 + 4 + 5 = 15s
        },
        soak: {
            stages: [
                { duration: "1s", target: 10 },
                { duration: "10s", target: 10 },
                { duration: "1s", target: 0 },
            ],
            duration: "12", // 10s + 1s + 1s
            startTime: "28s", // 8 + 15 + 5 = 28s
        },
        spike: {
            stages: [
                { duration: "2s", target: 100 },
                { duration: "1s", target: 0 },
            ],
            duration: "3", // 2s + 1s
            startTime: "45s", // 12 + 28 + 5 = 45s
        },
        breakpoint: {
            preAllocatedVUs: 10,
            stages: [{ duration: "30s", target: 1000 }],
            duration: "30", // 30s
            startTime: "53s", // 3 + 45 + 5 = 53s
        },
    };

    switch (ENVIRONMENT) {
        case "dev":
            return devConfig;

        case "prod":
            // wait period of 5m in between each test
            return {
                smoke: { vus: 3, duration: "1m", startTime: "0" },
                load: {
                    stages: [
                        { duration: "5m", target: 1000 },
                        { duration: "10m", target: 1000 },
                        { duration: "5m", target: 0 },
                    ],
                    duration: "20", // 5m + 10m + 5m
                    startTime: "6m" // 1 + 5 = 6m
                },
                stress: {
                    stages: [
                        { duration: "10m", target: 2000 },
                        { duration: "20m", target: 2000 },
                        { duration: "10m", target: 0 },
                    ],
                    duration: "40", // 10m + 20m + 10m
                    startTime: "31m", // 20 + 6 + 5 = 31m
                },
                soak: {
                    stages: [
                        { duration: "5m", target: 1000 },
                        { duration: "8h", target: 1000 },
                        { duration: "5m", target: 0 },
                    ],
                    duration: "490", // 8h + 5m + 5m
                    startTime: "76m", // 40 + 31 + 5 = 76m
                },
                spike: {
                    stages: [
                        { duration: "2m", target: 10000 },
                        { duration: "1m", target: 0 },
                    ],
                    duration: "3", // 2m + 1m
                    startTime: "571m", // 490 + 76 + 5 = 571m
                },
                breakpoint: {
                    preAllocatedVUs: 1000,
                    stages: [{ duration: "2h", target: 100000 }],
                    duration: "120", // 2h
                    startTime: "579m", // 3 + 571 + 5 = 579m
                },
            };

        default:
            return devConfig;
    }
}

// smoke tests https://k6.io/docs/test-types/smoke-testing/
function generateSmokeTestScenario(name) {
    const params = generateVusAndDuration().smoke;

    return {
        exec: name,
        executor: "constant-vus",
        vus: params.vus,
        duration: params.duration,
        startTime: params.startTime
    };
}

// load tests https://k6.io/docs/test-types/load-testing/
function generateLoadTestScenario(name) {
    const params = generateVusAndDuration().load;

    return {
        exec: name,
        executor: "ramping-vus",
        startVUs: 1,
        stages: params.stages,
        startTime: params.startTime
    };
}

// stress tests https://k6.io/docs/test-types/stress-testing/
function generateStressTestScenario(name) {
    const params = generateVusAndDuration().stress;

    return {
        exec: name,
        executor: "ramping-vus",
        startVUs: 1,
        stages: params.stages,
        startTime: params.startTime
    };
}

// soak tests https://k6.io/docs/test-types/soak-testing/
function generateSoakTestScenario(name) {
    const params = generateVusAndDuration().soak;

    return {
        exec: name,
        executor: "ramping-vus",
        startVUs: 1,
        stages: params.stages,
        startTime: params.startTime
    };
}

// spike tests https://k6.io/docs/test-types/spike-testing/
function generateSpikeTestScenario(name) {
    const params = generateVusAndDuration().spike;

    return {
        exec: name,
        executor: "ramping-vus",
        startVUs: 1,
        stages: params.stages,
        startTime: params.startTime
    };
}

// breakpoint tests https://k6.io/docs/test-types/breakpoint-testing/
function generateBreakpointTestScenario(name) {
    const params = generateVusAndDuration().breakpoint;

    return {
        exec: name,
        executor: "ramping-arrival-rate",
        preAllocatedVUs: params.preAllocatedVUs,
        stages: params.stages,
        startTime: params.startTime
    };
}

export function generateTestScenarios() {
    return {
        get_before: generateSmokeTestScenario("get_before"),
        update: generateSmokeTestScenario("update"),
        create: generateSmokeTestScenario("create"),
        get_after: generateSmokeTestScenario("get_after"),
        others: generateSmokeTestScenario("others"),

        get_before_load: generateLoadTestScenario("get_before"),
        update_load: generateLoadTestScenario("update"),
        create_load: generateLoadTestScenario("create"),
        get_after_load: generateLoadTestScenario("get_after"),
        others_load: generateLoadTestScenario("others"),

        get_before_stress: generateStressTestScenario("get_before"),
        update_stress: generateStressTestScenario("update"),
        create_stress: generateStressTestScenario("create"),
        get_after_stress: generateStressTestScenario("get_after"),
        others_stress: generateStressTestScenario("others"),

        get_before_soak: generateSoakTestScenario("get_before"),
        update_soak: generateSoakTestScenario("update"),
        create_soak: generateSoakTestScenario("create"),
        get_after_soak: generateSoakTestScenario("get_after"),
        others_soak: generateSoakTestScenario("others"),

        // get_before_spike: generateSpikeTestScenario("get_before"),
        // update_spike: generateSpikeTestScenario("update"),
        // create_spike: generateSpikeTestScenario("create"),
        // get_after_spike: generateSpikeTestScenario("get_after"),
        // others_spike: generateSpikeTestScenario("others"),

        // get_before_breakpoint: generateBreakpointTestScenario("get_before"),
        // update_breakpoint: generateBreakpointTestScenario("update"),
        // create_breakpoint: generateBreakpointTestScenario("create"),
        // get_after_breakpoint: generateBreakpointTestScenario("get_after"),
        // others_breakpoint: generateBreakpointTestScenario("others"),
    };
}
