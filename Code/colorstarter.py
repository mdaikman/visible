# moodlights.py
# Early pi code thingy
# Adapted from MonkMakes.com code

from gpiozero import Button, RGBLED
from colorzero import Color
import time, requests

waitseconds = 10
led = RGBLED(red=18, green=23, blue=24)
pushit = Button(25)

get_url="http://api.thingspeak.com/channels/1417/field/2/last.txt"
old_busted = None

def go_off():
	led.color = Color(0,0,0)
button.when_pressed = go_off

while True:
	try:
		lightups = request.get(get_url)
		colour = lightups.content
		if colour != old_busted:
			led.color = Color(colour)
			old_busted = colour
			print(colour)
	except Exception as e:
		print(e)
    # be patient
    time.sleep(waitseconds)
