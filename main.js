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
const bucketcap = 1;
let grid = [];

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
        if (this.sprouted === true) {
            this.splitpoint(p);
            return
        }
        this.bucket.push(p);

        if (this.bucket.length > bucketcap) {
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
            this.bucket = null;
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

function linearsearch(cells, origin) {
    let closest = Number.MAX_VALUE;
    let cell;

    for (let i = 0; i < cells.length; i++) {
        const obj = cells[i];

        const dx = obj.centerx - origin.x;
        const dy = obj.centery - origin.y;
        const pdist = dx * dx + dy * dy;

        if (pdist < closest) {
            closest = pdist;
            cell = obj;
        }
    }

    return { cell: cell, distance: closest };
}

function pdistancequery(subcells, origin, distance) { // distance inputted is assumed to be in squared form
    const query = [];
    
    for (let i = 0; i < subcells.length; i++) {
        const obj = subcells[i];

        const dx = obj.centerx - origin.x;
        const dy = obj.centery - origin.y;
        const pdist = dx * dx + dy * dy;

        if (pdist < distance) {
            query.push(obj);
        }
    }

    return query;
}

const topnodecenterdist = topnodesize ** 2 * 2;
function bundlequery(cells, x, y) { // returns cells that would have the closest point in them
    if (cells.sprouted === true) {
        cells = cells.nodes;
    } else if (cells.sprouted === false) {
        return cells.bucket; // really messy recursive function
    }

    const p = linearsearch(cells, { // get cell that is closest for to get distance
        x: x,
        y: y
    });
    c.beginPath();
    c.arc(p.cell.centerx, p.cell.centery, 6, Math.PI * 2, 0);
    c.fill();

    const query = pdistancequery(cells, {
        x: x,
        y: y
    }, topnodecenterdist + p.distance); // let distance be a + b.

    let finalquery = [];
    for (let i = 0; i < query.length; i++) {
        const obj = query[i];
        finalquery = [...finalquery, ...bundlequery(obj, x, y)];

        c.beginPath();
        c.arc(obj.centerx, obj.centery, 6, Math.PI * 2, 0);
        c.fill();
    }

    return finalquery;
}

function getnearestpoint(x, y) {
    const finalquery = []; // contains points for linear searching

    const topnodequery = [];
    for (const k in grid) {
        topnodequery.push(grid[k]);
    }

    finalquery = bundlequery(topnodequery, x, y);

    let closest = Number.MAX_VALUE; // final step
    let point;

    for (let i = 0; i < finalquery.length; i++) {
        const obj = finalquery[i];

        const dx = obj.x - x;
        const dy = obj.y - y;
        const pdist = dx * dx + dy * dy;

        if (pdist < closest) {
            closest = pdist;
            point = obj;
        }
    }

    return point;
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

    c.fillStyle = "rgb(255, 255, 255)";
    for (let i = 0; i < points.length; i++) {
        points[i].render();
    }

    getnearestpoint(mousex, mousey);
    
    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);