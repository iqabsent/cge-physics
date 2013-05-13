var canvas = document.getElementById('canvas');
window.ctx = canvas.getContext('2d');

/////////////////////////////////////////
// USEFUL STUFF
//
function pythagoras(x, y) { return Math.sqrt(x * x + y * y); };
function dot(x1, y1, x2, y2) { return x1 * x2 + y1 * y2; };
function weigh(richard_body) {
  // calculate the area and use directly as mass
  var verts = richard_body.vertices;
  var area;
  switch (richard_body.type) {
    case "circle": // area for circle
        var radius = verts[0];
        area = Math.PI * radius * radius;
      break;
    case "polygon": // area for polygon
        var i;
        var vertex_count = verts.length * 0.5;
        area = 0;
        for (i = 0; i < vertex_count - 1; i++) {
          area += verts[i*2+1] * verts[i*2+3] - verts[i*2+1] * verts[i*2+2];
        }
        area += verts[vertex_count*2-2] * verts[1] - verts[vertex_count*2-1] * verts[0];
        area *= 0.5;
      break;
  }
  return area;
};
function drawPoint(x, y, color) {
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = color || '#FF0000';
  ctx.moveTo(x-1,y-1);
  ctx.lineTo(x+1,y+1);
  ctx.moveTo(x+1,y-1);
  ctx.lineTo(x-1,y+1);
  ctx.stroke();
};
function drawLine(x, y, x2, y2, color) {
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = color || '#FF0000';
  if(!x2) {
    ctx.moveTo(0,0);
    ctx.lineTo(x,y);
  } else {
    ctx.moveTo(x,y);
  }
  if(x2)ctx.lineTo(x2,y2);
  ctx.stroke();
};
function centroid(poly){
  //http://stackoverflow.com/questions/2792443/finding-the-centroid-of-a-polygon
  var twicearea = 0, x = 0, y = 0,
    points = poly.length * 0.5,
    p1, p2, f;
    
  for (var i = 0, j = points - 1; i < points; j = i++) {
  //console.log("i: "+i+ "; j: "+j+"; poly[i*2]: "+poly[i*2]+"; poly[j*2]: "+poly[j*2]+"; poly[i*2+1]: "+poly[i*2+1]+"; poly[j*2+1]: "+poly[j*2+1]);
    twicearea += poly[i*2] * poly[j*2+1];
    twicearea -= poly[i*2+1] * poly[j*2];
    f = poly[i*2] * poly[j*2+1] - poly[j*2] * poly[i*2+1];
    x += (poly[i*2] + poly[j*2]) * f;
    y += (poly[i*2+1] + poly[j*2+1]) * f;
  }
  f = twicearea * 3;
  return [x/f, y/f];
};

/////////////////////////////////////////
// POLYGON STUFF
//
function calculateInterval(axis_x, axis_y, poly) {
  var dot, index, min, max;
  // return min/max
  
  index = poly.length - 1;
  dot = poly[index--] * axis_y + poly[index--] * axis_x;
  min = dot;
  max = dot;
  while (index > 0) {
    dot = poly[index--] * axis_y + poly[index--] * axis_x;
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }

  return [min,max];
}

function axisSeparatePolygons(axis_x, axis_y, poly_a, poly_b) {
  var min_a, max_a;
  var min_b, max_b;
  var interval;

  interval = calculateInterval(axis_x, axis_y, poly_a);
  min_a = interval[0];
  max_a = interval[1];
  interval = calculateInterval(axis_x, axis_y, poly_b);
  min_b = interval[0];
  max_b = interval[1];

  if (min_a > max_b || min_b > max_a)
      return true;

  // find the interval overlap
  var d0 = max_a - min_b;
  var d1 = max_b - min_a;
  var depth = (d0 < d1)? d0 : d1;

  // convert the separation axis into a push vector (re-normalise
  // the axis and multiply by interval overlap)
  var axis_length_squared = axis_x * axis_x + axis_y * axis_y;

  axis_x = axis_x * depth / axis_length_squared;
  axis_y = axis_y * depth / axis_length_squared;
  
  return [axis_x, axis_y];
}

function intersect(poly_a, poly_b) {
  var axis_x, axis_y;
  var min_trans_x, min_trans_y;
  var overlap;
  var overlap_size = null, min_size = null;
  
  // loop through poly_a edges
  var edges = poly_a.length * 0.5;
  while (edges--) {
    if(!edges) { // wrapping to first vertex
      axis_x = poly_a[poly_a.length - 1] - poly_a[1]; // swapping x/y and negating y
      axis_y = poly_a[0] - poly_a[poly_a.length - 2];
    } else {
      axis_x = poly_a[edges * 2 - 1] - poly_a[edges * 2 + 1];
      axis_y = poly_a[edges * 2] - poly_a[edges * 2 - 2];
    }
    overlap = axisSeparatePolygons(axis_x, axis_y, poly_a, poly_b)
    
    if (overlap instanceof Array) {
      overlap_size = dot(overlap[0], overlap[1], overlap[0], overlap[1]);
      if (min_size === null || overlap_size < min_size) {
        min_size = overlap_size;
        min_trans_x = overlap[0];
        min_trans_y = overlap[1];
      }
    } else {
      return false;
    }
  }
  
  // loop through poly_b edges
  edges = poly_b.length * 0.5;
  while (edges--) {
    if(!edges) { // wrapping to first vertex
      axis_x = poly_b[poly_b.length - 1] - poly_b[1]; // swapping x/y and negating y
      axis_y = poly_b[0] - poly_b[poly_b.length - 2];
    } else {
      axis_x = poly_b[edges * 2 - 1] - poly_b[edges * 2 + 1];
      axis_y = poly_b[edges * 2] - poly_b[edges * 2 - 2];
    }
    overlap = axisSeparatePolygons(axis_x, axis_y, poly_a, poly_b)
    
    if (overlap instanceof Array) {
      if (min_size === null || overlap_size < min_size) {
        min_size = overlap_size;
        min_trans_x = overlap[0];
        min_trans_y = overlap[1];
      }
    } else {
      return false;
    }
  }

  return [min_trans_x, min_trans_y];
} 

/////////////////////////////////////////
// PHYSICS MANAGER
//
window.richard = {
  // variables
  mouse_x: 0,
  mouse_y: 0,
  bodies: [],
  
  // functions
  addRichardBody: function (body) {
    richard.bodies.push(body);
    return true;
  },
  draw: function () {
    var bodycount = richard.bodies.length;
    while (bodycount--) {
      richard.bodies[bodycount].draw();
      drawPoint(
        richard.bodies[bodycount].centroid_offset_x + richard.bodies[bodycount].position_x,
        richard.bodies[bodycount].centroid_offset_y + + richard.bodies[bodycount].position_y
      );
    }
  },
  update: function () {    
    var bodycount = richard.bodies.length;
    var i;
    for (i = 0; i < bodycount; i++) {
      richard.bodies[i].update();
    }
    return;
  },
  move: function () {    
    var bodycount = richard.bodies.length;
    var i;
    for (i = 0; i < bodycount; i++) {
      richard.bodies[i].move();
    }
    return;
  },
  collisions: function () {
//CHEATING
    var mtd = intersect(body.vtx, body2.vtx);
    if (mtd instanceof Array) {    
      var body_component = body2.mass / (body.mass + body2.mass);
      var d_x = body.centroid_x - body2.centroid_x;
      var d_y = body.centroid_y - body2.centroid_y;
      
      var dotprod = dot(d_x, d_y, mtd[0], mtd[1]);
      if (dotprod < 0) {
        mtd[0] = -mtd[0];
        mtd[1] = -mtd[1];
      }
      trans_component_x = body_component * mtd[0]; 
      trans_component_y = body_component * mtd[1]; 
      body.position_x += trans_component_x;
      body.position_y += trans_component_y;
      drawLine(
        body.centroid_x,
        body.centroid_y,
        body.centroid_x + trans_component_x * 10,
        body.centroid_y + trans_component_y * 10
      );
      mtd[0] = -mtd[0];
      mtd[1] = -mtd[1];
      trans_component_x = (1 - body_component) * mtd[0]; 
      trans_component_y = (1 - body_component) * mtd[1]; 
      body2.position_x += trans_component_x;
      body2.position_y += trans_component_y;    
      drawLine(
        body2.centroid_x,
        body2.centroid_y,
        body2.centroid_x + trans_component_x * 10,
        body2.centroid_y + trans_component_y * 10
      );
      body.color = "#FF0000";
      body2.color = "#FF0000";
    } else {
      body.color = "#00FF00";
      body2.color = "#00FF00";
    }
    /*
      // check direction of mtd
    */
//STOP CHEATING
  },
  step: function () {
    ctx.clearRect(0,0,640,480);
    richard.update();
    richard.collisions();
    richard.move();
    richard.draw();
  },
  loop: function () {
    // TODO: MUST implement DeltaTime .. maybe?
    // quit on input? input handler? >_<
    // spawn threads (webworkers)?
    setInterval(richard.step,40);
  },
  mouseDown: function (e) {
    if (e.target.id === "canvas") {
      var count = richard.bodies.length || 0;
      var x = e.clientX - e.target.offsetLeft;
      var y = e.clientY - e.target.offsetTop;
      while (count--) {
        if (richard.bodies[count].pointInPoly(x, y)) {
          richard.bodies[count].dragged = true;
        }
      }
    }
  },
  mouseUp: function (e) {
    if (e.target.id === "canvas") {
      var count = richard.bodies.length || 0;
      while (count--) {
        richard.bodies[count].dragged = false;
      }
    }
  },
  mouseMove: function (e) {
    if (e.target.id === "canvas") {
      var x = e.clientX - e.target.offsetLeft;
      var y = e.clientY - e.target.offsetTop;
      var change_x = x - richard.mouse_x;
      var change_y = y - richard.mouse_y;
      richard.mouse_x = x;
      richard.mouse_y = y;
      var count = richard.bodies.length || 0;
      while (count--) {
        if (richard.bodies[count].dragged) {
          richard.bodies[count].impulse_x += change_x;
          richard.bodies[count].impulse_y += change_y;
        }
      }
    }
  },
  mouseOut: function (e) {
    if (e.target.id === "canvas") {
      var count = richard.bodies.length;
      while (count--) {
        richard.bodies[count].dragged = false;
      }
    }
  }
}

window.addEventListener('mousedown', richard.mouseDown, false);
window.addEventListener('mouseup', richard.mouseUp, false);
window.addEventListener('mousemove', richard.mouseMove, false);
window.addEventListener('mouseout', richard.mouseOut, false);

// Rigidbody
function RichardBody(vertices, position, mass) {
  this.position_x = position && position.x ? position.x : 0;
  this.position_y = position && position.y ? position.y : 0;
  this.vertices = vertices || [10]; // original vertices (needed???)
  this.vertex_count = this.vertices.length * 0.5;
  this.color = '#000000';
  this.vtx = []; // transformed vertices .. always work on these
  this.setVtx = function () { // to set up initial transformed vtx
    if (this.vtx.length) return; // only do it once
    var index = this.vertex_count * 2 - 1;
    while ( index >= 1 ) {
      this.vtx[index] = vertices[index--] + this.position_y;
      this.vtx[index] = vertices[index--] + this.position_x;
    }
  };
  this.setVtx(); // ..erm .. do it
  this.type = this.vertex_count > 1 ? "polygon" : "circle";
  this.mass = mass || weigh(this);
  this.centroid_offset_x = 0;
  this.centroid_offset_y = 0;
  this.set_centroid = function () {
    var centr = centroid(this.vertices);
    this.centroid_offset_x = centr[0];
    this.centroid_offset_y = centr[1];
    this.centroid_x = centr[0];
    this.centroid_y = centr[1];
  }
  this.set_centroid();
  this.impulse_x = 0;
  this.impulse_y = 0;
  this.momentum_x = 0;
  this.momentum_y = 0;
  this.dragged = false;
  this.move = function () {
    var index = this.vertex_count * 2 - 1;
    while ( index >= 1 ) {
      //this.vtx[index--] += this.momentum_y;
      this.vtx[index] = this.vertices[index--] + this.position_y;
      //this.vtx[index--] += this.momentum_x;
      this.vtx[index] = this.vertices[index--] + this.position_x;
      this.centroid_x = this.centroid_offset_x + this.position_x;
      this.centroid_y = this.centroid_offset_y + this.position_y;
    }
    if(this.dragged) {
      this.momentum_x = 0;
      this.momentum_y = 0;
    }
  };
  this.update = function () {
    // apply impulse
    this.momentum_x += this.impulse_x;
    this.momentum_y += this.impulse_y;
    // reset impulse
    this.impulse_x = 0; 
    this.impulse_y = 0;    
    // collision detect?
    // position update
    this.position_x += this.momentum_x;
    this.position_y += this.momentum_y;
    // friction (air-resistance?)
    this.momentum_x *= 0.9;
    this.momentum_y *= 0.9;
  };
  this.pointInPoly = function (x, y) {
    // works for convex/concave/holes.. O(n)
    // ref: http://www.codeproject.com/Tips/84226/Is-a-Point-inside-a-Polygon
    var count = this.vertex_count;
    var v = this.vtx;
    var index = 0;
    var index2;
    var in_poly = false;
    while (count - index++) {
      i2 = (index - 1) * 2;
      xi = i2;
      yi = i2 + 1;
      xj = (i2 + 2) % (count * 2);
      yj = (i2 + 3) % (count * 2);
      // loop through edges
      if(
        // if line between normal and test point intersects edge, toggle in_poly
        ((v[yi] > y) != (v[yj] > y)) && (x < (v[xj] - v[xi]) * (y - v[yi]) / (v[yj] - v[yi]) + v[xi])
      ) in_poly = !in_poly;
    }
    return in_poly
  };
  this.draw = function () {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.color;     
    switch (this.type) {
      case "circle":
          ctx.arc(
            this.position_x, this.position_y,
            this.vertices[0], 0, 2 * Math.PI
          );
        break;
      case "polygon":
          var vtx = this.vtx;
          var index = this.vertex_count * 2 - 1;
          ctx.moveTo(vtx[index - 1], vtx[index]);
          index -= 2;
          while (index >= 1) {
            ctx.lineTo(vtx[index-1], vtx[index]);
            index -= 2;
          }
          ctx.closePath();
        break;
    }
    ctx.stroke();
  }
}