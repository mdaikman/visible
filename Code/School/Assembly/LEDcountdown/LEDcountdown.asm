; CSC 230 
;
; A3P2
; M. Donovan Aikman
; V0263062
; 
;  "To me programming is more than an important practical art.
;		It is also a gigantic undertaking in the foundations of knowledge."
;				- Grace Hopper 


.include "m2560def.inc"
.def data = r16
.def count = r17
.def lbits = r18
.def bbits = r19
.def temp = r20
.def goleft = r21
.def goright = r22
.def setit =r23
.set startnum = 0x3F


; Assignment required pseudo-code
; number = /* choose a number in (0x00, 0xFF] */ 
; count = 0
; while (number > 0)
;		{ dest[count++] = number		; X is holding the count address here
;		* Output number on LEDs *
;		* delay 0.5 second *
;		 number --; 


.cseg			
			ldi data, startnum			; get starting number into our home register
			ldi R26, low(thenums)		; get our address for where thenums go into X
			ldi R27, high(thenums)
			ldi count, 0
			sts DDRL, lbits				; portL and portB as output
			out DDRB, bbits

countdown:
			st X+, data
			call disco					; go where the fun is!
			cpi count, startnum			; are we at 0?
			breq zen					; if so, zen out
			; call delay
			dec data
			inc count
			rjmp countdown

zen:		rjmp zen					; the processor, its job done, enters a nirvana of just being endlessly

										; reminder for myself because this pin-out is confusing.
										; 0 Port L: bit 7 PL7
										; 1 Port L: bit 5 PL5
										; 2 Port L: bit 3 PL3
										; 3 Port L: bit 1 PL1
										; 4 Port B: bit 3 PB3
										; 5 Port B: bit 1 PB1
			
disco:									; DISCO: where the blinking lights are!
										; get 'em ready so that the typewriter can line 'em up right
										; then load 'em up and light 'em up

			ldi lbits, 0				; clear out lbits
			ldi bbits, 0				; clear out bbits

										; lets chop up bbits proper
			ldi goleft, 2
			ldi goright, 7
			ldi setit, 1
			rcall typewriter
			or bbits, temp				; data bit 5 to set bbit 1

			ldi goleft, 3
			ldi goright, 7
			ldi setit, 3
			rcall typewriter
			or bbits, temp				; data bit 4 to bbit 3

										; lets chop up lbits proper
			ldi goleft, 4
			ldi goright, 7
			ldi setit, 1
			rcall typewriter
			or lbits, temp				; data bit 3 to set lbit 1

			ldi goleft, 5
			ldi goright, 7
			ldi setit, 3
			rcall typewriter
			or lbits, temp				; data bit 2 to set lbit 3

			ldi goleft, 6
			ldi goright, 7
			ldi setit, 5
			rcall typewriter
			or lbits, temp				; data bit 1 to set lbit 5

			ldi goleft, 7
			ldi goright, 7
			ldi setit, 7
			rcall typewriter
			or lbits, temp				; data bit 0 to set lbit 7

			sts PORTL, lbits			; fire in the disco!
			out PORTB, bbits			; get your binary lights grooving.

			ret


typewriter:	mov temp, data				; typewriter: where I slide those digits left and right on a carriage
slide_l:	lsl temp					; until they lose all other digits and then get set in place
			dec goleft
			cpi goleft, 0
			breq slide_r 
			rjmp slide_l
slide_r:		lsr temp
			dec goright
			cpi goright, 0
			breq into_place
			rjmp slide_r
into_place:	lsl temp
			dec setit
			cpi setit, 0
			breq donethis 
			rjmp into_place
donethis:	ret

										; The delay code, which is placed *after* the done: jmp done
delay:		ldi r24, 0x2A				; approx. 0.5 second delay
outer:		ldi r23, 0xFF				; Credit: L. Jackson for the writing these 9 lines
middle:		ldi r22, 0xFF
inner:		dec r22
			brne inner
			dec r23
			brne middle
			dec r24
			brne outer
			ret


.dseg
			.org 0x000200
			thenums:	.byte 256