M. Donovan Aikman
V00263072
CSc305 - A2

README
======
1   Running
2   Package contents
3   Project completion and shaders
4   Assistance acknowledgement 
5   Additional Notes
6   Source Credits    

============================================================================================================
1 Running
============================================================================================================
Extract all files into a folder of your choice. You will need to keep the folder structure as it will go looking for common, texture and music files in those folders.

You will need a WebGL compatable browser that allows local file loading in order to access textures and music properly.

Firefox:    about:config >> security.fileuri.strict_origin_policy parameter >> set to False
Chrome:     close and then re-open on the command line with 'chrome --allow-file-access-from-files'
Brave:      As with Chrome but 'brave --allow-file-access-from-files'

THIS WAS TESTED ONLY ON CHROME AND BRAVE WHICH IS CHROME-BASED!

Finally, open the main.html in your browser.


============================================================================================================
2 Package contents
============================================================================================================
main.html               What to run to run the program
main.js                 JS file that contains most my work
objects.js              Support JS file.
M-Donovan-Aikman.mp4    Compressed demo movie. Quality is "enh" but portable. Named as required.
M-Donovan-Aikman.png    Screenshot. Named as required.
readme.txt              This file
\Common                 5 related support files
\music                  1 file: Clare de Lune for audioplayback
\textures               8 textures used by WebGL in execution

============================================================================================================
3 Project completion
============================================================================================================
I believe I have completed all the objectives on this assignment. I worked on this a lot for weeks, trying to figure everything out.

That being said, above and beyond the requirements, if I had more time I would:
    - play with shaders more and add more effects over time
    - do project in perspective rather than the base-version orthographic
    - Experiment with light and materials more
    - Experiment on the vertex shader as well
    - Experiment more with material/light changes

As for the shaders...

Vertex shader:
You won't see any change to the base code here since it was sufficient enough to do light modelling. What you won't see here is that I did work in the javascript code to make shininess changes for each textures. I wanted this especially for the lander so it had a distinctive retrofuturist look.

Fragment shader:
I provide a lot of commentary in the code. I worked toward two main shader ideas and fiddled with the rest on a texture-by-texture basis. 

First, I wanted to mmake the lander as distinctive as possible. I didn't find a fragment shader that really did this even though I worked on it a bit. In the end, it wound up being about altering the shininess for that object, and laying the colours over a metallic structure that got sharpened up a lot in a photo editor. It's got a nice sparkle but did not wind up being the shader I hoped I could submit.

Second is the big obvious planet texture. I describe it in the code so I won't repeat it here. I had some earlier iterations I also liked that you try yourself if you read the code. They were cool too but I wanted a second layer that was very sci-fi, active, and had elements working across each other. The lava-mist and green magnetic field lights were just as I hoped they could be in the end.


============================================================================================================
4 Assistance acknowledgement
============================================================================================================
I helped at least 7 other students understand applying textures and using the lookAt to do eye movement. They are Leo MacKenzie, Mantawa, Aurelav, Shy, Victor Son, and a few others I know only by their Discord nicknames (Hunter16, TC, and drlag). The only code I showed them was the base code for the assignment and I just talked about the functions of WebGL generally. I did not give them any code and I did ask they acknowledge this in their own code so it's clear there is no plagirism going on here.

I discussed some general ideas with Kelvin Leung.

I did write up some code with Aurelav, which I didn't use myself. We were just trying to figure out how to activate single textures via a standalone function in WebGL. It was pretty simple stuff and largely based on the base code. I asked that if she did use it, she acknowledge my help on this for clarity.

I have never explicitly shared my own code with anyone else otherwise.

============================================================================================================
5 Additional Notes
============================================================================================================
Music:
Brave/Chrome doesn't like to autoplay music but it's in the video and attached to the page because I like it. I didn't want to force it on any marker who might be watching this multiple times. Controls are there if you want them and I do recommend it at least once.

Light source:
I don't know if it was required but I moved the light source when I moved the eye-camera. You can see it clearly in the asteroids and the lander when it takes off. Planet glow makes it hard to see on the surface though. Turn off the textures via the button and it's fairly clear that the light moves relative to the camera as it should to look "natural" for orthographic. WebGL doesn't do this on it's own when you move the eye and I wish it did.

Sliders/Buttons:
Left in and still functional but not required or used by my code.

Eyeball texture:
This is actually is a normal human eye on a square texture canvas but the weird wrap gave it a double iris effect I actually emphasized via rotation because the planet is supposed to be a monster anways

Flag texture:
Is actually upside down. The flag is a made up one anyways so I don't see the point of fixing it. It looks more surreal this way anyways.

ProjectionMatrix:
I stuck with the default ortho from the base code in the end. If I had more time, playing with the perspective more would have been fun.

Sphere seams
I thought about trying to fix the seams on my sphere. They are actually pretty hard to spot and after hearing Brandon's explanation of the difficulties of working around this, I am just going to live with them at this point in my graphics career.


============================================================================================================
6 Source Credits
============================================================================================================
Sources for all non-generated materials are listed below. 
All the sites promoted these items as either public domain or creative commons.
General due-dilligence was done to make sure that these claims appeared create and were then taken on good faith as o.

Music:
------
Claude Debussy - LUNA OST - 07 Clair de Lune
https://archive.org/details/kakofonousa.dischordlunaost/Claude+Debussy+-+LUNA+OST+-+07+Clair+de+Lune.flac

Textures:
---------
Planet (Alien Muscle)
https://3dtextures.me/2017/12/07/alien-muscle-001/

Lander (Metal plate)
https://3dtextures.me/2019/07/23/metal-plate-026/

Eyeball
https://publicdomainpictures.net/en/view-image.php?image=204585&picture=eyeball-render
Permitted for non-commercial use with attribution to the website.

Night Sky
https://commons.wikimedia.org/w/index.php?title=Special:Search&limit=500&offset=0&ns0=1&ns6=1&ns12=1&ns14=1&ns100=1&ns106=1&search=night+sky&advancedSearch-current={}#/media/File:Night_sky_Freycinet_2.jpg

Asteroid texture
https://commons.wikimedia.org/wiki/File:Bennu_global_mosaic_reduced_size.png

Flag
https://commons.wikimedia.org/wiki/File:Flag_Of_Brazilian_Antarctica.png
This was on the site as of March 13, 2021. It was marked for possible deletion though.
It is a fictious flag, which the author released under Creative Commons.

None (Checkerboard)
https://en.wikipedia.org/wiki/File:Checkerboard_pattern.svg
A placeholder texture, not used in the final implement. Also, not copywritable either.



============================================================================================================
Did you actually read this far?????
Why???
I talk too much.
============================================================================================================
