; UVic CSc230
; M. Donovan Aikman
; V00XXXXXX
;
; Assignment 5
;
;	"It's emotionally fufilling for humans to create things."
;			- Limor Fried, AKA Lady Ada, M.Eng and CEO of Adafruit Industries

;
; Project:
;	Create a "flashing" sign!
;	Start with two rows of "***************" on the LCD screen
;	React to buttons:
;		Up/Down:	Scroll off of *************** and on to messages 1-4
;		Select:		Flash between current message and  *************** every half-second
;		Left:		Show a count of button presses (as specified)
;		Right:		Autoscroll between messages 1-4 and loop back to 1
;	Messages:
;		1&2:		User defined (I chose a famous haiku and made it fit)
;		3&4:		A backwards version of messages 1&2 respectively

;	Extended: (stretch goals!)
;		8 lines, also be reflected in a backwards set too
;	

;;;;;;;;;;;;;;;;;;;;;;;;;
; general stuff
.include "m2560def.inc"
.def temp = r16
.def temp2 = r17
.def result = r18								; these 3 are work space registers

; register variables
.def liney1 = r14								; int value of line 1
.def liney2 = r15								; int value of line 2
.def showy1L = r19								; Line1 msg address parts 
.def showy1H = r20
.def showy2L = r21								; Line2 msg address parts
.def showy2H = r22
.def protectS = r25								; to store SREG
.def pushy = r10								; count of button pushes
.def cycley = r11								; for timer cycle, for 20hz, counts to 20 then resets and updates screen based on mode
.def modey = r13								; mode state

												;;;;;;;;;;;;;;;;;;;;;;;;;
												; modes values for reference
												; do_nothing = 0			do nothing state
												; auto_scroll = 1			auto scroll update
												; show_presses = 2			update button press screen
												; flashing_text = 3			toggle flash state
												; flashing_starz = 4

; REMINDER Y (r29:r28) is used to hold SW stack
; not used for anything else
.equ HW_max = $200			; for softstack 

;;;;;;;;;;;;;;;
; message stuff
.equ msgs_select = 2		
.equ msgs_max = 4

;;;;;;;;;;;;;;;
; board select
; board v1.0				- board at the lab terminal I sit at
;.equ RIGHT	= 0x032
;.equ UP     = 0x0C3
;.equ DOWN   = 0x17C
;.equ LEFT   = 0x22B
;.equ SELECT = 0x316

; board v1.1				- board I have at home
.equ RIGHT	= 0x032
.equ UP     = 0x0FA
.equ DOWN   = 0x1C2
.equ LEFT   = 0x28A
.equ SELECT = 0x352

.cseg

			; vector table
.org 0x0000
			rjmp startmeup

.org 0x0028
			jmp timer1_ISR


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Purpose:
; Intialize all variables, processes, interrupt and SW stack.
; Load all messages forwards and backward

startmeup:	
			cli
			clr temp
			clr temp2
			clr result

			; init that stack pointer
			ldi temp, low(RAMEND)
			out SPL, temp
			ldi temp, high(RAMEND)
			out SPH, temp

			; Gimme a software stack for easy value send and returns of MY variables!
			; I dislike reaching into a stack for things

			ldi YH, high(RAMEND - HW_max - 1)
			ldi YL, low(RAMEND - HW_max - 1)
			; and its macros!
			#define pushIT(Rr) st -Y,Rr
			#define popIT(Rd) ld Rd,Y+


			; initialize built-in ADC
			ldi temp, 0x87
			sts ADCSRA, temp
			ldi temp, 0x40
			sts ADMUX, temp

			; fire up the lcd!
			call lcd_init
			call lcd_clr

			; ..........................................................................................
			; This part is a longer part that we only do once to load the messages and their reverses
			; if I had more time (CORONA VIRUS! This really should be a macro or subroutine)
			; load the messages
			; push from then to
			; and  low  then high
			;starz
			ldi temp, low(starz << 1)
			pushIT(temp)
			ldi temp, high(starz << 1)
			pushIT(temp)
			ldi temp, low(lcd_starz)
			pushIT(temp)
			ldi temp, high(lcd_starz)
			pushIT(temp)
			rcall msgs

			;msg21
			ldi temp, low(msg21 << 1)
			pushIT(temp)
			ldi temp, high(msg21 << 1)
			pushIT(temp)
			ldi temp, low(lcd_msg01)
			pushIT(temp)
			ldi temp, high(lcd_msg01)
			pushIT(temp)
			rcall msgs

			;msg22
			ldi temp, low(msg22 << 1)
			pushIT(temp)
			ldi temp, high(msg22 << 1)
			pushIT(temp)
			ldi temp, low(lcd_msg02)
			pushIT(temp)
			ldi temp, high(lcd_msg02)
			pushIT(temp)
			rcall msgs


			;btn02
			ldi temp, low(btn02 << 1)
			pushIT(temp)
			ldi temp, high(btn02 << 1)
			pushIT(temp)
			ldi temp, low(lcd_btn02)
			pushIT(temp)
			ldi temp, high(lcd_btn02)
			pushIT(temp)
			rcall msgs			

			; reverse the messages
			; msg21->msg03
			ldi temp, low(msg21 << 1)
			pushIT(temp)
			ldi temp, high(msg21 << 1)
			pushIT(temp)
			ldi temp, low(lcd_msg03)
			pushIT(temp)
			ldi temp, high(lcd_msg03)
			pushIT(temp)
			rcall reverse_msgs		

			; msg22->msg04
			ldi temp, low(msg22 << 1)
			pushIT(temp)
			ldi temp, high(msg22 << 1)
			pushIT(temp)
			ldi temp, low(lcd_msg04)
			pushIT(temp)
			ldi temp, high(lcd_msg04)
			pushIT(temp)
			rcall reverse_msgs


			; finish message loading
			; ............................................................................................
			
			; setup the timer's first run			
			call timer1_setup				

			; setup our initial state values to 0 in case garbage of setup values remain
			clr temp
			clr temp2
			clr result 

			clr cycley
			clr pushy
			clr modey

			clr liney1
			clr liney2
			clr showy1L
			clr showy1H
			clr showy2L
			clr showy2H	
	
			; default LCD displays
			ldi temp, low(lcd_starz)
			pushIT(temp)
			ldi temp, high(lcd_starz)
			pushIT(temp)
			ldi temp, low(lcd_starz)
			pushIT(temp)
			ldi temp, high(lcd_starz)
			pushIT(temp)
			rcall display

			sei

illneverstop:
			rcall delay
			rcall buttons						; poll the buttons periodically and also
			rjmp	illneverstop				; wait for an interrupt	automatically by the timer to do display	

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Purpose:
; copy the messages into dseg
; takes four values from SW stack
; to then from  (from value should be pre << 1)
; high then low

msgs:											
			push temp							; PROTECT!

			popIT(temp)							; first onto stack is dest
			push temp
			popIT(temp)
			push temp
			popIT(temp)							; next onto stack is program source, 
;			lsl temp
			push temp
			popIT(temp)
;			lsl temp
			push temp
			call str_init						; copy from program to data
			pop temp							; clear HW stack
			pop temp
			pop temp
			pop temp

msgs_cleanup:									; RELOAD!
			pop temp
			ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Purporse:
; Reverses the message into another message via the HW stack
; takes four values from SW stack
; to then from  (from value should be pre << 1)
; high then low

reverse_msgs:
			push temp							; PROTECT!
			push temp2
			push ZH
			push ZL
			push XH
			push XL

			; load in our pointers from the SW stack
			popIT(temp)			
			mov XH, temp						;dest high
			popIT(temp)
			mov XL, temp						;dest low
			popIT(temp)
;			lsl temp
			mov ZH, temp						;src high
			popIT(temp)
;			lsl temp
			mov ZL, temp						;src low
			clr temp 	
			
r_push_char:									; push source to HWstack
			lpm temp2, Z+
			tst temp2
			breq r_pop_char
			inc temp
			push temp2
			rjmp r_push_char
			
r_pop_char:										; pop HWstack back to dest
;			pop temp2
;			dec temp
;			pop temp2
;			dec temp

r_pop_loop:
			pop temp2
			st X+, temp2
			dec temp
			tst temp
			brne r_pop_loop
			; add null
			ldi temp2, $00
			st X+, temp2

rev_msg_cleanup:								; RELOAD!
			pop XL
			pop XH
			pop ZL
			pop ZH
			pop temp2
			pop temp
			ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Purpose:
; Sends the messages to the display function LCD_puts, using lcd_xy to line up the messages
; This takes address parameters for the message from the software stack
; in the usual SWstack order to push to HW stack

display:
			push temp					; PROTECT!
			push temp2

			call lcd_clr

			ldi temp, 0x00
			push temp
			ldi temp, 0x00
			push temp
			call lcd_gotoxy
			pop temp
			pop temp

			; Now display line1 on the first line
			; taking from my own stack for the address delivery
			; high address first
			popIT(temp)
			push temp
			popIT(temp2)
			push temp2
			call lcd_puts
			pop temp
			pop temp

			; Now move the cursor to the second line (ie. 0,1)
			ldi temp, 0x01
			push temp
			ldi temp, 0x00
			push temp
			call lcd_gotoxy
			pop temp
			pop temp

			; Now display line2 on the second line
			popIT(temp)
			push temp
			popIT(temp2)
			push temp2
			call lcd_puts
			pop temp
			pop temp

display_cleanup:								; RELOAD!
			pop temp2
			pop temp
			ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Purpose:
; This delays.
; Adjust loops as desired for timing.
; Wet. Lather. Rinse. Repeat.

delay:
		
			push result					
			push temp2							; PROTECT!
			push temp
 										
			ldi result, 0x09					; approx. 0.05s delay = x12 or 20Hz// this is 40Hz or .025s delay
outer:		ldi temp2, 0xFF						; Based on L. Jackson's source 9 lines
middle:		ldi temp, 0xFF
inner:		dec temp
			brne inner
			dec temp2
			brne middle
			dec result
			brne outer

delay_cleanup:
			pop temp							; RELOAD!
			pop temp2
			pop result

			ret
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Purpose:
; Set up our timer details for the interrupt using the HW interrupt timer
; This is just lab 9 code updated a little

timer1_setup:
.equ TIMER1_DELAY = 7812						; counter updated using https://eleccelerator.com/avr-timer-calculator/ to 2Hz
.equ TIMER1_MAX_COUNT = 0xFFFF	
.equ TIMER1_COUNTER_INIT=TIMER1_MAX_COUNT-TIMER1_DELAY + 1
	
	push temp									; PROTECT!

	; timer mode	
	ldi temp, 0x00								; normal operation
	sts TCCR1A, temp

	; prescale 
	ldi temp, (1<<CS12)|(1<<CS10)				; clock / 1024
	sts TCCR1B, temp

	; set timer counter to TIMER1_COUNTER_INIT (defined above)
	ldi temp, high(TIMER1_COUNTER_INIT)
	sts TCNT1H, temp 							; must WRITE high byte first 
	ldi temp, low(TIMER1_COUNTER_INIT)
	sts TCNT1L, temp							; low byte
	
	; allow timer to interrupt the CPU when it's counter overflows
	ldi temp, 1<<TOIE1
	sts TIMSK1, temp

	; enable interrupts (the I bit in SREG)
	sei	

timersetup_cleanup:
	pop temp									; RELOAD!

	ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Purpose:
; Polls buttons and then responds to the input
; The first half is about polling.
; The second half modifies the method and liney values as needed
; This updates the result register
; As we want to count individual pushes, no action is taken until we switch from 
; >0 (finger down) to 0 (finger up) value

buttons:	
			push temp							; PROTECT!
			push temp2


			pushIT(result)						; copy of previous result for local work. 

			; start a2d conversion
			lds temp, ADCSRA					; get the current value of SDRA
			ori temp, 0x40						; set the ADSC bit to 1 to initiate conversion
			sts ADCSRA, temp

			; wait for A2D conversion to complete
wait:
			lds temp, ADCSRA
			andi temp, 0x40						; see if conversion is over by checking ADSC bit
			brne wait							; ADSC will be reset to 0 is finished

			; read the value available as 10 bits in ADCH:ADCL r17:r16
			lds temp, ADCL
			lds temp2, ADCH
	
			; set r18 based on the value returned from ADC	
			ldi result, 0	

			;	0x000 -> 0x032 - right button pressed

rgt_press:		
			cpi temp2, high(RIGHT)
			brne up__press
			cpi temp, low(RIGHT)
			brsh up__press
			ldi result, 1
			rjmp btn_react

			;	0x032 -> 0x0C3 - up button pressed
up__press:
			cpi temp2, high(UP)
			brne dwn_press
			cpi temp2, low(UP)
			brsh dwn_press
			ldi result, 2
			rjmp btn_react

			;	0x0C3 0x17C - down button pressed
dwn_press:
			cpi temp2, high(UP)
			brne dwn2
			ldi result, 3
			rjmp btn_react
dwn2:
			cpi temp2, high(DOWN)
			brne lft_press
			cpi temp, low(DOWN)
			brsh lft_press
			ldi result, 3
			rjmp btn_react

			;	0x17C -> 0x22B - left button pressed
lft_press:
			cpi temp2, high(DOWN)
			brne lft2
			ldi result, 4
			rjmp btn_react
lft2:
			cpi temp2, high(LEFT)
			brne sel_press
			cpi temp, low(LEFT)
			brsh sel_press
			ldi result, 4
			rjmp btn_react

			;	0x22B -> 0x316 - select button pressed
sel_press:
			cpi temp2, high(LEFT)
			brne sel2
			ldi result, 5
			rjmp btn_react
sel2:
			cpi temp2, high(SELECT)
			brne not_press
			cpi temp, low(SELECT)
			brsh not_press
			ldi result, 5
			rjmp btn_react

			; any higher value
not_press:
			ldi result, 0
			rjmp btn_react

			; after finding the result top bit, we jump to the lower half of this function below
			; ..................................................................................................



btn_react:	
			popIT(temp2)						; get our previous result value back in temp2 , even if we don't need it
			tst result							; test value now
			brne btn_done						; if it's not 0 (finger up), jump the following checks, we'll process later	when it is
			mov result, temp2					; it is 0, make the value before the actual result so we can continue

												; this cascades through the possible result values
												; deducting 1 until it is 0 or moving up the result chain if not
				
chk0:											; pressed nothing - do nothing
			tst result
			brne chk1
			nop							
			rjmp process_done

chk1:											; pressed right - Autoscroll between messages 1-4
			inc pushy							; since something has been pressed, inc the button press before we cascade through checks
			dec result
			tst result
			brne chk2
			mov temp, modey
			cpi temp, 1
			breq  auto_off
			ldi temp, 1	
			mov modey, temp						; set mode to autoscroll to on since off
			rjmp process_done
auto_off:	clr modey							; set mode to autoscroll to off since on
			rjmp process_done

chk2:											; pressed up - Scroll one line up
			dec result
			tst result
			brne chk3
			clr modey							; set this to manual mode now
			mov liney1, liney2					; move line2 msg up to line1
			inc liney2							; inc line2 value before show
			mov temp, liney2
			dec temp
			cpi temp, msgs_max					; checking to see if we are over message limit
			brlo process_done
			clr liney2							; if so, set it's value to 1
			inc liney2				
			rjmp process_done

chk3:											; pressed down - scroll one line down
			dec result
			tst result
			brne chk4					
			clr modey							; set this to manual mode now
			mov liney2, liney1					; move line1 down up to line2
			dec liney1							; dec line1 value before show
			mov temp, liney1
			cpi temp, 1
			brge process_done					;if it's not <1, move along
			ldi temp, msgs_max			
			mov liney1, temp					; if it is, set it to our maximum msg value
			rjmp process_done

chk4:											; pressed left - toggle mode 2 button press show
			dec result
			tst result
			brne chk5
			mov temp, modey
			cpi temp, 2
			breq  prs_off
			ldi temp, 2	
			mov modey, temp						; set mode to button presses(2) to on since off  (!=2)
			rjmp process_done
prs_off:	clr modey							; clear mode to manual (0) since on (==2)
			rjmp process_done

			
chk5:											; pressed select - flash mode - if no other check applies
												; a little trickier because
													; modey 3 = flash current lines
													; modey 4 = flash *******************
												; set mode 4 so the update can alternate back and forth
												; if already in 3 or 4 (or >2 since no higher values exist), toggle off
												; 5 is our last option so no dec/tst require, we default to here
			mov temp, modey
			cpi temp, 3
			brsh flash_off						; make sure it is in  a mode lower than 3 or 4  before setting mode 4
			ldi temp, 3
			mov modey, temp
			rjmp process_done			
flash_off:	clr modey							; if either is on, stop it
			rjmp process_done

process_done:
			clr result							; jump to here because we have applied result of processing

btn_done:				

			pop temp2							; RELOAD
			pop temp

			ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Purpose:
; Our ISR routine for updating the display
; This resets the timer counter to default values so timing stays consistent
; It then cascades through the modes until it finds the right one to apply
; Each mode is explained in the comments

timer1_ISR:				

			push temp							; PROTECT!
			push temp2
			push result
			lds protectS, SREG		

			; RESET timer
			ldi temp, high(TIMER1_COUNTER_INIT)
			sts TCNT1H, temp
			ldi temp, low(TIMER1_COUNTER_INIT)
			sts TCNT1L, temp



cycle_update:
			ldi temp, 1
			eor cycley, temp					; switch between a 0/1 value in the cycle for things we do every other cycle

mode0:											; do nothing
			mov temp, modey					
			tst temp
			brne mode1
			rcall load_showys_asis				; just load the lines normally
			jmp show_lines						; now go show them


mode1:											;  auto-scroll lines up one value but only on cycleys 1s values
			dec temp
			tst temp
			brne mode2

			tst cycley							; if we are at value 0/2 in the 2Hz don't bother
			breq m1_show						; this will update once per 2Hz on the .5s marker marker

			mov liney1, liney2					; move line2 msg up to line1
			inc liney2							; inc line2 value
			mov temp2, liney2
			dec temp2
			cpi temp2, msgs_max					; checking to see if we are over message limit
			brlo m1_show
			clr liney2							; if so, set it's value to 1
			inc liney2			
m1_show:	rcall load_showys_asis				; load lines normally
			rjmp show_lines			


mode2:											; show how many button pushes we have
			dec temp
			tst temp
			brne mode3
												; line 1 is not static and needs to be built on the fly
			rcall build_lcd_btn01				; this is big so doing this in a separate subroutine
			ldi showy1L, low(lcd_btn01)
			ldi showy1H, high(lcd_btn01)
			ldi showy2L, low(lcd_btn02)			; line 2 doesn't change so we can just load this routing
			ldi showy2H, high(lcd_btn02)
			rjmp show_lines

mode3:											; modey 3 = flash current lines
			dec temp
			tst temp
			brne mode4

			rcall load_showys_asis				; load lines normally	
			inc modey							; switch to mode 4 for next time
			rjmp show_lines		



mode4:											; modey 4 = flash *******************
												; no test needed, defaulted to showing this after failing all others
			ldi showy1L, low(lcd_starz)
			ldi showy1H, high(lcd_starz)
			ldi showy2L, low(lcd_starz)
			ldi showy2H, high(lcd_starz)
			dec modey							; switch to mode 3 for next time
			rjmp show_lines


show_lines:										; do the display
												; pulls from from my stack before HW stack so lows go first
			pushIT(showy2L)
			pushIT(showy2H)
			pushIT(showy1L)
			pushIT(showy1H)
			rcall display

timer_cleanup:									; RELOAD!
			sts SREG, protectS
			pop result
			pop temp2
			pop temp
			reti


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Purpose
; This update to epected value for liney registers
; into showy1L, showy1H, showy2L, showyH
; as most modes (but not all) will do
; the idea being that we start with the msg0 value (starz)
; and multiply the liney value  by $11 (space of each message)
; and then add that back into the address value

load_showys_asis:								
			push r1								; PROTECT!
			push r0								; muls uses r0 and r1
			push temp

			ldi showy1L, low(lcd_starz)
			ldi showy1H, high(lcd_starz)
			ldi showy2L, low(lcd_starz)
			ldi showy2H, high(lcd_starz)		; set both to my zero message

			ldi temp, $11
			mul liney1, temp					; result placed in R0:R1
			add showy1L, r0						; increment up that many values from base msg
			add showy1H, r1

			ldi temp, $11
			mul liney2, temp					; result placed in R0:R1
			add showy2L, r0
			add showy2H, r1

lsa_cleanup:
			pop temp
			pop r0
			pop r1								; RELOAD
			ret
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Purpose:
; When we are showing the count of button presses, this must be built on the fly
; Only way to do this easily is to tediously walk the message character-by character into place

build_lcd_btn01:
			push XH								; PROTECT!
			push XL
			push temp2
			push result
			ldi XH, high(lcd_btn01)
			ldi XL, low(lcd_btn01)
			
			; head
			ldi temp2, $2A						;*
			st X+, temp2
			ldi temp2, $2A						;*
			st X+, temp2
			ldi temp2, $20						; (space)
			st X+, temp2
			
			; numbers
			ldi result, $30						; offset to "0" in character set
			mov temp2, pushy
			cpi temp2, 100
			brsh hundreds
			cpi temp2, 10
			brsh tens
			rjmp ones

hundreds:	inc result
			subi temp2, 100
			cpi temp2, 100
			brsh hundreds 
			st X+, result
			ldi result, $30

			cpi temp2, 10						; any tens value?
			brsh tens							; if so, go find it
			st X+, result						; store a 0 if not

tens:		inc result
			subi temp2, 10
			cpi temp2, 10
			brsh tens
			st X+, result
			
ones:		ldi result, $30						; store the remainder up from the base value for "0"
			add result, temp2
			st X+, result

			; tail
			ldi temp2, $20						; (space)
			st X+, temp2	
			ldi temp2, $2A						;*
			st X+, temp2
			ldi temp2, $2A						;*
			st X+, temp2
			ldi temp2, $00						; null
			st X+, temp2

blb1_cleanup:									; RELOAD!
			pop result
			pop temp2
			pop XL
			pop XH

			ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

starz: .db "*****************", 0				; $11 bytes

; 2 line message								<$22 bytes
msg21: .db "An old pond.",0, 0
msg22: .db "Frog jump. Plop!",0, 0

; 8 line message for extended version			<$88 bytes
; leaving it in for now
msg81: .db $CC, $D9, $B2, $B9, $D4, 0
msg82: .db "An old pond.",0, 0
msg83: .db $B6, $DC, $BD, $DE, $20, $C4, $CB, $DE, $BA, $D1, $00, 0
msg84: .db "A frog jumps in.",0, 0
msg85: .db $D0, $BD, $DE, $C9, $B5, $C4, $00, 0
msg86: .db "Water sound.",0, 0
msg87: .db " - Matsuo Basho", 0
msg88: .db "    (1644-1694)", 0

btn01: .db "Blank on purpose!", 0
btn02: .db "Buttons Pressed", 0

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.dseg
.org 0x200
lcd_starz: .byte 17
lcd_msg01: .byte 17
lcd_msg02: .byte 17
lcd_msg03: .byte 17
lcd_msg04: .byte 17
lcd_msg05: .byte 17							; these spots and higher are for the expanded version
lcd_msg06: .byte 17							; leaving them in for now because 
lcd_msg07: .byte 17
lcd_msg08: .byte 17
lcd_msg09: .byte 17
lcd_msg10: .byte 17
lcd_msg11: .byte 17
lcd_msg12: .byte 17
lcd_msg13: .byte 17
lcd_msg14: .byte 17
lcd_msg15: .byte 17
lcd_msg16: .byte 17
lcd_btn01: .byte 17
lcd_btn02: .byte 17


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;
; Include the HD44780 LCD Driver for ATmega2560
;
; This library has it's own .cseg, .dseg, and .def
; which is why it's included last, so it would not interfere
; with the main program design.
; NEXT LINE NEEDED COMMENTING OUT TO FUNCTION ON MY BOARD. 
;#define LCD_LIBONLY
.include "lcd.asm"

; For this to work, there must be a blank line at the end of the file.
