# M. Donovan Aikman
# V00263072
# CSc 305 - A3
#
# A simple ray tracer in Python
#
# Built on a Windows 10 machine using Pycharm
#
# USAGE:
# python3 A3.py scenefile.txt <outputfolder>
#
# <outputfolder> is optional. You can leave this blank and it will just use the "././" folder that the program is in
# otherwise it is "./<outputfolder>/.
#
#
# See the README.txt for full details on this



# a few small imports
# PIL (actually PILlow) was here so I can test with PNG, it is not required to run the main functions
from PIL import Image
import numpy as np
import sys

# some globals to refer to as needed
maxbounces =    3
eye =           [0, 0, 0]
MinTee =        .000001


# Before we get started, let's be classy

class ray:
    global maxbounces
    global eye
    
    pixel      = [0, 0]
    rgb        = [0.0, 0.0, 0.0]
    origin     = eye
    direction  = [1, 1, 1]
    bounces     = maxbounces
    # stop the recursion after 3 bounces by global
    
    def __init__(self, r, g, b, x, y, z, vx, vy, vz, xx, yy):
        self.pixel      = [xx, yy]
        self.rgb        = [r, g, b]
        self.origin     = [x,y,z]
        self.direction  = [vx,vy,vz]
        self.bounces    = maxbounces
    
    # creates a new bounce ray based off the current
    def bounced(self, theSpot, N):
        newRay = ray(0.0, 0.0, 0.0, theSpot[0], theSpot[1], theSpot[2], 0.0, 0.0, 0.0, self.pixel[0], self.pixel[1])
        newRay.direction  = np.subtract(self.direction, (2 * (np.dot(N, self.direction) * N)))
        newRay.bounces = self.bounces - 1
        return newRay


class scene:
    NEAR    = 1
    LEFT    = -1
    RIGHT   = 1
    BOTTOM  = -1
    TOP     = 1
    RES     = [600, 600]
    SPHERES = []
    LIGHTS  = []
    BACK    = [1, 1, 1]
    AMBIENT = [0.75, 0.75, 0.75]
    OUTPUT  = 'default.ppm'
    FOLDER  = '.'
    
    def __init__(self):
        self.NEAR    = 1
        self.LEFT    = -1
        self.RIGHT   = 1
        self.BOTTOM  = -1
        self.TOP     = 1
        self.RES     = [600, 600]
        self.SPHERES = []
        self.LIGHTS  = []
        self.BACK    = [1, 1, 1]
        self.AMBIENT = [0.75, 0.75, 0.75]
        self.OUTPUT  = 'default.ppm'
        self.FOLDER  = '.'
    
    def addSphere(self, sphereDeets):
        newOne = sphere(sphereDeets)
        self.SPHERES.append(newOne)
    
    def addLight(self, lightDeets):
        newOne = light(lightDeets)
        self.LIGHTS.append(newOne)


class sphere:
    # name($)   position(F)  scaling(F) color(01), Ka(01), Kd(01), Ks(01), Kr(01) 
    # SPHERE s1     0 0 -10    2 4 2    0.5 0 0     1 0 0 0     50
    #                                                           specular exponent n(I) of a sphere
    
    name     = None
    position = [0,0,0]
    scale    = [0,0,0]
    colour   = [0,0,0]
    Ka       = 0                # ambient
    Kd       = 0                # diffuse
    Ks       = 0                # specular factor
    Kr       = 0                # reflective
    Specular = 0                # specular n
    inverted = [[0.0, 0.0, 0.0],[0.0, 0.0, 0.0],[0.0, 0.0, 0.0]]
    invTrans = [[0.0, 0.0, 0.0],[0.0, 0.0, 0.0],[0.0, 0.0, 0.0]]
    matrix   = [[0.0, 0.0, 0.0],[0.0, 0.0, 0.0],[0.0, 0.0, 0.0]]

    def __init__(self, values):
        self.name     = values[1]
        self.position = [float(values[2]), float(values[3]), float(values[4])]
        self.scale    = [float(values[5]), float(values[6]), float(values[7])]
        self.colour   = [float(values[8]), float(values[9]), float(values[10])]
        self.Ka       = float(values[11])
        self.Kd       = float(values[12])
        self.Ks       = float(values[13])
        self.Kr       = float(values[14])
        self.Specular = int(values[15])
        self.myMatrix = self.makeMyM()
        self.inverted = np.linalg.inv(self.myMatrix)
        self.invTrans = np.matrix.transpose(self.inverted)

    def makeMyM(self):
        return np.array([[(self.scale[0]), 0.0, 0.0, (self.position[0])],
                         [0.0, (self.scale[1]), 0.0, (self.position[1])],
                         [0.0, 0.0, (self.scale[2]), (self.position[2])],
                         [0.0, 0.0, 0.0, 1.0]])


class light:
    # The   name($) position(F) and intensityRGB(01) of a point light source
    # LIGHT l1      0 0 0           0.3 0.3 0.3
    
    name      = None
    position  = [0, 0, 0]
    intensity = [0, 0, 0]
    
    def __init__(self, values):
        self.name      = values[1]
        self.position  = [float(values[2]), float(values[3]), float(values[4])]
        self.intensity = [float(values[5]), float(values[6]), float(values[7])]


# a helpful small function
def heyNormalizeThis(vector):
    norm = np.linalg.norm(vector)
    if norm == 0:
       return vector
    return np.divide(vector, norm)


# another helpful small function
def isItBackFacing(theRay, theN):
    return (np.dot(theRay, theN) > 0)


# Used to determine if we are inside or outside the sphere
# helpful for figuring out if light sources are internal/external
# or if we are seeing the inside or outside of the sphere
def isItInThis(theSphere, thePoint):
    # expanded for my own clarity, not the most efficient way to write this
    x  = thePoint[0]
    y  = thePoint[1]
    z  = thePoint[2]
    x0 = theSphere.position[0]
    y0 = theSphere.position[1]
    z0 = theSphere.position[2]
    Rx = theSphere.scale[0]
    Ry = theSphere.scale[1]
    Rz = theSphere.scale[1]
    return ((((x - x0) * (x - x0)/(Rx * Rx)) + ((y - y0)*(y - y0)/(Ry * Ry)) + ((z - z0) * (z - z0)/(Rz * Rz)))  < 1)


# most of my work is cartesian
# this does a homogenous transform and returns back a cartesian xyz
# not sure if I named this function for Harry Potter or our evolutionary ancestors
def homogenousTransformus(theTransformer, theCartesian, theFourth):
    theHomogenous = np.array([theCartesian[0], theCartesian[1], theCartesian[2], theFourth])
    theHomogenous = np.matmul(theTransformer, theHomogenous)
    newCartesian  = np.array([theHomogenous[0], theHomogenous[1], theHomogenous[2]])
    return newCartesian


# this part just take the file from our CLI and makes a scene
def parseTheScene(TheLine):
    theScene = scene()

    # error check input
    if len(TheLine) == 1:
        sys.exit("Please give me at least a file name to do! Nothing to do if you don't.")
    elif len(TheLine) == 2:
        TheFile   = TheLine[1]
    elif len(TheLine) == 3:
        TheFile   = TheLine[1]
        theScene.FOLDER = TheLine[2]
    else:
        sys.exit("Sorry,  I'm not sure what you want.")
    # check if it at least superficially looks like a .txt file
    if TheFile.find(".txt") == -1:
        sys.exit("I require a .txt file type.")

    reading = open(TheFile, 'r')
    theDeets = reading.readlines()
    reading.close()
    for thisDeet in theDeets:
        theseDeets = thisDeet.split()
        if len(theseDeets) == 0:
            continue
        if theseDeets[0]   == 'NEAR':
            theScene.NEAR   = float(theseDeets[1])
        elif theseDeets[0] == 'LEFT':
            theScene.LEFT   = float(theseDeets[1])
        elif theseDeets[0] == 'RIGHT':
            theScene.RIGHT  = float(theseDeets[1])
        elif theseDeets[0] == 'BOTTOM':
            theScene.BOTTOM = float(theseDeets[1])
        elif theseDeets[0] == 'TOP':
            theScene.TOP    = float(theseDeets[1])
        elif theseDeets[0] == 'RES':
            theScene.RES    = [int(theseDeets[1]), int(theseDeets[2])]
        elif theseDeets[0] == 'SPHERE':
            theScene.addSphere(theseDeets)
        elif theseDeets[0] == 'LIGHT':
            theScene.addLight(theseDeets)
        elif theseDeets[0] == 'BACK':
            theScene.BACK   = [float(theseDeets[1]), float(theseDeets[2]), float(theseDeets[3])]
        elif theseDeets[0] == 'AMBIENT':
            theScene.AMBIENT = [float(theseDeets[1]), float(theseDeets[2]), float(theseDeets[3])]
        elif theseDeets[0] == 'OUTPUT':
            theScene.OUTPUT = theseDeets[1]
        else:
            print('Sorry, I do not understand this line in the file being parsed:')
            print(thisDeet)
            sys.exit(-1)
    return theScene


# This starts making the set of rays which we will be bouncing in the scene
def eyeGun(theScene):
    x = theScene.RES[0]
    y = theScene.RES[1]
    t = theScene.TOP
    b = theScene.BOTTOM
    h = t - b
    l = theScene.LEFT
    r = theScene.RIGHT
    w = r - l
    n = theScene.NEAR
    # I am handling w and h a little differently from the notes
    # but in a way to reach the same end
    # Eg: I am starting from l->r based on a column/x-resolution delta for each pixel
    # going t->b though to match ppm/png format of upper left
    # rather than dividing it into -w, w | w = x/2
    
    rayBlast = [[ray(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, j, i) for j in range(x)] for i in range(y)]
    for yy in range(y):
        print('%s... %.1f%s powered' % (('\b' * 18), (100 * yy / y), "%"), end='')
        for xx in range(x):
            Vx = l + w * (xx / x)
            Vy = t - h * (yy / y)
            Vz = 0 - n
            rayBlast[xx][yy].direction = [Vx, Vy, Vz]
            rayBlast[xx][yy].direction = heyNormalizeThis(rayBlast[xx][yy].direction)
    print('%s... %s' % (('\b' * 250), "100.0% charge complete!"))
    return rayBlast


# setups up and runs the ray collision detection and bounces
def rayGun(theScene, theRay):
    #pseudocode reminder
    # raytrace( ray )
        # P = compute_closest_intersection(ray)
        # color_local = ShadowRay(light1, P)+…+ ShadowRay(lightN, P)
        # color_reflect = raytrace(reflected_ray )
        # color_refract = raytrace(refracted_ray )   (NOT BEING USED)
        # color = color_local + kre*color_reflect+ kra*color_refract
    # return( color )

    # t must be greater than at least this to count
    global MinTee
    global eye
    global maxbounces

    t_rays    = {}
    originalO = theRay.origin
    originalD = theRay.direction

    # run through objects
    for thisObject in theScene.SPHERES:

        d      = homogenousTransformus(thisObject.inverted, originalD, 0)
        origin = homogenousTransformus(thisObject.inverted, originalO, 1)

        # these are used to check for values between eye and near plane
        nearCheck1 = None
        nearCheck2 = None

        # used to confirm if we have hit the inside or outside of an object
        insideHit  = False
        insideLight= False

        # trying to do these computations once and store for computational simplicity
        t = None
        v = origin

        vd = np.dot(v, d)

        d2 = np.square(np.linalg.norm(d))
        v2 = np.square(np.linalg.norm(v))

        determined = np.square(vd) - d2 * (v2 - 1)


        # Find smallest t greater than MinTee and past near distance -->> COLLISION WITH THAT OBJECT
        if (determined == 0) and (d2 != 0):
            # One answer, take it
            t = (0 - vd + (np.sqrt(determined))) / d2
            nearCheck1 = (originalO[2] + (np.multiply(originalD, t))[2]) <= (0 - theScene.NEAR)
            if (nearCheck1 == False):
                t = None
        elif (determined > 0) and (d2 != 0):
            # two answers!, take the smaller greater than the minimum value only
            t1 = (0 - vd + (np.sqrt(determined))) / d2
            t2 = (0 - vd - (np.sqrt(determined))) / d2
            nearCheck1 = (originalO[2] + (np.multiply(originalD, t1))[2]) <= (0 - theScene.NEAR)
            nearCheck2 = (originalO[2] + (np.multiply(originalD, t2))[2]) <= (0 - theScene.NEAR)
            if ((((t1 < t2) and (t1 > MinTee)) and nearCheck1) or                   # t1 is smaller and valid OR
                ((t1 > MinTee) and nearCheck1 and (not nearCheck2))):               # t1 valid but t2 isn't
                # take t1
                t = t1
            elif ((((t2 < t1) and (t2 > MinTee)) and nearCheck2) or                 # t2 is smaller and valid OR
                ((t2 > MinTee) and nearCheck2 and (not nearCheck1))):               # t2 valid but t1 isn't
                # take t2
                t = t2
            else:
                # no answers, do nothing
                pass
        else:
            # no answers, do nothing
            pass
        if (t != None):
            t_rays[thisObject.name] = t
    
    # We now have a dictionary of hit objects.
    # If it's empty, it's the ambient colour of the scene
    # If it isn't:  smallest t value = object hit first, roll on this t value with

    if len(t_rays) > 0:
        hitObject = None
        # find our minimum hit and right t value
        hit       = min(t_rays, key=t_rays.get)
        t         = t_rays[hit]

        for thisObject in theScene.SPHERES:
            if thisObject.name == hit:
                hitObject = thisObject
                break

        # Start by adding the ambient light quality
        #             PIXEL_COLOR[c] = Ka*Ia[c]*O[c]
        theRay.rgb = np.multiply((np.multiply(hitObject.Ka, theScene.AMBIENT)), hitObject.colour)

        # Next work in the details of this light
        #             add for each point light (p)          { Kd*Ip[c]*(N dot L)*O[c]               each{diffuse +
        #                                                    +Ks*Ip[c]*(R dot V)n } +               specular} +
        # for this we need details
        # Point (where we got to)
        P = originalO + np.multiply(originalD, t)


        # And the normal
        # Normal = 2 * (Px-x0, Py-y0, Pz-z0)/(scale xyz)
        # This is also where we should inverse transpose but it didn't work for me so we can divide by scale instead
        N = np.subtract(P, hitObject.position)
        N = np.divide(N, np.square(hitObject.scale))
        N = np.multiply(N, 2)

        N = heyNormalizeThis(N)

        insideHit = isItBackFacing(originalD, N)

        V = np.subtract(originalO, P)
        V = heyNormalizeThis(V)

        # Next:
        for thisLight in theScene.LIGHTS:

            # are both they both facing the same surface side?
            # if not, they will have different Boolean values and we should ignore this value
            lightDirection = np.subtract(P, thisLight.position)
            lightDirection = heyNormalizeThis(lightDirection)
            insideLight    = isItBackFacing(lightDirection, N)

            if (insideHit != insideLight):
                # they are on opposite facing sides so no go
                continue
            if insideHit and insideLight:
                dN = np.multiply(N, -1)
            else:
                dN = N

            # But is this spot lit?
            if butIsItLit(thisLight, theScene, P, hitObject.name):
                # Light angle from point (Light - P)
                L = np.subtract(thisLight.position, P)
                L = heyNormalizeThis(L)
                # Reflecting angle =  2 * (N dot L) * N - L
                R = 2 * np.dot(dN, L)
                R = np.multiply(R, dN)
                R = np.subtract(R, L)
                R = heyNormalizeThis(R)

                # FIRST, BE DIFFUSE
                # DON'T BE NOT DIFFUSE
                # unless Kd = 0.0 or our dot product is negative
                # Kd*Ip[c]*(N dot L)*O[c]
                # or
                # Kd*(N dot L)               *O[c]*Ip[c]
                # with scalars on the left & vectors on the right
                diffuse     = np.multiply(hitObject.Kd, thisLight.intensity)
                diffuse     = np.multiply(diffuse, max((np.dot(dN, L)), 0.0))
                diffuse     = np.multiply(diffuse, hitObject.colour)
                diffuse     = np.clip(diffuse, 0.0, 1.0)

                # SECOND:
                # MAKE YOUR SPECULAR specTACular!
                # unless your dot game is off angle
                # or your Ks is just gone (== 0.0)
                if np.dot(L,dN) < 0:
                    spectacular = np.array([0.0, 0.0, 0.0])
                else:
                    spectacular = np.multiply(hitObject.Ks, thisLight.intensity)
                    RdVn        = max(np.dot(R, V), 0.0)
                    RdVn        = np.power(RdVn, hitObject.Specular)
                    spectacular = np.multiply(spectacular, RdVn)
                spectacular = np.clip(spectacular, 0.0, 1.0)

                theRay.rgb = np.add(theRay.rgb, diffuse)
                theRay.rgb = np.add(theRay.rgb, spectacular)

        # THIRD:
        # After looking for pretty lights,
        # Always stop for a moment of quiet reflection...
        # Contemplate the +Kr*(Color of reflection ray) in your life
        # And don't bounce around too much

        if insideHit:
            dN = np.multiply(N, -1)
        else:
            dN = N

        if (theRay.bounces > 1):
            bounceRay  = theRay.bounced(P, dN)
            reflection = hitObject.Kr * rayGun(theScene, bounceRay)
            theRay.rgb = np.add(theRay.rgb, reflection)

    else:
        # Hittin' onna nothing...
        # BACK colour if first bounce
        # [0, 0, 0} if not
        # Either way, no reflections after this
        if theRay.bounces == maxbounces:
            theRay.rgb = theScene.BACK
        else:
            theRay.rgb = [0.0, 0.0, 0.0]

    theRay.rgb = np.clip(theRay.rgb, 0.0, 1.0)

    return theRay.rgb

# REMINDER:
#             PIXEL_COLOR[c] =                      Ka*Ia[c]*O[c] +                         base ambient +
#                 for each point light (p)          { Kd*Ip[c]*(N dot L)*O[c]               x{diffuse +
#                                                    +Ks*Ip[c]*(R dot V)n } +               specular} +
#                 for that reflection ray:           +Kr*(Color of reflection ray)          reflective
#             O is the object color (<r> <g> <b>)


# does this light in this scene hit this point
# this walks though each object to make sure nothing is blocking that path
def butIsItLit(theLight, theScene, thePoint, what):
    global MinTee

    # assume we will hit light until we don't
    itsLit          = True

    # set up the vector of our sunshine Ray
    # and start checking for objects that would block it
    # what? you call it a shadow ray? But it's from the light source! Why you do that? Who hurt you??
    sunshineRay = np.subtract(theLight.position, thePoint)
    # TTL = t To Light, a maximum distance, after which we can ignore object blocks
    TTL = np.linalg.norm(sunshineRay)
    sunshineRay = heyNormalizeThis(sunshineRay)


    # run through objects
    for thisObject in theScene.SPHERES:
        # we need to transform for each sphere to figure if it might hit as we did before
        # also we need to check that the thing blocking our light is closer than the light (TTL, t to light)
        newPoint    = homogenousTransformus(thisObject.inverted, thePoint,    1)
        d           = homogenousTransformus(thisObject.inverted, sunshineRay, 0)

        # we haven't found a t yet so it doesn't exist
        t = None

        # We set up our quadratics now
        v  = newPoint
        d2 = np.dot(d, d)
        v2 = np.dot(v, v)
        vd = np.dot(v, d)
        determined = np.square(vd) - d2 * (v2 - 1)

        # Find smallest t greater than .000001 -->> COLLISION WITH THAT OBJECT
        if (determined == 0) and (d2 != 0.0):
            # One hit, take it
            t = (0 - vd + (np.sqrt(determined))) / d2
            if t < MinTee or t > TTL:
                t = None
        elif (determined > 0) and (d2 != 0.0):
            # two answers!, take the smaller greater than the minimumum value and smaller than TTL
            t1 = (0 - vd + (np.sqrt(determined))) / d2
            t2 = (0 - vd - (np.sqrt(determined))) / d2
            if ((t1 > MinTee and t2 < MinTee and t1 < TTL) or
                (t1 > MinTee and t2 > MinTee and t1 < t2 and t1 < TTL)):
                # take t1
                t = t1
            elif ((t2 > MinTee and t1 < MinTee and t2 < TTL) or
                  (t1 > MinTee and t2 > MinTee and t1 > t2 and t2 < TTL)):
                # take t2
                t = t2
            else:
                # no answers, do nothing
                pass
        else:
            # no answers, do nothing
            pass

        if (t != None):
            # OK, it hit something
            itsLit = False
            break

    return itsLit
    

# This draws out the PPM file
def splatter(theScene, theBlast):
    filename = ".\\"+ theScene.FOLDER +"\\" + theScene.OUTPUT
    ppmBlast = open(filename, "w")
    header= 'P3 '+str(theScene.RES[0])+' '+str(theScene.RES[1])+' 255\n'
    ppmBlast.write(header)
    for y in range(theScene.RES[1]):
        for x in range(theScene.RES[0]):
            rgbSplat = str(int(theBlast[x][y].rgb[0] * 255))+" "+               \
                       str(int(theBlast[x][y].rgb[1] * 255))+" "+               \
                       str(int(theBlast[x][y].rgb[2] * 255))+"   "
            ppmBlast.write(rgbSplat)
        ppmBlast.write('\n')    
    ppmBlast.close()
    return


# draws to PNG as well b/c why PPM? Why?
# is this the 80s? Did Max Headroom spill New Coke on my Patrick Nagel print?
def describe(theScene, blasted):
    colourBlast = np.zeros((theScene.RES[0], theScene.RES[1], 3), dtype=np.uint8)
    for y in range(theScene.RES[1]):
        for x in range(theScene.RES[0]):
            r = (blasted[x][y].rgb[0] * 255)
            g = (blasted[x][y].rgb[1] * 255)
            b = (blasted[x][y].rgb[2] * 255)
            colourBlast[y][x][0] = r.astype(np.uint8)
            colourBlast[y][x][1] = g.astype(np.uint8)
            colourBlast[y][x][2] = b.astype(np.uint8)
    img = Image.fromarray(colourBlast, 'RGB')
    extension = theScene.OUTPUT.find(".")
    name = '.\\' + theScene.FOLDER + '\\' + theScene.OUTPUT[:extension] + '.png'
    img.save(name)



# Runs the subroutines
def main():
    print('Reading the scene...')
    ourScene= parseTheScene(sys.argv)
    print('Eye powered t-ray generator powering up...')
    blast = eyeGun(ourScene)
    print('Blasting the scene with t-rays...')
    for y in range(ourScene.RES[1]):
        print('%s... %2.1f%s radiated' % (('\b' * 18), (100 * y / ourScene.RES[1]), "%"), end = '')
        for x in range(ourScene.RES[0]):
            rayGun(ourScene, blast[x][y])
    # now produce them
    print("\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b... 100.0% radiated!\nSaving...")

    # uncomment for your output format of choice
    # PNG requires PIL/PILlow so make sure that is uncommented too.
    splatter(ourScene, blast)          #ppm
    # describe(ourScene, blast)          #png
    print("Process complete. Powering down...")


if __name__ == "__main__":
    main()
