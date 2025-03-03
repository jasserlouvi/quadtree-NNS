const canvas = document.getElementById("maincanvas");
const c = canvas.getContext("2d");

// http://www.lcad.icmc.usp.br/~jbatista/procimg/quadtree_neighbours.pdf
// https://stackoverflow.com/questions/20837530/quadtree-nearest-neighbour-algorithm

const screensize = { x: window.innerWidth, y: window.innerHeight };
canvas.width = screensize.x;
canvas.height = screensize.y;

const points = [];

class point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    render() {
        c.beginPath();
        c.arc(this.x, this.y, 2, Math.PI * 2, 0);
        c.fill();
    }
}

for (let i = 0; i < 10; i++) {
    points.push(new point(Math.random() * screensize.x, Math.random() * screensize.y));
}

const topnodesize = 400;
const leafnodesize = 5;
const bucketcap = 1;
let grid = [];
let grids = [];

const sizelookup = [];

let currentsize = topnodesize;
let iterations = 0;
while (currentsize > 1) {
    sizelookup[currentsize] = iterations;
    sizelookup.push(iterations);
    currentsize /= 2;
    iterations++;
}

class quadtree {
    constructor(x, y, size) {
        this.s = size;
        this.x = x;
        this.y = y;

        this.hs = size/2;
        this.centerx = x + this.hs;
        this.centery = y + this.hs;

        this.sprouted = false;
        this.bucket = [];

        c.beginPath();
        c.strokeRect(x, y, size, size);
    }

    splitpoint(p) {
        if (p.x > this.centerx) {
            if (p.y > this.centery) {
                this.nodes[3].addpoint(p);
                return;
            }
            this.nodes[0].addpoint(p);
            return;
        }
        if (p.y > this.centery) {
            this.nodes[2].addpoint(p);
            return;
        }
        this.nodes[1].addpoint(p);
    }

    addpoint(p) {
        this.bucket.push(p);

        if (this.sprouted === true) {
            this.splitpoint(p);
            return
        }

        if (this.bucket.length > bucketcap && this.s > leafnodesize) {
            this.sprouted = true;

            this.nodes = [
                new quadtree(this.centerx, this.y, this.hs),
                new quadtree(this.x, this.y, this.hs),
                new quadtree(this.x, this.centery, this.hs),
                new quadtree(this.centerx, this.centery, this.hs)
            ];

            for (let i = 0; i < bucketcap + 1; i++) {
                this.splitpoint(this.bucket[i]);
            }
        }
    }

    turnhash() {
        const key = this.centerx + " " + this.centery; // topcell position

        const gridnum = sizelookup[this.s];
        if (grids[gridnum] === undefined) grids[gridnum] = [];
        
        const selectedgrid = grids[gridnum];
        if (selectedgrid[key] === undefined) selectedgrid[key] = [];

        if (this.sprouted === true) {
            for (let i = 0; i < 4; i++) {
                const node = this.nodes[i];

                if (node.bucket.length === 0) continue;

                selectedgrid[key].push(node.centerx + " " + node.centery);
                node.turnhash();
            }

            return;
        }

        for (let i = 0; i < this.bucket.length; i++) {
            selectedgrid[key].push(this.bucket[i]);
        }
    }
}

function buildquadtree() {
    grid = [];

    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const fx = Math.floor(p.x / topnodesize) * topnodesize;
        const fy = Math.floor(p.y / topnodesize) * topnodesize;
        const k = fx + " " + fy;

        c.strokeStyle = "rgb(0, 0, 255)";
        if (grid[k] === undefined) grid[k] = new quadtree(fx, fy, topnodesize);
        
        grid[k].addpoint(p);

        c.strokeStyle = "rgb(0, 255, 0)";
        c.beginPath();
        c.strokeRect(fx, fy, topnodesize, topnodesize);
    }
}

function hashifyquadtree() {
    grids = [];
    for (const k in grid) {
        grid[k].turnhash();
    }
}

function getpossibleclosest(cells, points, x, y, disoffset) { // gets possible cells and points at the same time
    let closest = Number.MAX_VALUE;
    const distances = [];
    const pointdistances = [];

    for (const k in cells) {
        const pos = k.split(" ");

        const dx = pos[0] - x;
        const dy = pos[1] - y;
        const pdist = dx * dx + dy * dy;

        if (pdist < closest) {
            closest = pdist;
        }
        distances[k] = pdist;
    }

    for (let i = 0; i < points.length; i++) {
        const pos = points[i];

        const dx = pos.x - x;
        const dy = pos.y - y;
        const pdist = dx * dx + dy * dy;

        if (pdist < closest) {
            closest = pdist;
        }
        pointdistances[i] = pdist;
    }

    let possiblecells = [];
    let possiblepoints = [];
    const minimumdistance = closest + disoffset;
    for (const k in distances) {
        if (distances[k] < minimumdistance) possiblecells.push(cells[k]);
    }

    for (let i = 0; i < pointdistances; i++) {
        if (pointdistances[i] < minimumdistance) possiblepoints.push(points[i]);
    }

    return { validcells: possiblecells, validpoints: possiblepoints };
}

function linearsearchpoints(points, x, y) {
    let closest = Number.MAX_VALUE;
    let result;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dx = p.x - x;
        const dy = p.y - y;
        const pdist = dx * dx + dy * dy;
        if (pdist < closest) {
            closest = pdist;
            result = i;
        }
    }
    return { nearest: points[result], distance: closest };
}

const topnodecenterdist = topnodesize ** 3;
function getnearestpoint(x, y) {
    let finalquery = []; // contains individual points
    let currentgrid = 0;
    let lastpossiblecells = grids[0];

    while (Object.keys(lastpossiblecells).length > 0) {
        const disoffset = topnodecenterdist / (2 ** currentgrid);

        const closest = getpossibleclosest(lastpossiblecells, finalquery, x, y, disoffset);
        // TODO: also factor in "finalquery" points for getting minimum distance
        console.log(closest)
        lastpossiblecells = [];
        finalquery = closest.validpoints;

        for (let i = 0; i < closest.validcells.length; i++) {
            const cellcontents = closest.validcells[i];
            if (typeof cellcontents[0] === "object") {
                for (let j = 0; j < cellcontents.length; j++) {
                    finalquery.push(cellcontents[j]);
                }
                //finalquery = finalquery.concat(cellcontents);
                continue;
            }

            for (let j = 0; j < cellcontents.length; j++) {
                const subcellindex = cellcontents[j];
                lastpossiblecells[subcellindex] = grids[currentgrid + 1][subcellindex];
            }
        }

        currentgrid++;
    }

    c.fillStyle = "rgb(255, 0, 0)";
    for (let i = 0; i < finalquery.length; i++) {
        const pos = finalquery[i];
        c.beginPath();
        c.arc(pos.x, pos.y, 2, Math.PI * 2, 0);
        c.fill();
    }

    let closest = Number.MAX_VALUE;
    let index;
    for (let i = 0; i < finalquery.length; i++) {
        const obj = finalquery[i];
        const dx = obj.x - x;
        const dy = obj.y - y;

        const pdist = dx * dx + dy * dy;
        if (pdist < closest) {
            closest = pdist;
            index = i;
        }
    }
    
    c.fillStyle = "rgb(0, 255, 0)";
    c.beginPath();
    c.arc(finalquery[index].x, finalquery[index].y, 2, Math.PI * 2, 0);
    c.fill();
}

let mousex = 0;
let mousey = 0;
window.addEventListener("mousemove", e => {
    mousex = e.clientX;
    mousey = e.clientY;
});

function draw() {
    c.clearRect(0, 0, screensize.x, screensize.y);
    buildquadtree(400);
    hashifyquadtree();

    c.fillStyle = "rgb(255, 255, 255)";
    for (let i = 0; i < points.length; i++) {
        points[i].render();
    }

    getnearestpoint(mousex, mousey);
    
    //requestAnimationFrame(draw);
}
requestAnimationFrame(draw);