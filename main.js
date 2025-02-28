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
        c.arc(this.x, this.y, 3, 0, Math.PI * 2);
        c.fill();
    }
}

for (let i = 0; i < 150; i++) {
    points.push(new point(Math.random() * screensize.x, Math.random() * screensize.y));
}

const bucketcap = 2;
const grid = [];

class quadtree {
    constructor(x, y, size) {
        this.s = size;
        this.x = x;
        this.y = y;

        this.bucket = [];
    }

    addpoint() {

    }
}

function buildquadtree(topnodesize) {
    const inverse = 1 / topnodesize;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const k = Math.floor(p.x * inverse) * topnodesize + " " + Math.floor(p.y * inverse) * topnodesize;
        if (grid[k] === undefined) grid[k] = new quadtree();

        grid[k].addpoint(p);
    }
}

function draw() {
    buildquadtree(400);

    for (let i = 0; i < points.length; i++) {
        points[i].render();
    }

    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);