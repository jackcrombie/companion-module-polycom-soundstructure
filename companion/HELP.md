This module allows you to control a Polycom SoundStructure device.

**Configuration**
-   **Target IP:** The IP address of your SoundStructure device.
-   **Target Port:** The control port (default is 52774).
-   **Polling Interval:** How often to request status updates for non-event-driven states (in ms).

The module will automatically discover channels and groups upon connection.

**Available Actions:**
-   Channel Mute & Fader
-   Mic Input & Line Output Gain
-   Group Mute
-   Matrix Crosspoint Mute
-   Recall Preset

**Available Feedbacks:**
-   Channel is Muted
-   Group is Muted
-   Matrix Crosspoint Muted
