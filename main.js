const canvas = document.getElementById("maincanvas");
const c = canvas.getContext("2d");

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

for (let i = 0; i < 50; i++) {
    points.push(new point(Math.random() * screensize.x, Math.random() * screensize.y));
}

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
// http://www.lcad.icmc.usp.br/~jbatista/procimg/quadtree_neighbours.pdf
// https://stackoverflow.com/questions/20837530/quadtree-nearest-neighbour-algorithm
function buildquadtree(topnodesize) {
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

function draw() {
    buildquadtree(400);

    c.fillStyle = "rgb(255, 255, 255)";
    for (let i = 0; i < points.length; i++) {
        points[i].render();
    }

    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);