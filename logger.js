import fs from "fs";

let dir = '../logs';

// export function logStats(debug, label="") {
//     const time = ((Date.now() - debug.startTime) / 1000).toFixed(2);

//     const line = `
//         [${new Date().toISOString()}] ${label}
//         Time: ${time}s
//         Nodes: ${debug.nodes}
//         QNodes: ${debug.qNodes}
//         TT Hits: ${debug.ttHits}
//         Cutoffs: ${debug.cutoffs}
//         MaxDepth: ${debug.maxDepth}
//         -----------------------------------
//     `;

//     if(!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, {recursive: true})
//     }

//     try {
//         fs.appendFileSync("logs/engine.log", line);
//     } catch(err) {
//         console.log(err);
//     }
    

// }

export async function logStats(debug, label="") {
    const time = ((Date.now() - debug.startTime) / 1000).toFixed(2);

    const line = `
        [${new Date().toISOString()}] ${label}
        Time: ${time}s
        Nodes: ${debug.nodes}
        QNodes: ${debug.qNodes}
        TT Hits: ${debug.ttHits}
        Cutoffs: ${debug.cutoffs}
        MaxDepth: ${debug.maxDepth}
        -----------------------------------
    `;

    try {
        fs.mkdir(dir, { recursive: true }, (err) => err && console.error(err))
        fs.appendFile("../logs/engine.log", line, (err) => err && console.error(err));
    } catch(err) {
        console.log(err);
    }
    

}
