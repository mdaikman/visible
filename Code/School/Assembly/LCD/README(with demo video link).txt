M. Donovan Aikman
V00263072

UVic CSc 230 Assignment 5

Included are all the relevant files for my submission:
	display.asm
	display-ext.asm
	LCD.asm
	LCDdefs.inc
	
I am using the LCD files provided as I need them to drive the screen. I made one small change to LCD.asm where I commented out the fact we are both using r16 and defining it as temp. Otherwise, these files are unchanged. Please find a video link to watch the project here:

https://youtu.be/nv6qjqxwrv4

The basic display uses a very short version of a famous Basho haiku.
The extended display has 8 base lines (rather than just 2) and reverses them for a total of 16 lines displayed.

Basho's poem is traditionally written in kanji like so:
古池や
蛙飛び込む
水の音
However, the LCD does not support the full UTF character set. However, it does have it's own custom character set and I was able to use the phonetic katakana version which reads:
フルイケヤ
カワズ　トビコム
ミズノオト

which I handcoded in via hex like so:

msg81: .db $CC, $D9, $B2, $B9, $D4, 0
msg82: .db "An old pond.",0, 0
msg83: .db $B6, $DC, $BD, $DE, $20, $C4, $CB, $DE, $BA, $D1, $00, 0
msg84: .db "A frog jumps in.",0, 0
msg85: .db $D0, $BD, $DE, $C9, $B5, $C4, $00, 0


IF IT MATTERS, these are the things I would improve if I had more time:
	- change register variables to properly stored LDS/STS data variables
	- make the msg loading and reversing portion of the startmeup into a macro or subroutine
			(It's very inefficient the way it is done via copy/paste)
	- make the ISR a lot shorter and run the screen update in the general runtime instead.
