var canvas = document.getElementById('canvas');
window.ctx = canvas.getContext('2d');
(function() {
  var requestAnimationFrame =
    window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

/////////////////////////////////////////
// USEFUL STUFF
//
function pythagoras(x, y) { return Math.sqrt(x * x + y * y); };
function dot(x1, y1, x2, y2) { return x1 * x2 + y1 * y2; };
function cross(x1, y1, x2, y2) { return (x1 * y2) - (y1 * x2)};
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
    /*  // ORIGINAL ATEMPT .. YIELDS NEGATIVE RESULT
        // COULD TRY TO REPEAT FIRST VERTEX ON ODD NUMBERS..
        var i;
        var vertex_count = verts.length * 0.5;
        area = 0;
        for (i = 0; i < vertex_count - 1; i++) {
          //console.log(i*2+1, i*2+3, i*2+1, i*2+2);
          area += verts[i*2+1] * verts[i*2+3] - verts[i*2+1] * verts[i*2+2];
        }
        //console.log(vertex_count*2-1,1,vertex_count*2-1,0);
        area += verts[vertex_count*2-1] * verts[1] - verts[vertex_count*2-1] * verts[0];
        area *= 0.5;
    */
        var vtx_count = verts.length * 0.5;
        var prev_vert = vtx_count - 1;
        var vtx = 0;
        area = 0;

        for (vtx; vtx < vtx_count; vtx++) {
          //console.log(verts[prev_vert*2],verts[vtx*2],verts[prev_vert*2+1],verts[vtx*2+1]);
          area+= (verts[prev_vert*2]+verts[vtx*2])*(verts[prev_vert*2+1]-verts[vtx*2+1]);
          prev_vert = vtx;
        }
        if(!(vtx_count%2)) {
          //console.log('odd');
          area+= (verts[0]+verts[0])*(verts[1]-verts[1]);
        }
        //console.log(Math.abs(area * 0.5));
        // Cheating with Abs ..don't know how to fix this..
        return Math.abs(area * 0.5);

      /*
        var j = numPoints-1;  // The last vertex is the 'previous' one to the first

        for (i=0; i<numPoints; i++)
          { area = area +  (X[j]+X[i]) * (Y[j]-Y[i]); 
            j = i;  //j is previous vertex to i
          }
        return area/2;
      */
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
function drawCircle(x, y, radius, color) {
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = color || '#FF0000';
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.stroke();
}
function centroid_and_stuff(poly){
  //http://stackoverflow.com/questions/2792443/finding-the-centroid-of-a-polygon
  var twicearea = 0, x = 0, y = 0,
    points = poly.length * 0.5,
    p1, p2, f;
  var min_x = null, max_x = null, min_y = null, max_y = null;
  var inv_count = 1 / points;
    
  for (var i = 0, j = points - 1; i < points; j = i++) {
  //console.log("i: "+i+ "; j: "+j+"; poly[i*2]: "+poly[i*2]+"; poly[j*2]: "+poly[j*2]+"; poly[i*2+1]: "+poly[i*2+1]+"; poly[j*2+1]: "+poly[j*2+1]);
    twicearea += poly[i*2] * poly[j*2+1];
    twicearea -= poly[i*2+1] * poly[j*2];
    f = poly[i*2] * poly[j*2+1] - poly[j*2] * poly[i*2+1];
    x += (poly[i*2] + poly[j*2]) * f;
    y += (poly[i*2+1] + poly[j*2+1]) * f;
    // mean min max
    if(min_x === null || poly[i*2] < min_x) min_x = poly[i*2];
    if(max_x === null || poly[i*2] > max_x) max_x = poly[i*2]; 
    if(min_y === null || poly[i*2+1] < min_y) min_y = poly[i*2+1];
    if(max_y === null || poly[i*2+1] > max_y) max_y = poly[i*2+1];
    //console.log("min_x:max_x .. min_y:max_y: "+min_x+":"+max_x+" .. "+min_y+":"+max_y);   
  }
  f = twicearea * 3;
  
  // centroid_x, centroid_y, max_radius
  var extent_x = (max_x - min_x) * 0.5;
  var extent_y = (max_y - min_y) * 0.5;
  return [
    x/f, y/f, // centroid x:y
    (min_x + max_x) * 0.5, (min_y + max_y) * 0.5, // center x:y
    Math.sqrt(extent_x * extent_x + extent_y * extent_y) // max radius
  ];
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

function axisSeparatePolygons(axis_x, axis_y, poly_a, poly_b) { // , offset_x, offset_y, velocity_x, velocity_y
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
  
  // two loops, one for each poly, doing the same thing for each
  // loop through poly_a edges
  var edges = poly_a.length * 0.5;
  while (edges--) {
    if(!edges) { // wrapping to first vertex
      axis_x = poly_a[poly_a.length - 1] - poly_a[1]; // tangent, so ..
      axis_y = poly_a[0] - poly_a[poly_a.length - 2]; // .. swapping x/y and negating y
    } else {
      axis_x = poly_a[edges * 2 - 1] - poly_a[edges * 2 + 1];
      axis_y = poly_a[edges * 2] - poly_a[edges * 2 - 2];
    }
    // use as separating plane
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
  // loop through poly_b edges doing same as above..
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
  fps: 0,
  this_time: null,
  last_time: null,
  bodies: [],
  
  // functions
  addRichardBody: function (body) {
    richard.bodies.push(body);
    return true;
  },
  draw: function () {
    var bodycount = richard.bodies.length;
    while (bodycount--) {
      // body
      richard.bodies[bodycount].draw();
      // center
      drawPoint(
        richard.bodies[bodycount].centroid_offset_x + richard.bodies[bodycount].position_x,
        richard.bodies[bodycount].centroid_offset_y + + richard.bodies[bodycount].position_y
      );
      // radius
      drawCircle(
        richard.bodies[bodycount].position_x + richard.bodies[bodycount].center_x,
        richard.bodies[bodycount].position_y + richard.bodies[bodycount].center_y,
        richard.bodies[bodycount].radius, richard.bodies[bodycount].broad_color
      );
    }
  },
  update: function () {    
    var bodycount = richard.bodies.length;
    while (bodycount--) {
      richard.bodies[bodycount].update();
    }
    return;
  },
  move: function () {    
    var bodycount = richard.bodies.length;
    while (bodycount--) {
      richard.bodies[bodycount].move();
    }
    return;
  },
  collisions: function () {
    var bodycount = richard.bodies.length;
    // quickly reset colours
    while (bodycount--) {
      if(richard.bodies[bodycount].dragged) {
        richard.bodies[bodycount].color = "#288622";
      } else {
        richard.bodies[bodycount].color = "#00FF00";
      }
      richard.bodies[bodycount].broad_color = "#2BC2E0";
    }
    bodycount = richard.bodies.length;
    
    while (bodycount--) {
      // check each body combination
      var poly1 = richard.bodies[bodycount];
      var other_bodies = bodycount;
      while (other_bodies--) {
        var poly2 = richard.bodies[other_bodies];
        // broad phase
        var dist_x = poly1.position_x + poly1.center_x - poly2.position_x - poly2.center_x;
        var dist_y = poly1.position_y + poly1.center_y - poly2.position_y - poly2.center_y;
        // continue loop if no collision possible
        if (
          dist_x*dist_x + dist_y*dist_y
          >
          (poly1.radius+poly2.radius) * (poly1.radius+poly2.radius)
        ) continue; // skip narrow
        // narrow phase
        //console.log("Narrow on: ");console.log(poly1,poly2);        
        poly1.broad_color = "#0000FF";
        poly2.broad_color = "#0000FF";
        // get minimum translation vector to move bodies apart
        var mtd = intersect(poly1.vtx, poly2.vtx);
// something goes wrong here. mtd is not correct for small polygons hitting an ege which has
// a larger minima/maxima than itself. no idea why .. must investigate 
        if (mtd instanceof Array) {
          var poly1_component;
          var d_x = poly1.centroid_x - poly2.centroid_x;
          var d_y = poly1.centroid_y - poly2.centroid_y;
          
          var dotprod = dot(d_x, d_y, mtd[0], mtd[1]);
          if (dotprod < 0) {
            mtd[0] = -mtd[0];
            mtd[1] = -mtd[1];
          }
          
          if (poly1.dragged) {
            poly1_component = 0;
          } else if (poly2.dragged) {
            poly1_component = 1;
          } else {
            poly1_component = poly2.mass / (poly1.mass + poly2.mass);
          }
          
          trans_component_x = poly1_component * mtd[0]; 
          trans_component_y = poly1_component * mtd[1]; 
          poly1.position_x += trans_component_x;
          poly1.position_y += trans_component_y;
          drawLine(
            poly1.centroid_x,
            poly1.centroid_y,
            poly1.centroid_x + trans_component_x * 10,
            poly1.centroid_y + trans_component_y * 10
          );
          mtd[0] = -mtd[0];
          mtd[1] = -mtd[1];
          trans_component_x = (1 - poly1_component) * mtd[0]; 
          trans_component_y = (1 - poly1_component) * mtd[1]; 
          poly2.position_x += trans_component_x;
          poly2.position_y += trans_component_y;    
          drawLine(
            poly2.centroid_x,
            poly2.centroid_y,
            poly2.centroid_x + trans_component_x * 10,
            poly2.centroid_y + trans_component_y * 10
          );
          poly1.color = "#FF0000";
          poly2.color = "#FF0000";
          
          // update velocity to reflect a basic bounce
          //http://elancev.name/oliver/2D%20polygon.htm#tut3
          //V’ = V – (2 * (V . N)) * N .... erm =_=#?
          /* // .. OK THIS IS OBVIOUSLY NOT IT ..
          var scalar;
          scalar = 2 * (dot(poly1.velocity_x,poly1.velocity_y,mtd[0],mtd[1]));
          poly1.velocity_x = poly1.velocity_x - scalar * mtd[0];
          poly1.velocity_y = poly1.velocity_x - scalar * mtd[1];
          scalar = 2 * (dot(poly2.velocity_x,poly2.velocity_y,mtd[0],mtd[1]));
          poly2.velocity_x = poly2.velocity_x - scalar * mtd[0];
          poly2.velocity_y = poly2.velocity_x - scalar * mtd[1];
          */
        }
      }
    }
  },
  step: function (timestamp) {
    ctx.clearRect(0,0,640,480);
    richard.update();
    richard.collisions();
    richard.move();
    richard.draw();
    
    // fps
    richard.fps = 1000 / (timestamp - richard.last_time);
    richard.last_time = timestamp;
    ctx.fillText("FPS: " + Math.round(richard.fps), 10, 15);
    
    requestAnimationFrame(richard.step);
  },
  loop: function () {
    requestAnimationFrame(richard.step);
  },
  gravitate: function (gravitron, force) {
    var gravitation_x = 0;
    var gravitation_y = 1; // just down by default
    var force = force || 10;
    // TODO: calculate force based on mass?
    var bodycount = richard.bodies.length;
    var body;
    var i;

    // loop through rigidbodies
    for (i = 0; i < bodycount; i++) {
      body = richard.bodies[i];
      if( body === gravitron) continue;
      if(gravitron && gravitron.position_x) {
        var total;
        // calculate direction
        gravitation_x = gravitron.position_x - body.position_x;
        gravitation_y = gravitron.position_y - body.position_y;
        // normalize
        total = Math.abs(gravitation_x + gravitation_y);
        if (!total) continue; // avoid divide by 0
        gravitation_x = gravitation_x / total;
        gravitation_y = gravitation_y / total;
        // account for distance and mass?
        // .. nah
      }
      // apply force
      richard.bodies[i].impulse_x += gravitation_x * force;
      richard.bodies[i].impulse_y += gravitation_y * force;
    }
  },
  mouseDown: function (e) {
    if (e.target.id === "canvas") {
      var count = richard.bodies.length || 0;
      var x = e.clientX - e.target.offsetLeft;
      var y = e.clientY - e.target.offsetTop;
      while (count--) {
        if (richard.bodies[count].pointInPoly(x, y)) {
          richard.bodies[count].dragged = true;
          richard.bodies[count].color = "#288622";
        }
      }
    }
  },
  mouseUp: function (e) {
    if (e.target.id === "canvas") {
      var count = richard.bodies.length || 0;
      while (count--) {
        richard.bodies[count].dragged = false;
        richard.bodies[count].color = "#00FF00";
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
        richard.bodies[count].color = "#00FF00";
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
  this.color = '#00FF00';
  this.broad_color = '#2BC2E0';
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
  this.compute_stuff = function () {
    var stuff = centroid_and_stuff(this.vertices);
    // returns: centroid x:y, center x:y, max radius
    this.centroid_offset_x = stuff[0];
    this.centroid_offset_y = stuff[1];
    this.centroid_x = stuff[0];
    this.centroid_y = stuff[1];
    this.center_x = stuff[2];
    this.center_y = stuff[3];
    this.radius = stuff[4];
  }
  this.compute_stuff();
  this.impulse_x = 0;
  this.impulse_y = 0;
  this.velocity_x = 0;
  this.velocity_y = 0;
  this.dragged = false;
  this.move = function () {
    var index = this.vertex_count * 2 - 1;
    while ( index >= 1 ) {
      //this.vtx[index--] += this.velocity_y;
      this.vtx[index] = this.vertices[index--] + this.position_y;
      //this.vtx[index--] += this.velocity_x;
      this.vtx[index] = this.vertices[index--] + this.position_x;
      this.centroid_x = this.centroid_offset_x + this.position_x;
      this.centroid_y = this.centroid_offset_y + this.position_y;
    }
    if(this.dragged) {
      this.velocity_x = 0;
      this.velocity_y = 0;
    }
  };
  this.update = function () {
    // apply impulse
    this.velocity_x += this.impulse_x;
    this.velocity_y += this.impulse_y;
    // reset impulse
    this.impulse_x = 0; 
    this.impulse_y = 0;    
    // collision detect?
    // position update
    this.position_x += this.velocity_x;
    this.position_y += this.velocity_y;
    // friction (air-resistance?)
    this.velocity_x *= 0.9;
    this.velocity_y *= 0.9;
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
  };
}