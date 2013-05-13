cge-physics
===========

Rushed attempt to write a 2D physics engine in JS

##Richard##
Live version at: http://iqabsent.com/richard/



##Does do##
Polygon (convex, possibly concave) collision detection
- Broad-phase using max radius from center

- Calculates Mass (Area) and Centroid (though this is not used yet)

- Collision response (only just) based on inverse mass

- Lovely visual indicators ^_^

- Can click & drag (locking physics for dragged poly)


##Does not do##
Any rotation

Checking for future collisions (close.. but not yet)

Bounce accurately (velocity from before collision is maintained .. )


##Known bugs##
Cheating on Weigh() using Math.abs() for negative masses -_-

A poly colliding with an edge, the range of which encompasses it completely, picks the
wrong minimum translation vector for a reason which still escapes my grasp :/



