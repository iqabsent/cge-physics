var canvas = document.getElementById('canvas');
window.ctx = canvas.getContext('2d');

// Useful stuff
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
projectPolys = function (vector_x, vector_y, vtx_a, vtx_b) {
  // ref: http://www.codeproject.com/Articles/15573/2D-Polygon-Collision-Detection
  var distance = 0;
  var min_a, max_a, min_b, max_b, dot, index;
  // loop through vtx_a, dot with vector and store min and max
  index = vtx_a.length - 1;
  dot = vtx_a[index--] * vector_y + vtx_a[index--] * vector_x;
  min_a = dot;
  max_a = dot;
  while (index > 0) {
    dot = vtx_a[index--] * vector_y + vtx_a[index--] * vector_x;
    if (dot < min_a) min_a = dot;
    if (dot > max_a) max_a = dot;
  }
  // loop through vtx_b, dot with vector and store min and max
  index = vtx_b.length - 1;
  dot = vtx_b[index--] * vector_y + vtx_b[index--] * vector_x;
  min_b = dot;
  max_b = dot;
  while (index > 0) {
    dot = vtx_b[index--] * vector_y + vtx_b[index--] * vector_x;
    if (dot < min_b) min_b = dot;
    if (dot > max_b) max_b = dot;
  }
  // TODO:
  // .. project velocities, add to min & max values, then check distance
  // check distance between a and b projections
  return min_a < min_b ? min_b - max_a : min_a - max_b;
};
function polyCollide(poly1, poly2) {
  // ref: http://www.codeproject.com/Articles/15573/2D-Polygon-Collision-Detection
  var vtx = poly1.vtx;
  var vtx2 = poly2.vtx;
  var vtx_count = poly1.vertex_count;
  var vtx2_count = poly2.vertex_count;
  var axis_x, axis_y;
  var edge_index;
  var distance, min_distance = 0;
  var min_translation_x = 0, min_translation_y = 0;
  var no_collision = false;
  
  // for all edges in first poly
  edge_index = vtx_count;
  while (edge_index -- && !no_collision) {
    // find perpendicular axis
    if(edge_index === 0) { // wrapping
      axis_x = vtx[1] - vtx[vtx_count * 2 - 1]; // swapping x/y
      axis_y = vtx[vtx_count * 2 - 2] - vtx[0]; // negating
    } else {
      axis_x = vtx[edge_index * 2 + 1] - vtx[edge_index * 2 - 1]; // swapping x/y
      axis_y = vtx[edge_index * 2 - 2] - vtx[edge_index * 2]; // negating
    }
    // project polygons onto axis and check overlap
//drawLine(vtx[edge_index * 2], vtx[edge_index * 2 + 1], axis_x+vtx[edge_index * 2], axis_y+vtx[edge_index * 2 + 1]);
    distance = projectPolys(axis_x, axis_y, vtx, vtx2);
    if (!min_distance || distance > min_distance) {
      min_distance = distance;
      min_translation_x = axis_x;
      min_translation_y = axis_y;
    }
    if (distance >= 0) no_collision = true;
  }  
  // for all edges in second poly
  edge_index = vtx2_count;
  while (edge_index -- && !no_collision) {
    // find perpendicular axis
    if(edge_index === 0) { // wrapping
      axis_x = vtx2[1] - vtx2[vtx2_count * 2 - 1]; // swapping x/y
      axis_y = vtx2[vtx2_count * 2 - 2] - vtx2[0]; // negating
    } else {
      axis_x = vtx2[edge_index * 2 + 1] - vtx2[edge_index * 2 - 1]; // swapping x/y
      axis_y = vtx2[edge_index * 2 - 2] - vtx2[edge_index * 2]; // negating
    }
    // project polygons, check overlap
    //drawLine(vtx2[edge_index * 2], vtx2[edge_index * 2 + 1], axis_x+vtx2[edge_index * 2], axis_y+vtx2[edge_index * 2 + 1]);
    distance = projectPolys(axis_x, axis_y, vtx, vtx2);
    // find minimum translation vector (largest negative .. if positive, never used)
    if (distance > min_distance) {
      min_distance = distance;
      min_translation_x = axis_x;
      min_translation_y = axis_y;
    }
    if (distance >= 0) no_collision = true;
  }
  
  if (no_collision) {
    poly1.color = '#00ff00';
    poly2.color = '#00ff00';
  } else {
    poly1.color = '#ff0000';
    poly2.color = '#ff0000';
//console.log("min_distance: " + min_distance);
//console.log(min_translation_x, min_translation_y);
    var length_squared = dot(min_translation_x, min_translation_y, min_translation_x, min_translation_y);
    msa_x = min_translation_x * distance / length_squared;
    msa_y = min_translation_y * distance / length_squared;
    drawLine(100, 100, 100 + msa_x, 100 + msa_y, '#AA00FF');
  }
};

// Physics Manager
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
  step: function () {
    ctx.clearRect(0,0,640,480);
    richard.update();
    richard.move();
//cheating
polyCollide(body, body2);    
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
  this.impulse_x = 0;
  this.impulse_y = 0;
  this.momentum_x = 0;
  this.momentum_y = 0;
  this.dragged = false;
  this.move = function () {
    var index = this.vertex_count * 2 - 1;
    while ( index >= 1 ) {
      this.vtx[index--] += this.momentum_y;
      this.vtx[index--] += this.momentum_x;
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