function multi_sampler(sampler, amount) {
    let data = [];
    for (let i = 0; i < amount; i++) {
        data.push(sampler())
    }

    return data;
}

// Uniform
function random_uniform(min, max) {
    return Math.random() * (max - min) + min;
}

// Normal Distribution

let __cache_res_normal = null; // Gross but simple
function single_random_normal(mean, stdDev) {
    let num;

    if (__cache_res_normal != null) {
        num = __cache_res_normal;
        __cache_res_normal = null;
    } else {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        __cache_res_normal = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);
    }

    return num * stdDev + mean;
}

function random_normal(mean, stdDev, amount=1) {
    return multi_sampler(() => single_random_normal(mean, stdDev), amount);
}

// Bimodal Distribution

function random_bimodal(meanA, stdDevA, meanB, stdDevB, weighting, amt) {
    let numA = Math.floor(amt * weighting);
    let numB = amt - numA;

    let dataA = random_normal(meanA, stdDevA, numA);
    return dataA.concat(random_normal(meanB, stdDevB, numB));
}