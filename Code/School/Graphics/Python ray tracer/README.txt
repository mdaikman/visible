M. Donovan Aikman
V00263072
CSc 305 - A3
==================
INTRODUCTION/USAGE
==================
A simple ray tracer in Python.

It takes an input scene file in .txt format and raytraces out a image from that. By default, it does this in PPM P3 format.
But with slight modification, it will output in PNG format as well. See the build notes for PNG info.

USAGE:
python3 A3.py scenefile.txt <outputfolder>

EXAMPLES:
python A3.py .\tests\testSample.txt
python A3.py .\tests\testSample.txt output
python A3.py "C:\Users\mda\Desktop\UVic stuff\2021 Spring\CSc 305\A3\tests\MYunit.txt"

<outputfolder> is optional. You can leave this blank and it will just use the "././" folder that the program is in
otherwise it is "./<outputfolder>/.



=================
BUILD NOTES
=================
Built on a Windows 10 machine using Pycharm with Python 3.7.
It uses 3 external libraries:

sys                 for argument parsing
numpy               for linear algebra work, including the numpy.linalg library
Image from PIL      It actually pulls from the PILlow project library as PIL support is basically discontinued
                        THIS IS NOT STRICTLY NECESSARY AND YOU CAN COMMENT IT OUT IF YOU LIKE
                        It allows the program to output PNGs as well as PPMs if you also uncomment line 605 near the bottom
                                # describe(ourScene, blast)
                        It can be included from the command line via pip with:
                                pip install Pillow


=================
Input File Format
=================
The content and syntax of the file is as follows:
Content
    The near plane**, left**, right**, top**, and bottom**
    The resolution of the image nColumns* X nRows*
    The position** and scaling** (non-uniform), color***, Ka***, Kd***, Ks***, Kr*** and the specular exponent n* of a sphere
    The position** and intensity*** of a point light source
    The background colour ***
    The scene’s ambient intensity***
    The output file name (you should limit this to 20 characters with no spaces)
 
* int         ** float          *** float between 0 and 1
 
Syntax
NEAR <n>
LEFT <l>
RIGHT <r>
BOTTOM <b>
TOP <t>
RES <x> <y>
SPHERE <name> <pos x> <pos y> <pos z> <scl x> <scl y> <scl z> <r> <g> <b> <Ka> <Kd> <Ks> <Kr> <n>
… // up to 14 additional sphere specifications
LIGHT <name> <pos x> <pos y> <pos z> <Ir> <Ig> <Ib>
… // up to 9 additional light specifications
BACK <r> <g > <b>
AMBIENT <Ir> <Ig> <Ib>
OUTPUT <name>
 
All names should be limited to 20 characters, with no spaces. All fields are separated by spaces. 

--------
EXAMPLE:
--------

NEAR 1
LEFT -1
RIGHT 1
BOTTOM -1
TOP 1
RES 600 600
SPHERE s1 0 0 -10 2 4 2 0.5 0 0 1 1 0.9 0 50
SPHERE s2 4 4 -10 1 2 1 0 0.5 0 1 1 0.9 0 50
SPHERE s3 -4 2 -10 1 2 1 0 0 0.5 1 1 0.9 0 50
LIGHT l1 0 0 0 0.9 0.9 0.9
LIGHT l2 10 10 -10 0.9 0.9 0
LIGHT l3 -10 5 -5 0 0 0.9
BACK 1 1 1
AMBIENT 0.2 0.2 0.2
OUTPUT testSample.ppm


=============
Collaboration
=============
I shared no code with and received no code from other students and built this code myself. General concepts were discussed with other students and researched online for greater understanding.
 