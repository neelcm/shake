![shake](http://neel.io/img/shake_banner.png)

###*shake* allows any two people to quickly exchange contact information by simply shaking hands

shake takes advantage of Pebble's motion sensors to detect when a handshake has occurred. A Node.js backend evaluates concurrent requests to determine which two people just met - both parties then receive each other's contact information.

*How this works:* When your pebble detects a handshake-like motion, the server is queried with your json-encoded contact card, raw handshake data and location-based information. Your pebble in return receives a contact card if someone else in the same time window was in your geofence with a similar handshake motion. 

![shake2](http://neel.io/img/shake_flow2.png)

**technologies used:** C, JavaScript, Node.js, Express

**created in under 36 hours by** Neel Mouleeswaran, Vamsi Ponnapalli & Jeremy Sullivan

<p align="right">
  <i>HackIllinois 2014 Submission</i>
</p>
